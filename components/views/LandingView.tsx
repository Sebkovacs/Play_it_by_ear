
import React, { useState } from 'react';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { signInWithGoogle, signInGuest, signInWithEmail, isFirebaseInitialized } from '../../services/firebase';

interface LandingViewProps {
  myName: string;
  setMyName: (name: string) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  onCreateGame: () => void;
  onJoinGame: () => void;
  error: string | null;
  isLoggedIn: boolean;
  onManualLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  myName,
  setMyName,
  joinCode,
  setJoinCode,
  onCreateGame,
  onJoinGame,
  error,
  isLoggedIn,
  onManualLogin
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      const user = await signInWithGoogle();
      if (user) {
        setMyName(user.displayName || "Player");
        if ((user as any).isMock || !isFirebaseInitialized()) {
            onManualLogin(); 
        }
      }
    } catch (e: any) {
      console.error(e);
      setAuthError("Login Failed: " + (e.message || "Unknown Error"));
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInGuest();
      onManualLogin();
    } catch (e) {
      console.error("Guest login failed", e);
      onManualLogin();
    }
  };

  const handleEmailLogin = async () => {
      setAuthError('');
      if (!isFirebaseInitialized()) {
          setAuthError("Service unavailable (Demo Mode).");
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
      <div className="w-full mb-8 flex flex-col items-center justify-center min-h-[180px]">
        <img 
          src="/logo_small.png" 
          alt="Play it by Ear!" 
          className="w-full max-w-[280px] object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
        />
        <h1 className="text-3xl font-black text-brand-darkBlue tracking-tighter mt-4 uppercase hidden">Play it by Ear!</h1>
        <p className="text-brand-darkBlue font-bold mt-2 text-md tracking-widest uppercase text-center">Social. Fun. Delightfully Deceptive.</p>
      </div>

      {!isLoggedIn ? (
        <div className="w-full space-y-4">
           <div className="text-center mb-6">
             <h2 className="text-xl font-black text-brand-darkBlue uppercase tracking-wide">Who Are You?</h2>
             <p className="text-sm text-brand-navy/60 font-medium">Log in to track your reputation.</p>
           </div>
           
           <button onClick={handleGoogleLogin} className="w-full h-14 bg-white border-2 border-brand-darkBlue rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all text-brand-darkBlue font-bold shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
             Continue with Google
           </button>
           
           {!showEmailForm ? (
                <button onClick={() => setShowEmailForm(true)} className="w-full h-12 bg-transparent border-2 border-brand-navy/10 rounded-xl flex items-center justify-center gap-2 font-bold text-brand-navy hover:bg-brand-navy/5 transition-colors">
                    ✉️ Sign in with Email
                </button>
           ) : (
               <div className="bg-white p-4 rounded-xl border-2 border-brand-navy/10 space-y-3 animate-fadeIn shadow-lg">
                   <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white" />
                   <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white" />
                   {authError && <p className="text-xs text-brand-red font-bold">{authError}</p>}
                   <div className="flex gap-2">
                       <Button variant="text" onClick={() => setShowEmailForm(false)} className="flex-1">Cancel</Button>
                       <Button onClick={handleEmailLogin} className="flex-1">Login</Button>
                   </div>
               </div>
           )}

           <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t-2 border-brand-navy/10"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-brand-background px-2 text-brand-navy/40 font-black tracking-widest">Or</span></div>
           </div>

           <Button onClick={handleGuestLogin} variant="tonal" fullWidth className="h-14 text-base">
             Play as Guest (No Stats)
           </Button>
        </div>
      ) : (
        <>
          <div className="w-full bg-white p-6 rounded-3xl border-2 border-brand-darkBlue shadow-hard space-y-6 animate-fadeIn">
            <InputField 
              label="Codename" 
              value={myName} 
              onChange={(e) => setMyName(e.target.value)}
              className="bg-brand-background"
            />
            <Button 
                onClick={onCreateGame} 
                fullWidth 
                className="h-14 text-lg bg-brand-darkBlue text-white hover:bg-brand-navy"
                disabled={!myName.trim()}
            >
              Start New Game
            </Button>
          </div>

          <div className="w-full flex items-center gap-4 my-6">
            <div className="h-[2px] bg-brand-navy/10 flex-1"></div>
            <span className="text-[10px] font-black tracking-widest text-brand-navy/40 uppercase">Or Join</span>
            <div className="h-[2px] bg-brand-navy/10 flex-1"></div>
          </div>

          <div className="w-full flex gap-3 animate-fadeIn">
            <div className="flex-1">
              <input 
                className="w-full h-14 px-4 rounded-xl bg-white border-2 border-brand-darkBlue focus:shadow-hard focus:outline-none text-center font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans transition-all text-brand-darkBlue font-black text-xl"
                placeholder="CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={4}
              />
            </div>
            <button 
              onClick={onJoinGame} 
              className="h-14 px-6 rounded-xl bg-brand-teal text-brand-darkBlue border-2 border-brand-darkBlue shadow-hard hover:shadow-hard-lg font-black hover:bg-brand-lime transition-all disabled:opacity-50 disabled:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              disabled={!joinCode || !myName.trim()}
            >
              JOIN
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="p-4 bg-brand-red text-white border-2 border-brand-darkBlue shadow-hard rounded-xl text-sm text-center mt-4 w-full animate-bounce font-bold">
          {error}
        </div>
      )}
    </div>
  );
};
