
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
  const [mode, setMode] = useState<'menu' | 'join' | 'create'>('menu');

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      const user = await signInWithGoogle();
      if (user) {
        setMyName(user.displayName || "Party Animal");
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

  if (!isLoggedIn) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full min-h-[80vh]">
          {/* Hero Section */}
          <div className="w-full mb-10 flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-yellow rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="w-28 h-28 bg-brand-purple rounded-3xl rotate-3 border-4 border-brand-text shadow-pop mb-6 flex items-center justify-center relative z-10">
                    <span className="text-6xl">👂</span>
                </div>
            </div>
            <h1 className="text-6xl font-display font-black text-brand-text tracking-tight mb-2">Play It By Ear</h1>
            <p className="text-brand-text/60 font-bold text-lg max-w-[240px]">
                The social deduction game about hilarious misunderstandings.
            </p>
          </div>

           <div className="w-full space-y-4 animate-fadeIn">
               
               {/* OPTION 1: PLAY AS GUEST */}
               {!showEmailForm && (
                   <button 
                       onClick={handleGuestLogin} 
                       className="w-full h-20 bg-brand-yellow text-brand-text rounded-3xl border-3 border-brand-text shadow-pop hover:shadow-pop-lg hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-pop flex items-center justify-center gap-3 group"
                   >
                       <span className="text-3xl group-hover:scale-110 transition-transform">🚀</span>
                       <span className="font-display font-black text-2xl uppercase tracking-wide">Play as Guest</span>
                   </button>
               )}

               {/* SEPARATOR */}
               {!showEmailForm && (
                   <div className="relative py-2 text-center">
                       <span className="bg-brand-background px-4 text-brand-text/40 font-black uppercase text-xs tracking-widest relative z-10">Or Log In to Save Stats</span>
                       <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-brand-text/10"></div></div>
                   </div>
               )}

               {!showEmailForm ? (
                   <div className="grid grid-cols-2 gap-3">
                       {/* OPTION 2: GOOGLE */}
                       <button onClick={handleGoogleLogin} className="h-16 bg-white border-2 border-brand-text rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-all text-brand-text font-bold shadow-pop-sm active:translate-y-[1px] active:shadow-none">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                            <span className="text-xs uppercase tracking-wide">Google</span>
                       </button>

                       {/* OPTION 3: EMAIL */}
                       <button onClick={() => setShowEmailForm(true)} className="h-16 bg-white border-2 border-brand-text rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-all text-brand-text font-bold shadow-pop-sm active:translate-y-[1px] active:shadow-none">
                            <span className="text-xl leading-none">📧</span>
                            <span className="text-xs uppercase tracking-wide">Email</span>
                       </button>
                   </div>
               ) : (
                   <div className="bg-white p-6 rounded-3xl border-3 border-brand-text shadow-pop animate-slideUp">
                       <div className="flex items-center justify-between mb-4">
                           <h3 className="font-black uppercase text-brand-text">Email Login</h3>
                           <button onClick={() => setShowEmailForm(false)} className="text-xs font-bold text-brand-navy/50 hover:text-brand-navy">BACK</button>
                       </div>
                       
                       <div className="space-y-3 pt-2">
                           <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                           <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                           {authError && <p className="text-xs text-brand-coral font-bold bg-brand-coral/10 p-2 rounded">{authError}</p>}
                           <div className="flex gap-2 pt-2">
                               <Button variant="text" onClick={() => setShowEmailForm(false)} className="flex-1">Cancel</Button>
                               <Button onClick={handleEmailLogin} className="flex-1" variant="success">Log In</Button>
                           </div>
                       </div>
                   </div>
               )}
           </div>
        </div>
      );
  }

  // LOGGED IN VIEW
  return (
    <div className="flex-1 flex flex-col items-center p-6 max-w-md mx-auto w-full min-h-[80vh] animate-fadeIn">
      
      {/* Mini Profile Header */}
      <div className="w-full flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border-2 border-brand-text shadow-sm">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-teal rounded-full border-2 border-brand-text flex items-center justify-center text-lg font-bold text-brand-text">
                  {myName.charAt(0)}
              </div>
              <div>
                  <div className="text-[10px] font-black uppercase text-brand-text/40 tracking-widest">Logged in as</div>
                  <div className="font-bold text-brand-text leading-none">{myName}</div>
              </div>
          </div>
      </div>

      <div className="w-full flex-1 flex flex-col justify-center space-y-6">
          {mode === 'menu' && (
              <>
                <button 
                    onClick={() => setMode('create')}
                    className="w-full h-32 bg-brand-purple text-white rounded-3xl border-3 border-brand-text shadow-pop hover:shadow-pop-lg hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-pop flex flex-col items-center justify-center gap-2 group"
                >
                    <span className="text-4xl group-hover:scale-110 transition-transform">🎉</span>
                    <span className="font-display font-black text-2xl uppercase tracking-wide">Start Party</span>
                    <span className="text-xs font-bold opacity-80 bg-black/20 px-3 py-1 rounded-full">I am the Host</span>
                </button>

                <button 
                    onClick={() => setMode('join')}
                    className="w-full h-32 bg-brand-teal text-brand-text rounded-3xl border-3 border-brand-text shadow-pop hover:shadow-pop-lg hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-pop flex flex-col items-center justify-center gap-2 group"
                >
                    <span className="text-4xl group-hover:scale-110 transition-transform">👋</span>
                    <span className="font-display font-black text-2xl uppercase tracking-wide">Join Party</span>
                    <span className="text-xs font-bold opacity-80 bg-white/40 px-3 py-1 rounded-full">I have a Code</span>
                </button>
              </>
          )}

          {mode === 'join' && (
              <div className="w-full bg-white p-6 rounded-3xl border-3 border-brand-text shadow-pop space-y-4 animate-slideUp">
                  <div className="flex items-center justify-between">
                      <h3 className="font-black uppercase text-brand-text text-xl">Join Game</h3>
                      <button onClick={() => setMode('menu')} className="text-xs font-bold text-brand-navy/50 hover:text-brand-navy">BACK</button>
                  </div>
                  
                  <InputField 
                    label="Nickname" 
                    value={myName} 
                    onChange={(e) => setMyName(e.target.value)}
                  />
                  
                  <div className="pt-2">
                      <label className="text-xs font-black uppercase tracking-widest text-brand-darkBlue ml-1 mb-2 block">Room Code</label>
                      <input 
                        className="w-full h-20 text-center text-4xl font-display font-black tracking-widest uppercase rounded-xl border-3 border-brand-text focus:outline-none focus:border-brand-purple placeholder:text-gray-200"
                        placeholder="ABCD"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={4}
                        autoFocus
                      />
                  </div>

                  <Button 
                    fullWidth 
                    variant="success"
                    onClick={onJoinGame}
                    disabled={!joinCode || !myName.trim()}
                  >
                    ENTER ROOM
                  </Button>
              </div>
          )}

          {mode === 'create' && (
              <div className="w-full bg-white p-6 rounded-3xl border-3 border-brand-text shadow-pop space-y-4 animate-slideUp">
                  <div className="flex items-center justify-between">
                      <h3 className="font-black uppercase text-brand-text text-xl">Host Game</h3>
                      <button onClick={() => setMode('menu')} className="text-xs font-bold text-brand-navy/50 hover:text-brand-navy">BACK</button>
                  </div>

                  <div className="bg-brand-background p-4 rounded-xl border-2 border-brand-text/10 text-center mb-4">
                      <span className="text-4xl block mb-2">👑</span>
                      <p className="text-sm font-bold text-brand-navy/70">You will control the game settings and flow.</p>
                  </div>
                  
                  <InputField 
                    label="Your Nickname" 
                    value={myName} 
                    onChange={(e) => setMyName(e.target.value)}
                    autoFocus
                  />

                  <Button 
                    fullWidth 
                    variant="success"
                    onClick={onCreateGame}
                    disabled={!myName.trim()}
                  >
                    CREATE LOBBY
                  </Button>
              </div>
          )}
      </div>

      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-4 bg-brand-coral text-white border-3 border-brand-text shadow-pop rounded-xl text-sm text-center font-bold animate-bounce-slight z-50">
          {error}
        </div>
      )}
    </div>
  );
};
