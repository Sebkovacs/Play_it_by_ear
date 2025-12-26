
// @ts-ignore -- Suppress "Module has no exported member" error due to potential type definition mismatch
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
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
  AuthError
} from 'firebase/auth';
import { RoundHistory, Award } from '../types';

// Updated configuration from user request
const firebaseConfig = {
  apiKey: "AIzaSyBwCAgXJnH26-A4NZ1kL8GuYxrT-uhsw-I",
  authDomain: "play-it-by-ear-1fadd.firebaseapp.com",
  projectId: "play-it-by-ear-1fadd",
  storageBucket: "play-it-by-ear-1fadd.firebasestorage.app",
  messagingSenderId: "421132676422",
  appId: "1:421132676422:web:0ed9cfc9b1b54f39584947",
  measurementId: "G-8FRS1LQYV2"
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
  
  // Analytics check (only in browser)
  if (typeof window !== "undefined") {
    try {
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn("Analytics failed to load (ad blocker?):", err);
    }
  }
  console.log("Firebase initialized successfully with provided config");
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// Export a check so the UI knows if it can use Auth
export const isFirebaseInitialized = () => !!auth;

// Helper for Mock User (Fallback)
const getMockUser = () => ({
    uid: 'mock-user-' + Date.now(),
    displayName: 'Demo User',
    email: 'demo@example.com',
    isAnonymous: false,
    isMock: true // Flag to identify this as a local fallback
});

// --- Auth Functions ---

export const signInWithGoogle = async () => {
  if (!auth) {
      console.warn("Firebase Auth not initialized. Using Mock Login.");
      return getMockUser() as any;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign In Error Details:", error);
    
    // Check for common configuration errors that block development
    const isDomainError = error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain');
    const isConfigError = error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found';

    if (isDomainError || isConfigError) {
       const msg = `Login Note: Your current domain is not authorized in Firebase Console.\n\nSwitching to OFFLINE DEMO MODE so you can play immediately!`;
       console.warn(msg);
       // Alert the user so they know why "real" login didn't happen, but then proceed
       alert(msg);
       return getMockUser() as any;
    }
    
    // Throw other real errors (like popup closed by user)
    throw error;
  }
};

export const signInGuest = async () => {
  if (!auth) {
      // Fallback for guest if auth fails completely
      return {
          uid: 'guest-' + Date.now(),
          displayName: 'Guest',
          isAnonymous: true,
          isMock: true
      } as any;
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Guest Sign In Error", error);
    // If anonymous auth is disabled in console, fall back to mock
    return {
        uid: 'guest-' + Date.now(),
        displayName: 'Guest (Offline)',
        isAnonymous: true,
        isMock: true
    } as any;
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

export const updateUserIdentity = async (newName: string) => {
    if (!auth || !auth.currentUser) throw new Error("Not logged in");
    try {
        await updateProfile(auth.currentUser, { displayName: newName });
        return auth.currentUser;
    } catch (e) {
        console.error("Update profile failed:", e);
        throw e;
    }
};

export const deleteUserAccount = async () => {
    if (!auth || !auth.currentUser) return;
    try {
        // Delete Firestore Data (Awards) - Clean up logic
        if (db) {
            const userId = auth.currentUser.uid;
            // Note: Deleting collections from client is tricky in Firestore without a cloud function,
            // but we can try to delete what we can.
            // For now, we will rely on just deleting the Auth user, data becomes orphaned (acceptable for MVP).
        }
        await deleteUser(auth.currentUser);
    } catch (e: any) {
        console.error("Delete account failed:", e);
        if (e.code === 'auth/requires-recent-login') {
            throw new Error("Security Check: You must log out and log back in before you can burn your identity.");
        }
        throw e;
    }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch(e) {
      console.warn("Sign out error (ignoring if mock):", e);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
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
        const q = query(collection(db, `users/${userId}/awards`), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    } catch (e) {
        console.error("Error fetching user awards:", e);
        return [];
    }
};
