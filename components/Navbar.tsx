import React, { useState } from 'react';
import { UserStats } from '../types';

interface NavbarProps {
  userName: string;
  userStats: UserStats;
  onLogout: () => void;
  onShowStats: () => void;
  onShowHelp: () => void;
  playerTitle: string;
  minimal?: boolean;
}

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
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
  minimal = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Solid white background, thick bottom border
  const navClasses = minimal 
    ? "fixed top-0 left-0 right-0 h-20 bg-transparent z-50 px-6 flex items-center justify-end"
    : "fixed top-0 left-0 right-0 h-20 bg-white border-b-2 border-brand-darkBlue z-50 px-6 flex items-center justify-between";

  return (
    <nav className={navClasses}>
      {/* Left: Logo (Hidden in minimal mode) */}
      {!minimal && (
        <div className="flex items-center gap-3">
          <img src="/logo_small.png" alt="It By Ear" className="h-10 w-auto object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none'; 
          }}/>
          <span className="font-black text-brand-darkBlue tracking-tight text-xl hidden sm:block uppercase">It By Ear</span>
        </div>
      )}

      {/* Center/Right: User Info & Actions */}
      <div className="flex items-center gap-4">
        {userName && (
             <div className="flex items-center gap-3 bg-brand-lime px-4 py-2 rounded-lg border-2 border-brand-darkBlue shadow-hard-sm">
                <div className="flex flex-col leading-none text-right">
                    <span className="font-black text-xs text-brand-darkBlue uppercase tracking-wide">{userName}</span>
                    <span className="text-[10px] text-brand-darkBlue font-bold">{playerTitle}</span>
                </div>
                <div className="bg-brand-darkBlue p-1 rounded text-white">
                    <UserIcon />
                </div>
            </div>
        )}

        <div className="relative">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-brand-teal rounded-lg transition-colors text-brand-darkBlue border-2 border-brand-darkBlue bg-white shadow-hard-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                title="Menu"
            >
                <MenuIcon />
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-4 w-56 bg-white rounded-lg shadow-hard border-2 border-brand-darkBlue overflow-hidden py-0 animate-fadeIn z-50">
                    <button 
                        onClick={() => { onShowStats(); setIsMenuOpen(false); }}
                        className="w-full text-left px-6 py-4 hover:bg-brand-yellow text-sm font-bold uppercase tracking-wide border-b-2 border-brand-darkBlue flex items-center gap-2 text-brand-darkBlue transition-colors"
                    >
                        📊 Player Stats
                    </button>
                    <button 
                        onClick={() => { onShowHelp(); setIsMenuOpen(false); }}
                        className="w-full text-left px-6 py-4 hover:bg-brand-teal text-sm font-bold uppercase tracking-wide border-b-2 border-brand-darkBlue flex items-center gap-2 text-brand-darkBlue transition-colors"
                    >
                        ❔ Instructions
                    </button>
                    {userName && (
                        <div>
                             <button 
                                onClick={() => { onLogout(); setIsMenuOpen(false); }}
                                className="w-full text-left px-6 py-4 hover:bg-brand-red hover:text-white text-brand-red text-sm font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      
       {/* Mobile Overlay for Menu */}
       {isMenuOpen && (
        <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setIsMenuOpen(false)}
        />
       )}
    </nav>
  );
};