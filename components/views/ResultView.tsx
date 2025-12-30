
import React from 'react';
import { GameState, PlayerRole, GameMode, Player } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';

interface ResultViewProps {
  gameState: GameState;
  isHost: boolean;
  onStartVibeCheck: () => void;
  isGameOver?: boolean;
  onReset?: () => void;
  onSelectPlayer: (player: Player) => void;
}

const CSSConfetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(30)].map((_, i) => (
            <div 
                key={i}
                className="absolute w-3 h-3 rounded-full animate-bounce-slight opacity-80"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `-20px`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                    animationDelay: `${Math.random()}s`,
                    backgroundColor: ['#8C52FF', '#FF6B6B', '#4ECDC4', '#FFE66D'][Math.floor(Math.random() * 4)]
                }}
            />
        ))}
    </div>
);

export const ResultView: React.FC<ResultViewProps> = ({ gameState, isHost, onStartVibeCheck, isGameOver, onReset, onSelectPlayer }) => {
  const result = gameState.lastResult;
  const sortedPlayers = [...gameState.players].sort((a,b) => (gameState.scores[b.id]||0) - (gameState.scores[a.id]||0));
  const awards = isGameOver ? (gameState.endGameAwards || {}) : (result?.awards || {});
  const deltas = result?.pointDeltas || {};
  const isWin = result?.wasCorrect;

  return (
    <div className="flex-1 p-4 py-8 max-w-md mx-auto space-y-6 pb-20 w-full relative">
      
      {isWin && <CSSConfetti />}

      {!isGameOver && (
          <div className="text-center space-y-4 bg-white p-6 rounded-3xl border-3 border-brand-text shadow-pop relative z-10">
              <div className="bg-brand-purple text-white text-xs font-bold uppercase px-3 py-1 absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-brand-text">Result</div>
              <div className="text-4xl font-display font-black text-brand-text">{result?.winner} Wins!</div>
              <p className="text-lg font-medium text-brand-text/80 leading-tight">
                  "{result?.reason}"
              </p>
          </div>
      )}

      {isGameOver && (
          <div className="text-center space-y-2 bg-brand-yellow p-8 rounded-3xl border-3 border-brand-text shadow-pop-lg relative z-10 transform rotate-1">
              <h2 className="text-3xl font-display font-black text-brand-text uppercase">Game Over!</h2>
              <p className="font-bold text-brand-text">Final Scores</p>
          </div>
      )}
      
      {!isGameOver && (
          <div className="grid grid-cols-1 gap-4 relative z-10">
              <div className="bg-brand-coral p-4 rounded-xl border-3 border-brand-text shadow-pop-sm text-brand-text relative">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest text-white bg-brand-text/20 px-2 py-0.5 rounded">Team Red</span>
                  <p className="font-bold text-xl mt-2 leading-tight">"{gameState.scenarios?.scenarioA}"</p>
              </div>

              <div className="bg-blue-100 p-4 rounded-xl border-3 border-brand-text shadow-pop-sm text-brand-text relative">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest text-white bg-blue-500 px-2 py-0.5 rounded">Team Blue</span>
                  <p className="font-bold text-xl mt-2 leading-tight">"{gameState.scenarios?.scenarioB}"</p>
              </div>
          </div>
      )}

      <div className="space-y-4 relative z-10">
          <h3 className="text-xl font-display font-black text-brand-text ml-2">Leaderboard</h3>
          {sortedPlayers.map((player, idx) => {
               const change = deltas[player.id];
               const isTop = idx === 0 && (gameState.scores[player.id] || 0) > 0;
               return (
               <button 
                   key={player.id} 
                   onClick={() => onSelectPlayer(player)}
                   className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 border-brand-text shadow-pop-sm transition-all ${isTop ? 'bg-brand-yellow' : 'bg-white'}`}
               >
                   <div className="flex items-center gap-4">
                       <span className={`font-display font-bold text-lg w-8 text-center ${isTop ? 'text-brand-text' : 'text-brand-text/50'}`}>{idx + 1}</span>
                       <span className="font-bold text-brand-text text-lg">{player.name}</span>
                       {isTop && <span className="text-xl">👑</span>}
                   </div>
                   <div className="flex items-center gap-3">
                       {change !== undefined && change !== 0 && !isGameOver && (
                           <span className={`text-xs font-black px-2 py-1 rounded-full ${change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {change > 0 ? '+' : ''}{change}
                           </span>
                       )}
                       <div className="font-black text-2xl text-brand-text">{gameState.scores[player.id] || 0}</div>
                   </div>
               </button>
          )})}
      </div>

      <div className="space-y-3 relative z-10">
          <h3 className="text-xl font-display font-black text-brand-text ml-2 mt-4">
              {isGameOver ? "Awards" : "Roles"}
          </h3>
          
          {gameState.players.map(player => {
              let roleColor = "bg-white border-brand-text";
              let roleText = "Hidden";
              
              if (player.role === PlayerRole.SCENARIO_A) {
                  roleColor = "bg-brand-coral/10 border-brand-coral text-brand-coral";
                  roleText = "Team Red";
              } else if (player.role === PlayerRole.SCENARIO_B) {
                  roleColor = "bg-blue-50 border-blue-500 text-blue-600";
                  roleText = "Team Blue";
              } else {
                  roleColor = "bg-brand-yellow/20 border-brand-yellow text-brand-text";
                  roleText = "The Outsider";
              }

              const award = awards[player.id];

              return (
                  <div key={player.id} className="relative">
                      {award && (
                          <div className="absolute -top-3 right-4 z-10 bg-brand-purple text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-brand-text shadow-sm flex items-center gap-1 animate-bounce-slight">
                             <span>{award.emoji}</span> {award.title}
                          </div>
                      )}
                      <button 
                          onClick={() => onSelectPlayer(player)}
                          className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between ${roleColor} active:scale-[0.98] transition-all bg-white`}
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-background border-2 border-brand-text flex items-center justify-center text-sm font-bold text-brand-text">
                                  {player.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <div className="font-bold text-brand-text text-lg leading-none">{player.name}</div>
                                {award && <div className="text-xs text-brand-text/60 mt-1 font-medium">{award.description}</div>}
                              </div>
                          </div>
                          {!isGameOver && (
                              <div className="text-right">
                                  <div className="font-bold uppercase text-xs opacity-80">{roleText}</div>
                              </div>
                          )}
                      </button>
                  </div>
              )
          })}
      </div>
      
      {isHost && (
          <div className="flex flex-col gap-3 pt-6 relative z-10">
              {!isGameOver ? (
                   <Button 
                        fullWidth 
                        onClick={onStartVibeCheck} 
                        className="h-16 text-xl bg-green-500 text-white hover:bg-green-600 border-green-700"
                   >
                       Vote for MVP 🗳️
                   </Button>
              ) : (
                  <Button fullWidth onClick={onReset} variant="outlined">
                      Back to Lobby
                  </Button>
              )}
          </div>
      )}
      {!isHost && <div className="text-center font-bold text-brand-text/40">{isGameOver ? "Game Over" : "Waiting for Host..."}</div>}
    </div>
  );
};
