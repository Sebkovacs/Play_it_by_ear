

import React, { useState, useEffect } from 'react';
import { GameState, Player, GameMode, TopicPack } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';
import { GameSettings } from '../GameSettings';

interface LobbyViewProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onCopyLink: () => void;
  onToggleReady: () => void;
  onUpdateSettings: (target: number, toneDeaf: number, mode: GameMode, pack: TopicPack) => void;
  topicInput: string;
  setTopicInput: (val: string) => void;
  onSubmitTopic: (val: string) => void;
  onTestMode?: () => void;
  onSelectPlayer: (player: Player) => void;
}

const TOPIC_PROMPTS = [
  "A weird hobby", 
  "A place you'd hate to live", 
  "Something smells like...",
  "Worst first date",
  "A guilty pleasure"
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState, myPlayerId, isHost, onCopyLink, onToggleReady, onUpdateSettings,
  topicInput, setTopicInput, onSubmitTopic, onTestMode, onSelectPlayer
}) => {
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState(TOPIC_PROMPTS[Math.floor(Math.random() * TOPIC_PROMPTS.length)]);
  
  const myPlayer = gameState.players?.find(p => p.id === myPlayerId);

  // Scroll to top on mount to fix mobile keyboard displacement issue
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCopy = () => {
      onCopyLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
      if (!topicInput.trim()) return;
      onSubmitTopic(`${prompt}: ${topicInput}`);
  };

  return (
    <div className="flex-1 p-6 flex flex-col items-center max-w-5xl mx-auto w-full animate-fadeIn pb-24">
      
      {/* Game Code Badge */}
      <div className="flex flex-col items-center gap-2 mb-8">
          <span className="text-sm font-bold text-brand-text/50 uppercase tracking-widest">Join Code</span>
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border-3 border-brand-text shadow-pop hover:scale-105 transition-transform cursor-pointer" onClick={handleCopy}>
               <span className="text-5xl font-display font-bold text-brand-purple tracking-wider">{gameState.roomCode}</span>
               <div className="bg-brand-teal p-2 rounded-full text-white border-2 border-brand-text">
                   {copied ? <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>}
               </div>
          </div>
          {isHost && onTestMode && (
              <button onClick={onTestMode} className="text-[10px] font-bold text-brand-text/30 hover:text-brand-purple uppercase">Debug: Add Bots</button>
          )}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Left: Player List */}
         <div className="space-y-4">
             {isHost && (
                 <Card className="bg-white">
                     <GameSettings gameState={gameState} onUpdateSettings={onUpdateSettings} />
                 </Card>
             )}

             <div className="bg-white rounded-3xl border-3 border-brand-text shadow-pop p-6">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="font-display font-bold text-xl text-brand-text">Players</h2>
                     <span className="bg-brand-yellow px-3 py-1 rounded-full font-bold border-2 border-brand-text text-sm">{(gameState.players || []).length} / 8</span>
                 </div>
                 <div className="space-y-3">
                     {(gameState.players || []).map(p => (
                         <button 
                            key={p.id} 
                            onClick={() => onSelectPlayer(p)}
                            className={`w-full text-left p-3 rounded-xl border-2 flex items-center justify-between transition-all ${p.isReady ? 'bg-brand-teal text-white border-brand-text shadow-pop-sm' : 'bg-brand-background border-brand-text/10 text-brand-text'}`}
                         >
                             <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-brand-text font-bold text-xs ${p.isReady ? 'bg-white text-brand-teal' : 'bg-gray-200 text-gray-500'}`}>
                                     {p.name.charAt(0)}
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="font-bold leading-tight">{p.name}</span>
                                     {p.topicSuggestion && <span className="text-[10px] font-bold opacity-80 uppercase">Idea Submitted</span>}
                                 </div>
                             </div>
                             {p.isHost && <span className="text-lg">👑</span>}
                         </button>
                     ))}
                 </div>
             </div>
         </div>

         {/* Right: Action Area */}
         <div className="flex flex-col gap-4">
             <div className="bg-brand-purple p-6 rounded-3xl border-3 border-brand-text shadow-pop relative overflow-hidden text-white">
                 <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                 
                 <div className="mb-4 text-center">
                     <div className="text-xs font-bold uppercase opacity-80 mb-1">Topic Idea</div>
                     <h3 className="font-display font-bold text-2xl">"{prompt}..."</h3>
                     <button onClick={() => setPrompt(TOPIC_PROMPTS[Math.floor(Math.random() * TOPIC_PROMPTS.length)])} className="text-xs font-bold underline opacity-60 hover:opacity-100 mt-2">Shuffle Prompt</button>
                 </div>

                 <div className="flex gap-2">
                     <input 
                        className="flex-1 h-12 rounded-xl border-2 border-brand-text px-4 font-bold text-brand-text placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-yellow bg-white"
                        placeholder="Your answer..."
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                     />
                     <button onClick={handleSubmit} disabled={!topicInput.trim()} className="bg-brand-yellow text-brand-text h-12 px-4 rounded-xl border-2 border-brand-text font-bold shadow-sm hover:translate-y-[-2px] transition-all disabled:opacity-50">
                         ✓
                     </button>
                 </div>
             </div>

             <Button 
                fullWidth 
                onClick={onToggleReady} 
                variant={myPlayer?.isReady ? 'tonal' : 'success'}
                className="h-20 text-2xl shadow-pop"
                disabled={!topicInput.trim() && !myPlayer?.isReady && !myPlayer?.topicSuggestion}
             >
                 {myPlayer?.isReady ? 'Ready!' : 'I\'m Ready'}
             </Button>
             
             {isHost && (gameState.players || []).length < 3 && (
                 <div className="text-center text-sm font-bold text-brand-text/50">Need 3+ players to start.</div>
             )}
         </div>
      </div>
    </div>
  );
};