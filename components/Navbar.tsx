
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
  // New props for leaderboard
  players?: Player[];
  scores?: Record<string, number>;
}

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>
);

const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-27 25-42t48-15q32 0 48.5 17.5T546-590q0 20-14 36t-44 38q-44 42-53 59t-9 53Zm36 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
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
  scores = {}
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navClasses = minimal 
    ? "fixed top-0 left-0 right-0 h-20 bg-transparent z-50 px-6 flex items-center justify-end"
    : "fixed top-0 left-0 right-0 h-20 bg-white border-b-2 border-brand-darkBlue z-50 px-6 flex items-center justify-between shadow-sm";

  const sortedPlayers = [...players].sort((a,b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <nav className={navClasses}>
      {!minimal && (
        <div className="flex items-center gap-3">
          {/* Relative path for logo_small.png */}
          <img src="logo_small.png" alt="Play it by Ear!" className="h-10 w-auto object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none'; 
          }}/>
          <span className="font-black text-brand-darkBlue tracking-tight text-xl hidden sm:block uppercase">Play it by Ear!</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        
        {/* Help Button directly on Navbar in minimal mode (Landing) */}
        {minimal && (
            <button 
                onClick={onShowHelp}
                className="flex items-center gap-2 bg-white/50 hover:bg-white px-3 py-2 rounded-lg border-2 border-brand-darkBlue/20 hover:border-brand-darkBlue text-brand-darkBlue font-black text-xs uppercase tracking-wider transition-all backdrop-blur-sm shadow-sm hover:shadow-hard-sm"
            >
                <HelpIcon />
                <span>How to Play</span>
            </button>
        )}

        {userName && (
             <button 
                onClick={onShowStats}
                className="flex items-center gap-3 bg-brand-lime px-4 py-2 rounded-lg border-2 border-brand-darkBlue shadow-hard-sm hover:translate-y-[-2px] hover:shadow-hard transition-all active:translate-y-[0px] active:shadow-hard-sm"
             >
                <div className="flex flex-col leading-none text-right">
                    <span className="font-black text-xs text-brand-darkBlue uppercase tracking-wide">{userName}</span>
                    <span className="text-[10px] text-brand-darkBlue font-bold opacity-70">{playerTitle}</span>
                </div>
                <div className="bg-brand-darkBlue p-1 rounded text-white">
                    <UserIcon />
                </div>
            </button>
        )}

        {/* Menu only appears in non-minimal mode */}
        {!minimal && (
            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 hover:bg-brand-teal rounded-lg transition-colors text-brand-darkBlue border-2 border-brand-darkBlue bg-white shadow-hard-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    title="Menu"
                >
                    <MenuIcon />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-lg shadow-hard border-2 border-brand-darkBlue overflow-hidden py-0 animate-fadeIn z-50">
                        {/* Live Leaderboard */}
                        {sortedPlayers.length > 0 && (
                            <div className="bg-gray-50 p-4 border-b-2 border-brand-darkBlue">
                                <h4 className="text-xs font-black uppercase text-brand-navy mb-2 tracking-widest">Current Standings</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {sortedPlayers.map((p, i) => (
                                        <div key={p.id} className="flex justify-between text-xs font-bold text-brand-darkBlue">
                                            <span>{i+1}. {p.name}</span>
                                            <span className="text-brand-orange">{scores[p.id] || 0} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => { onShowStats(); setIsMenuOpen(false); }}
                            className="w-full text-left px-6 py-4 hover:bg-brand-yellow text-sm font-bold uppercase tracking-wide border-b-2 border-brand-darkBlue flex items-center gap-2 text-brand-darkBlue transition-colors"
                        >
                            📊 Rap Sheet
                        </button>
                        <button 
                            onClick={() => { onShowHelp(); setIsMenuOpen(false); }}
                            className="w-full text-left px-6 py-4 hover:bg-brand-teal text-sm font-bold uppercase tracking-wide border-b-2 border-brand-darkBlue flex items-center gap-2 text-brand-darkBlue transition-colors"
                        >
                            ❔ How to Lie
                        </button>
                        {userName && (
                            <div>
                                <button 
                                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                                    className="w-full text-left px-6 py-4 hover:bg-brand-red hover:text-white text-brand-red text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
                                >
                                    🚪 Bail Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
      
       {!minimal && isMenuOpen && (
        <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setIsMenuOpen(false)}
        />
       )}
    </nav>
  );
};
