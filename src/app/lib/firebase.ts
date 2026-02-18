import { initializeApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const fallbackConfig = {
  apiKey: 'AIzaSyAVpoZjLMygOgF6VU9rzt7e7XK2zhxCvtI',
  authDomain: 'normalizacija-1f71b.firebaseapp.com',
  projectId: 'normalizacija-1f71b',
  storageBucket: 'normalizacija-1f71b.appspot.com',
  messagingSenderId: '750075683245',
  appId: '1:750075683245:web:74f7ba1bafc7980da24124',
  measurementId: 'G-63H4QSFLTT',
} as const;

function env(name: string, fallback?: string): string | undefined {
  const value = import.meta.env[name];
  if (value) {
    return value as string;
  }
  return fallback;
}

function normalizeStorageBucket(bucket?: string): string | undefined {
  if (!bucket) {
    return bucket;
  }

  // Firebase Storage SDK expects the actual GCS bucket name (usually *.appspot.com).
  if (bucket.endsWith('.firebasestorage.app')) {
    return bucket.replace('.firebasestorage.app', '.appspot.com');
  }

  return bucket;
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY', fallbackConfig.apiKey),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN', fallbackConfig.authDomain),
  projectId: env('VITE_FIREBASE_PROJECT_ID', fallbackConfig.projectId),
  storageBucket: normalizeStorageBucket(
    env('VITE_FIREBASE_STORAGE_BUCKET', fallbackConfig.storageBucket),
  ),
  messagingSenderId: env(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    fallbackConfig.messagingSenderId,
  ),
  appId: env('VITE_FIREBASE_APP_ID', fallbackConfig.appId),
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID', fallbackConfig.measurementId),
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
