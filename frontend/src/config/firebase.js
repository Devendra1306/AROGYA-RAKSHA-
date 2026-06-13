import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyABPyLpgK7sd1j_1v9p04I5JbeMdkpPpOE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "arogya-raksha-4af7e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "arogya-raksha-4af7e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "arogya-raksha-4af7e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "789347248411",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:789347248411:web:89dceea66513098d3d4bbe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D9QGG2TJQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// Force account selection popup (optional but recommended for clear user choice)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
