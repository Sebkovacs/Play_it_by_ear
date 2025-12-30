
import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    "Overheating...",
    "Fabricating Reality...",
    "Corrupting Memory Banks...",
    "Downloading Hallucinations...",
    "Injecting Chaos...",
    "Misunderstanding User Input...",
    "Generating Cursed Images...",
    "Buffering The Simulation...",
    "Spawning NPCs...",
    "Deleting Logic..."
];

interface GeneratingViewProps {
  round: number;
}

export const GeneratingView: React.FC<GeneratingViewProps> = ({ round }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
      const interval = setInterval(() => {
          setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 bg-brand-background flex flex-col items-center justify-center p-6 text-center min-h-[60vh] relative overflow-hidden">
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        
        {/* Simple Dark Sphere Icon */}
        <div className="w-24 h-24 bg-brand-text rounded-full shadow-pop animate-bounce-slight"></div>

        {/* Card */}
        <div className="bg-white w-full p-8 rounded-2xl border-4 border-brand-text shadow-pop flex flex-col items-center">
            
            <h2 className="text-4xl font-display font-black text-brand-text uppercase tracking-tight mb-6">
                ITERATION {round}
            </h2>
            
            {/* Message Box */}
            <div className="bg-brand-background w-full border-2 border-brand-text/10 rounded-lg py-3 px-4 mb-8">
                <p className="font-bold text-brand-text/60 font-mono text-sm tracking-tight truncate">
                    {">"} {LOADING_MESSAGES[msgIndex]}
                </p>
            </div>
            
             {/* Progress Bar */}
            <div className="w-full space-y-2">
                <div className="w-full h-8 bg-white border-3 border-brand-text rounded-full overflow-hidden relative">
                    <div className="h-full bg-brand-teal w-full animate-pulse relative">
                        {/* Stripes Pattern */}
                        <div className="absolute inset-0 opacity-20" 
                             style={{ 
                                 backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', 
                                 backgroundSize: '16px 16px' 
                             }}>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-text/40 px-1">
                    <span>Rendering</span>
                    <span>Please Wait</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
