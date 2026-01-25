
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';
import LoginPage from './components/LoginPage';
import { PricingModal } from './components/PricingModal';
import { Tracker } from './components/Tracker';
import { SecondBrainPanel } from './components/SecondBrain';
import { User, Menu, DollarSign, LogOut } from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

const googleProvider = new GoogleAuthProvider();

export default function SoloS() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [headerHeight, setHeaderHeight] = useState(80);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState(null);

  const profileMenuRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (showPricing) {
      setIsMenuOpen(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showPricing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'artifacts', 'solos-web', 'users', u.uid, 'settings', 'profile');
        
        try {
          const docSnapshot = await getDoc(userRef);
          
          if (!docSnapshot.exists()) {
            await setDoc(userRef, {
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              uid: u.uid,
              tier: 'free',
              createdAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error('Error checking/creating user profile:', error);
        }
        
        const unsubscribeProfile = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data();
            
            if (profileData.tier === 'pro' && profileData.expiresAt) {
              const expirationDate = profileData.expiresAt.toDate();
              const now = new Date();
              
              if (now > expirationDate) {
                console.log('Your Pro subscription has expired. Downgrading to free.');
                try {
                  await setDoc(userRef, { tier: 'free', expiredAt: serverTimestamp() }, { merge: true });
                  setUserTier('free');
                } catch (error) {
                  console.error('Error downgrading expired user:', error);
                }
                return;
              }
            }
            
            setUserTier(profileData.tier || 'free');
            if (profileData.tier === 'pro' && profileData.expiresAt) {
              setProExpiresAt(profileData.expiresAt.toDate());
            } else {
              setProExpiresAt(null);
            }

          } else {
             console.log("User profile document does not exist in the database.");
          }
        });
        setLoading(false);
        return () => unsubscribeProfile();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height || 80);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDemoMode = async () => {
    try {
      await signInAnonymously(auth);
      setIsDemoMode(true);
    } catch (error) {
      console.error('Guest mode failed:', error);
    }
  };
  
  const handleLogin = async () => {
    try { 
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
    } catch (e) { 
      console.error("Login failed", e);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono animate-pulse">BOOTING KERNEL...</div>;

  if (!user) return <LoginPage onLogin={handleLogin} onDemoMode={handleDemoMode} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden app-container max-w-5xl mx-auto">
      
      {isDemoMode && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Guest MODE • Data will be lost on logout</span>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
          > Exit
          </button>
        </div>
      )}

      {showPricing && (
        <PricingModal 
            onClose={() => setShowPricing(false)} 
            headerOffset={headerHeight}
            user={user}
            db={db}
            setUserTier={setUserTier}
        />
      )}

      <header ref={headerRef} data-header="main" className="relative overflow-visibleborder-b border-white/5 flex justify-center items-center sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md">
        <div className="w-full max-w-5xl px-4 md:px-6 py-1 flex justify-between items-center">
            <div className="flex items-center gap-1">
                <div className="w-13 h-12 bg-black text-black rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-white/15">
                <img src="/SolOS.png" alt="SolOS" className="w-full h-full object-cover rounded-full"/>
                </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-3 pl-4 border-l border-white/10 relative" ref={profileMenuRef}>
                   <div className="hidden md:block text-right">
                      <div className="text-xs font-medium text-white">{user.displayName}</div>
                      <div className="text-[9px] text-zinc-500">{user.email}</div>
                   </div>
                   <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="relative group focus:outline-none">
                      {user.photoURL && !imageError ? (
                        <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" onError={() => setImageError(true)} className="w-8 h-8 rounded-full border border-white/10 group-hover:border-white/30 transition-colors object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors"><User size={14} /></div>
                      )}
                   </button>
                   {showProfileMenu && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-4 py-3 bg-zinc-800/50 border-b border-white/10">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Current Plan</div>
                            <div className="flex items-center gap-2">
                              {isDemoMode ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                  <span className="text-sm font-bold text-emerald-400">Guest Mode</span>
                                </> 
                              ) : userTier === 'pro' ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-bold text-emerald-400">SolOS Pro</span>
                                  </div>
                                  {proExpiresAt && (
                                    <div className="text-[9px] text-zinc-500 ml-4">
                                      Expires: {proExpiresAt.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                                  <span className="text-sm font-bold text-zinc-400">Free Plan</span>
                                </> 
                              )}
                            </div>
                          </div>
                        
                        {!isDemoMode && userTier === 'free' && (
                          <button 
                            onClick={() => { setShowPricing(true); setShowProfileMenu(false); }} 
                            className="w-full text-left px-4 py-3 text-xs text-emerald-400 hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-white/5"
                          >
                            <DollarSign size={14} /> Upgrade to Pro
                          </button>
                        )}
                        
                        <button 
                          onClick={() => signOut(auth)} 
                          className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} /> Log Out
                        </button>
                      </div>
                    )}
                </div>
                <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
                <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><Menu size={24} /></button>
            </div>
        </div>
      </header>

      <div className={`${isMenuOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <Tracker user={user} db={db} userTier={userTier} setShowPricing={setShowPricing} />
      </div>
      
      <SecondBrainPanel 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={user} 
        db={db} 
        appId="solos-web"
        setShowPricing={setShowPricing} 
        userTier={userTier} 
      />
    </div>
  );
}
