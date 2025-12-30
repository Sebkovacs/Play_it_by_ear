

import React, { useEffect, useState } from 'react';
import { Player, Award } from '../../types';
import { getUserAwards } from '../../services/firebase';

interface PublicProfileViewProps {
  player: Player;
  onClose: () => void;
}

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>;

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ player, onClose }) => {
  const [history, setHistory] = useState<Award[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAwards = async () => {
        if (player.uid) {
            setLoading(true);
            const awards = await getUserAwards(player.uid);
            setHistory(awards);
            setLoading(false);
        }
    };
    fetchAwards();
  }, [player.uid]);

  const formatDate = (ts: number) => ts ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '';

  return (
    <div className="min-h-screen bg-brand-background flex flex-col w-full">
        {/* Header */}
        <div className="bg-white p-4 border-b-2 border-brand-darkBlue flex items-center justify-between sticky top-0 z-50 shadow-sm">
             <div className="flex items-center gap-4">
                 <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                     <BackIcon />
                 </button>
                 <h2 className="font-display font-black text-xl uppercase tracking-widest text-brand-darkBlue">Player Profile</h2>
             </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-8 border-b-2 border-brand-darkBlue">
             <div className="max-w-lg mx-auto flex items-center gap-6">
                 <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center border-4 border-brand-darkBlue shadow-hard-sm shrink-0">
                     <span className="text-4xl">🕵️</span>
                 </div>
                 <div>
                     <h2 className="text-3xl font-black text-brand-darkBlue uppercase tracking-tighter leading-none mb-2">{player.name}</h2>
                     <div className="flex flex-wrap gap-2">
                        <div className="bg-brand-teal text-brand-darkBlue text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit border border-brand-darkBlue shadow-sm">
                            {player.stats?.title || "Unknown Subject"}
                        </div>
                        {player.stats?.archetype && (
                             <div className="bg-brand-orange text-brand-darkBlue text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit border border-brand-darkBlue shadow-sm">
                                {player.stats.archetype}
                            </div>
                        )}
                     </div>
                 </div>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-lg mx-auto w-full pb-24">
            
            {/* Stats Card */}
            <div className="bg-white p-6 rounded-3xl border-2 border-brand-darkBlue shadow-hard-sm">
                <h3 className="text-xs font-black uppercase text-brand-navy mb-4 border-b pb-2 tracking-widest">Known Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <div className="text-4xl font-black text-brand-darkBlue">{player.stats?.gamesPlayed ?? '-'}</div>
                        <div className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-wider mt-1">Games Played</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-black text-brand-teal">{player.stats?.wins ?? '-'}</div>
                        <div className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-wider mt-1">Wins</div>
                    </div>
                </div>
            </div>

            {/* Bio */}
            {player.stats?.description && (
                <div className="bg-brand-navy/5 p-6 rounded-3xl border-2 border-dashed border-brand-navy/20">
                    <h3 className="text-xs font-black uppercase text-brand-navy mb-3 tracking-widest">Intel</h3>
                    <p className="text-base font-medium italic text-brand-darkBlue/80 leading-relaxed">"{player.stats.description}"</p>
                </div>
            )}

            {/* History List */}
            {player.uid && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-brand-navy pl-1 tracking-widest">Game History</h3>
                    {loading ? (
                        <p className="text-xs text-center p-8 font-bold text-brand-navy/30">Loading records...</p>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-brand-navy/40 italic text-center p-8 bg-white rounded-2xl border-2 border-brand-navy/5">Clean record (or very good at hiding).</p>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border-2 border-brand-darkBlue shadow-sm flex items-start gap-4">
                                <div className="text-2xl pt-1">{item.emoji || '🏆'}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-black text-brand-darkBlue text-sm">{item.topic || "Game"}</span>
                                        {item.timestamp && <span className="text-[10px] font-bold opacity-50 pt-1">{formatDate(item.timestamp)}</span>}
                                    </div>
                                    <div className="text-[10px] font-black text-brand-teal uppercase tracking-wide mb-1">{item.title}</div>
                                    <div className="text-xs leading-tight opacity-70 font-medium">{item.description}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    </div>
  );
};