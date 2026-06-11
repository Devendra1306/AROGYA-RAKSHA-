import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyABPyLpgK7sd1j_1v9p04I5JbeMdkpPpOE",
  authDomain: "arogya-raksha-4af7e.firebaseapp.com",
  projectId: "arogya-raksha-4af7e",
  storageBucket: "arogya-raksha-4af7e.firebasestorage.app",
  messagingSenderId: "789347248411",
  appId: "1:789347248411:web:89dceea66513098d3d4bbe",
  measurementId: "G-D9QGG2TJQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
// Request profiles and email
googleProvider.addScope('profile');
googleProvider.addScope('email');
// Force account selection popup (optional but recommended for clear user choice)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
