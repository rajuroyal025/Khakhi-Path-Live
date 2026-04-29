import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, getDocFromServer, serverTimestamp, increment, deleteDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection
async function testConnection() {
  try {
    // Try to read a public collection instead of a specific document that might not exist
    const testRef = collection(db, 'dailyTests');
    const q = query(testRef, limit(1));
    await getDocs(q);
    console.log("Firestore connection successful.");
  } catch (error) {
    console.error("Firestore Connection Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Missing or insufficient permissions')) {
      console.error("Permission denied. Please ensure your firestore.rules allow public read for 'dailyTests'.");
    } else if (errorMessage.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.error("If you are seeing 404 errors, your Firebase project or database ID might be invalid. Consider re-running the Firebase setup.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, signInWithPopup, onAuthStateChanged, signOut, serverTimestamp, increment, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser, deleteDoc, writeBatch };
export type { User };
