

import React, { useState } from 'react';
import { GameState, GameMode, TopicPack } from '../types';

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"/></svg>
);

interface GameSettingsProps {
    gameState: GameState;
    onUpdateSettings: (target: number, toneDeaf: number, mode: GameMode, pack: TopicPack) => void;
    onClose?: () => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({ gameState, onUpdateSettings, onClose }) => {
    
    const updateConfig = (newTarget: number, newToneDeaf: number, newMode: GameMode, newPack: TopicPack) => {
        onUpdateSettings(newTarget, newToneDeaf, newMode, newPack);
    };

    const packOptions = [
        { id: TopicPack.STANDARD, label: "Standard", desc: "Everyday Life", emoji: "🏠", premium: false },
        { id: TopicPack.SCIFI, label: "Sci-Fi", desc: "Space & Magic", emoji: "👽", premium: true },
        { id: TopicPack.NSFW, label: "After Dark", desc: "18+ Spicy", emoji: "🌶️", premium: true },
        { id: TopicPack.HISTORY, label: "History", desc: "Time Travel", emoji: "🏛️", premium: true },
        { id: TopicPack.FOODIE, label: "Foodie", desc: "Culinary Chaos", emoji: "🍔", premium: true },
    ];

    return (
        <div className="min-h-screen bg-brand-background flex flex-col">
            {/* Header */}
            {onClose && (
                <div className="bg-white p-4 border-b-2 border-brand-text/10 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                    <div className="flex items-center gap-2 text-brand-darkBlue">
                        <SettingsIcon />
                        <span className="font-black text-xl uppercase tracking-widest">Game Settings</span>
                    </div>
                    <button onClick={onClose} className="text-sm font-bold bg-brand-background px-4 py-2 rounded-lg border border-brand-text/10 hover:bg-brand-text/5 text-brand-darkBlue">
                        CLOSE
                    </button>
                </div>
            )}

            <div className="flex-1 p-6 max-w-lg mx-auto w-full space-y-8 overflow-y-auto pb-24">
                
                {/* Content Packs */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase text-brand-navy tracking-widest border-b border-brand-navy/10 w-full block pb-2">Content Packs</label>
                    <div className="grid grid-cols-2 gap-3">
                        {packOptions.map(pack => (
                            <button
                                key={pack.id}
                                onClick={() => updateConfig(gameState.targetValue, gameState.maxToneDeaf, gameState.gameMode, pack.id)}
                                className={`p-4 rounded-2xl border-2 text-left relative overflow-hidden transition-all active:scale-95 ${gameState.topicPack === pack.id ? 'bg-brand-purple text-white border-brand-darkBlue shadow-pop-sm' : 'bg-white border-brand-darkBlue/10 hover:border-brand-purple'}`}
                            >
                                {pack.premium && gameState.topicPack !== pack.id && (
                                    <div className="absolute top-0 right-0 bg-brand-yellow text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg border-l border-b border-brand-darkBlue/10 text-brand-darkBlue uppercase">
                                        PREMIUM
                                    </div>
                                )}
                                <div className="text-3xl mb-2">{pack.emoji}</div>
                                <div className="font-bold text-sm leading-none mb-1 uppercase tracking-wide">{pack.label}</div>
                                <div className={`text-[10px] leading-tight font-medium ${gameState.topicPack === pack.id ? 'opacity-80' : 'opacity-50'}`}>{pack.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game Mode Toggle */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase text-brand-navy tracking-widest border-b border-brand-navy/10 w-full block pb-2">Game Mode</label>
                    <div className="flex bg-white p-1 rounded-xl border-2 border-brand-navy/10 shadow-sm">
                            <button 
                            onClick={() => updateConfig(3, gameState.maxToneDeaf, GameMode.ROUNDS, gameState.topicPack)}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${gameState.gameMode === GameMode.ROUNDS ? 'bg-brand-teal text-brand-darkBlue shadow-sm' : 'text-brand-navy/40 hover:text-brand-navy'}`}
                            >
                                Fixed Rounds
                            </button>
                            <button 
                            onClick={() => updateConfig(20, gameState.maxToneDeaf, GameMode.POINTS, gameState.topicPack)}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${gameState.gameMode === GameMode.POINTS ? 'bg-brand-teal text-brand-darkBlue shadow-sm' : 'text-brand-navy/40 hover:text-brand-navy'}`}
                            >
                                Race to Points
                            </button>
                    </div>
                </div>

                {/* Sliders based on Mode */}
                <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-brand-text/10 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between text-sm font-bold text-brand-darkBlue">
                            <span className="uppercase tracking-wide opacity-70">
                                {gameState.gameMode === GameMode.ROUNDS ? "Total Rounds" : "Target Score"}
                            </span>
                            <span className="bg-brand-darkBlue text-white px-3 py-1 rounded-lg text-lg font-black">{gameState.targetValue}</span>
                        </div>
                        <input 
                            type="range" 
                            min={gameState.gameMode === GameMode.ROUNDS ? "1" : "15"} 
                            max={gameState.gameMode === GameMode.ROUNDS ? "10" : "100"} 
                            step={gameState.gameMode === GameMode.ROUNDS ? "1" : "5"}
                            value={gameState.targetValue}
                            onChange={(e) => updateConfig(parseInt(e.target.value), gameState.maxToneDeaf, gameState.gameMode, gameState.topicPack)}
                            className="w-full accent-brand-purple"
                        />
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-sm font-bold text-brand-darkBlue">
                            <span className="uppercase tracking-wide opacity-70">Max Outsiders</span>
                            <span className="bg-brand-darkBlue text-white px-3 py-1 rounded-lg text-lg font-black">{gameState.maxToneDeaf}</span>
                        </div>
                        <input 
                            type="range" min="0" max="2" step="1"
                            value={gameState.maxToneDeaf}
                            onChange={(e) => updateConfig(gameState.targetValue, parseInt(e.target.value), gameState.gameMode, gameState.topicPack)}
                            className="w-full accent-brand-purple"
                        />
                        <p className="text-[10px] text-center text-brand-text/40 font-bold uppercase">Randomly assigns 0 to {gameState.maxToneDeaf} outsiders per round</p>
                    </div>
                </div>
            </div>
        </div>
    );
};