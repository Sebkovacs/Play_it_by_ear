// @ts-ignore -- Suppress "Module has no exported member" error due to potential type definition mismatch
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { RoundHistory, Award } from '../types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let db: any = null;
let analytics: any = null;
let auth: any = null;
let googleProvider: any = null;

// Helper to check if essential config is present
const hasValidConfig = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey.length > 0 && 
  !firebaseConfig.apiKey.includes("undefined");

if (hasValidConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Analytics check
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
    }
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
  console.warn("Firebase configuration missing or incomplete. Running in offline/demo mode.");
}

// Export a check so the UI knows if it can use Auth
export const isFirebaseInitialized = () => !!auth;

// --- Auth Functions ---

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase not configured");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign In Error", error);
    throw error;
  }
};

export const signInGuest = async () => {
  if (!auth) return null;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Guest Sign In Error", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error: any) {
        // Simple retry with create if not found (lazy auth)
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                const createResult = await createUserWithEmailAndPassword(auth, email, pass);
                return createResult.user;
            } catch(createErr) {
                 throw createErr;
            }
        }
        throw error;
    }
};

export const registerWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return await createUserWithEmailAndPassword(auth, email, pass);
};

export const logout = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    // If no auth, we never fire a user event, app handles manual fallback
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- Firestore Functions ---

/**
 * Saves a completed game round to the global history.
 */
export const saveGameToHistory = async (historyItem: RoundHistory) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "game_history"), {
      ...historyItem,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error saving game to history:", e);
  }
};

/**
 * Fetches the last 5 games played globally.
 */
export const getGlobalHistory = async (): Promise<RoundHistory[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "game_history"), orderBy("timestamp", "desc"), limit(5));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    } as RoundHistory));
  } catch (e) {
    console.error("Error fetching global history:", e);
    return [];
  }
};

/**
 * Saves an award to a user's personal collection.
 */
export const saveUserAward = async (userId: string, award: Award, topic: string) => {
    if (!db || !userId) return;
    try {
        await addDoc(collection(db, `users/${userId}/awards`), {
            ...award,
            topic,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Error saving user award:", e);
    }
};

/**
 * Gets a user's earned awards.
 */
export const getUserAwards = async (userId: string): Promise<any[]> => {
    if (!db || !userId) return [];
    try {
        const q = query(collection(db, `users/${userId}/awards`), orderBy("timestamp", "desc"), limit(20));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    } catch (e) {
        console.error("Error fetching user awards:", e);
        return [];
    }
};