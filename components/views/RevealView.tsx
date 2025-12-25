import React, { useState } from 'react';
import { GameState, PlayerRole } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';

interface RevealViewProps {
  gameState: GameState;
  myPlayerId: string;
  onMarkReady: () => void;
}

export const RevealView: React.FC<RevealViewProps> = ({ gameState, myPlayerId, onMarkReady }) => {
  const [revealVisible, setRevealVisible] = useState(false);
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  
  if (!myPlayer) return <div>Error: Player not found</div>;

  return (
    <div className="flex-1 bg-brand-darkBlue p-6 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md min-h-[400px] flex flex-col justify-between shadow-2xl bg-white border-0">
        <div className="space-y-2 text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-brand-navy/40">Round {gameState.currentRound} of {gameState.totalRounds}</span>
          <h2 className="text-3xl font-black text-brand-darkBlue">{myPlayer.name}</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          {!revealVisible ? (
            <div className="text-center space-y-6">
               <p className="text-brand-navy text-lg">Your role is ready.</p>
               <Button onClick={() => setRevealVisible(true)} className="h-16 px-8 text-lg bg-brand-teal hover:bg-brand-teal/90 text-white">
                 Reveal My Role
               </Button>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-fadeIn w-full">
              {myPlayer.role === PlayerRole.TONE_DEAF ? (
                <div className="p-8 bg-brand-yellow/10 rounded-2xl border-2 border-dashed border-brand-yellow">
                  <h3 className="text-2xl font-black text-brand-yellow uppercase tracking-widest">Tone Deaf</h3>
                  <p className="mt-4 text-brand-navy font-medium">You have no idea what is going on.</p>
                  <p className="text-sm text-brand-navy/60 mt-2">Just blend in. Don't get caught.</p>
                </div>
              ) : (
                <div className={`p-6 rounded-2xl ${myPlayer.role === PlayerRole.SCENARIO_A ? 'bg-brand-navy/5 text-brand-navy' : 'bg-brand-orange/5 text-brand-orange'}`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">
                      {myPlayer.role === PlayerRole.SCENARIO_A ? "Scenario A" : "Scenario B"}
                  </h3>
                  <p className="text-xl font-medium leading-relaxed">
                    {myPlayer.role === PlayerRole.SCENARIO_A ? gameState.scenarios?.scenarioA : gameState.scenarios?.scenarioB}
                  </p>
                </div>
              )}
              
              <div className="pt-4 space-y-2">
                  <p className="text-xs text-brand-navy/40 italic">Do NOT read this aloud. Imply it.</p>
                <Button variant="outlined" onClick={onMarkReady} fullWidth className="border-brand-teal text-brand-teal hover:bg-brand-teal/5">
                  Got it! Join Meeting
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};