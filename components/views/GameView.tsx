
import React, { useState, useEffect } from 'react';
import { GameState, PlayerRole, GameMode, GamePhase } from '../../types';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { Card } from '../Card';

interface GameViewProps {
  gameState: GameState;
  myPlayerId: string;
  onInitiateGuess: () => void;
  onCancelGuess: () => void;
  onSubmitGuess: (guesses: Record<string, PlayerRole>) => void;
  isHost: boolean;
}

export const GameView: React.FC<GameViewProps> = ({ 
  gameState, myPlayerId, onInitiateGuess, onCancelGuess, onSubmitGuess 
}) => {
  const [showPeek, setShowPeek] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, PlayerRole>>({});
  
  const myPlayer = gameState.players?.find(p => p.id === myPlayerId);
  const guesser = gameState.players?.find(p => p.id === gameState.guesserId);
  const isGuesser = gameState.guesserId === myPlayerId;
  const isGuessingPhase = gameState.phase === 'GUESSING';
  const isShootout = gameState.phase === GamePhase.SHOOTOUT;
  
  const myScore = gameState.scores[myPlayerId] || 0;
  const canAffordGuess = myScore >= 3 || isShootout;

  useEffect(() => {
    if (isGuessingPhase && isGuesser) {
       const initialGuesses: Record<string, PlayerRole> = {};
       (gameState.players || []).forEach(p => {
           if (p.id !== myPlayerId) initialGuesses[p.id] = PlayerRole.SCENARIO_A;
       });
       setGuesses(initialGuesses);
    }
  }, [isGuessingPhase, isGuesser, gameState.players, myPlayerId]);

  const handleRoleSelect = (targetId: string, role: PlayerRole) => {
      setGuesses(prev => ({ ...prev, [targetId]: role }));
  };

  if (!myPlayer) return null;

  return (
    <div className="flex-1 p-4 pb-24 flex flex-col max-w-lg mx-auto w-full relative">
      
      {/* Scoreboard Pill */}
      <div className="flex items-center justify-between bg-white border-3 border-brand-text rounded-full p-2 pl-4 shadow-pop-sm mb-6 sticky top-20 z-20">
           <div className="flex items-center gap-2">
               <span className="text-xs font-bold uppercase text-brand-text/50">My Score</span>
               <span className="text-2xl font-black text-brand-purple">{myScore}</span>
           </div>
           <div className="bg-brand-yellow px-4 py-1 rounded-full border-2 border-brand-text font-bold text-sm">
               {gameState.gameMode === GameMode.ROUNDS 
                   ? `Round ${gameState.currentRound} / ${gameState.targetValue}`
                   : `Goal: ${gameState.targetValue} pts`
               }
           </div>
      </div>
      
      {gameState.notification && (
        <div className="mb-6 p-4 bg-brand-coral text-white border-3 border-brand-text rounded-2xl font-bold text-center shadow-pop animate-bounce-slight">
            {gameState.notification}
        </div>
      )}

      {/* Main Gameplay Area */}
      {!isGuessingPhase ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fadeIn pb-12">
              
              <div className="text-center space-y-4">
                  <div className="w-32 h-32 bg-brand-teal rounded-full flex items-center justify-center mx-auto border-4 border-brand-text shadow-pop relative group cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowPeek(true)}>
                      <span className="text-5xl group-hover:hidden">🗣️</span>
                      <span className="text-xl font-bold hidden group-hover:block text-white text-center leading-tight px-2">View Role</span>
                  </div>
                  <h2 className="font-display font-black text-4xl text-brand-text">Discuss!</h2>
                  <p className="text-brand-text/70 font-medium max-w-xs mx-auto bg-white p-4 rounded-xl border-2 border-brand-text/10">
                     Try to find your team. Keep your story straight. Don't let the Outsider catch on!
                  </p>
              </div>

              <div className="w-full space-y-4">
                  <Button 
                    fullWidth 
                    variant="filled"
                    onClick={onInitiateGuess} 
                    disabled={!canAffordGuess}
                    className={`h-20 text-xl shadow-pop ${!canAffordGuess ? 'bg-gray-200 text-gray-400 border-gray-300' : 'bg-brand-coral text-white'}`}
                  >
                      {canAffordGuess 
                        ? (isShootout ? "Sudden Death Accusation!" : "Accuse Player (-3 Pts)") 
                        : "Need 3 Pts to Accuse"
                      }
                  </Button>
                  
                  <button onClick={() => setShowPeek(true)} className="w-full py-4 text-center font-bold text-brand-text/50 hover:text-brand-purple underline decoration-2">
                      Review My Secret Role
                  </button>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col animate-fadeIn">
              <div className="bg-white p-6 rounded-3xl border-3 border-brand-text shadow-pop mb-6 text-center">
                  <div className="w-12 h-12 bg-brand-coral rounded-full flex items-center justify-center text-2xl border-2 border-brand-text absolute -top-4 left-1/2 -translate-x-1/2">
                      🚨
                  </div>
                  <h3 className="font-display font-black text-xl mt-2">{isGuesser ? "Who is who?" : `${guesser?.name} is accusing!`}</h3>
                  <p className="text-sm font-medium opacity-70 mt-1">If they guess everyone's role correctly, they win.</p>
              </div>

              {isGuesser ? (
                  <div className="space-y-4 mb-8">
                      {(gameState.players || []).filter(p => p.id !== myPlayerId).map(p => (
                          <Card key={p.id} className="p-4 bg-white">
                              <div className="font-bold text-brand-text mb-2 text-lg">{p.name} is...</div>
                              <div className="grid grid-cols-3 gap-2">
                                  <button onClick={() => handleRoleSelect(p.id, PlayerRole.SCENARIO_A)} className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${guesses[p.id] === PlayerRole.SCENARIO_A ? 'bg-brand-coral text-white border-brand-text shadow-pop-sm' : 'bg-gray-100 border-transparent text-gray-400'}`}>Team Red</button>
                                  <button onClick={() => handleRoleSelect(p.id, PlayerRole.SCENARIO_B)} className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${guesses[p.id] === PlayerRole.SCENARIO_B ? 'bg-blue-500 text-white border-brand-text shadow-pop-sm' : 'bg-gray-100 border-transparent text-gray-400'}`}>Team Blue</button>
                                  <button onClick={() => handleRoleSelect(p.id, PlayerRole.TONE_DEAF)} className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${guesses[p.id] === PlayerRole.TONE_DEAF ? 'bg-brand-yellow text-brand-text border-brand-text shadow-pop-sm' : 'bg-gray-100 border-transparent text-gray-400'}`}>Outsider</button>
                              </div>
                          </Card>
                      ))}
                      <div className="flex gap-4 pt-4">
                          <Button variant="outlined" onClick={onCancelGuess} className="flex-1">Cancel</Button>
                          <Button variant="filled" onClick={() => onSubmitGuess(guesses)} className="flex-[2] !bg-green-500 hover:bg-green-600 !border-green-700">Lock In</Button>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-center opacity-50 p-8">
                      <p className="font-bold text-xl">The accusation is happening...</p>
                  </div>
              )}
          </div>
      )}

      {/* Peek Modal */}
      <Modal isOpen={showPeek} onClose={() => setShowPeek(false)} title="Your Secret Role">
          <div className="space-y-6 text-center">
              {myPlayer.role === PlayerRole.TONE_DEAF ? (
                <div className="p-8 bg-brand-yellow/20 rounded-3xl border-3 border-brand-yellow">
                  <div className="text-4xl mb-2">🤔</div>
                  <h3 className="text-2xl font-display font-black text-brand-text uppercase">The Outsider</h3>
                  <p className="mt-2 font-bold text-brand-text/80">You don't know the topic!</p>
                  <p className="text-sm mt-2">Listen to others and try to blend in.</p>
                </div>
              ) : (
                <div className={`p-8 rounded-3xl border-3 ${myPlayer.role === PlayerRole.SCENARIO_A ? 'bg-brand-coral/10 border-brand-coral' : 'bg-blue-50 border-blue-500'}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-50">
                      {myPlayer.role === PlayerRole.SCENARIO_A ? "Team Red" : "Team Blue"}
                  </h3>
                  <p className="text-2xl font-display font-black text-brand-text leading-tight">
                    {myPlayer.role === PlayerRole.SCENARIO_A ? gameState.scenarios?.scenarioA : gameState.scenarios?.scenarioB}
                  </p>
                </div>
              )}
              
              {gameState.starterId === myPlayerId && (
                   <div className="text-left bg-brand-purple text-white p-4 rounded-xl border-3 border-brand-text shadow-pop-sm">
                       <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">You Start</span>
                       <p className="font-bold text-lg mt-1 italic">"{gameState.scenarios?.openingQuestion}"</p>
                   </div>
              )}

              <Button fullWidth onClick={() => setShowPeek(false)}>Hide</Button>
          </div>
      </Modal>

    </div>
  );
};
