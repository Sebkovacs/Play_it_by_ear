
// @ts-ignore
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, orderBy, limit, getDocs, 
  doc, updateDoc, deleteDoc, where, setDoc, onSnapshot, getDoc, runTransaction 
} from 'firebase/firestore';
// @ts-ignore
import { getAnalytics } from 'firebase/analytics';
// @ts-ignore
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { RoundHistory, Award, GameState, UserStats, PlayerRole, RelationshipStat, Moment, Player, GamePhase } from '../types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBwCAgXJnH26-A4NZ1kL8GuYxrT-uhsw-I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "play-it-by-ear-1fadd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "play-it-by-ear-1fadd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "play-it-by-ear-1fadd.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "421132676422",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:421132676422:web:0ed9cfc9b1b54f39584947",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-8FRS1LQYV2"
};

let db: any = null;
let analytics: any = null;
let auth: any = null;
let googleProvider: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  if (typeof window !== "undefined") {
    try { analytics = getAnalytics(app); } catch (err) { console.warn("Analytics failed:", err); }
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export const isFirebaseInitialized = () => !!auth;

const getMockUser = () => ({
    uid: 'mock-user-' + Date.now(),
    displayName: 'Demo User',
    email: 'demo@example.com',
    isAnonymous: false,
    isMock: true
});

// --- Helper: Clean Undefined Values ---
// Firestore rejects 'undefined' values. This helper strips them out (keys missing) or keeps 'null'.
const cleanData = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

// --- Auth Functions ---

export const signInWithGoogle = async () => {
  if (!auth) return getMockUser() as any;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') throw new Error("Login cancelled.");
    return getMockUser() as any;
  }
};

export const signInGuest = async () => {
  if (!auth) return { uid: 'guest-' + Date.now(), displayName: 'Guest', isAnonymous: true, isMock: true } as any;
  // If already signed in (even as guest), just return current user
  if (auth.currentUser) return auth.currentUser;
  
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    return { uid: 'guest-' + Date.now(), displayName: 'Guest (Offline)', isAnonymous: true, isMock: true } as any;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                const createResult = await createUserWithEmailAndPassword(auth, email, pass);
                return createResult.user;
            } catch(createErr) { throw createErr; }
        }
        throw error;
    }
};

// --- ACCOUNT LINKING (Upgrading Guest to Permanent) ---

export const linkGoogleAccount = async () => {
    if (!auth || !auth.currentUser) throw new Error("Not logged in");
    try {
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use') {
             throw new Error("That Google account is already used by another player.");
        }
        throw error;
    }
};

export const linkEmailAccount = async (email: string, pass: string) => {
    if (!auth || !auth.currentUser) throw new Error("Not logged in");
    try {
        const credential = EmailAuthProvider.credential(email, pass);
        const result = await linkWithCredential(auth.currentUser, credential);
        return result.user;
    } catch (error: any) {
         if (error.code === 'auth/credential-already-in-use') {
             throw new Error("That email is already associated with another account.");
        }
        throw error;
    }
};

export const registerWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return await createUserWithEmailAndPassword(auth, email, pass);
};

export const updateUserIdentity = async (newName: string) => {
    if (!auth || !auth.currentUser) throw new Error("Not logged in");
    await updateProfile(auth.currentUser, { displayName: newName });
    return auth.currentUser;
};

export const deleteUserAccount = async () => {
    if (!auth || !auth.currentUser) return;
    await deleteUser(auth.currentUser);
};

export const logout = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// --- Firestore: Game State Management ---

export const createGameRoom = async (roomCode: string, initialState: GameState) => {
    if (!db) throw new Error("Database not initialized");
    await setDoc(doc(db, "games", roomCode), cleanData({
        ...initialState,
        createdAt: Date.now()
    }));
};

/**
 * Handles leaving a game safely.
 * 1. Removes player from list.
 * 2. If player was Host, assigns new Host.
 * 3. If room is empty, deletes the room.
 */
export const leaveGameRoom = async (roomCode: string, playerId: string) => {
    if (!db || !roomCode || !playerId) return;
    const gameRef = doc(db, "games", roomCode);

    try {
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) return;

            const gameState = gameDoc.data() as GameState;
            const players = gameState.players || [];
            
            // Filter out the leaving player
            const remainingPlayers = players.filter(p => p.id !== playerId);

            if (remainingPlayers.length === 0) {
                // Room empty? Delete it.
                transaction.delete(gameRef);
            } else {
                // Check if the leaving player was the host
                const leavingPlayer = players.find(p => p.id === playerId);
                if (leavingPlayer && leavingPlayer.isHost) {
                    // Assign new host (first player in remaining list)
                    remainingPlayers[0].isHost = true;
                }
                
                // Update the doc
                transaction.update(gameRef, { 
                    players: remainingPlayers,
                    lastUpdated: Date.now()
                });
            }
        });
    } catch (e) {
        console.error("Error leaving game:", e);
    }
};

export const subscribeToGame = (roomCode: string, onUpdate: (data: GameState) => void) => {
    if (!db) return () => {};
    const unsub = onSnapshot(doc(db, "games", roomCode), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as GameState;
            // Ensure players is always an array
            if (!data.players) data.players = [];
            onUpdate(data);
        } else {
            // Document deleted (game closed)
            onUpdate({ 
                error: "Game room closed.", 
                players: [], 
                phase: GamePhase.ERROR,
                lastUpdated: Date.now(),
                scores: {}
            } as any);
        }
    });
    return unsub;
};

