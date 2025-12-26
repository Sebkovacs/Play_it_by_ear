
import React from 'react';
import { GameState, Player, GameMode } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';

interface LobbyViewProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onCopyLink: () => void;
  onToggleReady: () => void;
  onUpdateSettings: (target: number, toneDeaf: number, mode: GameMode) => void;
  topicInput: string;
  setTopicInput: (val: string) => void;
  onSubmitTopic: (val: string) => void;
  onTestMode?: () => void;
  onSelectPlayer: (player: Player) => void;
}

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M720-80q-50 0-85-35t-35-85q0-7 1-14.5t3-13.5L322-392q-17 15-38 23.5t-44 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q23 0 44 8.5t38 23.5l282-164q-2-6-3-13.5t-1-14.5q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-23 0-44-8.5T638-672L356-508q2 6 3 13.5t1 14.5q0 7-1 14.5t-3 13.5l282 164q17-15 38-23.5t44-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Z"/></svg>
);
const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>
);
const CrownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M240-400h320v-80l-110-50 110-50v-80H240v80l110 50-110 50v80ZM80-120v-200h80v200H80Zm120 0v-200h480v200H200Zm520 0v-200h80v200h-80ZM200-640h480v-80h-80q-17 0-28.5-11.5T560-760q0-17 11.5-28.5T600-800h-80q-17 0-28.5-11.5T480-840q-17 0-28.5 11.5T440-800h-80q17 0 28.5 11.5T400-760q0 17-11.5 28.5T360-720h-80v80Z"/></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z"/></svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
);
const BugIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor"><path d="M480-410q-26 0-45.5-16T408-470H320v-40h85q5-39 36-64.5t79-25.5q48 0 79 25.5t36 64.5h85v40h-88q-7 29-26.5 45T480-410Zm0 250q-83 0-141.5-58.5T280-360v-60h80v60q0 50 35 85t85 35q50 0 85-35t35-85v-60h80v60q0 83-58.5 141.5T480-160Zm0-480q-17 0-28.5-11.5T440-680q0-17 11.5-28.5T480-720q17 0 28.5 11.5T520-680q0 17-11.5 28.5T480-640Zm280 200v-80h-46q-12-32-34-58t-50-46l42-64-68-40-42 64q-34-12-70-16v-80h-80v80q-36 4-70 16l-42-64-68 40 42 64q-28 20-50 46t-34 58h-46v80h46q2 14 5.5 27t8.5 25l-52 52 56 56 52-52q23 18 50.5 28.5T480-280q29 0 56.5-10.5T588-319l52 52 56-56-52-52q5-12 8.5-25t5.5-27h46Z"/></svg>
);

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  myPlayerId,
  isHost,
  onCopyLink,
  onToggleReady,
  onUpdateSettings,
  topicInput,
  setTopicInput,
  onSubmitTopic,
  onTestMode,
  onSelectPlayer
}) => {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);

  // Helper to safely call update settings
  const updateConfig = (newTarget: number, newToneDeaf: number, newMode: GameMode) => {
    onUpdateSettings(newTarget, newToneDeaf, newMode);
  };

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-start max-w-6xl mx-auto w-full relative">
      
      {/* Header Area for Room Code */}
      <div className="w-full flex flex-col items-center justify-center p-4 mb-8 gap-3">
        <span className="text-xs font-black uppercase tracking-widest text-brand-navy">The Holding Cell</span>
        <div className="relative py-3 px-8 border-3 border-brand-darkBlue rounded-lg bg-white flex items-center justify-center gap-4 shadow-hard hover:shadow-hard-lg transition-all">
            <span className="text-4xl font-mono font-black text-brand-darkBlue tracking-[0.2em]">{gameState.roomCode}</span>
            <button 
                onClick={onCopyLink} 
                className="p-2 bg-brand-teal text-brand-darkBlue border-2 border-brand-darkBlue rounded hover:bg-brand-lime transition-colors"
                title="Copy Link"
                >
                <ShareIcon/>
            </button>
        </div>
        {isHost && onTestMode && (
          <button 
            onClick={onTestMode}
            className="flex items-center gap-2 px-3 py-1 bg-yellow-400 border-2 border-black rounded text-[10px] font-black uppercase tracking-wider hover:bg-yellow-300"
          >
            <BugIcon />
            Dev: Inject Bots
          </button>
        )}
      </div>

      {gameState.countdown !== null && (
          <div className="absolute inset-0 z-50 bg-white/95 flex items-center justify-center flex-col animate-fadeIn border-4 border-brand-darkBlue m-4 rounded-xl">
              <div className="text-[140px] font-black text-brand-orange animate-pulse">
                  {gameState.countdown}
              </div>
              <p className="text-2xl text-brand-darkBlue font-bold uppercase tracking-widest">Prepare Yourself...</p>
          </div>
      )}

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Settings & Players */}
        <div className="space-y-6">
              {/* Host Settings */}
            {isHost && (
                <Card variant="elevated" className="space-y-4 bg-white">
                    <div className="flex items-center gap-2 text-brand-darkBlue border-b-2 border-brand-darkBlue pb-2">
                        <SettingsIcon />
                        <span className="font-black text-lg uppercase">The Scheme</span>
                    </div>
                    <div className="space-y-6 pt-2">
                        {/* Game Mode Toggle */}
                        <div className="flex bg-brand-navy/5 p-1 rounded-lg border border-brand-navy/10">
                             <button 
                                onClick={() => updateConfig(3, gameState.maxToneDeaf, GameMode.ROUNDS)}
                                className={`flex-1 py-2 rounded text-xs font-black uppercase tracking-wide transition-all ${gameState.gameMode === GameMode.ROUNDS ? 'bg-white shadow-sm text-brand-darkBlue border border-brand-darkBlue/20' : 'text-brand-navy/40 hover:text-brand-navy'}`}
                             >
                                 Fixed Rounds
                             </button>
                             <button 
                                onClick={() => updateConfig(20, gameState.maxToneDeaf, GameMode.POINTS)}
                                className={`flex-1 py-2 rounded text-xs font-black uppercase tracking-wide transition-all ${gameState.gameMode === GameMode.POINTS ? 'bg-white shadow-sm text-brand-darkBlue border border-brand-darkBlue/20' : 'text-brand-navy/40 hover:text-brand-navy'}`}
                             >
                                 Race to Points
                             </button>
                        </div>

                        {/* Sliders based on Mode */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span>
                                    {gameState.gameMode === GameMode.ROUNDS ? "Total Rounds" : "Target Score"}
                                </span>
                                <span className="bg-brand-darkBlue text-white px-2 rounded">{gameState.targetValue}</span>
                            </div>
                            <input 
                                type="range" 
                                min={gameState.gameMode === GameMode.ROUNDS ? "1" : "15"} 
                                max={gameState.gameMode === GameMode.ROUNDS ? "10" : "100"} 
                                step={gameState.gameMode === GameMode.ROUNDS ? "1" : "5"}
                                value={gameState.targetValue}
                                onChange={(e) => updateConfig(parseInt(e.target.value), gameState.maxToneDeaf, gameState.gameMode)}
                                className="w-full h-2 bg-brand-navy/20 rounded-lg appearance-none cursor-pointer accent-brand-darkBlue"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span>Max Imposters (Tone Deaf)</span>
                                <span className="bg-brand-darkBlue text-white px-2 rounded">{gameState.maxToneDeaf}</span>
                            </div>
                            <input 
                                type="range" min="0" max="2" step="1"
                                value={gameState.maxToneDeaf}
                                onChange={(e) => updateConfig(gameState.targetValue, parseInt(e.target.value), gameState.gameMode)}
                                className="w-full h-2 bg-brand-navy/20 rounded-lg appearance-none cursor-pointer accent-brand-darkBlue"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {!isHost && (
                <div className="text-center font-bold text-xs text-brand-darkBlue border-2 border-brand-darkBlue bg-brand-lime p-3 rounded-lg uppercase tracking-wider shadow-hard-sm">
                    {gameState.gameMode === GameMode.ROUNDS 
                        ? `${gameState.targetValue} Rounds Scheduled` 
                        : `Target: ${gameState.targetValue} Points`} 
                    {" • "}
                    Max {gameState.maxToneDeaf} Imposters
                </div>
            )}

            <Card variant="elevated" className="space-y-4 h-fit">
                <div className="flex justify-between items-end border-b-2 border-brand-darkBlue pb-2">
                    <h2 className="text-lg font-black uppercase text-brand-darkBlue">The Lineup</h2>
                    <span className="text-xs font-bold bg-brand-yellow px-2 py-0.5 rounded border border-brand-darkBlue">{gameState.players.length} / 8</span>
                </div>
                
                <div className="flex flex-col gap-3 mt-2">
                    {gameState.players.map((p) => (
                    <button 
                        key={p.id} 
                        onClick={() => onSelectPlayer(p)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 border-brand-darkBlue flex items-center justify-between transition-all active:scale-[0.98] ${p.isReady ? 'bg-brand-teal text-brand-darkBlue shadow-hard-sm' : 'bg-gray-50 text-brand-navy/50 border-dashed hover:bg-gray-100'}`}
                    >
                        <div className="flex items-center gap-3">
                            <PersonIcon />
                            <div className="flex flex-col">
                                <span className="font-bold leading-none">{p.name}</span>
                                {p.topicSuggestion && <span className="text-[10px] uppercase font-bold mt-1 opacity-80">Submitted</span>}
                            </div>
                            {p.id === myPlayerId && <span className="text-[10px] font-black uppercase bg-brand-darkBlue text-white px-1.5 rounded ml-2">You</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {p.isReady && <CheckCircleIcon />}
                            {p.isHost && <div className="text-brand-orange bg-brand-darkBlue p-1 rounded-full border border-brand-orange"><CrownIcon /></div>}
                        </div>
                    </button>
                    ))}
                </div>
            </Card>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col gap-6 justify-center">
             {/* Custom Styled Topic Submission */}
             <div className="bg-brand-yellow p-6 rounded-xl border-3 border-brand-darkBlue shadow-hard space-y-3 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white rounded-full border-2 border-brand-darkBlue z-0"></div>
                <label className="text-xs uppercase font-black text-brand-darkBlue tracking-widest ml-1 relative z-10">Give us something weird</label>
                <div className="relative flex items-center z-10">
                    <input 
                    className="w-full h-14 pl-4 pr-24 rounded-lg bg-white border-2 border-brand-darkBlue focus:shadow-hard-sm focus:outline-none transition-all text-lg font-bold text-brand-darkBlue placeholder:font-normal placeholder:text-brand-navy/40"
                    placeholder="e.g. A failed magician"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    />
                    <button 
                    className="absolute right-2 top-2 bottom-2 bg-brand-darkBlue hover:bg-black text-white font-black px-4 rounded border-2 border-transparent text-xs uppercase tracking-wide transition-colors"
                    onClick={() => onSubmitTopic(topicInput)}
                    >
                    Send
                    </button>
                </div>
                <p className="text-[10px] font-bold text-brand-darkBlue/70 ml-1 relative z-10">We pick one topic randomly. Make it count.</p>
            </div>

            <div className="space-y-4">
                <Button 
                    fullWidth 
                    onClick={onToggleReady}
                    variant={myPlayer?.isReady ? 'filled' : 'outlined'}
                    disabled={!topicInput.trim() && !myPlayer?.isReady && !myPlayer?.topicSuggestion}
                    className={`h-24 text-2xl ${myPlayer?.isReady ? 'bg-brand-green border-brand-darkBlue' : 'bg-white'}`}
                >
                    {myPlayer?.isReady ? 'LOCKED IN!' : 'LOCK IN'}
                </Button>
                {(!topicInput.trim() && !myPlayer?.isReady && !myPlayer?.topicSuggestion) && 
                    <div className="text-center">
                         <span className="inline-block px-3 py-1 bg-brand-red text-white text-xs font-bold uppercase rounded transform -rotate-1">Don't be boring (Submit Topic)</span>
                    </div>
                }
            </div>

              <div className="text-center p-2 mt-4">
                <p className="text-xs font-bold text-brand-navy bg-white inline-block px-6 py-3 rounded-full border-2 border-brand-darkBlue shadow-sm">
                    {isHost 
                        ? (gameState.players.length < 3 
                            ? "Need more victims..." 
                            : gameState.countdown !== null
                                ? "Ignition..."
                                : "Auto-launch when everyone locks in.")
                        : "Waiting for the Boss..."
                    }
                </p>
            </div>
        </div>
        
      </div>
        {gameState.error && (
          <div className="p-4 bg-brand-red text-white border-2 border-brand-darkBlue shadow-hard rounded-lg text-sm mt-4 text-center font-bold">
            {gameState.error}
          </div>
        )}
    </div>
  );
};
