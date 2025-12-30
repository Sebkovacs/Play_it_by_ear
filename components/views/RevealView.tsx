
import React, { useState } from 'react';
import { GameState, PlayerRole, GameMode } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';

interface RevealViewProps {
  gameState: GameState;
  myPlayerId: string;
  onMarkReady: () => void;
}

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="m233-80 65-281L80-550l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z"/></svg>
);

export const RevealView: React.FC<RevealViewProps> = ({ gameState, myPlayerId, onMarkReady }) => {
  const [revealVisible, setRevealVisible] = useState(false);
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const isStarter = gameState.starterId === myPlayerId;
  const readyCount = gameState.players.filter(p => p.isReady).length;
  
  if (!myPlayer) return <div>Error: Player not found</div>;

  return (
    <div className="flex-1 bg-brand-darkBlue p-6 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md min-h-[400px] flex flex-col justify-between shadow-2xl bg-white border-0">
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-brand-navy/40">
            {gameState.gameMode === GameMode.ROUNDS 
              ? `Round ${gameState.currentRound} of ${gameState.targetValue}`
              : `Round ${gameState.currentRound} (Target: ${gameState.targetValue} Pts)`
            }
          </span>
          <h2 className="text-3xl font-black text-brand-darkBlue">{myPlayer.name}</h2>
          {isStarter && (
             <div className="flex items-center justify-center gap-1 text-brand-orange text-xs font-black uppercase tracking-wider animate-pulse">
                <StarIcon /> The Starter
             </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8 w-full">
          {!revealVisible ? (
            <div className="text-center space-y-6 w-full px-8">
               <p className="text-brand-navy text-lg font-medium">Your role is ready.</p>
               <div className="border-2 border-dashed border-blue-400 p-2 rounded-xl w-full">
                   <Button onClick={() => setRevealVisible(true)} className="h-16 text-lg w-full border-0">
                     VIEW COVER STORY
                   </Button>
               </div>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-fadeIn w-full">
              {myPlayer.role === PlayerRole.TONE_DEAF ? (
                <div className="p-8 bg-brand-yellow/10 rounded-2xl border-2 border-dashed border-brand-yellow mx-4">
                  <h3 className="text-2xl font-black text-brand-yellow uppercase tracking-widest">Outsider</h3>
                  <p className="mt-4 text-brand-navy font-medium">You don't know the topic.</p>
                  <p className="text-sm text-brand-navy/60 mt-2">Listen carefully and blend in.</p>
                </div>
              ) : (
                <div className={`p-6 mx-4 rounded-2xl ${myPlayer.role === PlayerRole.SCENARIO_A ? 'bg-brand-coral/10 text-brand-coral border-2 border-brand-coral' : 'bg-blue-50 text-blue-600 border-2 border-blue-500'}`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
                      {myPlayer.role === PlayerRole.SCENARIO_A ? "Red Team" : "Blue Team"}
                  </h3>
                  <p className="text-xl font-medium leading-relaxed">
                    {myPlayer.role === PlayerRole.SCENARIO_A ? gameState.scenarios?.scenarioA : gameState.scenarios?.scenarioB}
                  </p>
                </div>
              )}

              {isStarter && (
                  <div className="mt-4 mx-4 p-4 bg-brand-darkBlue text-white rounded-xl shadow-hard border-2 border-brand-teal relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-teal text-brand-darkBlue text-[10px] font-black uppercase px-2 py-1 rounded">Read Aloud</div>
                      <p className="text-lg font-bold italic">"{gameState.scenarios?.openingQuestion}"</p>
                  </div>
              )}
              
              <div className="pt-4 space-y-3 px-4">
                <Button 
                    variant={myPlayer.isReady ? 'filled' : 'outlined'} 
                    onClick={onMarkReady} // Uses toggleReady in App.tsx
                    fullWidth 
                    className={`transition-all ${myPlayer.isReady ? 'bg-green-500 border-brand-darkBlue text-white' : 'border-brand-teal text-brand-teal hover:bg-brand-teal/5'}`}
                >
                  {myPlayer.isReady ? 'WAITING FOR OTHERS...' : "I'VE READ IT"}
                </Button>
                
                <div className="text-xs font-bold text-brand-navy/30 uppercase tracking-widest">
                    {readyCount} / {gameState.players.length} Ready
                </div>
                
                {!myPlayer.isReady && (
                    <button onClick={() => setRevealVisible(false)} className="text-xs text-brand-navy/40 hover:text-brand-navy underline">
                        Hide Role
                    </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
