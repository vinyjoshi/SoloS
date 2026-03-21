import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// --- FIREBASE INSTANCES ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- APP CONFIG ---
export const APP_ID = 'solos-web';

// --- EMPTY DAY STATE ---
export const emptyDayState = {
  top3: [
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
  ],
  schedule: {},
  expenses: [],
  brainDump: '',
  journal: '',
};

// --- TOAST ANIMATION ---
export const ensureHeaderToastStyles = () => {
  if (document.getElementById('header-toast-styles')) return;
  const style = document.createElement('style');
  style.id = 'header-toast-styles';
  style.innerHTML = `
    @keyframes headerToast {
      0%   { transform: translate(-50%, -12px); opacity: 0; }
      12%  { transform: translate(-50%, 0); opacity: 1; }
      80%  { transform: translate(-50%, 0); opacity: 1; }
      100% { transform: translate(-50%, -12px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
};