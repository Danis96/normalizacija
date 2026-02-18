import { initializeApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAVpoZjLMygOgF6VU9rzt7e7XK2zhxCvtI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'normalizacija-1f71b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'normalizacija-1f71b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'normalizacija-1f71b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '750075683245',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:750075683245:web:74f7ba1bafc7980da24124',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-63H4QSFLTT',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(firebaseApp);
  } catch {
    analytics = null;
  }
}

export { analytics };
