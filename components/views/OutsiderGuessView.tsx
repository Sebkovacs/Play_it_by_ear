
import React, { useState } from 'react';
import { GameState } from '../../types';
import { Button } from '../Button';
import { InputField } from '../InputField';

interface OutsiderGuessViewProps {
  gameState: GameState;
  myPlayerId: string;
  onSubmitGuess: (guess: string) => void;
}

export const OutsiderGuessView: React.FC<OutsiderGuessViewProps> = ({ 
  gameState, 
  myPlayerId, 
  onSubmitGuess 
}) => {
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const caughtPlayer = gameState.players.find(p => p.id === gameState.caughtPlayerId);
  const isMe = caughtPlayer?.id === myPlayerId;

  const handleSubmit = () => {
      if (!guess.trim()) return;
      setSubmitted(true);
      onSubmitGuess(guess);
  };

  if (isMe) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 animate-fadeIn max-w-lg mx-auto w-full">
              <div className="text-center space-y-4">
                  <div className="text-6xl animate-pulse">😰</div>
                  <h2 className="text-3xl font-black text-brand-red uppercase tracking-tighter">You were caught!</h2>
                  <p className="text-brand-darkBlue font-bold text-lg">
                      But you have one chance to steal the win.
                  </p>
                  <div className="bg-brand-red text-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard text-sm font-bold">
                      Guess the EXACT topic of conversation.
                      <br/>
                      <span className="opacity-80 font-normal">If you get it right, you steal the points!</span>
                  </div>
              </div>

              {!submitted ? (
                  <div className="w-full space-y-4">
                      <InputField 
                          label="Your Guess" 
                          placeholder="e.g. Scuba Diving" 
                          value={guess} 
                          onChange={(e) => setGuess(e.target.value)} 
                          autoFocus
                      />
                      <Button fullWidth onClick={handleSubmit} disabled={!guess.trim()} variant="success">
                          Take the Shot
                      </Button>
                  </div>
              ) : (
                  <div className="text-center p-8">
                      <p className="animate-bounce font-black text-xl text-brand-darkBlue">Verifying...</p>
                  </div>
              )}
          </div>
      );
  }

  return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center border-4 border-brand-darkBlue shadow-hard">
             <span className="text-4xl">🤔</span>
          </div>
          <div>
              <h2 className="text-2xl font-black text-brand-darkBlue uppercase">The Gambit</h2>
              <p className="text-lg font-bold text-brand-red mt-2">{caughtPlayer?.name} was caught!</p>
              <p className="text-brand-navy mt-4">
                  They are now guessing the topic to try and steal the win.
                  <br/>
                  <span className="opacity-50 text-sm">Hold your breath...</span>
              </p>
          </div>
      </div>
  );
};
