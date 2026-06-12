import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface CloudBackupPayload {
  id: string;
  customers: any[];
  settings: any;
  backup_date: string;
  timestamp: string;
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error during Google Sign-In popup:', error);
    throw error;
  }
}

/**
 * Sign out of Google Account
 */
export async function logoutFromGoogle(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error during sign-out:', error);
    throw error;
  }
}

/**
 * Save data to cloud backup in firestore multiple history items
 */
export async function saveBackupToCloud(userId: string, email: string, customers: any[], settings: any): Promise<string> {
  try {
    if (!userId) {
      throw new Error("Missing userId for cloud backup");
    }
    const backupDateStr = new Date().toLocaleString('ar-YE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const timestampIso = new Date().toISOString();
    const backupId = `bkp_${Date.now()}`;
    const docRef = doc(db, 'backups', userId, 'history', backupId);
    
    await setDoc(docRef, {
      userId,
      email,
      customers,
      settings,
      backup_date: backupDateStr,
      timestamp: timestampIso
    });

    // Also update a pointer doc for quick latest retrieval
    const pointerRef = doc(db, 'backups', userId);
    await setDoc(pointerRef, {
      last_backup_date: backupDateStr,
      last_backup_id: backupId,
      email,
      updatedAt: timestampIso
    }, { merge: true });

    return backupDateStr;
  } catch (error: any) {
    console.error('Error saving cloud backup:', error);
    throw error;
  }
}

/**
 * Fetch backup history list
 */
export async function fetchBackupHistoryFromCloud(userId: string): Promise<CloudBackupPayload[]> {
  try {
    if (!userId) {
      return [];
    }
    const historyRef = collection(db, 'backups', userId, 'history');
    const q = query(historyRef, limit(20)); // Removed orderBy to prevent "Firestore requires an index" error
    const querySnapshot = await getDocs(q);
    
    let backups: CloudBackupPayload[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      backups.push({
        id: d.id,
        customers: data.customers || [],
        settings: data.settings || {},
        backup_date: data.backup_date || 'غير محدد',
        timestamp: data.timestamp || ''
      });
    });

    // Client-side sort by timestamp descending
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // If no history found, try fetching legacy backup structure
    if (backups.length === 0) {
      const docRef = doc(db, 'backups', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
         const data = docSnap.data();
         if (data.customers || data.settings) {
            backups.push({
              id: 'legacy',
              customers: data.customers || [],
              settings: data.settings || {},
              backup_date: data.backup_date || 'نسخة سابقة متوفرة',
              timestamp: data.updatedAt || ''
            });
         }
      }
    }

    return backups;
  } catch (error: any) {
    console.error('Error fetching backup history:', error);
    throw error;
  }
}

/**
 * Restore specific database backup from firestore
 */
export async function fetchBackupFromCloud(userId: string, backupId?: string): Promise<CloudBackupPayload | null> {
  try {
    if (!userId) return null;

    if (backupId === 'legacy') {
        const docRef = doc(db, 'backups', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: 'legacy',
            customers: data.customers || [],
            settings: data.settings || {},
            backup_date: data.backup_date,
            timestamp: data.updatedAt
          };
        }
    }

    if (backupId) {
      const docRef = doc(db, 'backups', userId, 'history', backupId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          customers: data.customers || [],
          settings: data.settings || {},
          backup_date: data.backup_date,
          timestamp: data.timestamp
        };
      }
    }
    
    // Fallback to fetch latest if no backupId provided
    const h = await fetchBackupHistoryFromCloud(userId);
    if (h.length > 0) return h[0];
    return null;
  } catch (error) {
    throw error;
  }
}
