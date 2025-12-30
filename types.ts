

export enum GamePhase {
  LANDING = 'LANDING',
  LOBBY = 'LOBBY',
  GENERATING = 'GENERATING',
  REVEAL = 'REVEAL', 
  PLAYING = 'PLAYING',
  GUESSING = 'GUESSING', 
  SHOOTOUT = 'SHOOTOUT', 
  OUTSIDER_GUESS = 'OUTSIDER_GUESS', 
  RESULT = 'RESULT',
  VOTING = 'VOTING',
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

export enum TopicPack {
  STANDARD = 'STANDARD',
  SCIFI = 'SCIFI',
  NSFW = 'NSFW',
  HISTORY = 'HISTORY',
  FOODIE = 'FOODIE'
}

export interface PlayerPublicStats {
  wins: number;
  gamesPlayed: number;
  title: string;
  description: string;
  archetype?: string;
}

export interface Player {
  id: string; 
  name: string;
  role: PlayerRole;
  isHost: boolean;
  hasViewed: boolean;
  isReady: boolean;
  topicSuggestion: string;
  hasVoted: boolean; 
  stats?: PlayerPublicStats; 
  uid?: string; 
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
  role?: PlayerRole; 
  wasCorrect?: boolean; 
  wasCaught?: boolean; 
  votesReceived?: number; 
  
  accuser?: string; 
  accused?: string; 
}

export interface GameResult {
  winner: string;
  reason: string;
  guesserName?: string;
  guesserId?: string; 
  wasCorrect?: boolean;
  pointDeltas?: Record<string, number>;
  awards?: Record<string, Award>; 
  
  accusation?: {
      accuser: string; 
      target: string; 
      roleGuessed: PlayerRole;
      wasCorrect: boolean;
  };
}

export interface PlaystyleAttributes {
  chaos: number;    // How unpredictable
  smarts: number;   // Deduction skill
  vibes: number;    // Social skill
  stealth: number;  // Avoiding detection
  luck: number;     // Pure RNG
}

export interface RelationshipStat {
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  winsWith: number; // Partner in Crime
  accusedByMe: number; // Rival
  accusedMe: number; // Rival
}

export interface Moment {
  id: string;
  title: string;
  summary: string;
  topic: string;
  role: PlayerRole;
  timestamp: number;
  isPinned: boolean;
  emoji?: string;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  personaTitle?: string;
  personaDescription?: string;
  archetype?: string; 
  attributes?: PlaystyleAttributes;
  tags?: Record<string, number>; 
  
  scoutingReport?: string; 
  relationships?: Record<string, RelationshipStat>; 
  moments?: Moment[];
}

export interface VoteSubmission {
  bestPlayerId: string;
  worstPlayerId: string;
  descriptors: Record<string, string>; 
}

export interface GameState {
  lastUpdated: number; 
  phase: GamePhase;
  players: Player[];
  scenarios: Scenarios | null;
  error: string | null;
  notification: string | null; 
  roomCode: string | null;
  revealedPlayers: string[]; 
  countdown: number | null; 
  history: RoundHistory[];
  lastResult: GameResult | null;
  guesserId: string | null; 
  caughtPlayerId?: string | null; 
  starterId: string | null; 
  
  gameMode: GameMode;
  currentRound: number;
  targetValue: number; 
  maxToneDeaf: number; 
  topicPack: TopicPack; 

  scores: Record<string, number>; 
  
  accumulatedDescriptors: Record<string, string[]>; 
  accumulatedReasons: Record<string, string[]>; 
  endGameAwards: Record<string, Award> | null;
}

export const DESCRIPTORS = [
  "Chaotic", "Genius", "Quiet", "Loud",
  "Sneaky", "Honest", "Lucky", "Clueless",
  "Sweaty", "Chill", "Funny", "Serious",
  "Leader", "Follower", "Wildcard", "Trusting",
  "Salty", "Helpful", "Confused", "Sharp",
  "Bold", "Shy", "Friendly", "Ruthless"
];