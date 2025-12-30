

import React, { useState } from 'react';
import { UserStats, Award, RelationshipStat, PlaystyleAttributes } from '../../types';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { updateUserIdentity, deleteUserAccount, linkGoogleAccount, linkEmailAccount } from '../../services/firebase';

interface ProfileViewProps {
  userStats: UserStats;
  playerTitle: string;
  myAwards: any[];
  currentName: string;
  onUpdateName: (name: string) => void;
  onLogout: () => void;
  onClose: () => void;
  isAnonymous?: boolean;
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 17l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 56 56-28-27Z"/></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>;

// Improved SVG Radar Chart
const RadarChart: React.FC<{ stats: PlaystyleAttributes }> = ({ stats }) => {
    const size = 220;
    const center = size / 2;
    const radius = 70;
    const keys: (keyof PlaystyleAttributes)[] = ['chaos', 'smarts', 'vibes', 'stealth', 'luck']; 
    const total = keys.length;
    
    const points = keys.map((key, i) => {
        const value = (stats[key] || 50) / 100; 
        const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
        const x = center + radius * value * Math.cos(angle);
        const y = center + radius * value * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    const fullPoints = keys.map((_, i) => {
        const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative w-full flex justify-center py-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <polygon points={fullPoints} fill="#f8f5f2" stroke="#e5e7eb" strokeWidth="2" />
                <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 2" />
                {keys.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
                    return (
                        <line 
                            key={i}
                            x1={center} y1={center}
                            x2={center + radius * Math.cos(angle)}
                            y2={center + radius * Math.sin(angle)}
                            stroke="#e5e7eb" strokeWidth="1"
                        />
                    );
                })}
                <polygon points={points} fill="rgba(140, 82, 255, 0.4)" stroke="#8C52FF" strokeWidth="3" />
                {keys.map((key, i) => {
                    const value = (stats[key] || 50) / 100;
                    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
                    const x = center + radius * value * Math.cos(angle);
                    const y = center + radius * value * Math.sin(angle);
                    return <circle key={key} cx={x} cy={y} r="4" fill="#8C52FF" stroke="white" strokeWidth="2" />;
                })}
                {keys.map((key, i) => {
                    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
                    const labelRadius = radius + 25;
                    const x = center + labelRadius * Math.cos(angle);
                    const y = center + labelRadius * Math.sin(angle);
                    return (
                        <text 
                            key={key} 
                            x={x} y={y} 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            className="text-[10px] font-black uppercase fill-brand-text"
                            style={{ textShadow: '0px 0px 4px white' }}
                        >
                            {key}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    userStats, playerTitle, myAwards, currentName, onUpdateName, onLogout, onClose, isAnonymous 
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [newName, setNewName] = useState(currentName);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [showLinkOptions, setShowLinkOptions] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [linkError, setLinkError] = useState('');

    const handleSaveName = async () => {
        if(!newName.trim()) return;
        try {
            await updateUserIdentity(newName);
            onUpdateName(newName);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUserAccount();
            onClose(); 
            window.location.reload(); 
        } catch (e) { console.error(e); }
    };

    const handleLinkGoogle = async () => {
        try {
            setLinkError('');
            await linkGoogleAccount();
            setShowLinkOptions(false);
        } catch (e: any) {
            setLinkError(e.message);
        }
    };

    const handleLinkEmail = async () => {
        if(!email || !password) return setLinkError("Enter email & password");
        try {
            setLinkError('');
            await linkEmailAccount(email, password);
            setShowLinkOptions(false);
        } catch (e: any) {
            setLinkError(e.message);
        }
    };

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const statsForChart = userStats.attributes || { chaos: 50, smarts: 50, vibes: 50, stealth: 50, luck: 50 };
    const relationships = userStats.relationships 
        ? (Object.values(userStats.relationships) as RelationshipStat[]).sort((a,b) => b.gamesPlayed - a.gamesPlayed).slice(0, 5) 
        : [];

    return (
        <div className="min-h-screen bg-brand-background flex flex-col w-full">
            
            {/* Header */}
            <div className="bg-white p-4 border-b-2 border-brand-text/10 sticky top-0 z-50 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-4">
                     <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                         <BackIcon />
                     </button>
                     <h2 className="font-display font-black text-xl uppercase tracking-widest text-brand-darkBlue">My Profile</h2>
                 </div>
                 <button onClick={onLogout} className="text-xs font-bold text-brand-coral hover:bg-brand-coral/10 px-3 py-1.5 rounded-lg border border-brand-coral/20">
                    Sign Out
                 </button>
            </div>

            {/* Identity Card */}
            <div className="bg-white p-6 border-b-2 border-brand-text/10">
                <div className="max-w-lg mx-auto flex items-start gap-4">
                    <div className="w-20 h-20 bg-brand-purple rounded-2xl flex items-center justify-center border-3 border-brand-text shadow-pop-sm shrink-0">
                        <span className="text-4xl text-white">👤</span>
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <input 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="border-b-2 border-brand-purple bg-transparent font-black text-2xl w-full focus:outline-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSaveName} className="text-xs bg-brand-teal text-brand-text px-3 py-1.5 rounded font-bold border border-brand-text">SAVE</button>
                                    <button onClick={() => { setIsEditing(false); setNewName(currentName); }} className="text-xs bg-gray-200 text-brand-text px-3 py-1.5 rounded font-bold">CANCEL</button>
                                </div>
                            </div>
                        ) : (
                            <div className="group">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-black text-brand-text uppercase tracking-tight leading-none">{currentName}</h2>
                                    <button onClick={() => setIsEditing(true)} className="text-brand-text/30 hover:text-brand-purple transition-colors p-1">
                                        <EditIcon />
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <div className="bg-brand-yellow text-brand-text text-xs font-black uppercase px-2 py-0.5 rounded border border-brand-text/50">
                                        {userStats.archetype || "Newcomer"}
                                    </div>
                                    {isAnonymous && <span className="text-xs bg-gray-200 text-gray-500 font-bold px-2 py-0.5 rounded">GUEST</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto w-full pb-24">
                <div className="max-w-lg mx-auto">
                    {/* Tab Bar */}
                    <div className="px-6 pt-6 pb-2">
                        <div className="bg-white p-1 rounded-xl border-2 border-brand-text/10 flex shadow-sm">
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-brand-purple text-white shadow-sm' : 'text-brand-text/40 hover:text-brand-text/70'}`}
                            >
                                Stats & Vibe
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-brand-teal text-brand-text shadow-sm' : 'text-brand-text/40 hover:text-brand-text/70'}`}
                            >
                                History
                            </button>
                        </div>
                    </div>

                    <div className="px-6 pb-6 space-y-6">
                        
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Playstyle Chart */}
                                <div className="bg-white rounded-3xl border-2 border-brand-text/10 shadow-sm p-4 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase px-3 py-1 rounded-br-xl">Playstyle Analysis</div>
                                        <RadarChart stats={statsForChart} />
                                </div>

                                {/* ANONYMOUS UPGRADE */}
                                {isAnonymous && (
                                    <div className="bg-brand-yellow p-6 rounded-3xl border-3 border-brand-text shadow-pop-sm relative overflow-hidden">
                                        <h3 className="font-black text-brand-text uppercase mb-2 text-lg">Don't lose your stats!</h3>
                                        <p className="text-sm font-bold text-brand-text/70 mb-4">Create an account to keep your history.</p>
                                        
                                        {!showLinkOptions ? (
                                            <button onClick={() => setShowLinkOptions(true)} className="w-full h-12 rounded-xl bg-white text-brand-text font-black text-sm border-2 border-brand-text shadow-sm hover:translate-y-[-1px] transition-all">
                                                Link Account Now
                                            </button>
                                        ) : (
                                            <div className="bg-white p-4 rounded-xl space-y-3 border-2 border-brand-text/10">
                                                <button onClick={handleLinkGoogle} className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50">
                                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" /> Link Google
                                                </button>
                                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                                    <input className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm font-bold" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                                                    <input className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm font-bold" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                                                    <button onClick={handleLinkEmail} className="w-full bg-brand-purple text-white font-bold text-sm py-3 rounded-lg shadow-pop-sm border-2 border-brand-text">Link Email</button>
                                                </div>
                                                {linkError && <p className="text-brand-coral text-xs font-bold text-center bg-brand-coral/10 p-2 rounded">{linkError}</p>}
                                                <button onClick={() => setShowLinkOptions(false)} className="text-xs w-full text-center font-bold text-gray-400 mt-2">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-3xl border-2 border-brand-text/10 shadow-sm text-center">
                                        <div className="text-5xl font-black text-brand-text">{userStats.gamesPlayed}</div>
                                        <div className="text-xs font-bold text-brand-text/40 uppercase tracking-wider mt-1">Games Played</div>
                                    </div>
                                    <div className="bg-white p-5 rounded-3xl border-2 border-brand-text/10 shadow-sm text-center">
                                        <div className="text-5xl font-black text-brand-teal">{userStats.wins}</div>
                                        <div className="text-xs font-bold text-brand-text/40 uppercase tracking-wider mt-1">Victories</div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border-2 border-brand-text/10 shadow-sm space-y-4">
                                        <div>
                                        <h3 className="text-xs font-black uppercase text-brand-text/40 mb-2 tracking-widest">The Vibe</h3>
                                        <p className="text-lg font-medium italic text-brand-text">"{userStats.personaDescription || "Just getting started."}"</p>
                                        </div>
                                        
                                        {userStats.scoutingReport && (
                                        <div className="pt-4 border-t-2 border-brand-text/5">
                                            <h3 className="text-xs font-black uppercase text-brand-text/40 mb-2 tracking-widest">Scouting Report</h3>
                                            <p className="text-sm font-mono text-brand-navy leading-relaxed bg-brand-background p-4 rounded-xl border border-brand-text/10">
                                                {userStats.scoutingReport}
                                            </p>
                                        </div>
                                        )}
                                </div>

                                {relationships.length > 0 && (
                                    <div className="bg-white p-6 rounded-3xl border-2 border-brand-text/10 shadow-sm">
                                        <h3 className="text-xs font-black uppercase text-brand-text/40 mb-4 tracking-widest">Known Associates</h3>
                                        <div className="space-y-3">
                                            {relationships.map(rel => (
                                                <div key={rel.playerId} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                                    <span className="font-bold text-brand-text text-base">{rel.playerName}</span>
                                                    <div className="flex gap-2 text-[10px] font-bold">
                                                        <span className="bg-brand-teal/20 text-brand-teal px-2 py-1 rounded">+{rel.winsWith} Wins</span>
                                                        <span className="bg-brand-coral/20 text-brand-coral px-2 py-1 rounded">Vs {rel.accusedByMe + rel.accusedMe}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-8 pt-4 border-t-2 border-brand-text/10 text-center pb-8">
                                    {!deleteConfirm ? (
                                        <button onClick={() => setDeleteConfirm(true)} className="text-xs font-bold text-brand-text/30 hover:text-brand-coral uppercase tracking-widest">
                                            Delete Account
                                        </button>
                                    ) : (
                                        <div className="bg-brand-coral text-white p-6 rounded-2xl space-y-4 animate-fadeIn shadow-pop">
                                            <p className="font-bold text-sm">Are you sure? This cannot be undone.</p>
                                            <div className="flex gap-3 justify-center">
                                                <button onClick={() => setDeleteConfirm(false)} className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-xs font-bold">Cancel</button>
                                                <button onClick={handleDelete} className="bg-white text-brand-coral px-6 py-3 rounded-xl text-xs font-bold shadow-sm">Confirm Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-fadeIn">
                                {userStats.moments && userStats.moments.length > 0 && (
                                        <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase text-brand-text/40 pl-1 tracking-widest">Highlights</h3>
                                        {userStats.moments.map(moment => (
                                            <div key={moment.id} className="bg-white p-5 rounded-3xl border-2 border-brand-text/10 shadow-sm flex gap-4 items-start">
                                                <div className="text-4xl shrink-0 pt-1">{moment.emoji}</div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase bg-brand-yellow px-2 py-0.5 rounded text-brand-text">{formatDate(moment.timestamp)}</span>
                                                        <span className="text-[10px] font-bold text-brand-text/40 uppercase tracking-wide">{moment.role === 'TONE_DEAF' ? 'As Outsider' : 'As Team'}</span>
                                                    </div>
                                                    <div className="font-black text-brand-text text-lg leading-tight mb-1">{moment.title}</div>
                                                    <div className="text-sm text-brand-text/70 leading-relaxed">{moment.summary}</div>
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-black uppercase text-brand-text/40 pl-1 tracking-widest">Award Collection</h3>
                                    {myAwards.length === 0 ? (
                                        <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-brand-text/10">
                                            <p className="text-brand-text/40 font-bold text-sm">No awards yet. Play a game!</p>
                                        </div>
                                    ) : (
                                        myAwards.map((item, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-2xl border-b border-brand-text/5 flex items-start gap-4 last:border-0 shadow-sm">
                                                <div className="bg-brand-background w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-brand-text/10 shrink-0">
                                                    {item.emoji || '👾'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <span className="font-black text-brand-text text-base truncate pr-2">{item.title}</span>
                                                        <span className="text-[10px] text-brand-text/40 font-bold shrink-0 pt-1">{formatDate(item.timestamp)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-brand-teal font-black uppercase tracking-wide mb-1">{item.topic || "Unknown Topic"}</div>
                                                    <div className="text-xs text-brand-text/60 font-medium leading-tight">{item.description}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};