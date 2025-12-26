
import React, { useState, useEffect } from 'react';
import { GameState, PlayerRole, GameMode } from '../../types';
import { Button } from '../Button';
import { Modal } from '../Modal';

interface GameViewProps {
  gameState: GameState;
  myPlayerId: string;
  onInitiateGuess: () => void;
  onCancelGuess: () => void;
  onSubmitGuess: (guesses: Record<string, PlayerRole>) => void;
  isHost: boolean;
}

// Icons
const MegaphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M120-320v-160h160l200-200v560L280-320H120Zm424 84L482-300q33-18 53.5-50t20.5-70q0-38-20.5-70T482-540l62-64q45 27 72.5 73.5T644-420q0 58-27.5 104.5T544-236Zm104 104L590-190q60-31 97-89t37-141q0-83-37-141t-97-89l58-58q72 43 115.5 114.5T808-420q0 86-43.5 157.5T648-132Z"/></svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Z"/></svg>
);

export const GameView: React.FC<GameViewProps> = ({ 
  gameState, 
  myPlayerId, 
  onInitiateGuess, 
  onCancelGuess, 
  onSubmitGuess 
}) => {
  const [showPeek, setShowPeek] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, PlayerRole>>({});
  
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const guesser = gameState.players.find(p => p.id === gameState.guesserId);
  const isGuesser = gameState.guesserId === myPlayerId;
  const isGuessingPhase = gameState.phase === 'GUESSING';
  
  const myScore = gameState.scores[myPlayerId] || 0;
  const canAffordGuess = myScore >= 2;

  // Initialize guesses when entering guessing phase
  useEffect(() => {
    if (isGuessingPhase && isGuesser) {
       const initialGuesses: Record<string, PlayerRole> = {};
       gameState.players.forEach(p => {
           if (p.id !== myPlayerId) initialGuesses[p.id] = PlayerRole.SCENARIO_A;
       });
       setGuesses(initialGuesses);
    }
  }, [isGuessingPhase, isGuesser, gameState.players, myPlayerId]);

  const handleRoleSelect = (targetId: string, role: PlayerRole) => {
      setGuesses(prev => ({ ...prev, [targetId]: role }));
  };

  const getRoleColor = (role: PlayerRole) => {
      switch(role) {
          case PlayerRole.SCENARIO_A: return 'bg-brand-navy text-white';
          case PlayerRole.SCENARIO_B: return 'bg-brand-orange text-brand-darkBlue';
          case PlayerRole.TONE_DEAF: return 'bg-brand-yellow text-brand-darkBlue';
          default: return 'bg-gray-200';
      }
  };

  if (!myPlayer) return null;

  return (
    <div className="flex-1 p-4 pb-24 flex flex-col max-w-lg mx-auto w-full relative">
      
      {/* Top Bar: Scores */}
      <div className="flex items-center justify-between bg-white border-2 border-brand-darkBlue rounded-xl p-3 shadow-hard-sm mb-6">
           <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-brand-navy/40 tracking-widest">Street Cred</span>
               <span className={`text-2xl font-black ${myScore < 0 ? 'text-brand-red' : 'text-brand-darkBlue'}`}>{myScore}</span>
           </div>
           <div className="h-8 w-[2px] bg-brand-navy/10"></div>
           <div className="flex flex-col text-right">
                <span className="text-[10px] font-black uppercase text-brand-navy/40 tracking-widest">
                    {gameState.gameMode === GameMode.ROUNDS ? "Round" : "Goal"}
                </span>
                <span className="text-xl font-bold text-brand-darkBlue">
                    {gameState.gameMode === GameMode.ROUNDS 
                        ? `${gameState.currentRound}/${gameState.targetValue}`
                        : `${gameState.targetValue} pts`
                    }
                </span>
           </div>
      </div>

      {/* Main Gameplay Area */}
      {!isGuessingPhase ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fadeIn">
              <div className="text-center space-y-4">
                 <div className="w-24 h-24 bg-brand-teal rounded-full flex items-center justify-center mx-auto border-4 border-brand-darkBlue shadow-hard animate-pulse">
                    <div className="text-brand-darkBlue"><MegaphoneIcon /></div>
                 </div>
                 <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tight">Blend In or Die</h2>
                 <p className="text-brand-navy font-medium max-w-xs mx-auto">
                    Discuss the topic vaguely. Lie to your enemies. Don't be weird about it.
                 </p>
              </div>

              <div className="w-full space-y-4">
                  <Button 
                    fullWidth 
                    onClick={onInitiateGuess} 
                    disabled={!canAffordGuess}
                    className="h-20 text-xl bg-brand-red text-white border-brand-darkBlue hover:bg-brand-red/90 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                      {canAffordGuess ? "ACCUSE SCUM [-2 Pts]" : "Too Poor to Accuse"}
                  </Button>
                  <Button variant="outlined" fullWidth onClick={() => setShowPeek(true)} className="gap-2 bg-white hover:bg-brand-teal/10">
                      <EyeIcon /> What am I doing again?
                  </Button>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col animate-fadeIn">
              <div className="bg-brand-red text-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard mb-6 text-center">
                  <h3 className="font-black uppercase tracking-widest text-sm mb-1">Snitch in Progress</h3>
                  <p className="text-lg font-bold">{isGuesser ? "Expose them all!" : `${guesser?.name} is trying to ruin the vibe!`}</p>
              </div>

              {isGuesser ? (
                  <div className="space-y-4 mb-8">
                      {gameState.players.filter(p => p.id !== myPlayerId).map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard-sm">
                              <div className="font-bold text-brand-darkBlue mb-2">{p.name} is...</div>
                              <div className="grid grid-cols-3 gap-2">
                                  {[PlayerRole.SCENARIO_A, PlayerRole.SCENARIO_B, PlayerRole.TONE_DEAF].map(role => (
                                      <button
                                          key={role}
                                          onClick={() => handleRoleSelect(p.id, role)}
                                          className={`p-2 rounded text-[10px] font-black uppercase border-2 transition-all ${guesses[p.id] === role ? 'border-brand-darkBlue shadow-hard-sm scale-105 ' + getRoleColor(role) : 'border-transparent bg-gray-100 text-gray-400'}`}
                                      >
                                          {role === PlayerRole.SCENARIO_A ? "Serious" : role === PlayerRole.SCENARIO_B ? "Absurd" : "Imposter"}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                      <div className="flex gap-4 pt-4">
                          <Button variant="text" onClick={onCancelGuess} className="flex-1 text-xs">Nevermind</Button>
                          <Button onClick={() => onSubmitGuess(guesses)} className="flex-[2] bg-brand-red text-white hover:bg-brand-red/90">Destroy Them</Button>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-center opacity-50">
                      <p>Pray they don't pick you...</p>
                  </div>
              )}
          </div>
      )}

      {/* Peek Modal */}
      <Modal isOpen={showPeek} onClose={() => setShowPeek(false)} title="Your Cover Story">
          <div className="space-y-6 text-center">
              {myPlayer.role === PlayerRole.TONE_DEAF ? (
                <div className="p-6 bg-brand-yellow/10 rounded-xl border-2 border-dashed border-brand-yellow">
                  <h3 className="text-xl font-black text-brand-yellow uppercase tracking-widest">Imposter (Tone Deaf)</h3>
                  <p className="mt-2 text-brand-navy">You have no context. Good luck.</p>
                </div>
              ) : (
                <div className={`p-6 rounded-xl border-2 border-brand-darkBlue ${myPlayer.role === PlayerRole.SCENARIO_A ? 'bg-brand-navy/5' : 'bg-brand-orange/5'}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-50">
                      {myPlayer.role === PlayerRole.SCENARIO_A ? "Serious Team" : "Absurd Team"}
                  </h3>
                  <p className="text-lg font-bold text-brand-darkBlue">
                    {myPlayer.role === PlayerRole.SCENARIO_A ? gameState.scenarios?.scenarioA : gameState.scenarios?.scenarioB}
                  </p>
                </div>
              )}
              
              {gameState.starterId === myPlayerId && (
                   <div className="text-left bg-brand-teal/10 p-3 rounded-lg border border-brand-teal/20">
                       <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">Your Opening Line</span>
                       <p className="text-brand-darkBlue font-medium italic text-sm">"{gameState.scenarios?.openingQuestion}"</p>
                   </div>
              )}

              <Button fullWidth onClick={() => setShowPeek(false)}>Hide Evidence</Button>
          </div>
      </Modal>

    </div>
  );
};
