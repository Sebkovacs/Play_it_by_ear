
import React, { useState } from 'react';
import { UserStats, Player } from '../types';

interface NavbarProps {
  userName: string;
  userStats: UserStats;
  onLogout: () => void;
  onShowStats: () => void;
  onShowHelp: () => void;
  playerTitle: string;
  minimal?: boolean;
  players?: Player[];
  scores?: Record<string, number>;
  isHost?: boolean;
  onShowSettings?: () => void;
  onShowGM?: () => void;
}

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 -960 960 960" width="28" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>
);

export const Navbar: React.FC<NavbarProps> = ({ 
  userName, 
  userStats, 
  onLogout, 
  onShowStats, 
  onShowHelp,
  playerTitle,
  minimal = false,
  players = [],
  scores = {},
  isHost = false,
  onShowSettings,
  onShowGM
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navClasses = minimal 
    ? "fixed top-0 left-0 right-0 h-20 bg-transparent z-50 px-4 flex items-center justify-end"
    : "fixed top-0 left-0 right-0 h-20 bg-brand-background/90 backdrop-blur-sm border-b-2 border-brand-text/5 z-50 px-4 flex items-center justify-between";

  const sortedPlayers = [...players].sort((a,b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <nav className={navClasses}>
      {!minimal && (
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 bg-brand-purple rounded-xl border-2 border-brand-text shadow-pop-sm flex items-center justify-center text-white font-display text-xl">
             Ear
          </div>
          <span className="font-display font-bold text-brand-text text-xl hidden sm:block">Play It By Ear</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {minimal && (
             <button onClick={onShowHelp} className="px-4 py-2 bg-white rounded-full font-bold text-sm text-brand-text border-2 border-brand-text/10 shadow-sm hover:bg-brand-yellow transition-colors">
                 How to Play
             </button>
        )}

        {userName && (
             <button 
                onClick={onShowStats}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border-2 border-brand-text shadow-pop-sm hover:translate-y-[-2px] hover:shadow-pop transition-all active:translate-y-[0px] active:shadow-pop-sm"
             >
                <div className="bg-brand-coral p-1.5 rounded-full text-white">
                    <UserIcon />
                </div>
                <div className="flex flex-col leading-none text-left pr-2">
                    <span className="font-bold text-sm text-brand-text">{userName}</span>
                    <span className="text-[10px] font-bold text-brand-purple uppercase">{playerTitle}</span>
                </div>
            </button>
        )}

        {!minimal && (
            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-10 h-10 bg-brand-teal rounded-xl border-2 border-brand-text shadow-pop-sm flex items-center justify-center text-brand-text hover:brightness-110 active:scale-95 transition-all"
                >
                    <MenuIcon />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-2xl shadow-pop-lg border-2 border-brand-text overflow-hidden py-2 animate-fadeIn z-50">
                        {sortedPlayers.length > 0 && (
                            <div className="px-4 py-3 border-b-2 border-brand-text/5 bg-brand-background">
                                <h4 className="text-xs font-bold uppercase text-brand-text/50 mb-2">Leaderboard</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {sortedPlayers.map((p, i) => (
                                        <div key={p.id} className="flex justify-between text-sm font-bold text-brand-text">
                                            <span>{i+1}. {p.name}</span>
                                            <span className="text-brand-purple">{scores[p.id] || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {isHost && onShowSettings && (
                           <button onClick={() => { onShowSettings(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-brand-yellow font-bold text-brand-text transition-colors">
                              ⚙️ Game Settings
                          </button>
                        )}
                        
                        {isHost && onShowGM && (
                           <button onClick={() => { onShowGM(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 bg-brand-navy/5 hover:bg-brand-navy/10 text-brand-navy font-bold transition-colors">
                              🕶️ GM / Secrets
                          </button>
                        )}

                        <button onClick={() => { onShowStats(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-brand-teal/20 font-bold text-brand-text transition-colors">
                            👤 My Profile
                        </button>
                        <button onClick={() => { onShowHelp(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-brand-teal/20 font-bold text-brand-text transition-colors">
                            ❔ How to Play
                        </button>
                        {userName && (
                            <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 hover:bg-brand-coral/20 text-brand-coral font-bold transition-colors">
                                🚪 Leave Game
                            </button>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
      
       {!minimal && isMenuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
       )}
    </nav>
  );
};
