import React, { useState } from 'react';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { RoundHistory } from '../../types';
import { signInWithGoogle, signInGuest, signInWithEmail, isFirebaseInitialized } from '../../services/firebase';

interface LandingViewProps {
  myName: string;
  setMyName: (name: string) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  onCreateGame: () => void;
  onJoinGame: () => void;
  globalHistory: RoundHistory[];
  error: string | null;
  isLoggedIn: boolean;
  onManualLogin: () => void; // Fallback for offline mode
}

const HistoryIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm.5-55q144 0 244.5-100.5T825.5-480q0-144-100.5-244.5T480.5-825q-144 0-244.5 100.5T135.5-480q0 144 100.5 244.5T480.5-135ZM480-480Z"/><path d="M495-266h-50v-237l186-111 25 43-161 96v209Z"/></svg>
);

export const LandingView: React.FC<LandingViewProps> = ({
  myName,
  setMyName,
  joinCode,
  setJoinCode,
  onCreateGame,
  onJoinGame,
  globalHistory,
  error,
  isLoggedIn,
  onManualLogin
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleGoogleLogin = async () => {
    if (!isFirebaseInitialized()) {
        alert("Firebase not configured. Please use Guest mode.");
        return;
    }
    try {
      const user = await signInWithGoogle();
      if (user && user.displayName) {
        setMyName(user.displayName);
      }
    } catch (e) {
      console.error(e);
      setAuthError("Google Login Failed");
    }
  };

  const handleGuestLogin = async () => {
    // If Firebase is not configured, manually trigger logged-in state
    if (!isFirebaseInitialized()) {
        console.log("Firebase missing, bypassing auth...");
        onManualLogin();
        return;
    }

    try {
      await signInGuest();
      // Keep name empty so they can type it
    } catch (e) {
      console.error("Guest login failed, falling back to offline", e);
      onManualLogin();
    }
  };

  const handleEmailLogin = async () => {
      setAuthError('');
      if (!isFirebaseInitialized()) {
          setAuthError("Online services unavailable.");
          return;
      }
      if (!email || !password) {
          setAuthError("Please enter email and password");
          return;
      }
      try {
          const user = await signInWithEmail(email, password);
          if (user && user.displayName) setMyName(user.displayName);
      } catch (e: any) {
          if (e.code === 'auth/invalid-credential') {
             setAuthError("Invalid email or password.");
          } else {
             setAuthError("Login failed: " + e.message);
          }
      }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
      {/* Logo Area */}
      <div className="w-full mb-8 flex flex-col items-center justify-center min-h-[160px]">
        <img 
          src="/logo_full.png" 
          alt="It By Ear" 
          className="w-full max-w-[280px] object-contain drop-shadow-sm"
        />
        <p className="text-brand-navy/60 font-medium mt-3 text-sm tracking-wide">The Official Game of Unpreparedness.</p>
      </div>

      {!isLoggedIn ? (
        <div className="w-full space-y-4">
           <div className="text-center mb-6">
             <h2 className="text-xl font-bold text-brand-darkBlue">Login to Play</h2>
             <p className="text-sm text-brand-navy/50">Save your stats and awards.</p>
           </div>
           
           <button onClick={handleGoogleLogin} className="w-full h-12 bg-white border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors text-gray-700 font-medium shadow-sm">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
             Continue with Google
           </button>
           
           {!showEmailForm ? (
                <button onClick={() => setShowEmailForm(true)} className="w-full h-12 bg-brand-navy/5 border border-brand-navy/10 rounded-xl flex items-center justify-center gap-2 font-medium text-brand-navy hover:bg-brand-navy/10 transition-colors">
                    ✉️ Sign in with Email
                </button>
           ) : (
               <div className="bg-white p-4 rounded-xl border border-brand-navy/10 space-y-3 animate-fadeIn">
                   <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white" />
                   <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white" />
                   {authError && <p className="text-xs text-red-500">{authError}</p>}
                   <div className="flex gap-2">
                       <Button variant="text" onClick={() => setShowEmailForm(false)} className="flex-1">Cancel</Button>
                       <Button onClick={handleEmailLogin} className="flex-1">Login / Register</Button>
                   </div>
               </div>
           )}

           <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-navy/10"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-brand-background px-2 text-brand-navy/40 font-bold">Or</span></div>
           </div>

           <Button onClick={handleGuestLogin} variant="tonal" fullWidth className="h-12">
             Play as Guest
           </Button>
        </div>
      ) : (
        <>
          {/* Create Section */}
          <div className="w-full bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-white/50 shadow-sm space-y-6 animate-fadeIn">
            <InputField 
              label="Your Name" 
              value={myName} 
              onChange={(e) => setMyName(e.target.value)}
              className="bg-white/50"
            />
            <Button 
                onClick={onCreateGame} 
                fullWidth 
                className="h-12 text-base font-bold bg-brand-darkBlue text-white hover:bg-brand-navy"
                disabled={!myName.trim()}
            >
              Create New Game
            </Button>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 my-6">
            <div className="h-px bg-brand-navy/10 flex-1"></div>
            <span className="text-[10px] font-bold tracking-widest text-brand-navy/40 uppercase">Or Join Existing</span>
            <div className="h-px bg-brand-navy/10 flex-1"></div>
          </div>

          {/* Join Section */}
          <div className="w-full flex gap-3 animate-fadeIn">
            <div className="flex-1">
              <input 
                className="w-full h-12 px-4 rounded-xl bg-m3-surfaceVariant/50 border-2 border-transparent focus:border-brand-teal focus:outline-none text-center font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans transition-all text-brand-darkBlue font-bold"
                placeholder="Room Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={4}
              />
            </div>
            <button 
              onClick={onJoinGame} 
              className="h-12 px-6 rounded-xl bg-brand-teal/20 text-brand-darkBlue font-bold hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50"
              disabled={!joinCode || !myName.trim()}
            >
              Join
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-brand-orange rounded-xl text-sm text-center mt-4 w-full animate-fadeIn">
          {error}
        </div>
      )}
      
      {globalHistory.length > 0 && (
        <div className="w-full mt-12 opacity-50">
          <div className="flex items-center gap-2 mb-2 justify-center text-brand-navy">
            <HistoryIcon />
            <h3 className="text-xs uppercase font-bold tracking-wider">Recently Played</h3>
          </div>
          <div className="space-y-2">
            {globalHistory.slice(0, 2).map(h => (
              <div key={h.id} className="text-xs bg-white/50 p-2 rounded-lg flex justify-between items-center text-brand-navy/70">
                <span className="truncate max-w-[200px]">{h.topic}</span>
                <span className="text-[10px] opacity-70">{h.winner}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};