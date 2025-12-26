
import React, { useState } from 'react';
import { GameState, Player, DESCRIPTORS, VoteSubmission } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';
import { InputField } from '../InputField';

interface VotingViewProps {
  gameState: GameState;
  myPlayerId: string;
  onSubmitVotes: (votes: VoteSubmission) => void;
  isHost: boolean;
  onHostNext: () => void;
}

export const VotingView: React.FC<VotingViewProps> = ({ gameState, myPlayerId, onSubmitVotes, isHost, onHostNext }) => {
  const [bestId, setBestId] = useState('');
  const [bestReason, setBestReason] = useState('');
  const [worstId, setWorstId] = useState('');
  const [worstReason, setWorstReason] = useState('');
  const [tags, setTags] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const otherPlayers = gameState.players.filter(p => p.id !== myPlayerId);
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const allVoted = gameState.players.every(p => p.hasVoted);

  // If already voted, show waiting screen
  if (myPlayer?.hasVoted) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-fadeIn pb-24">
              <div className="text-6xl animate-bounce">🗳️</div>
              <h2 className="text-2xl font-black text-brand-darkBlue uppercase tracking-tighter">Vibe Check Submitted</h2>
              <p className="text-brand-navy font-bold text-center">Waiting for everyone else to judge you...</p>
              
              <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                 {gameState.players.map(p => (
                     <div key={p.id} className="flex flex-col items-center gap-1">
                        <div className={`w-4 h-4 rounded-full border border-brand-darkBlue ${p.hasVoted ? 'bg-brand-teal' : 'bg-brand-navy/20'}`} />
                        <span className="text-[10px] font-bold uppercase">{p.name.slice(0,6)}</span>
                     </div>
                 ))}
              </div>

              {isHost && (
                  <div className="mt-8 p-4 bg-white rounded-xl border-2 border-brand-darkBlue shadow-hard w-full max-w-sm">
                      <p className="text-xs font-black uppercase text-brand-navy mb-3 text-center">Host Controls</p>
                      <Button fullWidth onClick={onHostNext} disabled={!allVoted}>
                          {allVoted ? "Finalize & Next Round" : "Waiting for Votes..."}
                      </Button>
                      {!allVoted && <p className="text-[10px] text-center mt-2 text-brand-red font-bold">You can force skip if needed, but it ruins the data.</p>}
                  </div>
              )}
          </div>
      );
  }

  const handleNext = () => {
      if (step === 1) {
          if (!bestId || !bestReason || !worstId || !worstReason) return;
          setStep(2);
      } else {
          // Check if all others are tagged
          const taggedCount = Object.keys(tags).length;
          if (taggedCount < otherPlayers.length) return;

          onSubmitVotes({
              bestPlayerId: bestId,
              bestReason: bestReason,
              worstPlayerId: worstId,
              worstReason: worstReason,
              descriptors: tags
          });
      }
  };

  const toggleTag = (targetId: string, descriptor: string) => {
      setTags(prev => ({ ...prev, [targetId]: descriptor }));
  };

  return (
    <div className="flex-1 p-6 max-w-lg mx-auto w-full flex flex-col pb-24">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter">The Vibe Check</h2>
        <p className="text-brand-navy font-bold text-sm opacity-60">Be honest. Be brutal.</p>
      </div>

      {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
              <Card className="bg-white border-2 border-brand-darkBlue shadow-hard">
                  <div className="flex items-center gap-2 mb-4 text-brand-teal">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-80 310-250l-170-25 25-170-125-125 125-125-25-170 170-25 170-170 170 170 170 25-25 170 125 125-125 125 25 170-170 25-170 170Zm0-120q100 0 170-70t70-170q0-100-70-170t-170-70q-100 0-170 70t-70 170q0 100 70 170t170 70Z"/></svg>
                      <h3 className="font-black uppercase">MVP (Best Player)</h3>
                  </div>
                  <p className="text-xs font-bold mb-2">Who fooled you or carried the team?</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                      {otherPlayers.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setBestId(p.id)}
                            className={`p-2 rounded-lg font-bold text-xs border-2 transition-all ${bestId === p.id ? 'bg-brand-teal text-white border-brand-darkBlue shadow-hard-sm' : 'bg-gray-50 border-brand-navy/10 hover:border-brand-navy/30'}`}
                          >
                              {p.name}
                          </button>
                      ))}
                  </div>
                  <InputField label="Why?" placeholder="e.g. Total sociopath..." value={bestReason} onChange={e => setBestReason(e.target.value)} />
              </Card>

              <Card className="bg-white border-2 border-brand-darkBlue shadow-hard">
                  <div className="flex items-center gap-2 mb-4 text-brand-red">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200l40-40h160l40 40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                      <h3 className="font-black uppercase">The Liability (Worst)</h3>
                  </div>
                  <p className="text-xs font-bold mb-2">Who blew their cover or just sucked?</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                      {otherPlayers.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setWorstId(p.id)}
                            className={`p-2 rounded-lg font-bold text-xs border-2 transition-all ${worstId === p.id ? 'bg-brand-red text-white border-brand-darkBlue shadow-hard-sm' : 'bg-gray-50 border-brand-navy/10 hover:border-brand-navy/30'}`}
                          >
                              {p.name}
                          </button>
                      ))}
                  </div>
                  <InputField label="Why?" placeholder="e.g. Too obvious..." value={worstReason} onChange={e => setWorstReason(e.target.value)} />
              </Card>
              
              <Button fullWidth onClick={handleNext} disabled={!bestId || !bestReason || !worstId || !worstReason}>
                  Next Step
              </Button>
          </div>
      )}

      {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-2">
                  <h3 className="font-black uppercase text-brand-darkBlue">Label Your Coworkers</h3>
                  <p className="text-xs font-bold text-brand-navy/50">Pick ONE descriptor for each person.</p>
              </div>

              {otherPlayers.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard-sm">
                      <h4 className="font-black text-brand-darkBlue mb-3">{p.name} is...</h4>
                      <div className="grid grid-cols-3 gap-2">
                          {DESCRIPTORS.slice(0, 12).map(tag => ( // Showing subset for brevity, or map all
                              <button 
                                key={tag}
                                onClick={() => toggleTag(p.id, tag)}
                                className={`text-[10px] font-bold uppercase py-2 border rounded transition-all ${tags[p.id] === tag ? 'bg-brand-darkBlue text-white border-brand-darkBlue' : 'bg-gray-50 border-gray-200 hover:border-brand-darkBlue'}`}
                              >
                                  {tag}
                              </button>
                          ))}
                           {/* Add 'More' button logic in real app if list is long, or just scroll */}
                      </div>
                  </div>
              ))}

              <Button fullWidth onClick={handleNext} disabled={Object.keys(tags).length < otherPlayers.length}>
                  Submit Judgment
              </Button>
          </div>
      )}
    </div>
  );
};
