import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if config is valid (not placeholders and not empty)
export const isFirebaseConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  firebaseConfig.apiKey.length > 10 &&
  !!firebaseConfig.appId &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId;

// Initialize Firebase with a fallback to avoid crashing if config is invalid
// but still provide a database object that won't throw immediately on 'ref()'
const app = (isFirebaseConfigured || getApps().length > 0) 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : initializeApp({
      apiKey: "dummy-key",
      authDomain: "dummy.firebaseapp.com",
      projectId: "dummy-project",
      storageBucket: "dummy.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:0000000000000000000000"
    });

// Export database and auth
export const database = getDatabase(app);
export const auth = getAuth(app);

// Analytics is disabled to prevent "Installations: Create Installation request failed" errors
// which occur when invalid/placeholder keys are used with the Analytics SDK.
export const analytics = null;