export const updateGameRoom = async (roomCode: string, newState: Partial<GameState>) => {
    if (!db) return;
    const gameRef = doc(db, "games", roomCode);
    await updateDoc(gameRef, cleanData({
        ...newState,
        lastUpdated: Date.now()
    }));
};

export const getGameRoom = async (roomCode: string) => {
    if (!db) return null;
    const docSnap = await getDoc(doc(db, "games", roomCode));
    if (docSnap.exists()) return docSnap.data() as GameState;
    return null;
};


// --- Firestore: User Stats Persistence (Senior Implementation) ---

export const getUserStats = async (uid: string): Promise<UserStats> => {
    if (!db || !uid) return { wins: 0, gamesPlayed: 0 };
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            return docSnap.data() as UserStats;
        }
        return { wins: 0, gamesPlayed: 0 };
    } catch (e) {
        console.error("Error fetching stats:", e);
        return { wins: 0, gamesPlayed: 0 };
    }
};

interface GameContext {
    won: boolean;
    teammates: string[];
    opponents: string[];
    accusedTargetId?: string | null;
    accusedByTargetId?: string | null;
    role: PlayerRole;
    playersMap: Record<string, string>; // ID -> Name
}

/**
 * Robust transactional update for Proposals 2 & 3.
 * Calculates Nemesis, Synergies, and basic stats.
 */
export const updateUserGameStats = async (uid: string, ctx: GameContext) => {
    if (!db || !uid) return;
    const userRef = doc(db, "users", uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            let stats: UserStats = userDoc.exists() ? (userDoc.data() as UserStats) : { wins: 0, gamesPlayed: 0 };

            // 1. Basic Stats
            stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
            if (ctx.won) stats.wins = (stats.wins || 0) + 1;

            // 2. Relationship Stats (Proposal 2)
            if (!stats.relationships) stats.relationships = {};
            
            // Process all players involved
            const allPlayers = [...ctx.teammates, ...ctx.opponents];
            allPlayers.forEach(otherId => {
                if (otherId === uid) return; // Skip self

                const otherName = ctx.playersMap[otherId] || "Unknown";
                
                // Initialize if missing
                if (!stats.relationships![otherId]) {
                    stats.relationships![otherId] = {
                        playerId: otherId,
                        playerName: otherName,
                        gamesPlayed: 0,
                        winsWith: 0,
                        accusedByMe: 0,
                        accusedMe: 0
                    };
                }

                const rel = stats.relationships![otherId];
                rel.gamesPlayed++;
                rel.playerName = otherName; // Update name in case it changed

                // Synergy (Won while teammates)
                if (ctx.won && ctx.teammates.includes(otherId)) {
                    rel.winsWith++;
                }

                // Nemesis (Accusations)
                if (ctx.accusedTargetId === otherId) {
                    rel.accusedByMe++;
                }
                if (ctx.accusedByTargetId === otherId) {
                    rel.accusedMe++;
                }
            });

            // Save back
            transaction.set(userRef, cleanData(stats), { merge: true });
        });
    } catch (e) {
        console.error("Stats Transaction Failed:", e);
    }
};

/**
 * Save a Moment Card (Proposal 3)
 */
export const saveMoment = async (uid: string, moment: Moment) => {
    if (!db || !uid) return;
    const userRef = doc(db, "users", uid);
    
    // We add it to the moments array using arrayUnion logic, but since we need to check duplicates
    // or limits, let's just do a transaction or direct update. Simple update for now.
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as UserStats;
            const moments = data.moments || [];
            // Prepend new moment, keep max 10
            const newMoments = [moment, ...moments].slice(0, 10);
            await updateDoc(userRef, cleanData({ moments: newMoments }));
        } else {
             await setDoc(userRef, cleanData({ moments: [moment] }), { merge: true });
        }
    } catch (e) {
        console.error("Error saving moment", e);
    }
};

// Deprecated simple increment
export const incrementUserStats = async (uid: string, didWin: boolean) => {
   // Use updateUserGameStats instead
};

export const updateUserProfile = async (uid: string, updates: Partial<UserStats>) => {
    if (!db || !uid) return;
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, cleanData(updates), { merge: true });
};

// --- Firestore: History & Awards (Existing) ---

export const saveGameToHistory = async (historyItem: RoundHistory) => {
  if (!db) return;
  await addDoc(collection(db, "game_history"), cleanData({ ...historyItem, timestamp: Date.now() }));
};

export const getGlobalHistory = async (): Promise<RoundHistory[]> => {
  if (!db) return [];
  const q = query(collection(db, "game_history"), orderBy("timestamp", "desc"), limit(5));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoundHistory));
};

export const saveUserAward = async (userId: string, award: Award, topic: string) => {
    if (!db || !userId) return;
    await addDoc(collection(db, `users/${userId}/awards`), cleanData({ ...award, topic, timestamp: Date.now() }));
};

export const getUserAwards = async (userId: string): Promise<any[]> => {
    if (!db || !userId) return [];
    const q = query(collection(db, `users/${userId}/awards`), orderBy("timestamp", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
};
