import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyByv5ASBuMGUZVEXme6_7xhODcxQkYteAA",
  authDomain: "solos-26e4a.firebaseapp.com",
  projectId: "solos-26e4a",
  storageBucket: "solos-26e4a.firebasestorage.app",
  messagingSenderId: "872913065542",
  appId: "1:872913065542:web:c2abaf02de01eb8dc01c47",
  measurementId: "G-YYQ5K0RKK8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const APP_ID = 'solos-web';

export const emptyDayState = {
  top3: [
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false },
    { text: '', done: false }
  ],
  schedule: {},
  expenses: [],
  brainDump: '',
  journal: ''
};

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
