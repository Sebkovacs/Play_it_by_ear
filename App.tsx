import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, GameState, Player, PlayerRole, NetworkMessage, RoundHistory, UserStats, Award } from './types';
import { generateGameScenarios, generateAwards } from './services/geminiService';
import { p2p } from './services/p2pService';
import { saveGameToHistory, getGlobalHistory, subscribeToAuthChanges, logout, saveUserAward, getUserAwards } from './services/firebase';
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
    currentRound: 1,
    totalRounds: 3,
    maxToneDeaf: 1,
    scores: {}
  });

  const [globalHistory, setGlobalHistory] = useState<RoundHistory[]>([]);
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
      setMyName('');
      localStorage.removeItem('ibe_name');
      setGameState(prev => ({ ...prev, phase: GamePhase.LANDING }));
  };
  
  const getPlayerTitle = (stats: UserStats) => {
      if (stats.gamesPlayed === 0) return "Intern";
      if (stats.gamesPlayed < 5) return "Junior Associate";
      if (stats.gamesPlayed < 10) return "Senior Associate";
      const winRate = stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0;
      if (winRate > 0.5 && stats.gamesPlayed >= 10) return "CEO";
      if (stats.gamesPlayed >= 20) return "Partner";
      return "Executive";
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
          // If we receive a result that has awards, check if we need to save ours
          const currentState = stateRef.current;
          const nextState = msg.payload;

          if (nextState.phase === GamePhase.RESULT && currentState.phase !== GamePhase.RESULT) {
              updateStatsOnGameEnd(nextState);
              // Save award if logged in
              if (userId && nextState.lastResult?.awards) {
                  const myAward = nextState.lastResult.awards[myPlayerId];
                  if (myAward) {
                      saveUserAward(userId, myAward, nextState.scenarios?.topic || "Unknown");
                      // Optimistically update local state
                      setMyAwards(prev => [{...myAward, topic: nextState.scenarios?.topic, timestamp: Date.now()}, ...prev]);
                  }
              }
          }
          setGameState({...nextState, error: null}); 
       }
    } else if (msg.type === 'JOIN_REQUEST') {
       const { name, id } = msg.payload;
       const realPeerId = senderPeerId || msg.payload.peerId;
       setGameState(prev => {
         const exists = prev.players.find(p => p.id === id);
         if (exists) return prev;
         const newPlayer: Player = {
           id, peerId: realPeerId, name, role: PlayerRole.PENDING, isHost: false, hasViewed: false, isReady: false, topicSuggestion: ''
         };
         const newState = { ...prev, players: [...prev.players, newPlayer] };
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
    } else if (msg.type === 'NEXT_ROUND') {
        setTopicInput('');
    } else if (msg.type === 'RESET_GAME') {
        setGameState(prev => ({ ...prev, phase: GamePhase.LOBBY, scenarios: null, revealedPlayers: [], countdown: null, players: prev.players.map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: ''})), lastResult: null, guesserId: null, currentRound: 1, scores: {} }));
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
      const hostPlayer: Player = { id: myId, peerId: 'HOST', name: myName.trim(), role: PlayerRole.PENDING, isHost: true, hasViewed: false, isReady: false, topicSuggestion: '' };
      const newState = { phase: GamePhase.LOBBY, players: [hostPlayer], scenarios: null, error: null, roomCode: code, revealedPlayers: [], countdown: null, history: [], lastResult: null, guesserId: null, currentRound: 1, totalRounds: 3, maxToneDeaf: 1, scores: { [myId]: 0 } };
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
      p2p.broadcast({ type: 'JOIN_REQUEST', payload: { name: myName.trim(), id: myId, peerId: 'CLIENT' } });
    } catch (e: any) {
      setGameState(prev => ({ ...prev, phase: GamePhase.LANDING, error: "Could not join: " + e.message + ". Check the code." }));
    }
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
      setGameState(prev => ({ ...prev, error: "Game designed for 4-8 players. (Min 3 to force start)" }));
      return;
    }
    setGameState(prev => { const next = { ...prev, phase: GamePhase.GENERATING, error: null }; broadcastState(next); return next; });
    try {
      const submittedTopics = gameState.players.map(p => p.topicSuggestion).filter(t => t && t.trim().length > 0);
      const chosenTopic = submittedTopics.length > 0 ? submittedTopics[Math.floor(Math.random() * submittedTopics.length)] : undefined;
      const scenarios = await generateGameScenarios(chosenTopic);
      const players = [...gameState.players];
      const scores = { ...gameState.scores };
      players.forEach(p => { if (scores[p.id] === undefined) scores[p.id] = 0; });

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

      const newState = { ...gameState, phase: GamePhase.REVEAL, players, scores, scenarios, error: null, revealedPlayers: [], countdown: null, lastResult: null, guesserId: null };
      setGameState(newState);
      broadcastState(newState);
    } catch (e: any) {
      const errState = { ...gameState, phase: GamePhase.LOBBY, error: "Failed to generate: " + (e.message || ""), countdown: null };
      setGameState(errState);
      broadcastState(errState);
    }
  };

  const markAsReady = () => setGameState(prev => ({...prev, phase: GamePhase.PLAYING}));

  const updateStatsOnGameEnd = (state: GameState) => {
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
      saveUserStats({ gamesPlayed: userStats.gamesPlayed + 1, wins: iWon ? userStats.wins + 1 : userStats.wins });
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
          reason = "Accusation was 100% Correct!";
          if (guesser) scores[guesser.id] = (scores[guesser.id] || 0) + 200;
          players.forEach(p => { if (p.id !== guesserId && guesser && p.role === guesser.role && p.role !== PlayerRole.TONE_DEAF) scores[p.id] = (scores[p.id] || 0) + 100; });
      } else {
          winner = "Opponents";
          reason = `${guesser?.name} guessed wrong!`;
          if (guesser) scores[guesser.id] = (scores[guesser.id] || 0) - 100;
          players.forEach(p => { if (p.id !== guesserId && guesser && p.role !== guesser.role) scores[p.id] = (scores[p.id] || 0) + 50; });
      }

      const scenarios = stateRef.current.scenarios;
      let awards = {};
      
      // Generate Awards (Host side only)
      if (scenarios) {
          awards = await generateAwards(players, scenarios, winner);
      }
      
      // Save Host's award locally if logged in
      if (userId && awards && (awards as any)[myPlayerId]) {
          const myAward = (awards as any)[myPlayerId];
          saveUserAward(userId, myAward, scenarios?.topic || "Unknown");
          setMyAwards(prev => [{...myAward, topic: scenarios?.topic, timestamp: Date.now()}, ...prev]);
      }

      const result = { winner, reason, guesserName: guesser?.name, wasCorrect: allCorrect, awards };
      const newHistory: RoundHistory = { id: Date.now().toString(), topic: stateRef.current.scenarios?.topic || "Unknown Topic", winner: allCorrect ? (guesser?.name + "'s Team") : "Opposition", timestamp: Date.now() };
      saveGameToHistory(newHistory);
      const newState = { ...stateRef.current, phase: GamePhase.RESULT, lastResult: result, history: [newHistory, ...stateRef.current.history], scores, guesserId: null, revealedPlayers: players.map(p => p.id) };
      setGameState(newState);
      broadcastState(newState);
      updateStatsOnGameEnd(newState);
  };
  
  const handleNextRound = () => {
      if (!isHost) return;
      if (gameState.currentRound >= gameState.totalRounds) { handleReset(); return; }
      const nextRound = gameState.currentRound + 1;
      setTopicInput(''); 
      setGameState(prev => ({ ...prev, currentRound: nextRound }));
      setGameState(prev => { const next = { ...prev, phase: GamePhase.GENERATING, currentRound: nextRound, error: null }; broadcastState(next); return next; });
      setTimeout(() => startGame(), 500); 
  };

  const handleReset = () => {
      if(!isHost) return;
      const newState = { ...gameState, phase: GamePhase.LOBBY, scenarios: null, revealedPlayers: [], countdown: null, players: gameState.players.map(p => ({...p, role: PlayerRole.PENDING, hasViewed: false, isReady: false, topicSuggestion: ''})), lastResult: null, guesserId: null, currentRound: 1, scores: {} };
      setGameState(newState);
      broadcastState(newState);
      setTopicInput('');
  };
  
  const updateSettings = (rounds: number, toneDeaf: number) => {
      setGameState(prev => { const newState = { ...prev, totalRounds: rounds, maxToneDeaf: toneDeaf }; broadcastState(newState); return newState; });
  };
  
  const copyLink = () => {
      const url = `${window.location.origin}${window.location.pathname}?code=${gameState.roomCode}`;
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
  };

  const renderContent = () => {
    switch(gameState.phase) {
      case GamePhase.LANDING:
        return <LandingView 
                  myName={myName} setMyName={setMyName} 
                  joinCode={joinCode} setJoinCode={setJoinCode}
                  onCreateGame={createGame} onJoinGame={joinGame}
                  globalHistory={globalHistory} error={gameState.error}
                  isLoggedIn={isLoggedIn}
                  onManualLogin={() => {
                     setMyName(prev => prev || "Guest");
                     setIsLoggedIn(true);
                  }}
               />;
      case GamePhase.LOBBY:
        return <LobbyView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost}
                  onCopyLink={copyLink} onToggleReady={toggleReady} onUpdateSettings={updateSettings}
                  topicInput={topicInput} setTopicInput={setTopicInput} onSubmitTopic={submitTopic}
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
        return <ResultView gameState={gameState} isHost={isHost} onNextRound={handleNextRound} onReset={handleReset} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8 text-center flex-col gap-4">
            <h2 className="text-xl text-brand-orange font-bold">Something went wrong</h2>
            <p className="text-brand-navy">{gameState.error}</p>
            <Button onClick={() => setGameState(prev => ({...prev, phase: GamePhase.LANDING, error: null}))}>Back to Home</Button>
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
      />

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Game Rules">
         <div className="space-y-4 text-brand-navy text-sm leading-relaxed">
            <p className="italic text-brand-navy/60 border-l-4 border-brand-teal pl-3">"We don't have a plan, but we have a vibe."</p>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">1. The Setup</h3>
                <p>Everyone enters the meeting. Half the room has a <strong>Serious Agenda</strong>. The other half has a <strong>Silly Agenda</strong>.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">2. The Twist</h3>
                <p>There might be <strong>Tone Deaf</strong> players. They have no idea what's going on. They just have to fake it.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">3. The Gameplay</h3>
                <p>Talk vaguely about the topic. Try to signal your teammates without alerting the enemy.</p>
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-brand-darkBlue">4. Winning</h3>
                <p>Hit <strong>"Make Accusation"</strong> if you know who everyone is.</p>
                <ul className="list-disc pl-5 opacity-80">
                    <li>Correct Accusation: +200 pts (Guesser), +100 pts (Team).</li>
                    <li>Wrong Accusation: -100 pts (Guesser), +50 pts (Enemy Team).</li>
                </ul>
            </div>
         </div>
         <div className="pt-2">
            <Button fullWidth onClick={() => setShowHelp(false)}>Got it</Button>
         </div>
      </Modal>

      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Career Profile">
           <div className="flex flex-col items-center justify-center py-4 space-y-4 w-full">
               <div className="bg-brand-teal/10 p-4 rounded-full text-brand-darkBlue">
                   <div className="text-4xl">👔</div>
               </div>
               <div className="text-center">
                   <h2 className="text-2xl font-bold text-brand-darkBlue">{myName || "Guest"}</h2>
                   <span className="bg-brand-darkBlue text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mt-2 inline-block">
                       {getPlayerTitle(userStats)}
                   </span>
               </div>
               
               <div className="grid grid-cols-2 gap-4 w-full mt-4">
                   <div className="bg-brand-navy/5 p-4 rounded-xl text-center">
                       <div className="text-3xl font-black text-brand-navy">{userStats.gamesPlayed}</div>
                       <div className="text-xs uppercase font-bold text-brand-navy/40">Meetings Attended</div>
                   </div>
                   <div className="bg-brand-navy/5 p-4 rounded-xl text-center">
                       <div className="text-3xl font-black text-brand-teal">{userStats.wins}</div>
                       <div className="text-xs uppercase font-bold text-brand-navy/40">Successful Mergers</div>
                   </div>
               </div>
               
               <div className="w-full text-center pt-2">
                   <p className="text-xs text-brand-navy/40">Win Rate: {userStats.gamesPlayed > 0 ? Math.round((userStats.wins / userStats.gamesPlayed) * 100) : 0}%</p>
               </div>

               {/* Awards Section */}
               <div className="w-full pt-4 border-t border-brand-navy/10 mt-2">
                   <h3 className="text-left font-bold text-brand-navy mb-3 flex items-center gap-2">🏆 Awards Collection</h3>
                   {myAwards.length === 0 ? (
                       <p className="text-sm text-brand-navy/50 italic text-center py-4">No awards earned yet. Play a game to win!</p>
                   ) : (
                       <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                           {myAwards.map((award, idx) => (
                               <div key={idx} className="bg-white border border-brand-navy/10 p-3 rounded-lg flex items-center gap-3">
                                   <span className="text-2xl">{award.emoji}</span>
                                   <div className="flex-1">
                                       <div className="font-bold text-brand-darkBlue text-sm">{award.title}</div>
                                       <div className="text-xs text-brand-navy/60">{award.description}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
      </Modal>

      {renderContent()}
    </div>
  );
};

export default App;