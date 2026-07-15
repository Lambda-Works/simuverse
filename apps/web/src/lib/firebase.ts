import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  return getAuth(firebaseApp);
}

export const googleProvider = new GoogleAuthProvider();

export async function firebaseEmailLogin(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseGoogleLogin() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured');
  return signInWithPopup(auth, googleProvider);
}

export async function firebaseLogout() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}

export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}

export function onFirebaseAuthChanged(cb: (user: FirebaseUser | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, cb);
}
