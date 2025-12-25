import React, { useState } from 'react';
import { GamePhase, GameState, PlayerRole } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';

interface GameViewProps {
  gameState: GameState;
  myPlayerId: string;
  onInitiateGuess: () => void;
  onCancelGuess: () => void;
  onSubmitGuess: (guesses: Record<string, PlayerRole>) => void;
  isHost: boolean;
}

const MegaphoneIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M280-280q-33 0-56.5-23.5T200-360v-240q0-33 23.5-56.5T280-680h320l200-120v640L600-280H280Zm0-80h320l120 72v-484l-120 72H280v340Zm-120 80v-500h-40v500h40Zm560-50q-14-11-23-26.5T684-392q10-18 27-44t17-64q0-38-17-64t-27-44q14-11 23-26.5t9-35.5q38 31 60.5 75t22.5 95q0 51-22.5 95T720-330Z"/></svg>
);
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
);
const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>
);


export const GameView: React.FC<GameViewProps> = ({ 
  gameState, 
  myPlayerId, 
  onInitiateGuess, 
  onCancelGuess,
  onSubmitGuess
}) => {
  const [guesses, setGuesses] = useState<Record<string, PlayerRole>>({});
  const isMyTurnToGuess = gameState.guesserId === myPlayerId;
  const guesser = gameState.players.find(p => p.id === gameState.guesserId);

  return (
    <div className="flex-1 bg-brand-background p-6 flex flex-col items-center justify-center space-y-8 relative">
        
        {/* Normal Game View */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/50">Round {gameState.currentRound}/{gameState.totalRounds}</span>
          <h1 className="text-4xl font-black text-brand-darkBlue">The Meeting</h1>
          <p className="text-brand-navy text-lg">Discuss the matter at hand.</p>
        </div>
        
        <div className="w-full max-w-xs aspect-square rounded-full bg-brand-teal/5 flex flex-col items-center justify-center animate-pulse gap-2 border-4 border-brand-teal/20">
          <span className="text-6xl">👂</span>
          <span className="text-sm font-medium text-brand-teal">Play It By Ear</span>
        </div>

        <div className="space-y-4 w-full max-w-md">
          <p className="text-center text-sm text-brand-navy/50 px-8">
              Think you know the truth?
          </p>
          <Button 
              fullWidth 
              onClick={onInitiateGuess}
              disabled={gameState.phase === GamePhase.GUESSING}
              className={`h-16 text-xl bg-brand-orange hover:bg-brand-orange/90 text-white shadow-brand-orange/20 shadow-xl`}
          >
            <MegaphoneIcon />
            MAKE AN ACCUSATION
          </Button>
        </div>

        {/* Guessing Overlay */}
        {gameState.phase === GamePhase.GUESSING && (
            <div className="fixed inset-0 z-50 bg-brand-navy/90 backdrop-blur-md flex items-center justify-center p-4">
                <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col bg-white">
                    <div className="border-b border-brand-navy/10 pb-4 mb-4 text-center">
                        <h2 className="text-2xl font-bold text-brand-orange">ACCUSATION IN PROGRESS</h2>
                        <p className="text-brand-navy/60">{isMyTurnToGuess ? "Identify everyone's role correctly to win." : `${guesser?.name} is making an accusation...`}</p>
                    </div>

                    {isMyTurnToGuess ? (
                        <div className="space-y-4 flex-1 overflow-y-auto">
                            {gameState.players.filter(p => p.id !== myPlayerId).map(p => (
                                <div key={p.id} className="bg-brand-navy/5 p-4 rounded-xl space-y-2">
                                    <div className="font-bold flex items-center gap-2 text-brand-darkBlue"><PersonIcon/> {p.name}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[PlayerRole.SCENARIO_A, PlayerRole.SCENARIO_B, PlayerRole.TONE_DEAF].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setGuesses(prev => ({...prev, [p.id]: role}))}
                                                className={`text-xs p-2 rounded-lg border-2 transition-all font-bold 
                                                ${guesses[p.id] === role 
                                                    ? 'border-brand-teal bg-brand-teal text-white' 
                                                    : 'border-brand-navy/10 text-brand-navy/60 hover:border-brand-teal/50'
                                                }`}
                                            >
                                                {role === PlayerRole.SCENARIO_A ? "Scenario A" : role === PlayerRole.SCENARIO_B ? "Scenario B" : "Tone Deaf"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 flex gap-2">
                                <Button onClick={onCancelGuess} variant="outlined" className="flex-1">Cancel</Button>
                                <Button onClick={() => onSubmitGuess(guesses)} className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white border-0">CONFIRM ACCUSATION</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="animate-spin text-brand-orange"><RefreshIcon/></div>
                            <p className="text-brand-navy">Wait while {guesser?.name} decides your fate...</p>
                        </div>
                    )}
                </Card>
            </div>
        )}
    </div>
  );
};