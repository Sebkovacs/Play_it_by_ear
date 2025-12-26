
import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, GameState, Player, PlayerRole, NetworkMessage, UserStats, GameMode, GameResult, VoteSubmission, RoundHistory } from './types';
import { generateGameScenarios, generateEndGameAwards, generatePersona } from './services/geminiService';
import { p2p } from './services/p2pService';
import { saveGameToHistory, subscribeToAuthChanges, logout, saveUserAward, getUserAwards } from './services/firebase';
import { Navbar } from './components/Navbar';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

// Views
import { LandingView } from './components/views/LandingView';
import { LobbyView } from './components/views/LobbyView';
import { GeneratingView } from './components/views/GeneratingView';
import { RevealView } from './components/views/RevealView';
import { GameView } from './components/views/GameView';
import { ResultView } from './components/views/ResultView';
import { VotingView } from './components/views/VotingView';
import { ProfileView } from './components/views/ProfileView';
import { PublicProfileView } from './components/views/PublicProfileView';

const App: React.FC = () => {
  // Identity
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myName, setMyName] = useState('');
  const [userStats, setUserStats] = useState<UserStats>({ gamesPlayed: 0, wins: 0 });
  const [myAwards, setMyAwards] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // UI State
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  
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
    guesserId: null,
    starterId: null,
    currentRound: 1,
    targetValue: 3, // Default 3 rounds
    gameMode: GameMode.ROUNDS,
    maxToneDeaf: 1,
    scores: {},
    accumulatedDescriptors: {},
    accumulatedReasons: {},
    endGameAwards: null
  });

  const [topicInput, setTopicInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const countdownIntervalRef = useRef<any>(null);

  // Ref to access current state in event listeners
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        setUserId(user.uid);
        if (user.displayName) {
           setMyName(user.displayName);
           handleLogin(user.displayName);
        }
        // Fetch Awards
        const awards = await getUserAwards(user.uid);
        setMyAwards(awards);
      } else {
        setUserId('');
        setMyAwards([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load User Stats and Name from LocalStorage (fallback)
  useEffect(() => {
      const storedName = localStorage.getItem('ibe_name');
      const storedStats = localStorage.getItem('ibe_stats');
      
      if (storedName && !myName) setMyName(storedName);
      if (storedStats) {
          try {
              setUserStats(JSON.parse(storedStats));
          } catch (e) {
              console.error("Failed to parse stats", e);
          }
      }
  }, []);

  // Initial URL Check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setJoinCode(code);
    }
  }, []);

  // Cleanup P2P on unmount
  useEffect(() => {
    return () => { p2p.destroy(); };
  }, []);
  
  // --- Helper Functions ---
  const saveUserStats = (newStats: UserStats) => {
      setUserStats(newStats);
      localStorage.setItem('ibe_stats', JSON.stringify(newStats));
  };
  
  const handleLogin = (name: string) => {
      const cleanName = name.trim();
      setMyName(cleanName);
      localStorage.setItem('ibe_name', cleanName);
  };
  
  const handleLogout = async () => {
      await logout();
      setIsLoggedIn(false);
      setMyName('');
      setUserId('');
      setMyAwards([]);
      localStorage.removeItem('ibe_name');
      setGameState(prev => ({ ...prev, phase: GamePhase.LANDING }));
  };
  
  const getPlayerTitle = (stats: UserStats) => {
      if (stats.personaTitle) return stats.personaTitle;
      if (stats.gamesPlayed === 0) return "Fresh Meat";
      return "The Unknown";
  };


  // --- Host Logic: Countdown Monitor ---
  useEffect(() => {
    if (!isHost || gameState.phase !== GamePhase.LOBBY) return;
    const allReady = gameState.players.length >= 3 && gameState.players.every(p => p.isReady);
    if (allReady && gameState.countdown === null) startCountdown();
    if (!allReady && gameState.countdown !== null) cancelCountdown();
  }, [gameState.players, isHost, gameState.phase]);

  const startCountdown = () => {
      let count = 5;
      updateCountdownState(count);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
          count--;
          if (count > 0) updateCountdownState(count);
          else {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              updateCountdownState(null);
              startGame();
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
    if (msg.type === 'STATE_UPDATE') {
       if (!stateRef.current.players.find(p => p.id === myPlayerId)?.isHost) {
          const currentState = stateRef.current;
          const nextState = msg.payload;

          // Check if game just ended with new awards
          if ((nextState.phase === GamePhase.GAME_OVER) && currentState.phase !== GamePhase.GAME_OVER) {
               handleGameOverSync(nextState);
          }
          
          if (nextState.phase === GamePhase.RESULT && currentState.phase !== GamePhase.RESULT) {
              updateStatsOnRoundEnd(nextState);
          }

          setGameState({...nextState, error: null}); 
       }
    } else if (msg.type === 'JOIN_REQUEST') {
       const { name, id, stats, uid } = msg.payload; // Stats and UID added
       const realPeerId = senderPeerId || msg.payload.peerId;
       setGameState(prev => {
         const exists = prev.players.find(p => p.id === id);
         if (exists) return prev;
         const newPlayer: Player = {
           id, peerId: realPeerId, name, role: PlayerRole.PENDING, isHost: false, hasViewed: false, isReady: false, topicSuggestion: '', hasVoted: false,
           stats: stats, // Store public stats
           uid: uid
         };
         const newScores = { ...prev.scores, [id]: 10 };
         const newState = { ...prev, players: [...prev.players, newPlayer], scores: newScores };
         broadcastState(newState);
         return newState;
       });
    } else if (msg.type === 'TOGGLE_READY') {
        const { id } = msg.payload;
        setGameState(prev => {
            const newState = { ...prev, players: prev.players.map(p => p.id === id ? { ...p, isReady: !p.isReady } : p) };
            broadcastState(newState);
            return newState;
        });
    } else if (msg.type === 'SUBMIT_TOPIC') {
        const { id, topic } = msg.payload;
        setGameState(prev => {
            const newState = { ...prev, players: prev.players.map(p => p.id === id ? { ...p, topicSuggestion: topic } : p) };
            broadcastState(newState);
            return newState;
        });
    } else if (msg.type === 'START_GUESS') {
        const { id } = msg.payload;
        setGameState(prev => ({ ...prev, phase: GamePhase.GUESSING, guesserId: id }));
    } else if (msg.type === 'SUBMIT_GUESS') {
        if (isHost) handleGuessVerification(msg.payload.guesses, msg.payload.guesserId);
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
    } else if (msg.type === 'SUBMIT_VOTES') {
        if(isHost) handleVoteAggregation(msg.payload, msg.senderId);
    } else if (msg.type === 'RESET_GAME') {
        setGameState(prev => ({ ...prev, phase: GamePhase.LOBBY, scenarios: null, revealedPlayers: [], countdown: null, players: prev.players.map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: '', hasVoted: false})), lastResult: null, guesserId: null, starterId: null, currentRound: 1, scores: {}, targetValue: 3 }));
        setTopicInput('');
    }
  };

  const broadcastState = (state: GameState) => {
    p2p.broadcast({ type: 'STATE_UPDATE', payload: state });
  };
  
  const handlePeerDisconnect = (disconnectedPeerId: string) => {
    if (stateRef.current.players.find(p => p.id === myPlayerId)?.isHost) {
        setGameState(prev => {
            const newPlayers = prev.players.filter(p => p.peerId !== disconnectedPeerId);
            const newState = { ...prev, players: newPlayers };
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
    handleLogin(myName);
    const code = p2p.generateRoomCode();
    setIsHost(true);
    const myId = Date.now().toString();
    setMyPlayerId(myId);

    try {
      await p2p.host(code, handleIncomingMessage, 
          (conn) => { conn.send({ type: 'STATE_UPDATE', payload: stateRef.current }); },
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
          topicSuggestion: '', 
          hasVoted: false,
          stats: {
              wins: userStats.wins,
              gamesPlayed: userStats.gamesPlayed,
              title: getPlayerTitle(userStats),
              description: userStats.personaDescription || ""
          },
          uid: userId
      };
      // Host starts with 10 pts
      const newState: GameState = { phase: GamePhase.LOBBY, players: [hostPlayer], scenarios: null, error: null, roomCode: code, revealedPlayers: [], countdown: null, history: [], lastResult: null, guesserId: null, starterId: null, currentRound: 1, targetValue: 3, gameMode: GameMode.ROUNDS, maxToneDeaf: 1, scores: { [myId]: 10 }, accumulatedDescriptors: {}, accumulatedReasons: {}, endGameAwards: null };
      setGameState(newState);
    } catch (e: any) {
       setGameState(prev => ({...prev, error: "Could not create room: " + e.message}));
    }
  };

  const joinGame = async () => {
    if (!myName.trim() || !joinCode.trim()) return;
    handleLogin(myName);
    const myId = Date.now().toString();
    setMyPlayerId(myId);
    setIsHost(false);
    setGameState(prev => ({...prev, phase: GamePhase.LOBBY})); 
    try {
      await p2p.join(joinCode, handleIncomingMessage);
      p2p.broadcast({ 
          type: 'JOIN_REQUEST', 
          payload: { 
              name: myName.trim(), 
              id: myId, 
              peerId: 'CLIENT',
              stats: {
                  wins: userStats.wins,
                  gamesPlayed: userStats.gamesPlayed,
                  title: getPlayerTitle(userStats),
                  description: userStats.personaDescription || ""
              },
              uid: userId
          } 
      });
    } catch (e: any) {
      setGameState(prev => ({ ...prev, phase: GamePhase.LANDING, error: "Could not join: " + e.message + ". Check the code." }));
    }
  };

  // --- DEV: TEST MODE INJECTOR ---
  const handleTestMode = () => {
    const fakeBots: Player[] = [
      { id: 'bot-1', peerId: 'bot-1', name: 'Bot Alice', role: PlayerRole.PENDING, isHost: false, hasViewed: true, isReady: true, topicSuggestion: 'Office Politics', hasVoted: false, stats: { wins: 5, gamesPlayed: 20, title: "The Average", description: "Boring." } },
      { id: 'bot-2', peerId: 'bot-2', name: 'Bot Bob', role: PlayerRole.PENDING, isHost: false, hasViewed: true, isReady: true, topicSuggestion: 'First Date', hasVoted: false, stats: { wins: 99, gamesPlayed: 100, title: "The Shark", description: "Dangerous." } },
      { id: 'bot-3', peerId: 'bot-3', name: 'Bot Charlie', role: PlayerRole.PENDING, isHost: false, hasViewed: true, isReady: true, topicSuggestion: 'Cooking Show', hasVoted: false, stats: { wins: 0, gamesPlayed: 1, title: "The Noob", description: "Fresh meat." } },
    ];
    setGameState(prev => {
      const newScores = { ...prev.scores };
      fakeBots.forEach(b => newScores[b.id] = 10);
      const newState = {
         ...prev,
         players: [...prev.players, ...fakeBots],
         scores: newScores
      };
      broadcastState(newState); 
      return newState;
    });
  };

  const toggleReady = () => {
      const myPlayer = gameState.players.find(p => p.id === myPlayerId);
      if (!myPlayer?.topicSuggestion.trim()) return;
      if (isHost) {
          setGameState(prev => {
              const newState = { ...prev, players: prev.players.map(p => p.id === myPlayerId ? { ...p, isReady: !p.isReady } : p) };
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
              const newState = { ...prev, players: prev.players.map(p => p.id === myPlayerId ? { ...p, topicSuggestion: val } : p) };
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
      setGameState(prev => ({ ...prev, error: "Minimum 3 players needed for chaos." }));
      return;
    }
    setGameState(prev => { const next = { ...prev, phase: GamePhase.GENERATING, error: null }; broadcastState(next); return next; });
    try {
      const submittedTopics = gameState.players.map(p => p.topicSuggestion).filter(t => t && t.trim().length > 0);
      const chosenTopic = submittedTopics.length > 0 ? submittedTopics[Math.floor(Math.random() * submittedTopics.length)] : undefined;
      const scenarios = await generateGameScenarios(chosenTopic);
      const players = [...gameState.players];
      const scores = { ...gameState.scores };
      
      // Ensure everyone has 10 points if they are new or if round 1
      players.forEach(p => { 
        if (scores[p.id] === undefined) {
            scores[p.id] = 10; 
        }
        // Reset per-round states
        p.hasVoted = false; 
      });

      // Role Assignment
      const playerCount = players.length;
      let toneDeafCount = gameState.maxToneDeaf;
      if (playerCount === 3) toneDeafCount = Math.min(toneDeafCount, 1);
      players.forEach(p => p.role = PlayerRole.PENDING);
      const indices = players.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
      for (let i = 0; i < toneDeafCount; i++) { players[indices[i]].role = PlayerRole.TONE_DEAF; }
      const remainingIndices = indices.slice(toneDeafCount);
      const splitPoint = Math.floor(remainingIndices.length / 2);
      for (let i = 0; i < remainingIndices.length; i++) {
          if (i < splitPoint) players[remainingIndices[i]].role = PlayerRole.SCENARIO_A;
          else players[remainingIndices[i]].role = PlayerRole.SCENARIO_B;
      }

      // Select Meeting Starter (Random)
      const starter = players[Math.floor(Math.random() * players.length)];

      const newState = { ...gameState, phase: GamePhase.REVEAL, players, scores, scenarios, error: null, revealedPlayers: [], countdown: null, lastResult: null, guesserId: null, starterId: starter.id };
      setGameState(newState);
      broadcastState(newState);
    } catch (e: any) {
      const errState = { ...gameState, phase: GamePhase.LOBBY, error: "Failed to generate: " + (e.message || ""), countdown: null };
      setGameState(errState);
      broadcastState(errState);
    }
  };

  const markAsReady = () => setGameState(prev => ({...prev, phase: GamePhase.PLAYING}));

  const updateStatsOnRoundEnd = (state: GameState) => {
      const result = state.lastResult;
      const me = state.players.find(p => p.id === myPlayerId);
      if (!result || !me) return;
      const guesser = state.players.find(p => p.name === result.guesserName);
      let iWon = false;
      if (result.wasCorrect) {
          if (me.id === guesser?.id) iWon = true;
          else if (guesser && me.role === guesser.role && me.role !== PlayerRole.TONE_DEAF) iWon = true;
      } else {
          if (guesser && me.role !== guesser.role && me.id !== guesser.id) iWon = true;
      }
      saveUserStats({ ...userStats, gamesPlayed: userStats.gamesPlayed + 1, wins: iWon ? userStats.wins + 1 : userStats.wins });
  };
  
  const handleGameOverSync = async (nextState: GameState) => {
      // Save award if logged in
      if (userId && nextState.endGameAwards) {
          const myAward = nextState.endGameAwards[myPlayerId];
          if (myAward) {
              await saveUserAward(userId, myAward, "It By Ear Season");
              setMyAwards(prev => [{...myAward, topic: "End Game", timestamp: Date.now()}, ...prev]);
              
              // Generate persistent persona if we have enough data (lazy trigger)
              const newPersona = await generatePersona(userStats, myAwards);
              if (newPersona) {
                  const newStats = { ...userStats, personaTitle: newPersona.title, personaDescription: newPersona.description };
                  saveUserStats(newStats);
              }
          }
      }
  };

  const initiateGuess = () => {
      if (isHost) {
          setGameState(prev => ({ ...prev, phase: GamePhase.GUESSING, guesserId: myPlayerId }));
          broadcastState({ ...gameState, phase: GamePhase.GUESSING, guesserId: myPlayerId });
      } else {
          p2p.broadcast({ type: 'START_GUESS', payload: { id: myPlayerId }});
      }
  };

  const cancelGuess = () => {
      if (isHost) {
           const newState = { ...gameState, phase: GamePhase.PLAYING, guesserId: null };
           setGameState(newState);
           broadcastState(newState);
      } else {
           p2p.broadcast({ type: 'CANCEL_GUESS', payload: {} });
      }
  };

  const submitGuess = (guesses: Record<string, PlayerRole>) => {
      if (isHost) handleGuessVerification(guesses, myPlayerId);
      else p2p.broadcast({ type: 'SUBMIT_GUESS', payload: { guesses, guesserId: myPlayerId } });
  };

  const handleGuessVerification = async (guesses: Record<string, PlayerRole>, guesserId: string) => {
      const players = stateRef.current.players;
      const scores = { ...stateRef.current.scores };
      const pointDeltas: Record<string, number> = {};
      
      scores[guesserId] = (scores[guesserId] || 10) - 2;
      pointDeltas[guesserId] = -2;

      let allCorrect = true;
      players.filter(p => p.id !== guesserId).forEach(p => {
         const guessedRole = guesses[p.id];
         if (!guessedRole || guessedRole !== p.role) allCorrect = false;
      });
      const guesser = players.find(p => p.id === guesserId);
      let winner = "";
      let reason = "";
      
      if (allCorrect) {
          winner = guesser?.name || "Guesser";
          reason = "Accusation Verified. Scum removed.";
          scores[guesserId] = (scores[guesserId] || 0) + 5;
          pointDeltas[guesserId] = (pointDeltas[guesserId] || 0) + 5;
          players.forEach(p => { 
             const isTeammate = p.id !== guesserId && guesser && p.role === guesser.role && p.role !== PlayerRole.TONE_DEAF;
             if (isTeammate) {
                 scores[p.id] = (scores[p.id] || 10) + 1; 
                 pointDeltas[p.id] = 1;
             }
          });
      } else {
          winner = "The Resistance";
          reason = `${guesser?.name} is a loud wrong person.`;
          players.forEach(p => { 
             const isTeammate = p.id !== guesserId && guesser && p.role === guesser.role && p.role !== PlayerRole.TONE_DEAF;
             if (isTeammate) {
                 scores[p.id] = (scores[p.id] || 10) - 1; 
                 pointDeltas[p.id] = -1;
             }
          });
          players.forEach(p => { 
              const isOpponent = p.id !== guesserId && guesser && p.role !== guesser.role;
              if (isOpponent) {
                  scores[p.id] = (scores[p.id] || 10) + 1; 
                  pointDeltas[p.id] = 1;
              }
          });
      }

      const result: GameResult = { winner, reason, guesserName: guesser?.name, wasCorrect: allCorrect, awards: {}, pointDeltas };
      const newHistory: RoundHistory = { id: Date.now().toString(), topic: stateRef.current.scenarios?.topic || "Unknown Topic", winner: allCorrect ? (guesser?.name + "'s Team") : "Opposition", timestamp: Date.now() };
      saveGameToHistory(newHistory);
      
      const newState = { 
          ...stateRef.current, 
          phase: GamePhase.RESULT, 
          lastResult: result, 
          history: [newHistory, ...stateRef.current.history], 
          scores, 
          guesserId: null, 
          revealedPlayers: players.map(p => p.id),
          players: players.map(p => ({...p, hasVoted: false})) // Reset voting status
      };
      setGameState(newState);
      broadcastState(newState);
      updateStatsOnRoundEnd(newState);
  };
  
  // --- VOTING LOGIC ---

  const startVibeCheck = () => {
      if(!isHost) return;
      const newState = { ...gameState, phase: GamePhase.VOTING };
      setGameState(newState);
      broadcastState(newState);
  };

  const submitVotes = (votes: VoteSubmission) => {
      if(isHost) {
          handleVoteAggregation(votes, myPlayerId);
      } else {
          p2p.broadcast({ type: 'SUBMIT_VOTES', payload: votes, senderId: myPlayerId });
      }
  };

  const handleVoteAggregation = (votes: VoteSubmission, senderId?: string) => {
      if(!senderId) return;
      
      setGameState(prev => {
          const newDesc = { ...prev.accumulatedDescriptors };
          const newReason = { ...prev.accumulatedReasons };
          
          // Add descriptors
          Object.keys(votes.descriptors).forEach(targetId => {
              if(!newDesc[targetId]) newDesc[targetId] = [];
              newDesc[targetId].push(votes.descriptors[targetId]);
          });

          // Add reasons (Best/Worst)
          if(votes.bestPlayerId) {
             if(!newReason[votes.bestPlayerId]) newReason[votes.bestPlayerId] = [];
             newReason[votes.bestPlayerId].push(`Voted BEST: ${votes.bestReason}`);
          }
          if(votes.worstPlayerId) {
             if(!newReason[votes.worstPlayerId]) newReason[votes.worstPlayerId] = [];
             newReason[votes.worstPlayerId].push(`Voted WORST: ${votes.worstReason}`);
          }

          const newPlayers = prev.players.map(p => p.id === senderId ? { ...p, hasVoted: true } : p);
          
          const newState = { 
              ...prev, 
              players: newPlayers, 
              accumulatedDescriptors: newDesc, 
              accumulatedReasons: newReason 
          };
          
          // Host sees local update immediately
          // Note: We don't broadcast every single vote to avoid spam, but we broadcast the 'hasVoted' status
          if (isHost) broadcastState(newState);
          return newState;
      });
  };

  const handleNextRound = async () => {
      if (!isHost) return;

      let isGameOver = false;
      if (gameState.gameMode === GameMode.ROUNDS) {
          if (gameState.currentRound >= gameState.targetValue) isGameOver = true;
      } else {
          const highestScore = Math.max(...(Object.values(gameState.scores) as number[]));
          if (highestScore >= gameState.targetValue) isGameOver = true;
      }

      if (isGameOver) {
          // GENERATE FINAL AWARDS
          const awards = await generateEndGameAwards(gameState.players, gameState.accumulatedDescriptors, gameState.accumulatedReasons);
          const newState = { ...gameState, phase: GamePhase.GAME_OVER, endGameAwards: awards };
          setGameState(newState);
          broadcastState(newState);
          handleGameOverSync(newState);
          return; 
      }

      const nextRound = gameState.currentRound + 1;
      setTopicInput(''); 
      const loadingState = { ...gameState, phase: GamePhase.GENERATING, currentRound: nextRound, error: null };
      setGameState(loadingState);
      broadcastState(loadingState);
      setTimeout(() => startGame(), 500); 
  };

  const handleReset = () => {
      if(!isHost) return;
      const resetScores: Record<string, number> = {};
      gameState.players.forEach(p => resetScores[p.id] = 10);
      
      const newState: GameState = { 
          ...gameState, 
          phase: GamePhase.LOBBY, 
          scenarios: null, 
          revealedPlayers: [], 
          countdown: null, 
          players: gameState.players.map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: '', hasVoted: false})), 
          lastResult: null, 
          guesserId: null, 
          starterId: null, 
          currentRound: 1, 
          scores: resetScores,
          accumulatedDescriptors: {},
          accumulatedReasons: {},
          endGameAwards: null
      };
      setGameState(newState);
      broadcastState(newState);
      setTopicInput('');
  };
  
  const updateSettings = (target: number, toneDeaf: number, mode: GameMode) => {
      setGameState(prev => { 
          const newState = { ...prev, targetValue: target, maxToneDeaf: toneDeaf, gameMode: mode }; 
          broadcastState(newState); 
          return newState; 
      });
  };
  
  const copyLink = () => {
      const url = `${window.location.origin}${window.location.pathname}?code=${gameState.roomCode}`;
      navigator.clipboard.writeText(url);
      alert("Link copied! Spread the virus.");
  };

  const handleSelectPlayer = (player: Player) => {
      // Don't view yourself as 'other', use the main stats modal
      if (player.id === myPlayerId) {
          setShowStats(true);
      } else {
          setViewingPlayer(player);
      }
  };

  const renderContent = () => {
    switch(gameState.phase) {
      case GamePhase.LANDING:
        return <LandingView 
                  myName={myName} setMyName={setMyName} 
                  joinCode={joinCode} setJoinCode={setJoinCode}
                  onCreateGame={createGame} onJoinGame={joinGame}
                  error={gameState.error}
                  isLoggedIn={isLoggedIn}
                  onManualLogin={() => { setMyName(prev => prev || "Guest"); setIsLoggedIn(true); }}
               />;
      case GamePhase.LOBBY:
        return <LobbyView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost}
                  onCopyLink={copyLink} onToggleReady={toggleReady} onUpdateSettings={updateSettings}
                  topicInput={topicInput} setTopicInput={setTopicInput} onSubmitTopic={submitTopic}
                  onTestMode={handleTestMode}
                  onSelectPlayer={handleSelectPlayer}
               />;
      case GamePhase.GENERATING:
        return <GeneratingView round={gameState.currentRound} />;
      case GamePhase.REVEAL:
        return <RevealView gameState={gameState} myPlayerId={myPlayerId} onMarkReady={markAsReady} />;
      case GamePhase.PLAYING:
      case GamePhase.GUESSING:
        return <GameView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost}
                  onInitiateGuess={initiateGuess} onCancelGuess={cancelGuess} onSubmitGuess={submitGuess}
               />;
      case GamePhase.RESULT:
        return <ResultView 
                  gameState={gameState} isHost={isHost} onStartVibeCheck={startVibeCheck} 
                  onSelectPlayer={handleSelectPlayer}
               />;
      case GamePhase.VOTING:
        return <VotingView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost} 
                  onSubmitVotes={submitVotes} onHostNext={handleNextRound} 
               />;
      case GamePhase.GAME_OVER:
        // Reuse ResultView but with special props or just let it read endGameAwards
        return <ResultView 
                  gameState={gameState} isHost={isHost} onStartVibeCheck={() => {}} onReset={handleReset} 
                  isGameOver={true} onSelectPlayer={handleSelectPlayer} 
               />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8 text-center flex-col gap-4">
            <h2 className="text-xl text-brand-orange font-bold">System Failure</h2>
            <p className="text-brand-navy">{gameState.error}</p>
            <Button onClick={() => setGameState(prev => ({...prev, phase: GamePhase.LANDING, error: null}))}>Eject</Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-brand-background font-sans">
      <Navbar 
          userName={myName}
          userStats={userStats}
          onLogout={handleLogout}
          onShowStats={() => setShowStats(true)}
          onShowHelp={() => setShowHelp(true)}
          playerTitle={getPlayerTitle(userStats)}
          minimal={gameState.phase === GamePhase.LANDING}
          players={gameState.players}
          scores={gameState.scores}
      />

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Rules of Engagement">
         <div className="space-y-4 text-brand-navy text-sm leading-relaxed">
            <p className="italic text-brand-navy/60 border-l-4 border-brand-teal pl-3">"We don't have a plan, but we have a vibe."</p>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">1. The Setup</h3>
                <p>Half the room has a <strong>Serious Scenario</strong>. The other half has an <strong>Absurd Scenario</strong>. There can be 0 to 2 <strong>Tone Deaf</strong> players who know nothing!</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">2. The Gameplay</h3>
                <p>Talk vaguely. Signal your tribe. Lie to the others. Don't let the Tone Deaf player blend in.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">3. The Vibe Check</h3>
                <p>After each round, you must judge your peers. Rate the MVP and the Worst player. Assign tags. These will haunt them forever.</p>
            </div>
         </div>
         <div className="pt-2">
            <Button fullWidth onClick={() => setShowHelp(false)}>Understood</Button>
         </div>
      </Modal>

      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="">
          <ProfileView 
             userStats={userStats}
             playerTitle={getPlayerTitle(userStats)}
             myAwards={myAwards}
             currentName={myName}
             onUpdateName={setMyName}
             onLogout={handleLogout}
             onClose={() => setShowStats(false)}
          />
      </Modal>

      <Modal isOpen={!!viewingPlayer} onClose={() => setViewingPlayer(null)} title="">
          {viewingPlayer && <PublicProfileView player={viewingPlayer} />}
      </Modal>

      {renderContent()}
    </div>
  );
};

export default App;
