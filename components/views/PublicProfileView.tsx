
import React, { useEffect, useState } from 'react';
import { Player, Award } from '../../types';
import { getUserAwards } from '../../services/firebase';

interface PublicProfileViewProps {
  player: Player;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ player }) => {
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
    <div className="flex flex-col h-full bg-brand-background rounded-xl overflow-hidden w-full max-h-[60vh]">
        {/* Header */}
        <div className="bg-white p-6 border-b-2 border-brand-darkBlue flex items-center gap-4">
             <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center border-4 border-brand-darkBlue shadow-hard-sm">
                 <span className="text-3xl">🕵️</span>
             </div>
             <div>
                 <h2 className="text-2xl font-black text-brand-darkBlue uppercase tracking-tighter">{player.name}</h2>
                 <div className="bg-brand-teal text-brand-darkBlue text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit mt-1 border border-brand-darkBlue">
                     {player.stats?.title || "Unknown Subject"}
                 </div>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Stats Card */}
            <div className="bg-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard-sm">
                <h3 className="text-xs font-black uppercase text-brand-navy mb-4 border-b pb-2">Known Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-black text-brand-darkBlue">{player.stats?.gamesPlayed ?? '-'}</div>
                        <div className="text-[10px] font-bold text-brand-navy/50 uppercase">Games</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black text-brand-teal">{player.stats?.wins ?? '-'}</div>
                        <div className="text-[10px] font-bold text-brand-navy/50 uppercase">Wins</div>
                    </div>
                </div>
            </div>

            {/* Bio */}
            {player.stats?.description && (
                <div className="bg-brand-navy/5 p-4 rounded-xl border-2 border-dashed border-brand-navy/20">
                    <h3 className="text-xs font-black uppercase text-brand-navy mb-2">Intel</h3>
                    <p className="text-sm font-medium italic text-brand-darkBlue/80">"{player.stats.description}"</p>
                </div>
            )}

            {/* History List */}
            {player.uid && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-brand-navy pl-1">Criminal Record</h3>
                    {loading ? (
                        <p className="text-xs text-center p-4">Decrypting records...</p>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-brand-navy/40 italic text-center p-4 bg-white rounded-lg border-2 border-brand-navy/5">Clean record (or very good at hiding).</p>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border-2 border-brand-darkBlue shadow-sm flex items-start gap-3">
                                <div className="text-xl">{item.emoji || '🏆'}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-black text-brand-darkBlue text-xs">{item.topic || "Operation"}</span>
                                        {item.timestamp && <span className="text-[10px] font-bold opacity-50">{formatDate(item.timestamp)}</span>}
                                    </div>
                                    <div className="text-[10px] font-bold text-brand-teal uppercase">{item.title}</div>
                                    <div className="text-[10px] leading-tight opacity-70">{item.description}</div>
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
