import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, GameState, Player, PlayerRole, NetworkMessage, RoundHistory } from './types';
import { generateGameScenarios } from './services/geminiService';
import { p2p } from './services/p2pService';
import { saveGameToHistory, getGlobalHistory } from './services/firebase';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { InputField } from './components/InputField';

// --- Icons ---
const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>
);
const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M240-400h320v-80l-110-50 110-50v-80H240v80l110 50-110 50v80ZM80-120v-200h80v200H80Zm120 0v-200h480v200H200Zm520 0v-200h80v200h-80ZM200-640h480v-80h-80q-17 0-28.5-11.5T560-760q0-17 11.5-28.5T600-800h-80q-17 0-28.5-11.5T480-840q-17 0-28.5 11.5T440-800h-80q17 0 28.5 11.5T400-760q0 17-11.5 28.5T360-720h-80v80Z"/></svg>
);
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
);
const MegaphoneIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M280-280q-33 0-56.5-23.5T200-360v-240q0-33 23.5-56.5T280-680h320l200-120v640L600-280H280Zm0-80h320l120 72v-484l-120 72H280v340Zm-120 80v-500h-40v500h40Zm560-50q-14-11-23-26.5T684-392q10-18 27-44t17-64q0-38-17-64t-27-44q14-11 23-26.5t9-35.5q38 31 60.5 75t22.5 95q0 51-22.5 95T720-330Z"/></svg>
);
const QuestionMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80q0-46 22-82t70-66q35-23 51.5-56t16.5-76q0-66-47-113t-113-47q-55 0-99.5 29.5T363-772l67 38q11-28 35.5-47t54.5-19q33 0 56.5 23.5T600-720q0 27-16 46.5T544-634q-54 34-82 72.5T440-440Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
);
const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M720-80q-50 0-85-35t-35-85q0-7 1-14.5t3-13.5L322-392q-17 15-38 23.5t-44 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q23 0 44 8.5t38 23.5l282-164q-2-6-3-13.5t-1-14.5q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-23 0-44-8.5T638-672L356-508q2 6 3 13.5t1 14.5q0 7-1 14.5t-3 13.5l282 164q17-15 38-23.5t44-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Z"/></svg>
);
const HistoryIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm.5-55q144 0 244.5-100.5T825.5-480q0-144-100.5-244.5T480.5-825q-144 0-244.5 100.5T135.5-480q0 144 100.5 244.5T480.5-135ZM480-480Z"/><path d="M495-266h-50v-237l186-111 25 43-161 96v209Z"/></svg>
);

