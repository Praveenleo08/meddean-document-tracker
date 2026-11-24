/**
 * Firebase Client SDK Configuration
 * Authentication Only (Email/Password) - No Firestore or Firebase Storage used.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAznLPW0zj-tFuo-Gxgljhzz0cLbVQU-GM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "meddean-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "meddean-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "meddean-tracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "714480037560",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:714480037560:web:df3e5008c8ab25081e4e4d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
