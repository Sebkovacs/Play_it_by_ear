export enum GamePhase {
  LANDING = 'LANDING',
  LOBBY = 'LOBBY',
  GENERATING = 'GENERATING',
  REVEAL = 'REVEAL', // Individual reveal now
  PLAYING = 'PLAYING',
  GUESSING = 'GUESSING', // Active guessing state
  RESULT = 'RESULT',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR'
}

export enum PlayerRole {
  SCENARIO_A = 'SCENARIO_A',
  SCENARIO_B = 'SCENARIO_B',
  TONE_DEAF = 'TONE_DEAF',
  PENDING = 'PENDING'
}

export interface Player {
  id: string; // Internal ID
  peerId: string; // Network ID
  name: string;
  role: PlayerRole;
  isHost: boolean;
  hasViewed: boolean;
  isReady: boolean;
  topicSuggestion: string;
}

export interface Scenarios {
  scenarioA: string;
  scenarioB: string;
  topic: string;
}

export interface Award {
  title: string;
  description: string;
  emoji: string;
}

export interface RoundHistory {
  id: string;
  topic: string;
  winner: string; // "Team A", "Team B", "Tone Deaf", etc.
  timestamp: number;
}

export interface GameResult {
  winner: string;
  reason: string;
  guesserName?: string;
  wasCorrect?: boolean;
  awards?: Record<string, Award>; // PlayerId -> Award
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  scenarios: Scenarios | null;
  error: string | null;
  roomCode: string | null;
  revealedPlayers: string[]; // List of IDs revealed in result phase
  countdown: number | null; // 5, 4, 3... null if inactive
  history: RoundHistory[];
  lastResult: GameResult | null;
  guesserId: string | null; // ID of player currently guessing
  
  // New State for Multi-round
  currentRound: number;
  totalRounds: number;
  maxToneDeaf: number; // 0, 1, or 2
  scores: Record<string, number>; // PlayerId -> Score
}

// Network Payloads
export type MessageType = 'STATE_UPDATE' | 'JOIN_REQUEST' | 'TOGGLE_READY' | 'SUBMIT_TOPIC' | 'START_GUESS' | 'SUBMIT_GUESS' | 'CANCEL_GUESS' | 'REVEAL_GUESS' | 'RESET_GAME' | 'NEXT_ROUND';

export interface NetworkMessage {
  type: MessageType;
  payload: any;
  senderId?: string;
}