
import React, { useState } from 'react';
import { UserStats, Award } from '../../types';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { updateUserIdentity, deleteUserAccount } from '../../services/firebase';

interface ProfileViewProps {
  userStats: UserStats;
  playerTitle: string;
  myAwards: any[];
  currentName: string;
  onUpdateName: (name: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 17l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 56 56-28-27Z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200l40-40h160l40 40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>;

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    userStats, playerTitle, myAwards, currentName, onUpdateName, onLogout, onClose 
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview');
    const [newName, setNewName] = useState(currentName);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [error, setError] = useState('');

    const handleSaveName = async () => {
        try {
            await updateUserIdentity(newName);
            onUpdateName(newName);
            setIsEditing(false);
        } catch (e: any) {
            setError("Could not rename subject. " + e.message);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUserAccount();
            onClose(); // Close modal logic handled by App triggers usually, but Auth change will trigger global logout
            window.location.reload(); // Hard refresh to clear state
        } catch (e: any) {
            setError(e.message);
        }
    };

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });

    return (
        <div className="flex flex-col h-full bg-brand-background rounded-xl overflow-hidden w-full">
            {/* Header */}
            <div className="bg-white p-6 border-b-2 border-brand-darkBlue flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-brand-darkBlue rounded-full flex items-center justify-center border-4 border-brand-teal shadow-hard-sm">
                         <span className="text-3xl">👺</span>
                     </div>
                     <div>
                         {isEditing ? (
                             <div className="flex items-center gap-2">
                                 <input 
                                     value={newName} 
                                     onChange={(e) => setNewName(e.target.value)}
                                     className="border-b-2 border-brand-darkBlue bg-transparent font-black text-xl w-32 focus:outline-none"
                                     autoFocus
                                 />
                                 <button onClick={handleSaveName} className="text-xs bg-brand-teal px-2 py-1 rounded font-bold border border-brand-darkBlue">SAVE</button>
                             </div>
                         ) : (
                             <div className="flex items-center gap-2 group">
                                <h2 className="text-2xl font-black text-brand-darkBlue uppercase tracking-tighter">{currentName}</h2>
                                <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-navy hover:text-brand-orange">
                                    <EditIcon />
                                </button>
                             </div>
                         )}
                         <div className="bg-brand-orange text-brand-darkBlue text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit mt-1 border border-brand-darkBlue">
                             {playerTitle}
                         </div>
                     </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-brand-darkBlue bg-white">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors border-r-2 border-brand-darkBlue ${activeTab === 'overview' ? 'bg-brand-teal text-brand-darkBlue' : 'hover:bg-gray-50 text-brand-navy/50'}`}
                >
                    Rap Sheet
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors border-r-2 border-brand-darkBlue ${activeTab === 'history' ? 'bg-brand-yellow text-brand-darkBlue' : 'hover:bg-gray-50 text-brand-navy/50'}`}
                >
                    Prior Convictions
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'bg-brand-red text-white' : 'hover:bg-gray-50 text-brand-navy/50'}`}
                >
                    Identity Theft
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard-sm">
                            <h3 className="text-xs font-black uppercase text-brand-navy mb-4 border-b pb-2">Career Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-brand-darkBlue">{userStats.gamesPlayed}</div>
                                    <div className="text-[10px] font-bold text-brand-navy/50 uppercase">Games Played</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-brand-teal">{userStats.wins}</div>
                                    <div className="text-[10px] font-bold text-brand-navy/50 uppercase">Wins Scored</div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed border-brand-navy/20">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span>Win Rate</span>
                                    <span className="bg-brand-darkBlue text-white px-2 rounded">
                                        {userStats.gamesPlayed > 0 ? Math.round((userStats.wins / userStats.gamesPlayed) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {userStats.personaDescription && (
                            <div className="bg-brand-navy/5 p-4 rounded-xl border-2 border-dashed border-brand-navy/20">
                                <h3 className="text-xs font-black uppercase text-brand-navy mb-2">Psych Eval</h3>
                                <p className="text-sm font-medium italic text-brand-darkBlue/80">"{userStats.personaDescription}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fadeIn">
                        <h3 className="text-xs font-black uppercase text-brand-navy mb-2 pl-1">Recent Incidents</h3>
                        {myAwards.length === 0 ? (
                            <div className="text-center p-8 opacity-50 font-bold italic text-sm">No criminal record found.</div>
                        ) : (
                            myAwards.map((item, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border-2 border-brand-darkBlue shadow-sm flex items-start gap-3">
                                    <div className="bg-brand-background p-2 rounded border border-brand-darkBlue text-xl">
                                        {item.emoji || '🎲'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className="font-black text-brand-darkBlue text-sm">{item.topic || "Unknown Mission"}</span>
                                            <span className="text-[10px] font-bold bg-brand-navy/10 px-1.5 py-0.5 rounded text-brand-navy/60">
                                                {formatDate(item.timestamp)}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-brand-teal mt-0.5 uppercase tracking-wide">{item.title}</div>
                                        <div className="text-xs text-brand-navy/70 mt-1 leading-snug">"{item.description}"</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white p-4 rounded-xl border-2 border-brand-darkBlue shadow-hard-sm">
                            <h3 className="text-xs font-black uppercase text-brand-navy mb-4">Edit Credentials</h3>
                            <InputField 
                                label="Codename" 
                                value={newName} 
                                onChange={(e) => setNewName(e.target.value)} 
                            />
                            <div className="mt-4 flex justify-end">
                                <Button onClick={handleSaveName} disabled={newName === currentName}>Update Papers</Button>
                            </div>
                        </div>

                        <div className="bg-brand-red/5 p-4 rounded-xl border-2 border-brand-red border-dashed">
                            <h3 className="text-xs font-black uppercase text-brand-red mb-2 flex items-center gap-2">
                                <TrashIcon /> Danger Zone
                            </h3>
                            <p className="text-xs font-bold text-brand-red/70 mb-4">
                                Entering Witness Protection will burn your stats and awards forever. This cannot be undone.
                            </p>
                            
                            {!deleteConfirm ? (
                                <Button 
                                    variant="outlined" 
                                    onClick={() => setDeleteConfirm(true)}
                                    className="border-brand-red text-brand-red hover:bg-brand-red hover:text-white"
                                    fullWidth
                                >
                                    Burn Identity (Delete Account)
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-center font-black text-brand-red text-sm">ARE YOU SURE?</p>
                                    <div className="flex gap-2">
                                        <Button variant="text" onClick={() => setDeleteConfirm(false)} fullWidth>Cancel</Button>
                                        <Button onClick={handleDelete} className="bg-brand-red text-white" fullWidth>YES, DO IT</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-brand-red text-white text-xs font-bold rounded text-center border-2 border-brand-darkBlue">
                        Error: {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t-2 border-brand-darkBlue">
                 <Button fullWidth variant="tonal" onClick={onLogout}>Sign Out (Run Away)</Button>
            </div>
        </div>
    );
};