const App: React.FC = () => {
  // Identity
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myName, setMyName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LANDING,
    players: [],
    scenarios: null,
    error: null,
    roomCode: null,
    revealedPlayers: [],
    countdown: null,
    history: [],
    lastResult: null,
    guesserId: null
  });

  const [globalHistory, setGlobalHistory] = useState<RoundHistory[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [revealVisible, setRevealVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, PlayerRole>>({});
  
  const countdownIntervalRef = useRef<any>(null);

  // Ref to access current state in event listeners
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Initial URL Check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setJoinCode(code.toUpperCase());
    }
  }, []);

  // Fetch Global History on mount
  useEffect(() => {
    const fetchHistory = async () => {
        const history = await getGlobalHistory();
        setGlobalHistory(history);
    };
    fetchHistory();
  }, []);

  // Cleanup P2P on unmount
  useEffect(() => {
    return () => { p2p.destroy(); };
  }, []);

  // --- Host Logic: Countdown Monitor ---
  useEffect(() => {
    if (!isHost || gameState.phase !== GamePhase.LOBBY) return;

    // Check readiness (Min 3 players)
    const allReady = gameState.players.length >= 3 && gameState.players.every(p => p.isReady);
    
    // If all ready and countdown not started, start it
    if (allReady && gameState.countdown === null) {
        startCountdown();
    }
    
    // If not all ready but countdown is running (someone unreadied), stop it
    if (!allReady && gameState.countdown !== null) {
        cancelCountdown();
    }

  }, [gameState.players, isHost, gameState.phase]);

  const startCountdown = () => {
      let count = 5;
      updateCountdownState(count);

      // Clear existing if any
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
          count--;
          if (count > 0) {
              updateCountdownState(count);
          } else {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              updateCountdownState(null); // Clear countdown
              startGame(); // Go!
          }
      }, 1000);
  };

  const cancelCountdown = () => {
      if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
      }
      updateCountdownState(null);
  };
  
  const updateCountdownState = (val: number | null) => {
       setGameState(prev => {
           const next = { ...prev, countdown: val };
           broadcastState(next);
           return next;
       });
  };


  // --- Network Handlers ---

  const handleIncomingMessage = (msg: NetworkMessage, senderPeerId: string) => {
    console.log("Received:", msg.type, msg.payload, "From:", senderPeerId);
    
    if (msg.type === 'STATE_UPDATE') {
       // Only clients update full state from host
       if (!stateRef.current.players.find(p => p.id === myPlayerId)?.isHost) {
          setGameState(prev => ({...msg.payload, error: null})); 
       }
    } else if (msg.type === 'JOIN_REQUEST') {
       // Host handles joins
       const { name, id } = msg.payload;
       
       // Use the REAL peerId from the network connection
       const realPeerId = senderPeerId || msg.payload.peerId;

       setGameState(prev => {
         const exists = prev.players.find(p => p.id === id);
         if (exists) return prev;
         
         const newPlayer: Player = {
           id,
           peerId: realPeerId, // Store the correct Peer ID for disconnection handling
           name,
           role: PlayerRole.PENDING,
           isHost: false,
           hasViewed: false,
           isReady: false,
           topicSuggestion: ''
         };
         
         const newState = { ...prev, players: [...prev.players, newPlayer] };
         broadcastState(newState);
         return newState;
       });
    } else if (msg.type === 'TOGGLE_READY') {
        const { id } = msg.payload;
        setGameState(prev => {
            const newState = {
                ...prev,
                players: prev.players.map(p => p.id === id ? { ...p, isReady: !p.isReady } : p)
            };
            broadcastState(newState);
            return newState;
        });
    } else if (msg.type === 'SUBMIT_TOPIC') {
        const { id, topic } = msg.payload;
        setGameState(prev => {
            const newState = {
                ...prev,
                players: prev.players.map(p => p.id === id ? { ...p, topicSuggestion: topic } : p)
            };
            broadcastState(newState);
            return newState;
        });
    } else if (msg.type === 'START_GUESS') {
        // A player is attempting to guess
        const { id } = msg.payload;
        setGameState(prev => ({ ...prev, phase: GamePhase.GUESSING, guesserId: id }));
        // As a client, we just see the phase change. The Host waits for SUBMIT_GUESS
    } else if (msg.type === 'SUBMIT_GUESS') {
        // Only Host processes the actual guess verification
        if (isHost) {
            handleGuessVerification(msg.payload.guesses, msg.payload.guesserId);
        }
    } else if (msg.type === 'CANCEL_GUESS') {
         setGameState(prev => ({ ...prev, phase: GamePhase.PLAYING, guesserId: null }));
    } else if (msg.type === 'REVEAL_GUESS') {
       const { targetId } = msg.payload;
       setGameState(prev => {
          if (prev.revealedPlayers.includes(targetId)) return prev;
          const newState = { ...prev, revealedPlayers: [...prev.revealedPlayers, targetId] };
          broadcastState(newState);
          return newState;
       });
    } else if (msg.type === 'RESET_GAME') {
        setGameState(prev => ({
            ...prev,
            phase: GamePhase.LOBBY,
            scenarios: null,
            revealedPlayers: [],
            countdown: null,
            players: prev.players.map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: ''})),
            lastResult: null,
            guesserId: null
        }));
    }
  };

  const broadcastState = (state: GameState) => {
    p2p.broadcast({ type: 'STATE_UPDATE', payload: state });
  };
  
  const handlePeerDisconnect = (disconnectedPeerId: string) => {
    // Only Host manages the player list
    if (stateRef.current.players.find(p => p.id === myPlayerId)?.isHost) {
        setGameState(prev => {
            // Remove player with the matching Peer ID
            const newPlayers = prev.players.filter(p => p.peerId !== disconnectedPeerId);
            const newState = { ...prev, players: newPlayers };
            
            // If the disconnected player was the guesser, cancel the guess
            if (prev.guesserId) {
                const disconnectedPlayer = prev.players.find(p => p.peerId === disconnectedPeerId);
                if (disconnectedPlayer && disconnectedPlayer.id === prev.guesserId) {
                    newState.phase = GamePhase.PLAYING;
                    newState.guesserId = null;
                }
            }
            
            broadcastState(newState);
            return newState;
        });
    }
  };

  // --- Actions ---

  const createGame = async () => {
    if (!myName.trim()) return;
    
    const code = p2p.generateRoomCode();
    setIsHost(true);
    const myId = Date.now().toString();
    setMyPlayerId(myId);

    try {
      await p2p.host(
          code, 
          handleIncomingMessage, 
          (conn) => {
            conn.send({ type: 'STATE_UPDATE', payload: stateRef.current });
          },
          handlePeerDisconnect
      );
      
      const hostPlayer: Player = {
        id: myId,
        peerId: 'HOST',
        name: myName.trim(),
        role: PlayerRole.PENDING,
        isHost: true,
        hasViewed: false,
        isReady: false,
        topicSuggestion: ''
      };

      const newState = {
        phase: GamePhase.LOBBY,
        players: [hostPlayer],
        scenarios: null,
        error: null,
        roomCode: code,
        revealedPlayers: [],
        countdown: null,
        history: [],
        lastResult: null,
        guesserId: null
      };
      
      setGameState(newState);
      
    } catch (e: any) {
       setGameState(prev => ({...prev, error: "Could not create room: " + e.message}));
    }
  };

  const joinGame = async () => {
    if (!myName.trim() || !joinCode.trim()) return;
    const myId = Date.now().toString();
    setMyPlayerId(myId);
    setIsHost(false);

    setGameState(prev => ({...prev, phase: GamePhase.LOBBY})); 

    try {
      await p2p.join(joinCode.toUpperCase(), handleIncomingMessage);
      
      p2p.broadcast({
        type: 'JOIN_REQUEST',
        payload: { name: myName.trim(), id: myId, peerId: 'CLIENT' } 
      });

    } catch (e: any) {
      setGameState(prev => ({
          ...prev, 
          phase: GamePhase.LANDING, 
          error: "Could not join: " + e.message + ". Check the code."
      }));
    }
  };

  const toggleReady = () => {
      if (isHost) {
          setGameState(prev => {
              const newState = {
                  ...prev,
                  players: prev.players.map(p => p.id === myPlayerId ? { ...p, isReady: !p.isReady } : p)
              };
              broadcastState(newState);
              return newState;
          });
      } else {
          p2p.broadcast({ type: 'TOGGLE_READY', payload: { id: myPlayerId } });
      }
  };
  
  const submitTopic = (val: string) => {
      setTopicInput(val);
      if (isHost) {
           setGameState(prev => {
              const newState = {
                  ...prev,
                  players: prev.players.map(p => p.id === myPlayerId ? { ...p, topicSuggestion: val } : p)
              };
              broadcastState(newState);
              return newState;
          });
      } else {
           p2p.broadcast({ type: 'SUBMIT_TOPIC', payload: { id: myPlayerId, topic: val }});
      }
  };

  const startGame = async () => {
    if (!isHost) return;
    if (gameState.players.length < 3) {
      setGameState(prev => ({ ...prev, error: "Game designed for 4-8 players. (Min 3 to force start)" }));
      return;
    }

    setGameState(prev => {
        const next = { ...prev, phase: GamePhase.GENERATING, error: null };
        broadcastState(next);
        return next;
    });

    try {
      // Pick a random topic from suggestions or default
      const submittedTopics = gameState.players
          .map(p => p.topicSuggestion)
          .filter(t => t && t.trim().length > 0);
      
      const chosenTopic = submittedTopics.length > 0 
          ? submittedTopics[Math.floor(Math.random() * submittedTopics.length)] 
          : undefined;

      const scenarios = await generateGameScenarios(chosenTopic);
      
      const players = [...gameState.players];
      const toneDeafIndex = Math.floor(Math.random() * players.length);
      players[toneDeafIndex].role = PlayerRole.TONE_DEAF;
      
      const otherIndices = players.map((_, idx) => idx).filter(idx => idx !== toneDeafIndex);
      otherIndices.sort(() => Math.random() - 0.5);

      if (otherIndices.length >= 2) {
          players[otherIndices[0]].role = PlayerRole.SCENARIO_A;
          players[otherIndices[1]].role = PlayerRole.SCENARIO_B;
          for (let i = 2; i < otherIndices.length; i++) {
              players[otherIndices[i]].role = Math.random() > 0.5 ? PlayerRole.SCENARIO_A : PlayerRole.SCENARIO_B;
          }
      } else if (otherIndices.length === 1) {
          players[otherIndices[0]].role = PlayerRole.SCENARIO_A;
      }

      const newState = {
        ...gameState,
        phase: GamePhase.REVEAL,
        players,
        scenarios,
        error: null,
        revealedPlayers: [],
        countdown: null,
        lastResult: null,
        guesserId: null
      };

      setGameState(newState);
      broadcastState(newState);

    } catch (e: any) {
      const errState = { 
        ...gameState, 
        phase: GamePhase.LOBBY,
        error: "Failed to generate: " + (e.message || ""),
        countdown: null
      };
      setGameState(errState);
      broadcastState(errState);
    }
  };

  const markAsReady = () => {
    setGameState(prev => ({...prev, phase: GamePhase.PLAYING}));
  };

  // --- Guessing Logic ---

  const initiateGuess = () => {
      // Open guess modal locally, tell others we are guessing
      if (isHost) {
          setGameState(prev => ({ ...prev, phase: GamePhase.GUESSING, guesserId: myPlayerId }));
          broadcastState({ ...gameState, phase: GamePhase.GUESSING, guesserId: myPlayerId });
      } else {
          p2p.broadcast({ type: 'START_GUESS', payload: { id: myPlayerId }});
      }
  };

  const cancelGuess = () => {
      setGuesses({});
      if (isHost) {
           const newState = { ...gameState, phase: GamePhase.PLAYING, guesserId: null };
           setGameState(newState);
           broadcastState(newState);
      } else {
           p2p.broadcast({ type: 'CANCEL_GUESS', payload: {} });
      }
  };

  const submitGuess = () => {
      if (isHost) {
          handleGuessVerification(guesses, myPlayerId);
      } else {
          p2p.broadcast({ type: 'SUBMIT_GUESS', payload: { guesses, guesserId: myPlayerId } });
      }
  };

  const handleGuessVerification = (guesses: Record<string, PlayerRole>, guesserId: string) => {
      const players = stateRef.current.players;
      let allCorrect = true;

      // Validate every player EXCEPT the guesser themselves
      players.filter(p => p.id !== guesserId).forEach(p => {
         const guessedRole = guesses[p.id];
         if (!guessedRole || guessedRole !== p.role) {
             allCorrect = false;
         }
      });

      const guesser = players.find(p => p.id === guesserId);
      
      let winner = "";
      let reason = "";

      if (allCorrect) {
          winner = guesser?.name || "Guesser";
          reason = "Accusation was 100% Correct!";
      } else {
          winner = "Opponents";
          reason = `${guesser?.name} guessed wrong!`;
      }

      const result = {
          winner,
          reason,
          guesserName: guesser?.name,
          wasCorrect: allCorrect
      };

      const newHistory: RoundHistory = {
          id: Date.now().toString(),
          topic: stateRef.current.scenarios?.topic || "Unknown Topic",
          winner: allCorrect ? (guesser?.name + "'s Team") : "Opposition",
          timestamp: Date.now()
      };
      
      // SAVE TO FIREBASE
      saveGameToHistory(newHistory);

      const newState = {
          ...stateRef.current,
          phase: GamePhase.RESULT,
          lastResult: result,
          history: [newHistory, ...stateRef.current.history],
          guesserId: null,
          // Auto reveal everyone
          revealedPlayers: players.map(p => p.id)
      };

      setGameState(newState);
      broadcastState(newState);
  };

  const revealPlayer = (targetId: string) => {
    if (isHost) {
        setGameState(prev => {
          if (prev.revealedPlayers.includes(targetId)) return prev;
          const newState = { ...prev, revealedPlayers: [...prev.revealedPlayers, targetId] };
          broadcastState(newState);
          return newState;
       });
    } else {
        p2p.broadcast({ type: 'REVEAL_GUESS', payload: { targetId }});
    }
  };

  const handleReset = () => {
      if(!isHost) return;
      
      const newState = {
        ...gameState,
        phase: GamePhase.LOBBY,
        scenarios: null,
        revealedPlayers: [],
        countdown: null,
        players: gameState.players.map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: ''})),
        lastResult: null,
        guesserId: null
      };
      setGameState(newState);
      broadcastState(newState);
      setTopicInput('');
  };

  const copyLink = () => {
      const url = `${window.location.origin}${window.location.pathname}?code=${gameState.roomCode}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
  };

  // --- Views ---

  const renderContent = () => {
    // 1. Landing View
    if (gameState.phase === GamePhase.LANDING) {
        return (
          <div className="min-h-screen bg-m3-background p-4 flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-full space-y-8">
              <div className="text-center space-y-2">
                  <h1 className="text-5xl font-bold text-m3-primary tracking-tighter">It By Ear</h1>
                  <p className="text-m3-onSurfaceVariant">The Official Game of Unpreparedness.</p>
              </div>

              <Card variant="filled" className="space-y-4">
                  <InputField 
                      label="Your Name" 
                      value={myName} 
                      onChange={(e) => setMyName(e.target.value)}
                  />
              </Card>

              <div className="grid grid-cols-1 gap-4">
                  <Button onClick={createGame} fullWidth className="h-14 text-lg">
                      Create New Game
                  </Button>
                  
                  <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-m3-outline/20"></span></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-m3-background px-2 text-m3-outline">Or Join Existing</span></div>
                  </div>

                  <div className="flex gap-2">
                       <InputField 
                          label="Room Code" 
                          value={joinCode} 
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          maxLength={4}
                          className="flex-1 text-center font-mono tracking-widest uppercase"
                      />
                      <Button onClick={joinGame} variant="tonal" className="h-14">Join</Button>
                  </div>
              </div>

              {globalHistory.length > 0 && (
                  <div className="w-full">
                      <div className="flex items-center gap-2 mb-2 opacity-50 justify-center">
                          <HistoryIcon />
                          <h3 className="text-xs uppercase font-bold tracking-wider">Recently Played Worldwide</h3>
                      </div>
                      <div className="space-y-2 opacity-80">
                          {globalHistory.map(h => (
                              <div key={h.id} className="text-xs bg-m3-surfaceVariant/50 p-3 rounded-xl flex justify-between items-center animate-fadeIn">
                                   <div className="flex flex-col">
                                       <span className="font-medium truncate max-w-[200px]">{h.topic}</span>
                                       <span className="text-[10px] opacity-70">Winner: {h.winner}</span>
                                   </div>
                                   <span className="text-[10px] opacity-50">Just now</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {gameState.error && (
                  <div className="p-4 bg-m3-error/10 text-m3-error rounded-xl text-sm text-center">
                  {gameState.error}
                  </div>
              )}
              </div>
          </div>
        );
    }
    
    // 2. Lobby View
    if (gameState.phase === GamePhase.LOBBY) {
        const myPlayer = gameState.players.find(p => p.id === myPlayerId);
        
      return (
        <div className="min-h-screen bg-m3-background p-4 flex flex-col items-center justify-center max-w-md mx-auto relative">
          {gameState.countdown !== null && (
              <div className="absolute inset-0 z-50 bg-m3-background/90 flex items-center justify-center flex-col animate-fadeIn">
                  <div className="text-[120px] font-bold text-m3-primary animate-pulse">
                      {gameState.countdown}
                  </div>
                  <p className="text-xl text-m3-onSurfaceVariant font-medium">Starting meeting...</p>
              </div>
          )}

          <div className="w-full space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl text-m3-onSurfaceVariant">Lobby</h2>
              <div className="flex items-center justify-center gap-2">
                   <span className="text-m3-outline text-sm">Room Code:</span>
                   <span className="text-4xl font-mono font-bold text-m3-primary tracking-widest">{gameState.roomCode}</span>
                   <button onClick={copyLink} className="p-2 text-m3-primary hover:bg-m3-primary/10 rounded-full"><ShareIcon/></button>
              </div>
            </div>

            <Card variant="outlined" className="space-y-4">
               <div className="flex justify-between items-end">
                 <h2 className="text-lg font-medium text-m3-onSurface">Players ({gameState.players.length})</h2>
                 <span className="text-xs text-m3-outline">3-8 Req.</span>
               </div>
               
               <div className="flex flex-col gap-2 mt-2">
                 {gameState.players.map((p) => (
                   <div key={p.id} className={`px-4 py-3 rounded-xl flex items-center justify-between animate-fadeIn transition-colors ${p.isReady ? 'bg-green-100 text-green-900' : 'bg-m3-secondaryContainer text-m3-onSecondaryContainer'}`}>
                     <div className="flex items-center gap-2">
                          <PersonIcon />
                          <div className="flex flex-col">
                            <span className="font-medium leading-none">{p.name}</span>
                            {p.topicSuggestion && <span className="text-[10px] opacity-70 mt-1">Submitted a topic</span>}
                          </div>
                          {p.id === myPlayerId && <span className="text-xs opacity-50">(You)</span>}
                     </div>
                     <div className="flex items-center gap-2">
                        {p.isReady && <CheckCircleIcon />}
                        {p.isHost && <CrownIcon />}
                     </div>
                   </div>
                 ))}
               </div>
            </Card>
            
            <div className="space-y-2">
                <Button 
                    fullWidth 
                    onClick={toggleReady}
                    variant={myPlayer?.isReady ? 'filled' : 'outlined'}
                    className={`h-16 text-lg ${myPlayer?.isReady ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                    {myPlayer?.isReady ? 'I am Ready!' : 'Mark as Ready'}
                </Button>
            </div>

            <Card variant="filled" className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wide opacity-70 font-bold">Submit a Topic (Optional)</label>
                    <div className="flex gap-2">
                        <InputField 
                        label="Topic Idea" 
                        placeholder="e.g. A failed magician's show"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        className="flex-1"
                        />
                        <Button onClick={() => submitTopic(topicInput)} variant="tonal" className="h-14">Submit</Button>
                    </div>
                    <p className="text-[10px] text-m3-outline">The game will randomly pick one suggestion from the players.</p>
                  </div>
            </Card>

            <div className="text-center p-2">
                <p className="text-xs text-m3-outline">
                    {isHost 
                        ? (gameState.players.length < 3 
                            ? "Waiting for more players..." 
                            : gameState.countdown !== null
                                ? "Starting..."
                                : "Game auto-starts when everyone is Ready.")
                        : "Waiting for everyone to Ready up..."
                    }
                </p>
            </div>

            {gameState.error && (
              <div className="p-4 bg-m3-error/10 text-m3-error rounded-xl text-sm">
                {gameState.error}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Generating View
    if (gameState.phase === GamePhase.GENERATING) {
      return (
        <div className="min-h-screen bg-m3-background flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="animate-spin text-m3-primary">
            <RefreshIcon />
          </div>
          <h2 className="text-2xl font-medium text-m3-onSurface">Writing the Agenda...</h2>
          <p className="text-m3-onSurfaceVariant">Using a submitted topic to generate scenarios.</p>
        </div>
      );
    }

    // 4. Reveal View
    if (gameState.phase === GamePhase.REVEAL) {
      const myPlayer = gameState.players.find(p => p.id === myPlayerId);
      if (!myPlayer) return <div>Error: Player not found</div>;
      
      return (
        <div className="min-h-screen bg-m3-primaryContainer p-6 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md min-h-[400px] flex flex-col justify-between shadow-xl">
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold tracking-widest uppercase text-m3-outline">CONFIDENTIAL</span>
              <h2 className="text-3xl font-bold text-m3-primary">{myPlayer.name}</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-8">
              {!revealVisible ? (
                <div className="text-center space-y-6">
                   <p className="text-m3-onSurface text-lg">Your role is ready.</p>
                   <Button onClick={() => setRevealVisible(true)} className="h-16 px-8 text-lg">
                     Reveal My Role
                   </Button>
                </div>
              ) : (
                <div className="space-y-6 text-center animate-fadeIn w-full">
                  {myPlayer.role === PlayerRole.TONE_DEAF ? (
                    <div className="p-8 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                      <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest">Tone Deaf</h3>
                      <p className="mt-4 text-gray-500 font-medium">You have no idea what is going on.</p>
                      <p className="text-sm text-gray-400 mt-2">Just blend in. Don't get caught.</p>
                    </div>
                  ) : (
                    <div className={`p-6 rounded-2xl ${myPlayer.role === PlayerRole.SCENARIO_A ? 'bg-blue-50 text-blue-900' : 'bg-orange-50 text-orange-900'}`}>
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
                          {myPlayer.role === PlayerRole.SCENARIO_A ? "Scenario A" : "Scenario B"}
                      </h3>
                      <p className="text-xl font-medium leading-relaxed">
                        {myPlayer.role === PlayerRole.SCENARIO_A ? gameState.scenarios?.scenarioA : gameState.scenarios?.scenarioB}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 space-y-2">
                      <p className="text-xs text-m3-outline italic">Do NOT read this aloud. Imply it.</p>
                    <Button variant="outlined" onClick={markAsReady} fullWidth>
                      Got it! Join Meeting
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    }

    // 5. Playing & Guessing Views
    if (gameState.phase === GamePhase.PLAYING || gameState.phase === GamePhase.GUESSING) {
      const isMyTurnToGuess = gameState.guesserId === myPlayerId;
      const guesser = gameState.players.find(p => p.id === gameState.guesserId);

      return (
        <div className="min-h-screen bg-m3-background p-6 flex flex-col items-center justify-center space-y-8 relative">
           
           {/* Normal Game View */}
           <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-m3-primary">The Meeting</h1>
              <p className="text-m3-onSurfaceVariant text-lg">Discuss the matter at hand.</p>
           </div>
           
           <div className="w-full max-w-xs aspect-square rounded-full bg-m3-primaryContainer/50 flex flex-col items-center justify-center animate-pulse gap-2 border-4 border-m3-primaryContainer">
              <span className="text-6xl">👂</span>
              <span className="text-sm font-medium text-m3-primary">Play It By Ear</span>
           </div>

           <div className="space-y-4 w-full max-w-md">
              <p className="text-center text-sm text-m3-outline px-8">
                  Think you know the truth?
              </p>
              <Button 
                  fullWidth 
                  onClick={initiateGuess}
                  disabled={gameState.phase === GamePhase.GUESSING}
                  className={`h-16 text-xl bg-m3-error hover:bg-red-700 text-white shadow-red-200 shadow-xl`}
              >
                <MegaphoneIcon />
                MAKE AN ACCUSATION
              </Button>
           </div>

           {/* Guessing Overlay */}
           {gameState.phase === GamePhase.GUESSING && (
               <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                   <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                       <div className="border-b pb-4 mb-4 text-center">
                           <h2 className="text-2xl font-bold text-m3-error">ACCUSATION IN PROGRESS</h2>
                           <p className="text-m3-onSurfaceVariant">{isMyTurnToGuess ? "Identify everyone's role correctly to win." : `${guesser?.name} is making an accusation...`}</p>
                       </div>

                       {isMyTurnToGuess ? (
                           <div className="space-y-4 flex-1 overflow-y-auto">
                               {gameState.players.filter(p => p.id !== myPlayerId).map(p => (
                                   <div key={p.id} className="bg-m3-surfaceVariant/30 p-4 rounded-xl space-y-2">
                                       <div className="font-bold flex items-center gap-2"><PersonIcon/> {p.name}</div>
                                       <div className="grid grid-cols-3 gap-2">
                                           {[PlayerRole.SCENARIO_A, PlayerRole.SCENARIO_B, PlayerRole.TONE_DEAF].map(role => (
                                               <button
                                                   key={role}
                                                   onClick={() => setGuesses(prev => ({...prev, [p.id]: role}))}
                                                   className={`text-xs p-2 rounded-lg border-2 transition-all ${guesses[p.id] === role ? 'border-m3-primary bg-m3-primary text-white' : 'border-m3-outline/20'}`}
                                               >
                                                   {role === PlayerRole.SCENARIO_A ? "Scenario A" : role === PlayerRole.SCENARIO_B ? "Scenario B" : "Tone Deaf"}
                                               </button>
                                           ))}
                                       </div>
                                   </div>
                               ))}
                               <div className="pt-4 flex gap-2">
                                   <Button onClick={cancelGuess} variant="outlined" className="flex-1">Cancel</Button>
                                   <Button onClick={submitGuess} className="flex-1 bg-m3-error text-white">CONFIRM ACCUSATION</Button>
                               </div>
                           </div>
                       ) : (
                           <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                               <div className="animate-spin text-m3-error"><RefreshIcon/></div>
                               <p>Wait while {guesser?.name} decides your fate...</p>
                           </div>
                       )}
                   </Card>
               </div>
           )}
        </div>
      );
    }

    // 6. Result View
    if (gameState.phase === GamePhase.RESULT) {
      const result = gameState.lastResult;
      
      return (
        <div className="min-h-screen bg-m3-background p-4 py-8 max-w-md mx-auto space-y-6 pb-20">
          <div className="text-center space-y-2 bg-m3-surface p-6 rounded-3xl shadow-lg border-2 border-m3-primary/10">
              <h2 className="text-md uppercase tracking-widest text-m3-outline font-bold">Game Over</h2>
              <div className="text-4xl font-black text-m3-primary">{result?.winner} Wins!</div>
              <p className="text-sm font-medium text-m3-onSurfaceVariant bg-m3-secondaryContainer py-2 px-4 rounded-full inline-block">
                  {result?.reason}
              </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
              <Card variant="filled" className="bg-blue-50 border-l-4 border-blue-500 relative overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-10"><QuestionMarkIcon/></div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Scenario A</span>
                  <p className="text-blue-900 font-medium text-lg mt-1">{gameState.scenarios?.scenarioA}</p>
              </Card>

              <Card variant="filled" className="bg-orange-50 border-l-4 border-orange-500 relative overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-10"><QuestionMarkIcon/></div>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Scenario B</span>
                  <p className="text-orange-900 font-medium text-lg mt-1">{gameState.scenarios?.scenarioB}</p>
              </Card>
          </div>

          <div className="space-y-2">
              <h3 className="text-lg font-medium text-m3-onSurface ml-2">The Cast</h3>
              
              {gameState.players.map(player => {
                  let roleColor = "bg-m3-surfaceVariant";
                  let roleText = "Unknown";
                  let roleSub = "";

                  if (player.role === PlayerRole.SCENARIO_A) {
                      roleColor = "bg-blue-100 text-blue-900";
                      roleText = "Scenario A";
                      roleSub = "Serious Team";
                  } else if (player.role === PlayerRole.SCENARIO_B) {
                      roleColor = "bg-orange-100 text-orange-900";
                      roleText = "Scenario B";
                      roleSub = "Absurd Team";
                  } else {
                      roleColor = "bg-gray-800 text-white";
                      roleText = "TONE DEAF";
                      roleSub = "Clueless";
                  }

                  return (
                      <div 
                          key={player.id}
                          className={`w-full text-left p-4 rounded-xl flex items-center justify-between shadow-sm ${roleColor}`}
                      >
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-white/20`}>
                                  <PersonIcon />
                              </div>
                              <div className="font-bold text-lg">{player.name}</div>
                          </div>
                          <div className="text-right">
                              <div className="font-bold">{roleText}</div>
                              <div className="text-xs opacity-70">{roleSub}</div>
                          </div>
                      </div>
                  )
              })}
          </div>
          
          {isHost && (
              <div className="flex flex-col gap-3 pt-4">
              <Button fullWidth onClick={handleReset}>Play Again (Return to Lobby)</Button>
              </div>
          )}
          {!isHost && <div className="text-center text-sm text-m3-outline">Waiting for Host...</div>}
        </div>
      );
    }

    // Default Error
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center flex-col gap-4">
        <h2 className="text-xl text-m3-error font-bold">Something went wrong</h2>
        <p>{gameState.error}</p>
        <Button onClick={() => setGameState(prev => ({...prev, phase: GamePhase.LANDING, error: null}))}>Back to Home</Button>
      </div>
    );
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-40">
        <button 
          onClick={() => setShowHelp(true)} 
          className="bg-m3-surface shadow-md p-2 rounded-full text-m3-primary hover:bg-m3-primary/10 transition-colors"
          title="How to Play"
        >
          <QuestionMarkIcon />
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl relative bg-m3-surface border border-m3-outline/10">
             <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full text-m3-outline">
               <CloseIcon />
             </button>
             
             <div className="space-y-6 p-2">
                <div className="text-center border-b border-m3-outline/20 pb-4 mt-2">
                    <h2 className="text-3xl font-bold text-m3-primary tracking-tight">It By Ear</h2>
                    <p className="text-m3-onSurfaceVariant italic text-sm mt-1">"We don't have a plan, but we have a vibe."</p>
                </div>
                <section className="space-y-2">
                    <h3 className="text-lg font-bold text-m3-primary uppercase tracking-wide text-xs">The Rules</h3>
                    <ul className="list-disc pl-5 space-y-2 text-m3-onSurface text-sm">
                        <li><strong>Start Talking:</strong> The meeting is in session.</li>
                        <li><strong>Vague Statements:</strong> Use vague language to signal your team without alerting the others.</li>
                        <li><strong>The Accusation:</strong> Hit "MAKE AN ACCUSATION" if you think you know everyone's role.</li>
                        <li><strong>Winning:</strong> Get 100% correct to win. Get one wrong, and the other team wins.</li>
                    </ul>
                </section>
                <div className="pt-2">
                     <Button fullWidth onClick={() => setShowHelp(false)}>Got it</Button>
                </div>
             </div>
          </Card>
        </div>
      )}

      {renderContent()}
    </>
  );
};

export default App;