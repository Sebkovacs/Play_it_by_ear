
export enum GamePhase {
  LANDING = 'LANDING',
  LOBBY = 'LOBBY',
  GENERATING = 'GENERATING',
  REVEAL = 'REVEAL', 
  PLAYING = 'PLAYING',
  GUESSING = 'GUESSING', 
  RESULT = 'RESULT',
  VOTING = 'VOTING', // New Phase
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR'
}

export enum GameMode {
  ROUNDS = 'ROUNDS',
  POINTS = 'POINTS'
}

export enum PlayerRole {
  SCENARIO_A = 'SCENARIO_A',
  SCENARIO_B = 'SCENARIO_B',
  TONE_DEAF = 'TONE_DEAF',
  PENDING = 'PENDING'
}

export interface PlayerPublicStats {
  wins: number;
  gamesPlayed: number;
  title: string;
  description: string;
}

export interface Player {
  id: string; 
  peerId: string; 
  name: string;
  role: PlayerRole;
  isHost: boolean;
  hasViewed: boolean;
  isReady: boolean;
  topicSuggestion: string;
  hasVoted: boolean; // For the voting phase
  stats?: PlayerPublicStats; // Publicly visible stats
  uid?: string; // Firebase UID for deep fetching history
}

export interface Scenarios {
  scenarioA: string;
  scenarioB: string;
  topic: string;
  openingQuestion: string;
}

export interface Award {
  title: string;
  description: string;
  emoji: string;
  timestamp?: number;
  topic?: string;
}

export interface RoundHistory {
  id: string;
  topic: string;
  winner: string; 
  timestamp: number;
}

export interface GameResult {
  winner: string;
  reason: string;
  guesserName?: string;
  wasCorrect?: boolean;
  pointDeltas?: Record<string, number>;
  // Round specific awards (optional, generated if interesting things happened)
  awards?: Record<string, Award>; 
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  // New Profile Data
  personaTitle?: string;
  personaDescription?: string;
  tags?: Record<string, number>; // Tag -> Count
}

export interface VoteSubmission {
  bestPlayerId: string;
  bestReason: string;
  worstPlayerId: string;
  worstReason: string;
  descriptors: Record<string, string>; // TargetID -> Adjective
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  scenarios: Scenarios | null;
  error: string | null;
  roomCode: string | null;
  revealedPlayers: string[]; 
  countdown: number | null; 
  history: RoundHistory[];
  lastResult: GameResult | null;
  guesserId: string | null; 
  starterId: string | null; 
  
  gameMode: GameMode;
  currentRound: number;
  targetValue: number; 
  maxToneDeaf: number; 
  scores: Record<string, number>; 
  
  // New Accumulators
  accumulatedDescriptors: Record<string, string[]>; // PlayerID -> List of tags
  accumulatedReasons: Record<string, string[]>; // PlayerID -> List of 'Best/Worst' comments
  endGameAwards: Record<string, Award> | null;
}

export type MessageType = 'STATE_UPDATE' | 'JOIN_REQUEST' | 'TOGGLE_READY' | 'SUBMIT_TOPIC' | 'START_GUESS' | 'SUBMIT_GUESS' | 'CANCEL_GUESS' | 'REVEAL_GUESS' | 'RESET_GAME' | 'NEXT_ROUND' | 'SUBMIT_VOTES';

export interface NetworkMessage {
  type: MessageType;
  payload: any;
  senderId?: string;
}

// The 24 Options
export const DESCRIPTORS = [
  "Chaotic", "Sweaty", "Genius", "Unhinged", 
  "Robot", "Loud", "Sneaky", "Clueless", 
  "Dramatic", "Thirsty", "Salty", "Moist", 
  "Basic", "Extra", "Sketchy", "Wholesome", 
  "Toxic", "Cringe", "Iconic", "Feral", 
  "Chill", "Sus", "Smooth", "Petty"
];
