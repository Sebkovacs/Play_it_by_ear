

import { useState, useRef, useEffect } from 'react';
import { 
  GameState, Player, GamePhase, PlayerRole, 
  GameMode, GameResult, VoteSubmission, RoundHistory, PlayerPublicStats, TopicPack 
} from '../types';
import { 
  createGameRoom, subscribeToGame, updateGameRoom, 
  getGameRoom, saveGameToHistory, leaveGameRoom 
} from '../services/firebase'; 
import { generateGameScenarios, generateEndGameAwards, verifyTopicGuess } from '../services/geminiService';

const GUESS_COST = 3;

// Helper to generate a room code 
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Distinct chars to avoid confusion
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const INITIAL_STATE: GameState = {
  lastUpdated: Date.now(),
  phase: GamePhase.LANDING,
  players: [],
  scenarios: null,
  error: null,
  notification: null,
  roomCode: null,
  revealedPlayers: [],
  countdown: null,
  history: [],
  lastResult: null,
  guesserId: null,
  caughtPlayerId: null,
  starterId: null,
  currentRound: 1,
  targetValue: 3,
  gameMode: GameMode.ROUNDS,
  maxToneDeaf: 1,
  topicPack: TopicPack.STANDARD,
  scores: {},
  accumulatedDescriptors: {},
  accumulatedReasons: {},
  endGameAwards: null
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  
  // Ref to access latest state in async functions without closure staleness
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Derived state (Safe Access)
  const isHost = gameState.players?.find(p => p.id === myPlayerId)?.isHost || false;

  // --- Session Recovery (Reconnect on Refresh) ---
  useEffect(() => {
    const restoreSession = async () => {
        const savedRoom = sessionStorage.getItem('ibe_room');
        const savedPlayerId = sessionStorage.getItem('ibe_pid');
        
        // Only attempt restore if we are currently in Landing phase (not already joined)
        if (savedRoom && savedPlayerId && gameState.phase === GamePhase.LANDING) {
            try {
                const roomData = await getGameRoom(savedRoom);
                if (roomData && roomData.players && roomData.players.some(p => p.id === savedPlayerId)) {
                    console.log("Restoring session:", savedRoom);
                    setMyPlayerId(savedPlayerId);
                    subscribeToGame(savedRoom, setGameState);
                } else {
                    // Session invalid (game over or kicked)
                    sessionStorage.removeItem('ibe_room');
                    sessionStorage.removeItem('ibe_pid');
                }
            } catch (e) {
                console.error("Session restore failed", e);
            }
        }
    };
    restoreSession();
  }, [gameState.phase]); // Dependency on phase ensures we don't loop if already connected

  // --- Host Reactive Logic ---
  // Instead of relying on events, the Host watches the state for transitions
  useEffect(() => {
      if (!isHost || !gameState.players) return;

      // Transition: REVEAL -> PLAYING
      if (gameState.phase === GamePhase.REVEAL) {
          const allReady = gameState.players.length > 0 && gameState.players.every(p => p.isReady);
          if (allReady) {
              const updatedPlayers = gameState.players.map(p => ({...p, isReady: false}));
              // Check for Shootout Trigger
              const allBroke = updatedPlayers.every(p => (gameState.scores[p.id] || 0) < GUESS_COST);
              
              updateGameRoom(gameState.roomCode!, {
                  phase: allBroke ? GamePhase.SHOOTOUT : GamePhase.PLAYING,
                  players: updatedPlayers,
                  notification: allBroke ? "SUDDEN DEATH! Everyone is broke. Guessing is FREE!" : null
              });
          }
      }

      // Host Pickup / Migration Logic
      // If I just became host (e.g. previous host left), check if I need to unstuck the game.
      if (gameState.phase === GamePhase.REVEAL) {
          // Double check if everyone is already ready but we're stuck in REVEAL
          const allReady = gameState.players.length > 0 && gameState.players.every(p => p.isReady);
          if (allReady) {
              // Re-trigger the transition
               const updatedPlayers = gameState.players.map(p => ({...p, isReady: false}));
               const allBroke = updatedPlayers.every(p => (gameState.scores[p.id] || 0) < GUESS_COST);
               updateGameRoom(gameState.roomCode!, {
                  phase: allBroke ? GamePhase.SHOOTOUT : GamePhase.PLAYING,
                  players: updatedPlayers,
                  notification: allBroke ? "SUDDEN DEATH! Everyone is broke. Guessing is FREE!" : null
              });
          }
      }
      
  }, [gameState, isHost]);


  // --- Actions ---

  const createGame = async (playerName: string, playerStats: PlayerPublicStats, uid?: string) => {
      const code = generateRoomCode();
      const myId = uid || 'host-' + Date.now();
      setMyPlayerId(myId);
      
      // Save Session
      sessionStorage.setItem('ibe_room', code);
      sessionStorage.setItem('ibe_pid', myId);

      const hostPlayer: Player = { 
          id: myId, name: playerName, role: PlayerRole.PENDING, isHost: true, hasViewed: false, isReady: false, topicSuggestion: '', hasVoted: false,
          stats: playerStats, uid: uid
      };

      const newState: GameState = { 
          ...INITIAL_STATE, 
          phase: GamePhase.LOBBY, 
          players: [hostPlayer], 
          roomCode: code, 
          scores: { [myId]: 10 } 
      };

      await createGameRoom(code, newState);
      subscribeToGame(code, setGameState);
  };

  const joinGame = async (code: string, playerName: string, playerStats: PlayerPublicStats, uid?: string) => {
      try {
          const currentRemoteState = await getGameRoom(code);
          if (!currentRemoteState) {
              setGameState(prev => ({...prev, error: "Room not found."}));
              return;
          }
          if (currentRemoteState.phase !== GamePhase.LOBBY) {
              // Allow rejoin if player ID exists in room, but for new players block them
              // We rely on Session Recovery for actual rejoins, this function is for NEW joins
              setGameState(prev => ({...prev, error: "Game already in progress."}));
              return;
          }

          const myId = uid || 'player-' + Date.now();
          setMyPlayerId(myId);

          // Save Session
          sessionStorage.setItem('ibe_room', code);
          sessionStorage.setItem('ibe_pid', myId);

          // Check if already in game (rejoin)
          const existingPlayers = currentRemoteState.players || [];
          const existingPlayer = existingPlayers.find(p => p.id === myId);
          if (!existingPlayer) {
              const newPlayer: Player = {
                  id: myId, name: playerName, role: PlayerRole.PENDING, isHost: false, hasViewed: false, isReady: false, topicSuggestion: '', hasVoted: false,
                  stats: playerStats, uid: uid
              };
              const newScores = { ...currentRemoteState.scores, [myId]: 10 };
              const newState = { 
                  ...currentRemoteState, 
                  players: [...existingPlayers, newPlayer], 
                  scores: newScores 
              };
              await updateGameRoom(code, newState);
          }
          
          subscribeToGame(code, setGameState);

      } catch (e: any) {
          setGameState(prev => ({ ...prev, error: "Could not join: " + e.message }));
      }
  };

  const syncUpdate = async (newState: Partial<GameState>) => {
      if (!stateRef.current.roomCode) return;
      await updateGameRoom(stateRef.current.roomCode, newState);
  };

  // --- Logic Helpers ---

  const startGame = async () => {
    if (!isHost) return;
    const current = stateRef.current;
    
    if (!current.players || current.players.length < 3) {
      setGameState(prev => ({ ...prev, error: "Minimum 3 players needed." })); 
      return;
    }

    // Set Loading State
    await syncUpdate({ phase: GamePhase.GENERATING, error: null, notification: null });
    
    try {
      const submittedTopics = current.players.map(p => p.topicSuggestion).filter(t => t && t.trim().length > 0);
      
      // --- UPDATE: Pass the Topic Pack ---
      const scenarios = await generateGameScenarios(submittedTopics, current.topicPack);
      
      const players = [...current.players];
      const scores = { ...current.scores };
      
      // Reset Round State
      players.forEach(p => { 
        if (scores[p.id] === undefined) scores[p.id] = 10; 
        p.hasVoted = false; 
        p.isReady = false; 
      });

      // Assign Roles
      const playerCount = players.length;
      
      // Updated Logic: Randomize Outsider count (0 to Max)
      let roundToneDeafCount = Math.floor(Math.random() * (current.maxToneDeaf + 1));
      
      // Constraints
      if (playerCount <= 3) {
           // Small games: Max 1 outsider to ensure playability (need 2 topic-knowers)
           roundToneDeafCount = Math.min(roundToneDeafCount, 1);
      } else {
           // Standard games: Ensure at least 2 people know topic
           roundToneDeafCount = Math.min(roundToneDeafCount, playerCount - 2);
      }
      
      players.forEach(p => p.role = PlayerRole.PENDING);
      const indices = players.map((_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
      
      for (let i = 0; i < roundToneDeafCount; i++) { players[indices[i]].role = PlayerRole.TONE_DEAF; }
      
      const remainingIndices = indices.slice(roundToneDeafCount);
      const splitPoint = Math.floor(remainingIndices.length / 2);
      for (let i = 0; i < remainingIndices.length; i++) {
          if (i < splitPoint) players[remainingIndices[i]].role = PlayerRole.SCENARIO_A;
          else players[remainingIndices[i]].role = PlayerRole.SCENARIO_B;
      }

      const starter = players[Math.floor(Math.random() * players.length)];
      
      await syncUpdate({ 
          phase: GamePhase.REVEAL, 
          players, scores, scenarios, 
          error: null, notification: null, 
          revealedPlayers: [], countdown: null, 
          lastResult: null, guesserId: null, 
          starterId: starter.id
      });

    } catch (e: any) {
      await syncUpdate({ phase: GamePhase.LOBBY, error: "Failed to generate: " + (e.message || ""), countdown: null });
    }
  };

  // --- Handlers ---

  const toggleReady = async () => {
      const current = stateRef.current;
      const myPlayer = current.players?.find(p => p.id === myPlayerId);
      if (!myPlayer) return;
      if (current.phase === GamePhase.LOBBY && !myPlayer.topicSuggestion.trim()) return;

      const updatedPlayers = (current.players || []).map(p => p.id === myPlayerId ? { ...p, isReady: !p.isReady } : p);
      let newState: Partial<GameState> = { players: updatedPlayers };
      await syncUpdate(newState);
  };

  // Replaced startCountdown with direct start
  const startCountdown = () => {
      startGame();
  };

  const handleGuessVerification = async (guesses: Record<string, PlayerRole>, guesserId: string) => {
      const current = stateRef.current;
      const players = current.players || [];
      const scores = { ...current.scores };
      
      const guesser = players.find(p => p.id === guesserId);
      if (!guesser) return;

      let allCorrect = true;
      players.filter(p => p.id !== guesserId).forEach(p => {
         const guessedRole = guesses[p.id];
         if (!guessedRole || guessedRole !== p.role) allCorrect = false;
      });

      if (allCorrect) {
          const targetId = Object.keys(guesses).find(id => guesses[id] === PlayerRole.TONE_DEAF);
          const target = players.find(p => p.id === targetId);

          if (target && target.role === PlayerRole.TONE_DEAF) {
               await syncUpdate({
                   phase: GamePhase.OUTSIDER_GUESS,
                   caughtPlayerId: targetId,
                   guesserId: guesserId,
                   notification: `Accusation Correct! But ${target.name} has one chance to steal the win...`
               });
               return;
          }

          // Verified & No Tone Deaf Gambit triggered
          const pointDeltas: Record<string, number> = {};
          scores[guesserId] = (scores[guesserId] || 10) + 5;
          pointDeltas[guesserId] = 5;
          players.forEach(p => { 
             const isTeammate = p.id !== guesserId && guesser && p.role === guesser.role && p.role !== PlayerRole.TONE_DEAF;
             if (isTeammate) { scores[p.id] = (scores[p.id] || 10) + 1; pointDeltas[p.id] = 1; }
          });
          
          await finishRound({ 
              winner: guesser.name, reason: "Accusation Verified.", guesserName: guesser.name, wasCorrect: true, awards: {}, pointDeltas 
          }, scores);

      } else {
          // WRONG GUESS
          const isShootout = current.phase === GamePhase.SHOOTOUT;
          if (!isShootout) scores[guesserId] = (scores[guesserId] || 10) - GUESS_COST;
          
          players.forEach(p => { 
             const isTeammate = p.id !== guesserId && guesser && p.role === guesser.role && p.role !== PlayerRole.TONE_DEAF;
             if (isTeammate) scores[p.id] = (scores[p.id] || 10) - 1; 
          });

          let notification = `${guesser.name} guessed incorrectly!`;
          
          // Check for Shootout Trigger
          const allBroke = players.every(p => (scores[p.id] || 0) < GUESS_COST);
          let nextPhase = GamePhase.PLAYING;
          if (allBroke) {
              nextPhase = GamePhase.SHOOTOUT;
              notification += " ENTERING SHOOTOUT MODE!";
          } else if (isShootout) {
              nextPhase = GamePhase.SHOOTOUT;
          }

          await syncUpdate({
              phase: nextPhase,
              scores,
              guesserId: null,
              notification
          });
      }
  };

  const handleOutsiderGuess = async (guess: string, outsiderId: string) => {
      const current = stateRef.current;
      const scores = { ...current.scores };
      const players = current.players || [];
      const accuser = players.find(p => p.id === current.guesserId);
      const outsider = players.find(p => p.id === outsiderId);
      const pointDeltas: Record<string, number> = {};

      if (!outsider) return;

      const actualTopic = current.scenarios?.topic || "";
      const isMatch = await verifyTopicGuess(actualTopic, guess);

      if (isMatch) {
          scores[outsiderId] = (scores[outsiderId] || 10) + 15;
          pointDeltas[outsiderId] = 15;
          await finishRound({
              winner: outsider.name, reason: `Tone Deaf Stole the Win! Topic was "${actualTopic}".`, guesserName: outsider.name, wasCorrect: true, pointDeltas
          }, scores);
      } else {
           if (accuser) {
               scores[accuser.id] = (scores[accuser.id] || 10) + 5;
               pointDeltas[accuser.id] = 5;
               players.forEach(p => { 
                    const isTeammate = p.id !== accuser.id && p.role === accuser.role && p.role !== PlayerRole.TONE_DEAF;
                    if (isTeammate) { scores[p.id] = (scores[p.id] || 10) + 1; pointDeltas[p.id] = 1; }
               });
           }
           scores[outsiderId] = (scores[outsiderId] || 10) - 5;
           pointDeltas[outsiderId] = -5;
           await finishRound({
               winner: accuser?.name || "Team", reason: `Imposter Caught! Topic was "${actualTopic}".`, guesserName: accuser?.name, wasCorrect: true, pointDeltas
           }, scores);
      }
  };

  const finishRound = async (result: GameResult, scores: Record<string, number>) => {
      const current = stateRef.current;
      const players = current.players || [];
      const newHistory: RoundHistory = { id: Date.now().toString(), topic: current.scenarios?.topic || "Unknown", winner: result.winner, timestamp: Date.now() };
      await saveGameToHistory(newHistory);
      
      await syncUpdate({ 
          phase: GamePhase.RESULT, 
          lastResult: result, 
          history: [newHistory, ...current.history], 
          scores, 
          guesserId: null, 
          caughtPlayerId: null,
          revealedPlayers: players.map(p => p.id),
          players: players.map(p => ({...p, hasVoted: false})),
          notification: null
      });
  };

  const handleNextRound = async () => {
      const current = stateRef.current;
      let isGameOver = false;
      if (current.gameMode === GameMode.ROUNDS) {
          if (current.currentRound >= current.targetValue) isGameOver = true;
      } else {
          const highestScore = Math.max(...(Object.values(current.scores) as number[]));
          if (highestScore >= current.targetValue) isGameOver = true;
      }

      if (isGameOver) {
          const awards = await generateEndGameAwards(current.players || [], current.accumulatedDescriptors, current.accumulatedReasons);
          await syncUpdate({ phase: GamePhase.GAME_OVER, endGameAwards: awards, notification: null });
          return; 
      }

      const nextRound = current.currentRound + 1;
      await syncUpdate({ phase: GamePhase.GENERATING, currentRound: nextRound, error: null, notification: null });
      setTimeout(() => startGame(), 500); 
  };

  const devForceProgress = async () => {
      const current = stateRef.current;
      switch (current.phase) {
          case GamePhase.LOBBY:
              await startGame();
              break;
          case GamePhase.REVEAL:
              const readyPlayers = (current.players || []).map(p => ({ ...p, isReady: true }));
              await syncUpdate({ players: readyPlayers });
              break;
          case GamePhase.PLAYING:
          case GamePhase.GUESSING:
          case GamePhase.SHOOTOUT:
          case GamePhase.OUTSIDER_GUESS:
              await finishRound({ 
                  winner: "Dev Force", 
                  reason: "The Developer intervened.", 
                  wasCorrect: true,
                  awards: {},
                  pointDeltas: {}
              }, current.scores);
              break;
          case GamePhase.RESULT:
          case GamePhase.VOTING:
              await handleNextRound();
              break;
      }
  };

  const actions = {
      createGame,
      joinGame,
      startGame,
      startCountdown: () => startCountdown(),
      cancelCountdown: async () => await syncUpdate({ countdown: null }),
      returnToHome: async () => {
          // Gracefully leave the room in Firestore before clearing local session
          if (stateRef.current.roomCode && myPlayerId) {
             await leaveGameRoom(stateRef.current.roomCode, myPlayerId);
          }
          setGameState({ ...INITIAL_STATE, lastUpdated: Date.now() });
          setMyPlayerId('');
          sessionStorage.removeItem('ibe_room');
          sessionStorage.removeItem('ibe_pid');
      }, 
      
      toggleReady,
      submitTopic: async (val: string) => {
          const updated = (stateRef.current.players || []).map(p => p.id === myPlayerId ? { ...p, topicSuggestion: val } : p);
          await syncUpdate({ players: updated });
      },
      updateSettings: async (target: number, toneDeaf: number, mode: GameMode, pack: TopicPack) => {
          await syncUpdate({ 
              targetValue: target, 
              maxToneDeaf: toneDeaf, 
              gameMode: mode,
              topicPack: pack
          });
      },
      initiateGuess: async () => {
          // Race Condition Guard: If someone else already initiated the guess, ignore this click
          if (stateRef.current.phase === GamePhase.GUESSING || stateRef.current.phase === GamePhase.OUTSIDER_GUESS) return;
          await syncUpdate({ phase: GamePhase.GUESSING, guesserId: myPlayerId, notification: null });
      },
      cancelGuess: async () => {
          const returnPhase = stateRef.current.notification?.includes("SUDDEN DEATH") ? GamePhase.SHOOTOUT : GamePhase.PLAYING;
          await syncUpdate({ phase: returnPhase, guesserId: null });
      },
      submitGuess: async (guesses: Record<string, PlayerRole>) => {
          handleGuessVerification(guesses, myPlayerId);
      },
      submitOutsiderGuess: async (guess: string) => {
          handleOutsiderGuess(guess, myPlayerId);
      },
      startVibeCheck: async () => {
          await syncUpdate({ phase: GamePhase.VOTING });
      },
      submitVotes: async (votes: VoteSubmission) => {
          const current = stateRef.current;
          const newDesc = { ...current.accumulatedDescriptors };
          const newReason = { ...current.accumulatedReasons };
          
          Object.keys(votes.descriptors).forEach(targetId => {
              if(!newDesc[targetId]) newDesc[targetId] = [];
              newDesc[targetId].push(votes.descriptors[targetId]);
          });
          
          // Store system messages instead of user text
          if(votes.bestPlayerId) {
             if(!newReason[votes.bestPlayerId]) newReason[votes.bestPlayerId] = [];
             newReason[votes.bestPlayerId].push(`Received an MVP Vote`);
          }
          if(votes.worstPlayerId) {
             if(!newReason[votes.worstPlayerId]) newReason[votes.worstPlayerId] = [];
             newReason[votes.worstPlayerId].push(`Received a Suspicion Vote`);
          }
          const newPlayers = (current.players || []).map(p => p.id === myPlayerId ? { ...p, hasVoted: true } : p);
          await syncUpdate({ players: newPlayers, accumulatedDescriptors: newDesc, accumulatedReasons: newReason });
      },
      handleNextRound,
      handleReset: async () => {
          const current = stateRef.current;
          const resetScores: Record<string, number> = {};
          (current.players || []).forEach(p => resetScores[p.id] = 10);
          await syncUpdate({ 
              phase: GamePhase.LOBBY,
              players: (current.players || []).map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: '', hasVoted: false})), 
              scores: resetScores,
              targetValue: current.targetValue,
              maxToneDeaf: current.maxToneDeaf,
              gameMode: current.gameMode,
              history: []
          });
      },
      handleTestMode: async () => {
          const fakeBots: Player[] = [
            { id: 'bot-1', name: 'Bot Alice', role: PlayerRole.PENDING, isHost: false, hasViewed: true, isReady: true, topicSuggestion: 'Expertise: Corporate Law', hasVoted: false, stats: { wins: 5, gamesPlayed: 20, title: "The Average", description: "Boring." } },
            { id: 'bot-2', name: 'Bot Bob', role: PlayerRole.PENDING, isHost: false, hasViewed: true, isReady: true, topicSuggestion: 'Activity: Skydiving', hasVoted: false, stats: { wins: 99, gamesPlayed: 100, title: "The Shark", description: "Dangerous." } },
            { id: 'bot-3', name: 'Bot Charlie', role: PlayerRole.PENDING, isHost: false, hasViewed: true, isReady: true, topicSuggestion: 'Skill: Making Toast', hasVoted: false, stats: { wins: 0, gamesPlayed: 1, title: "The Newbie", description: "Just happy to be here." } },
          ];
          const newScores = { ...stateRef.current.scores };
          fakeBots.forEach(b => newScores[b.id] = 10);
          await syncUpdate({ players: [...(stateRef.current.players || []), ...fakeBots], scores: newScores });
      },
      devForceProgress
  };

  return { gameState, isHost, myPlayerId, actions };
};