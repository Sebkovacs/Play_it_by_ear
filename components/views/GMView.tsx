

import React from 'react';
import { GameState, PlayerRole } from '../../types';
import { Button } from '../Button';

interface GMViewProps {
  gameState: GameState;
  onClose: () => void;
}

export const GMView: React.FC<GMViewProps> = ({ gameState, onClose }) => {
  const players = gameState.players || [];
  const scenarios = gameState.scenarios;

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
        <div className="p-4 border-b-2 border-brand-text/10 bg-brand-darkBlue text-white flex justify-between items-center sticky top-0 z-50">
            <h2 className="font-display font-black text-xl uppercase tracking-widest text-brand-yellow">GM Top Secret</h2>
            <button onClick={onClose} className="text-xs font-bold bg-white/10 px-3 py-2 rounded hover:bg-white/20">CLOSE</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 max-w-lg mx-auto w-full">
            
            {/* Scenarios Section */}
            <div className="bg-white p-6 rounded-2xl border-3 border-brand-text shadow-hard">
                <h3 className="text-xs font-black uppercase text-brand-navy mb-4 border-b pb-2">Current Reality</h3>
                {scenarios ? (
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-bold uppercase text-brand-navy/50 tracking-widest">The Vibe (Topic)</span>
                            <div className="font-black text-2xl text-brand-text leading-tight mt-1">{scenarios.topic}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-brand-coral/10 p-4 rounded-xl border-2 border-brand-coral">
                                <span className="text-[10px] font-bold uppercase text-brand-coral tracking-widest">Team Red</span>
                                <div className="font-bold text-brand-text text-lg mt-1">{scenarios.scenarioA}</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-500">
                                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-widest">Team Blue</span>
                                <div className="font-bold text-brand-text text-lg mt-1">{scenarios.scenarioB}</div>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-bold uppercase text-brand-navy/50 tracking-widest">Opening Question</span>
                            <div className="italic text-brand-text font-medium text-lg mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">"{scenarios.openingQuestion}"</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 opacity-50 font-bold italic">No scenarios generated yet.</div>
                )}
            </div>

            {/* Player Roles */}
            <div className="bg-white p-6 rounded-2xl border-3 border-brand-text shadow-hard">
                <h3 className="text-xs font-black uppercase text-brand-navy mb-4 border-b pb-2">Player Dossiers</h3>
                <div className="space-y-3">
                    {players.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="font-bold text-brand-text text-lg">{p.name}</div>
                            <div className="flex items-center gap-2">
                                {p.isHost && <span className="text-[10px] font-black bg-brand-yellow px-1.5 py-0.5 rounded border border-brand-text">HOST</span>}
                                {p.role === PlayerRole.SCENARIO_A && <span className="text-xs font-bold text-brand-coral bg-brand-coral/10 px-2 py-1 rounded">RED</span>}
                                {p.role === PlayerRole.SCENARIO_B && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">BLUE</span>}
                                {p.role === PlayerRole.TONE_DEAF && <span className="text-xs font-black text-brand-purple bg-brand-purple/10 px-2 py-1 rounded">OUTSIDER</span>}
                                {p.role === PlayerRole.PENDING && <span className="text-xs text-gray-400 font-bold border border-gray-200 px-2 py-1 rounded">PENDING</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Debug Info */}
            <div className="opacity-50 text-[10px] font-mono p-4 text-center border-t border-brand-text/10">
                <div>Phase: {gameState.phase}</div>
                <div>Round: {gameState.currentRound}</div>
                <div>Guesser: {gameState.guesserId || 'None'}</div>
            </div>
        </div>
    </div>
  );
};