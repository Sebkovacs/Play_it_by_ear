
import React, { useState } from 'react';
import { GameState, Player, DESCRIPTORS, VoteSubmission } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';

interface VotingViewProps {
  gameState: GameState;
  myPlayerId: string;
  onSubmitVotes: (votes: VoteSubmission) => void;
  isHost: boolean;
  onHostNext: () => void;
}

export const VotingView: React.FC<VotingViewProps> = ({ gameState, myPlayerId, onSubmitVotes, isHost, onHostNext }) => {
  const [bestId, setBestId] = useState('');
  const [worstId, setWorstId] = useState('');
  const [tags, setTags] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const otherPlayers = gameState.players.filter(p => p.id !== myPlayerId);
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const allVoted = gameState.players.every(p => p.hasVoted);

  // If already voted, show waiting screen
  if (myPlayer?.hasVoted) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-fadeIn pb-24">
              <div className="text-6xl animate-bounce-slight">🗳️</div>
              <h2 className="text-2xl font-display font-black text-brand-text uppercase">Vote Locked In!</h2>
              <p className="text-brand-text/60 font-bold text-center">Waiting for the slowpokes...</p>
              
              <div className="flex flex-wrap gap-3 justify-center max-w-xs mt-4">
                 {gameState.players.map(p => (
                     <div key={p.id} className="flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-full border-2 border-brand-text flex items-center justify-center transition-all ${p.hasVoted ? 'bg-brand-teal text-white' : 'bg-white text-brand-text/20'}`}>
                             {p.hasVoted ? '✓' : '...'}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-brand-text/50">{p.name.slice(0,6)}</span>
                     </div>
                 ))}
              </div>

              {isHost && (
                  <div className="mt-8 p-4 bg-white rounded-2xl border-2 border-brand-text shadow-pop w-full max-w-sm">
                      <p className="text-xs font-bold uppercase text-brand-text/40 mb-3 text-center">Host Controls</p>
                      <Button fullWidth onClick={onHostNext} disabled={!allVoted}>
                          {allVoted ? "Reveal Results" : "Waiting..."}
                      </Button>
                      {!allVoted && <button className="text-xs text-center w-full mt-3 text-brand-coral font-bold hover:underline" onClick={onHostNext}>Skip Voting</button>}
                  </div>
              )}
          </div>
      );
  }

  const handleNext = () => {
      if (step === 1) {
          if (!bestId || !worstId) return;
          setStep(2);
      } else {
          // Check if all others are tagged
          const taggedCount = Object.keys(tags).length;
          if (taggedCount < otherPlayers.length) return;

          onSubmitVotes({
              bestPlayerId: bestId,
              worstPlayerId: worstId,
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
        <h2 className="text-3xl font-display font-black text-brand-text">Awards Time!</h2>
        <p className="text-brand-text/60 font-bold text-sm">Be honest (or mean).</p>
      </div>

      {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
              <Card className="bg-white border-3 border-brand-text shadow-pop relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 text-brand-purple">
                      <span className="text-2xl">🏆</span>
                      <h3 className="font-black uppercase text-lg">The MVP</h3>
                  </div>
                  <p className="text-xs font-bold mb-3 text-brand-text/60">Who carried the conversation?</p>
                  <div className="grid grid-cols-2 gap-3">
                      {otherPlayers.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setBestId(p.id)}
                            className={`p-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${bestId === p.id ? 'bg-brand-purple text-white border-brand-text shadow-pop-sm scale-[1.02]' : 'bg-brand-background border-brand-text/10 hover:border-brand-text/30 text-brand-text'}`}
                          >
                              {p.name}
                          </button>
                      ))}
                  </div>
              </Card>

              <Card className="bg-white border-3 border-brand-text shadow-pop">
                  <div className="flex items-center gap-2 mb-4 text-brand-coral">
                      <span className="text-2xl">👀</span>
                      <h3 className="font-black uppercase text-lg">Most Suspicious</h3>
                  </div>
                  <p className="text-xs font-bold mb-3 text-brand-text/60">Who was acting weird?</p>
                  <div className="grid grid-cols-2 gap-3">
                      {otherPlayers.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setWorstId(p.id)}
                            className={`p-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${worstId === p.id ? 'bg-brand-coral text-white border-brand-text shadow-pop-sm scale-[1.02]' : 'bg-brand-background border-brand-text/10 hover:border-brand-text/30 text-brand-text'}`}
                          >
                              {p.name}
                          </button>
                      ))}
                  </div>
              </Card>
              
              <Button fullWidth onClick={handleNext} disabled={!bestId || !worstId} className="h-16 text-xl" variant="success">
                  Next Step
              </Button>
          </div>
      )}

      {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-2">
                  <h3 className="font-black uppercase text-brand-text">Describe Them</h3>
                  <p className="text-xs font-bold text-brand-text/50">Pick one word for each player.</p>
              </div>

              {otherPlayers.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-xl border-2 border-brand-text shadow-pop-sm">
                      <h4 className="font-black text-brand-text mb-3 text-lg">{p.name} is...</h4>
                      <div className="grid grid-cols-3 gap-2">
                          {DESCRIPTORS.slice(0, 15).map(tag => (
                              <button 
                                key={tag}
                                onClick={() => toggleTag(p.id, tag)}
                                className={`text-[10px] font-bold uppercase py-2 border-2 rounded-lg transition-all ${tags[p.id] === tag ? 'bg-brand-text text-white border-brand-text shadow-sm' : 'bg-brand-background border-transparent hover:border-brand-text/20 text-brand-text'}`}
                              >
                                  {tag}
                              </button>
                          ))}
                      </div>
                  </div>
              ))}

              <Button fullWidth onClick={handleNext} disabled={Object.keys(tags).length < otherPlayers.length} className="h-16 text-xl" variant="success">
                  Cast Votes
              </Button>
          </div>
      )}
    </div>
  );
};
