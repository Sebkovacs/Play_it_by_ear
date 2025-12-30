

import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, Player, PlayerRole, UserStats, Moment } from './types';
import { generatePersona, generateScoutingReport, generateMoment } from './services/geminiService';
import { 
  subscribeToAuthChanges, logout, saveUserAward, getUserAwards, 
  getUserStats, updateUserGameStats, updateUserProfile, saveMoment,
  updateUserIdentity
} from './services/firebase';
import { useGameEngine } from './hooks/useGameEngine';
import { Navbar } from './components/Navbar';
import { Button } from './components/Button';
import { GameSettings } from './components/GameSettings';

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
import { OutsiderGuessView } from './components/views/OutsiderGuessView';
import { GMView } from './components/views/GMView';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

// --- Sound Engine ---
const playSound = (type: 'tick' | 'success' | 'alert' | 'pop') => {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tick') {
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'pop') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
};

// --- Page Wrapper for Instructions ---
const InstructionsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="min-h-screen bg-brand-background flex flex-col">
        <div className="bg-white p-4 border-b-2 border-brand-text/10 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <h2 className="font-display font-black text-xl uppercase tracking-widest text-brand-darkBlue">How To Play</h2>
            <button onClick={onBack} className="text-sm font-bold bg-brand-background px-4 py-2 rounded-lg border border-brand-text/10 hover:bg-brand-text/5">
                CLOSE
            </button>
        </div>
        <div className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6 overflow-y-auto pb-24">
            <div className="text-center mb-6">
                <p className="text-brand-navy font-medium text-lg leading-relaxed">
                    "It's like <strong>Telephone</strong> meets <strong>Mafia</strong>."
                </p>
            </div>

            <div className="bg-brand-yellow/20 p-6 rounded-3xl border-2 border-brand-yellow text-brand-text">
                <p className="mb-4"><strong>The Setup:</strong> You are all at a party.</p>
                <p>Most of you are split into two teams (Red & Blue). You are discussing <strong>two slightly different versions</strong> of the same topic (e.g. "Job Interview" vs "First Date").</p>
                <p className="mt-4"><strong>The Catch:</strong> One person is the <strong>Outsider</strong>. They know nothing. They are just trying to blend in.</p>
            </div>

            <div className="space-y-4">
                <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border-2 border-brand-text/10 shadow-sm">
                    <div className="w-12 h-12 bg-brand-purple text-white rounded-full flex items-center justify-center font-black shrink-0 text-xl">1</div>
                    <div>
                        <h3 className="font-black text-brand-text uppercase text-lg mb-1">Blend In & Detect</h3>
                        <p className="text-sm text-brand-text/70 leading-relaxed">
                            Talk to each other. Ask vague questions. Find your teammates without letting the Outsider know the topic.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-start bg-white p-4 rounded-2xl border-2 border-brand-text/10 shadow-sm">
                    <div className="w-12 h-12 bg-brand-teal text-brand-text rounded-full flex items-center justify-center font-black shrink-0 text-xl">2</div>
                    <div>
                        <h3 className="font-black text-brand-text uppercase text-lg mb-1">Accuse to Win</h3>
                        <p className="text-sm text-brand-text/70 leading-relaxed">
                            Spend <strong>3 Points</strong> to accuse. You must correctly identify <strong>EVERYONE'S</strong> role to win.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-start bg-brand-red/5 p-4 rounded-2xl border-2 border-brand-red/20">
                    <div className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center font-black shrink-0 text-xl">🤫</div>
                    <div>
                        <h3 className="font-black text-brand-red uppercase text-lg mb-1">The Outsider's Gambit</h3>
                        <p className="text-sm text-brand-text/70 leading-relaxed">
                            If the Outsider is caught, they have one last chance: If they can guess the <strong>Secret Topic</strong>, they steal the win!
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="pt-4">
                <Button fullWidth onClick={onBack} className="h-16 text-xl">I'm Ready</Button>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
  // --- User Session State ---
  const [myName, setMyName] = useState('');
  const [userStats, setUserStats] = useState<UserStats>({ gamesPlayed: 0, wins: 0 });
  const [myAwards, setMyAwards] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // --- UI State (View Manager) ---
  type ViewState = 'GAME' | 'PROFILE' | 'SETTINGS' | 'GM' | 'HELP' | 'PLAYER_PROFILE';
  const [currentView, setCurrentView] = useState<ViewState>('GAME');
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);

  const [topicInput, setTopicInput] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // --- Game Engine ---
  const { gameState, isHost, myPlayerId, actions } = useGameEngine();

  // --- Sound Effects on Phase Change ---
  const prevPhase = useRef(gameState.phase);
  useEffect(() => {
     if (gameState.phase !== prevPhase.current) {
         if (gameState.phase === GamePhase.REVEAL) playSound('success');
         if (gameState.phase === GamePhase.GUESSING) playSound('alert');
         if (gameState.phase === GamePhase.RESULT) playSound('success');
         if (gameState.phase === GamePhase.LOBBY) playSound('pop');
         prevPhase.current = gameState.phase;
     }
  }, [gameState.phase]);

  // --- Identity & Persistence ---

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        setUserId(user.uid);
        setIsAnonymous(user.isAnonymous);
        if (user.displayName) setMyName(user.displayName);
        
        // Fetch Persistent Data
        const awards = await getUserAwards(user.uid);
        setMyAwards(awards);
        const stats = await getUserStats(user.uid);
        setUserStats(stats);
      } else {
        setUserId('');
        setIsAnonymous(false);
        setMyAwards([]);
        setUserStats({ gamesPlayed: 0, wins: 0 });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) setJoinCode(code);
  }, []);
  
  const handleLogout = async () => {
      await logout();
      setIsLoggedIn(false);
      setMyName('');
      setUserId('');
      setMyAwards([]);
      setUserStats({ gamesPlayed: 0, wins: 0 });
      actions.returnToHome();
      setCurrentView('GAME');
  };
  
  const getPlayerTitle = (stats: UserStats) => {
      if (stats.archetype) return stats.archetype;
      if (stats.personaTitle) return stats.personaTitle;
      if (stats.gamesPlayed === 0) return "Rookie";
      return "The Unknown";
  };
  
  // --- Reacting to Game Events ---

  const prevResultRef = useRef(gameState.lastResult);
  useEffect(() => {
      if (gameState.phase === GamePhase.RESULT && gameState.lastResult !== prevResultRef.current) {
          prevResultRef.current = gameState.lastResult;
          const result = gameState.lastResult;
          const me = gameState.players?.find(p => p.id === myPlayerId);
          
          if (result && me && userId) {
              const guesser = gameState.players?.find(p => p.name === result.guesserName);
              let iWon = false;
              if (result.wasCorrect) {
                  if (me.id === guesser?.id) iWon = true;
                  else if (guesser && me.role === guesser.role && me.role !== PlayerRole.TONE_DEAF) iWon = true;
              } else {
                  if (guesser && me.role !== guesser.role && me.id !== guesser.id) iWon = true;
              }

              // Update Stats Context
              const currentPlayers = gameState.players || [];
              const teammates = currentPlayers
                  .filter(p => p.role === me.role && p.id !== me.id && me.role !== PlayerRole.TONE_DEAF)
                  .map(p => p.uid || p.id); 
              
              const opponents = currentPlayers
                  .filter(p => p.role !== me.role && p.id !== me.id)
                  .map(p => p.uid || p.id);
              
              const playersMap: Record<string, string> = {};
              currentPlayers.forEach(p => {
                  playersMap[p.uid || p.id] = p.name;
              });

              let accusedTargetId = null;
              let accusedByTargetId = null;

              if (result.guesserId === myPlayerId) {
                  if (gameState.caughtPlayerId) accusedTargetId = gameState.caughtPlayerId; 
              } else if (result.guesserId) {
                  if (gameState.caughtPlayerId === myPlayerId) accusedByTargetId = result.guesserId;
              }
              
              updateUserGameStats(userId, {
                  won: iWon,
                  teammates,
                  opponents,
                  accusedTargetId,
                  accusedByTargetId,
                  role: me.role,
                  playersMap
              }).then(async () => {
                  const newStats = await getUserStats(userId);
                  setUserStats(newStats);

                  if (iWon || me.role === PlayerRole.TONE_DEAF) {
                      const moment = await generateMoment(
                          me.role, 
                          gameState.scenarios?.topic || "Unknown", 
                          iWon, 
                          result.reason
                      );
                      await saveMoment(userId, moment);
                      setUserStats(prev => ({
                          ...prev,
                          moments: [moment, ...(prev.moments || [])]
                      }));
                  }
              });
          }
      }
  }, [gameState.lastResult, gameState.phase, myPlayerId, gameState.players, userId]);

  const prevPhaseRef = useRef(gameState.phase);
  useEffect(() => {
      if (gameState.phase === GamePhase.GAME_OVER && prevPhaseRef.current !== GamePhase.GAME_OVER) {
          if (userId && gameState.endGameAwards) {
              const myAward = gameState.endGameAwards[myPlayerId];
              if (myAward) {
                  const newAwardsList = [{...myAward, topic: "End Game", timestamp: Date.now()}, ...myAwards];
                  saveUserAward(userId, myAward, "It By Ear Season");
                  setMyAwards(newAwardsList);
                  
                  Promise.all([
                      generatePersona(userStats, newAwardsList),
                      generateScoutingReport(userStats)
                  ]).then(([newPersona, newScouting]) => {
                      if (newPersona) {
                          const db = getFirestore();
                          setDoc(doc(db, "users", userId), { 
                              personaTitle: newPersona.title, 
                              personaDescription: newPersona.description,
                              archetype: newPersona.archetype,
                              attributes: newPersona.attributes,
                              scoutingReport: newScouting
                          }, { merge: true });

                          setUserStats(prev => ({
                              ...prev, 
                              personaTitle: newPersona.title, 
                              personaDescription: newPersona.description,
                              archetype: newPersona.archetype,
                              attributes: newPersona.attributes,
                              scoutingReport: newScouting
                          }));
                      }
                  });
              }
          }
      }
      prevPhaseRef.current = gameState.phase;
  }, [gameState.phase, gameState.endGameAwards, userId, myPlayerId, userStats, myAwards]);

  // --- Helpers ---
  
  const copyLink = () => {
      const url = `${window.location.origin}${window.location.pathname}?code=${gameState.roomCode}`;
      navigator.clipboard.writeText(url);
      alert("Link copied! Share it with friends.");
  };

  const handleCreateGame = () => {
      if (!myName.trim()) return;
      if (isLoggedIn) updateUserIdentity(myName).catch(err => console.error(err));

      actions.createGame(myName, {
          wins: userStats.wins,
          gamesPlayed: userStats.gamesPlayed,
          title: getPlayerTitle(userStats),
          description: userStats.personaDescription || "",
          archetype: userStats.archetype
      }, userId);
  };

  const handleJoinGame = () => {
      if (!myName.trim() || !joinCode.trim()) return;
      if (isLoggedIn) updateUserIdentity(myName).catch(err => console.error(err));

      actions.joinGame(joinCode, myName, {
          wins: userStats.wins,
          gamesPlayed: userStats.gamesPlayed,
          title: getPlayerTitle(userStats),
          description: userStats.personaDescription || "",
          archetype: userStats.archetype
      }, userId);
  };
  
  const handleHostNext = () => {
      setTopicInput('');
      actions.handleNextRound();
  };
  
  const handleReset = () => {
      setTopicInput('');
      actions.handleReset();
  };

  const openPlayerProfile = (p: Player) => {
      if (p.id === myPlayerId) {
          setCurrentView('PROFILE');
      } else {
          setViewingPlayer(p);
          setCurrentView('PLAYER_PROFILE');
      }
  };

  useEffect(() => {
    if (!isHost || gameState.phase !== GamePhase.LOBBY) return;
    const currentPlayers = gameState.players || [];
    const allReady = currentPlayers.length >= 3 && currentPlayers.every(p => p.isReady);
    if (allReady && gameState.countdown === null) actions.startCountdown();
    if (!allReady && gameState.countdown !== null) actions.cancelCountdown();
  }, [gameState.players, isHost, gameState.phase, gameState.countdown]);

  const renderGameContent = () => {
    switch(gameState.phase) {
      case GamePhase.LANDING:
        return <LandingView 
                  myName={myName} setMyName={setMyName} 
                  joinCode={joinCode} setJoinCode={setJoinCode}
                  onCreateGame={handleCreateGame} onJoinGame={handleJoinGame}
                  error={gameState.error}
                  isLoggedIn={isLoggedIn}
                  onManualLogin={() => { setMyName(prev => prev || "Guest"); setIsLoggedIn(true); }}
               />;
      case GamePhase.LOBBY:
        return <LobbyView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost}
                  onCopyLink={copyLink} onToggleReady={actions.toggleReady} onUpdateSettings={actions.updateSettings}
                  topicInput={topicInput} setTopicInput={setTopicInput} onSubmitTopic={actions.submitTopic}
                  onTestMode={actions.handleTestMode}
                  onSelectPlayer={openPlayerProfile}
               />;
      case GamePhase.GENERATING:
        return <GeneratingView round={gameState.currentRound} />;
      case GamePhase.REVEAL:
        return <RevealView gameState={gameState} myPlayerId={myPlayerId} onMarkReady={actions.toggleReady} />;
      case GamePhase.PLAYING:
      case GamePhase.GUESSING:
      case GamePhase.SHOOTOUT:
        return <GameView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost}
                  onInitiateGuess={actions.initiateGuess} onCancelGuess={actions.cancelGuess} onSubmitGuess={actions.submitGuess}
               />;
      case GamePhase.OUTSIDER_GUESS:
        return <OutsiderGuessView 
                  gameState={gameState} myPlayerId={myPlayerId} 
                  onSubmitGuess={actions.submitOutsiderGuess} 
               />;
      case GamePhase.RESULT:
        return <ResultView 
                  gameState={gameState} isHost={isHost} onStartVibeCheck={actions.startVibeCheck} 
                  onSelectPlayer={openPlayerProfile}
               />;
      case GamePhase.VOTING:
        return <VotingView 
                  gameState={gameState} myPlayerId={myPlayerId} isHost={isHost} 
                  onSubmitVotes={actions.submitVotes} onHostNext={handleHostNext} 
               />;
      case GamePhase.GAME_OVER:
        return <ResultView 
                  gameState={gameState} isHost={isHost} onStartVibeCheck={() => {}} onReset={handleReset} 
                  isGameOver={true} onSelectPlayer={openPlayerProfile} 
               />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8 text-center flex-col gap-4">
            <h2 className="text-xl text-brand-orange font-bold">Something went wrong</h2>
            <p className="text-brand-navy">{gameState.error}</p>
            <Button onClick={actions.returnToHome}>Return to Home</Button>
          </div>
        );
    }
  };

  // --- Main View Controller ---

  // 1. Utility Views (Full Page)
  if (currentView === 'HELP') {
      return <InstructionsPage onBack={() => setCurrentView('GAME')} />;
  }

  if (currentView === 'SETTINGS') {
      return (
          <GameSettings 
              gameState={gameState} 
              onUpdateSettings={actions.updateSettings} 
              onClose={() => setCurrentView('GAME')}
          />
      );
  }

  if (currentView === 'GM' && isHost) {
      return <GMView gameState={gameState} onClose={() => setCurrentView('GAME')} />;
  }

  if (currentView === 'PROFILE') {
      return (
          <ProfileView 
              userStats={userStats} playerTitle={getPlayerTitle(userStats)} myAwards={myAwards}
              currentName={myName} onUpdateName={setMyName} 
              onLogout={handleLogout} 
              onClose={() => setCurrentView('GAME')}
              isAnonymous={isAnonymous}
          />
      );
  }

  if (currentView === 'PLAYER_PROFILE' && viewingPlayer) {
      return (
          <PublicProfileView 
              player={viewingPlayer} 
              onClose={() => setCurrentView('GAME')}
          />
      );
  }

  // 2. Main Game View
  return (
    <div className="min-h-screen flex flex-col pt-24 bg-brand-background font-sans relative">
      <Navbar 
          userName={myName} userStats={userStats} 
          onLogout={actions.returnToHome} 
          onShowStats={() => setCurrentView('PROFILE')} 
          onShowHelp={() => setCurrentView('HELP')}
          playerTitle={getPlayerTitle(userStats)} 
          minimal={gameState.phase === GamePhase.LANDING}
          players={gameState.players || []} scores={gameState.scores}
          isHost={isHost} 
          onShowSettings={() => setCurrentView('SETTINGS')}
          onShowGM={() => setCurrentView('GM')}
      />
      
      {/* Dev Force Button */}
      {isHost && gameState.phase !== GamePhase.LANDING && (
          <div className="fixed bottom-4 left-4 z-50">
              <button 
                  onClick={actions.devForceProgress}
                  className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase px-3 py-2 rounded-lg shadow-lg border-2 border-brand-darkBlue tracking-widest active:scale-95 transition-all"
              >
                  Dev Force >
              </button>
          </div>
      )}

      {renderGameContent()}
    </div>
  );
};

export default App;