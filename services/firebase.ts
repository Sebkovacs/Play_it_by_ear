import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { RoundHistory } from '../types';

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

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  analytics = getAnalytics(app);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

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