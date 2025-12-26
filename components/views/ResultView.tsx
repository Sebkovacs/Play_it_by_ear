
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

const QuestionMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80q0-46 22-82t70-66q35-23 51.5-56t16.5-76q0-66-47-113t-113-47q-55 0-99.5 29.5T363-772l67 38q11-28 35.5-47t54.5-19q33 0 56.5 23.5T600-720q0 27-16 46.5T544-634q-54 34-82 72.5T440-440Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
);
const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>
);

export const ResultView: React.FC<ResultViewProps> = ({ gameState, isHost, onStartVibeCheck, isGameOver, onReset, onSelectPlayer }) => {
  const result = gameState.lastResult;
  const sortedPlayers = [...gameState.players].sort((a,b) => (gameState.scores[b.id]||0) - (gameState.scores[a.id]||0));
  // Use endGameAwards if game over, otherwise use round awards (if any)
  const awards = isGameOver ? (gameState.endGameAwards || {}) : (result?.awards || {});
  const deltas = result?.pointDeltas || {};

  return (
    <div className="flex-1 bg-brand-background p-4 py-8 max-w-md mx-auto space-y-6 pb-20 w-full">
      
      {!isGameOver && (
          <div className="text-center space-y-2 bg-white p-6 rounded-xl border-2 border-brand-darkBlue shadow-hard">
              <h2 className="text-md uppercase tracking-widest text-brand-navy/40 font-bold">The Verdict</h2>
              <div className="text-4xl font-black text-brand-darkBlue">{result?.winner} Wins!</div>
              <p className="text-sm font-medium text-brand-navy bg-brand-teal/10 border-2 border-brand-teal py-2 px-4 rounded-full inline-block">
                  {result?.reason}
              </p>
          </div>
      )}

      {isGameOver && (
          <div className="text-center space-y-2 bg-brand-yellow p-6 rounded-xl border-2 border-brand-darkBlue shadow-hard animate-bounce">
              <h2 className="text-2xl font-black text-brand-darkBlue uppercase">Game Over</h2>
              <p className="font-bold">The dust has settled.</p>
          </div>
      )}
      
      {!isGameOver && (
          <div className="grid grid-cols-1 gap-4">
              <Card variant="filled" className="bg-white border-2 border-brand-darkBlue shadow-hard relative overflow-hidden text-brand-navy">
                  <div className="absolute top-2 right-2 opacity-10"><QuestionMarkIcon/></div>
                  <span className="text-xs font-bold opacity-60 uppercase tracking-widest">Serious Scenario</span>
                  <p className="font-medium text-lg mt-1">{gameState.scenarios?.scenarioA}</p>
              </Card>

              <Card variant="filled" className="bg-brand-orange text-white border-2 border-brand-darkBlue shadow-hard relative overflow-hidden">
                  <div className="absolute top-2 right-2 opacity-10"><QuestionMarkIcon/></div>
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest text-brand-darkBlue">Absurd Scenario</span>
                  <p className="font-medium text-lg mt-1 text-brand-darkBlue">{gameState.scenarios?.scenarioB}</p>
              </Card>
          </div>
      )}

      <div className="space-y-4">
          <h3 className="text-lg font-black uppercase text-brand-darkBlue ml-1 tracking-wider">Scoreboard</h3>
          {sortedPlayers.map((player, idx) => {
               const change = deltas[player.id];
               return (
               <button 
                   key={player.id} 
                   onClick={() => onSelectPlayer(player)}
                   className="w-full flex items-center justify-between p-3 bg-white rounded-xl border-2 border-brand-darkBlue shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-hard-sm"
               >
                   <div className="flex items-center gap-3">
                       <span className="text-brand-darkBlue font-mono font-black w-6">{idx + 1}</span>
                       <span className="font-bold text-brand-darkBlue">{player.name}</span>
                   </div>
                   <div className="flex items-center gap-2">
                       {change !== undefined && change !== 0 && !isGameOver && (
                           <span className={`text-xs font-bold px-1.5 rounded ${change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {change > 0 ? '+' : ''}{change}
                           </span>
                       )}
                       <div className="font-black text-brand-orange">{gameState.scores[player.id] || 0} pts</div>
                   </div>
               </button>
          )})}
      </div>

      <div className="space-y-2">
          <h3 className="text-lg font-black uppercase text-brand-darkBlue ml-1 tracking-wider">
              {isGameOver ? "Permanent Records" : "The Lineup"}
          </h3>
          
          {gameState.players.map(player => {
              let roleColor = "bg-white border-2 border-brand-darkBlue text-brand-darkBlue";
              let roleText = "Unknown";
              
              if (player.role === PlayerRole.SCENARIO_A) {
                  roleColor = "bg-brand-background border-2 border-brand-darkBlue text-brand-darkBlue";
                  roleText = "Serious";
              } else if (player.role === PlayerRole.SCENARIO_B) {
                  roleColor = "bg-brand-orange border-2 border-brand-darkBlue text-brand-darkBlue";
                  roleText = "Absurd";
              } else {
                  roleColor = "bg-brand-yellow border-2 border-brand-darkBlue text-brand-darkBlue";
                  roleText = "Imposter";
              }

              const award = awards[player.id];

              return (
                  <div key={player.id} className="flex flex-col gap-1">
                      {award && (
                          <div className="ml-4 mb-[-8px] z-10 bg-brand-lime text-brand-darkBlue text-xs font-bold px-3 py-1 rounded-t-lg w-fit shadow-sm border-2 border-b-0 border-brand-darkBlue flex items-center gap-1 animate-fadeIn">
                             <span>{award.emoji}</span> {award.title}
                          </div>
                      )}
                      <button 
                          onClick={() => onSelectPlayer(player)}
                          className={`w-full text-left p-4 rounded-xl shadow-hard-sm flex items-center justify-between ${roleColor} hover:brightness-95 active:scale-[0.98] transition-all`}
                      >
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full bg-white/40 border-2 border-brand-darkBlue`}>
                                  <PersonIcon />
                              </div>
                              <div className="flex flex-col">
                                <div className="font-bold text-lg leading-none">{player.name}</div>
                                {award && <div className="text-[10px] opacity-70 mt-1 leading-tight max-w-[200px] font-bold">{award.description}</div>}
                              </div>
                          </div>
                          {!isGameOver && (
                              <div className="text-right">
                                  <div className="font-black uppercase text-xs">{roleText}</div>
                              </div>
                          )}
                      </button>
                  </div>
              )
          })}
      </div>
      
      {isHost && (
          <div className="flex flex-col gap-3 pt-4">
              {!isGameOver ? (
                   <Button fullWidth onClick={onStartVibeCheck} className="h-16 text-lg bg-brand-teal text-brand-darkBlue">
                       Start Vibe Check
                   </Button>
              ) : (
                  <Button fullWidth onClick={onReset} variant="tonal">
                      Reset Lobby
                  </Button>
              )}
          </div>
      )}
      {!isHost && <div className="text-center text-sm font-bold text-brand-navy/50 uppercase tracking-widest">{isGameOver ? "Game Over" : "Waiting for Host..."}</div>}
    </div>
  );
};
