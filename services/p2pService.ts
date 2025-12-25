import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage } from '../types';

// Prefix to avoid collisions on public PeerJS server
const APP_PREFIX = 'it-by-ear-v1-';

export class P2PService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  // Callback now includes the senderPeerId
  private onMessageCallback: ((msg: NetworkMessage, senderPeerId: string) => void) | null = null;
  private onConnectionCallback: ((conn: DataConnection) => void) | null = null;
  private onDisconnectCallback: ((peerId: string) => void) | null = null;

  constructor() {}

  // Generate a 4-char uppercase code
  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Initialize as Host
  async host(
    roomCode: string, 
    onMessage: (msg: NetworkMessage, senderPeerId: string) => void, 
    onConn: (conn: DataConnection) => void,
    onDisc: (peerId: string) => void
  ): Promise<string> {
    this.onMessageCallback = onMessage;
    this.onConnectionCallback = onConn;
    this.onDisconnectCallback = onDisc;

    return new Promise((resolve, reject) => {
      // Create Peer with specific ID
      this.peer = new Peer(`${APP_PREFIX}${roomCode}`, {
        debug: 1, // Reduced debug level to reduce noise
      });

      this.peer.on('open', (id) => {
        console.log('Host initialized:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
        if (this.onConnectionCallback) this.onConnectionCallback(conn);
      });

      this.peer.on('disconnected', () => {
         console.log('Peer disconnected from signaling server. Attempting reconnect...');
         this.peer?.reconnect();
      });

      this.peer.on('error', (err: any) => {
        console.error('Peer error:', err);
        if (this.peer?.disconnected) {
             this.peer.reconnect();
        }
      });
    });
  }

  // Initialize as Client and Join
  async join(roomCode: string, onMessage: (msg: NetworkMessage, senderPeerId: string) => void): Promise<DataConnection> {
    this.onMessageCallback = onMessage;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(); // Auto-gen ID for client

      let connectionTimeout: any;

      this.peer.on('open', (id) => {
        console.log('Client initialized:', id);
        if (!this.peer) return;

        const conn = this.peer.connect(`${APP_PREFIX}${roomCode}`, { reliable: true });

        conn.on('open', () => {
          clearTimeout(connectionTimeout);
          this.connections.set(conn.peer, conn);
          this.handleConnection(conn);
          resolve(conn);
        });

        conn.on('error', (err) => {
            console.error("Connection Error", err);
        });
        
        conn.on('close', () => {
             console.log("Connection to host closed");
        });

        // Timeout if connection doesn't open
        connectionTimeout = setTimeout(() => {
            if(!conn.open) {
                conn.close();
                reject(new Error("Connection timed out. Host might be offline or code is wrong."));
            }
        }, 10000); // Increased timeout to 10s
      });

      this.peer.on('disconnected', () => {
         console.log('Client disconnected from signaling. Reconnecting...');
         this.peer?.reconnect();
      });

      this.peer.on('error', (err) => {
        console.error('Client Peer error:', err);
        if (this.connections.size === 0) {
             // Optional: decide if we want to fail hard
        }
      });
    });
  }

  private handleConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      if (this.onMessageCallback) {
        // PASS THE SENDER ID (conn.peer) UP TO THE APP
        this.onMessageCallback(data as NetworkMessage, conn.peer);
      }
    });

    conn.on('close', () => {
      console.log(`Connection closed: ${conn.peer}`);
      this.connections.delete(conn.peer);
      if (this.onDisconnectCallback) {
          this.onDisconnectCallback(conn.peer);
      }
    });
    
    conn.on('error', (err) => {
        console.error("DataConnection error:", err);
    });
  }

  broadcast(msg: NetworkMessage) {
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  send(peerId: string, msg: NetworkMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }
  
  destroy() {
      this.peer?.destroy();
      this.connections.clear();
  }
}

export const p2p = new P2PService();