import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from "@vercel/analytics/react"
import { 
  CheckCircle, Circle, Trash2, Plus, DollarSign, Brain, BookOpen, 
  Calendar as CalendarIcon, Target, ChevronLeft, ChevronRight, 
  Moon, Sun, LogOut, Layout, Shield, Clock, Hash, AlignLeft,
  ChevronDown, ChevronUp, Layers, Menu, X, Folder, FileText,
  Briefcase, Globe, Archive, Save, Tag, Loader2, ArrowRight,
  FolderInput, RotateCcw, AlertTriangle, Play, Settings, User, MoreVertical, Lock, CreditCard
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDocs 
} from 'firebase/firestore';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyByv5ASBuMGUZVEXme6_7xhODcxQkYteAA",
  authDomain: "solos-26e4a.firebaseapp.com",
  projectId: "solos-26e4a",
  storageBucket: "solos-26e4a.firebasestorage.app",
  messagingSenderId: "872913065542",
  appId: "1:872913065542:web:c2abaf02de01eb8dc01c47",
  measurementId: "G-YYQ5K0RKK8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appId = 'solos-web'; 

// --- FREEMIUM LIMITS ---
const TIER_LIMITS = {
  free: {
    projects: 5,
    areas: 5,
    resources: 20,
    archives: Infinity, // Unlimited
    history: 'current_week' // Only see this week
  },
  pro: {
    projects: Infinity,
    areas: Infinity,
    resources: Infinity,
    archives: Infinity,
    history: 'unlimited'
  }
};

// --- UTILS ---
const generateDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// Get the Monday of the current week (for locking logic)
const getStartOfCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // adjust when day is sunday
  // Simple fix for Sunday start vs Monday start preference - defaulting to Sunday start for timeline view consistency
  return new Date(d.setDate(diff));
};

const emptyDayState = {
  top3: [
    { text: '', done: false }, 
    { text: '', done: false }, 
    { text: '', done: false }
  ],
  schedule: {},
  expenses: [], 
  brainDump: '',
  journal: ''
};

// --- COMPONENT: LOGIN PAGE ---
const LoginPage = ({ onLogin }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
      <img src="/SolOS.png" alt="SolOS Logo" className="w-full h-full object-cover"/>
    </div>
    <h1 className="text-4xl md:text-6xl font-bold text-zinc-600 mb-6 tracking-tight">
      Sol<span className="text-white">OS</span>
    </h1>
    <p className="text-zinc-400 max-w-md mb-12 text-lg leading-relaxed">
      The ruthlessly minimalist OS for founders. 
      Capture your thoughts, prioritize your day, track expenses, and reflect — all in one place.
    </p>
    
    <button 
      onClick={onLogin}
      className="group relative flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all duration-200 active:scale-95"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Sign in with Google
    </button>
    <div className="mt-8 text-xs text-zinc-600 font-mono">V2.2 • SECURE • ENCRYPTED</div>
  </div>
);

// --- COMPONENT: PRICING MODAL ---
const PricingModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors z-10">
        <X size={20} />
      </button>
      
      <div className="grid md:grid-cols-2">
        {/* Left: Value Prop */}
        <div className="p-8 md:p-12 bg-zinc-900 flex flex-col justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20">
                <Shield className="text-black" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Unlock Your Potential.</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
                SoloS Free is designed for starters. SoloS Pro is designed for finishers. 
                Unlock unlimited history, unlimited projects, and secure your focus.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
                <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Unlimited History</li>
                <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Unlimited Projects & Areas</li>
                <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500"/> Priority Support</li>
            </ul>
        </div>

        {/* Right: Pricing Options */}
        <div className="p-8 md:p-12 flex flex-col gap-4">
            <h3 className="text-lg font-medium text-white mb-2">Choose your commitment</h3>
            
            <button className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex justify-between items-center group">
                <div>
                    <div className="font-bold text-white group-hover:text-emerald-400">Weekly Grind</div>
                    <div className="text-xs text-zinc-500">Perfect for sprints</div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">$1.50</div>
                    <div className="text-[10px] text-zinc-500">/ week</div>
                </div>
            </button>

            <button className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-900/10 relative text-left flex justify-between items-center">
                <div className="absolute -top-3 left-4 px-2 bg-emerald-500 text-black text-[10px] font-bold rounded-full">POPULAR</div>
                <div>
                    <div className="font-bold text-white">Monthly Focus</div>
                    <div className="text-xs text-zinc-400">Standard plan</div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">$5.00</div>
                    <div className="text-[10px] text-zinc-500">/ month</div>
                </div>
            </button>

            <button className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex justify-between items-center group">
                <div>
                    <div className="font-bold text-white group-hover:text-emerald-400">Yearly Commit</div>
                    <div className="text-xs text-zinc-500">Save 16%</div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">$50.00</div>
                    <div className="text-[10px] text-zinc-500">/ year</div>
                </div>
            </button>

            <button className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all text-left flex justify-between items-center group mt-4">
                <div>
                    <div className="font-bold text-white group-hover:text-purple-400">Founder Mode</div>
                    <div className="text-xs text-zinc-500">One-time payment</div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">$99.00</div>
                    <div className="text-[10px] text-zinc-500">lifetime</div>
                </div>
            </button>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENT: MAIN APP ---
export default function SoloS() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayData, setDayData] = useState(emptyDayState);
  const [synced, setSynced] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [routineConfig, setRoutineConfig] = useState({ start: 6, end: 23 }); 
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPricing, setShowPricing] = useState(false); // Paywall State
  const [userTier, setUserTier] = useState('free'); // 'free' or 'pro'

  const profileMenuRef = useRef(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateKey = generateDateKey(currentDate);

  // --- GATEKEEPER LOGIC ---
  const isDateLocked = () => {
      if (userTier === 'pro') return false;
      
      const startOfWeek = getStartOfCurrentWeek();
      const checkDate = new Date(currentDate);
      checkDate.setHours(0,0,0,0);
      
      // If date is before this week's Monday, LOCK IT.
      return checkDate < startOfWeek;
  };
  
  const isLocked = isDateLocked();

  // Data Sync
  useEffect(() => {
    if (!user) return;
    
    // If locked, don't fetch data, just reset state (or keep empty)
    if (isLocked) {
        setDayData(emptyDayState);
        return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'days', dateKey);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let safeTop3 = data.top3 || emptyDayState.top3;
        if (safeTop3.length > 0 && typeof safeTop3[0] === 'string') {
            safeTop3 = safeTop3.map(text => ({ text, done: false }));
        }
        setDayData({ ...emptyDayState, ...data, top3: safeTop3 });
      } else {
        setDayData(emptyDayState);
      }
      setSynced(true);
    }, (error) => console.error("Sync error:", error));

    return () => unsubscribe();
  }, [user, dateKey, isLocked]);

  // Monthly Aggregator
  useEffect(() => {
      if (!user) return;
      const fetchMonthlyBurn = async () => {
          const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'days');
          try {
             const snapshot = await getDocs(colRef); 
             let total = 0;
             const currentMonthPrefix = dateKey.substring(0, 7); 
             snapshot.forEach(doc => {
                 if (doc.id.startsWith(currentMonthPrefix)) {
                     const exps = doc.data().expenses || [];
                     total += exps.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                 }
             });
             setMonthlyTotal(total);
          } catch (e) { console.error(e); }
      };
      fetchMonthlyBurn();
  }, [user, currentDate, dayData.expenses]);

  const handleLogin = async () => {
    try { 
      await signInWithPopup(auth, googleProvider);
    } catch (e) { 
      console.error("Login failed", e);
      if (e.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`⚠️ DOMAIN NOT AUTHORIZED ⚠️\n\nGo to Firebase Console -> Authentication -> Settings -> Authorized Domains.\n\nAdd this domain: ${domain}`);
      } else if (e.code !== 'auth/popup-closed-by-user') {
        alert(`Login error: ${e.message}`);
      }
    }
  };

  const saveData = async (newData) => {
    if (isLocked) return; // Prevention
    setDayData(newData);
    setSynced(false);
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'days', dateKey);
      await setDoc(docRef, newData);
      setSynced(true);
    } catch (e) { console.error("Save failed", e); }
  };

  const updateField = (field, value) => {
    saveData({ ...dayData, [field]: value });
  };

  // derived state
  const top3Completed = dayData.top3.filter(t => t.done).length;
  const top3Summary = <div className={`text-[10px] font-bold tracking-widest ${top3Completed === 3 ? 'text-emerald-400' : 'text-zinc-500'}`}>[{top3Completed}/3 DONE]</div>;
  const dailyBurn = dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const burnSummary = <div className="flex gap-2 text-[10px] font-mono text-zinc-500"><span>DAY: <span className="text-zinc-300">${dailyBurn.toFixed(0)}</span></span><span className="text-zinc-700">|</span><span>MO: <span className="text-zinc-300">${monthlyTotal.toFixed(0)}</span></span></div>;

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono animate-pulse">BOOTING KERNEL...</div>;

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}

      <header className="border-b border-white/5 flex justify-center items-center sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md">
        <div className="w-full max-w-5xl px-4 md:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-white/5">
                <img src="/SolOS.png" alt="SolOS Logo" className="w-full h-full object-cover"/>
                </div>
                <div className="hidden md:block">
                  <h1 className="font-bold text-[33px] text-zinc-600 tracking-tight leading-none">
                    Sol<span className="text-white">OS</span>
                  </h1>
                </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                    <div className={`w-1.5 h-1.5 rounded-full ${synced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    {synced ? 'Synced' : 'Saving'}
                </div>
                
                {/* User Profile / Logout */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/10 relative" ref={profileMenuRef}>
                   <div className="hidden md:block text-right">
                      <div className="text-xs font-medium text-white">{user.displayName}</div>
                      <div className="text-[9px] text-zinc-500">{user.email}</div>
                   </div>
                   <button 
                      onClick={() => setShowProfileMenu(!showProfileMenu)} 
                      className="relative group focus:outline-none"
                   >
                      {user.photoURL && !imageError ? (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          referrerPolicy="no-referrer"
                          onError={() => setImageError(true)}
                          className="w-8 h-8 rounded-full border border-white/10 group-hover:border-white/30 transition-colors object-cover" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                           <User size={14} />
                        </div>
                      )}
                   </button>

                   {/* Profile Dropdown */}
                   {showProfileMenu && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                          <button 
                            onClick={() => { setShowPricing(true); setShowProfileMenu(false); }}
                            className="w-full text-left px-4 py-3 text-xs text-emerald-400 hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-white/5"
                          >
                            <DollarSign size={14} /> Upgrade Plan
                          </button>
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
                
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                    <Menu size={24} />
                </button>
            </div>
        </div>
      </header>

      <main className={`p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-20 transition-all duration-300 ${isMenuOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <TimelineWidget currentDate={currentDate} setCurrentDate={setCurrentDate} />
        
        {isLocked ? (
            <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden group cursor-pointer" onClick={() => setShowPricing(true)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50"></div>
                <Lock size={48} className="text-zinc-600 mb-4 z-10 group-hover:text-emerald-500 transition-colors" />
                <h3 className="text-xl font-bold text-white z-10">History Locked</h3>
                <p className="text-zinc-500 text-sm mt-2 z-10">Upgrade to Pro to access past data.</p>
                <button className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-sm transition-colors z-10">
                    Unlock History
                </button>
            </div>
        ) : (
            <>
                <CollapsibleSection title="Brain Dump (Inbox)" icon={Brain} defaultOpen={true}>
                    <TextWidget value={dayData.brainDump} onChange={(val) => updateField('brainDump', val)} placeholder="Capture phase. Dump raw thoughts here. Refactor into Docs later." minHeight="h-48"/>
                </CollapsibleSection>
                <CollapsibleSection title="Top Priorities" icon={Target} defaultOpen={true} summary={top3Summary}>
                    <Top3Widget top3={dayData.top3} onUpdate={(val) => updateField('top3', val)} />
                </CollapsibleSection>
                <CollapsibleSection title="Routine" icon={Clock} defaultOpen={false}>
                    <RoutineWidget schedule={dayData.schedule} onUpdate={(val) => updateField('schedule', val)} config={routineConfig} setConfig={setRoutineConfig}/>
                </CollapsibleSection>
                <CollapsibleSection title="Burn Rate" icon={DollarSign} defaultOpen={false} summary={burnSummary}>
                    <ExpenseWidget expenses={dayData.expenses} onUpdate={(val) => updateField('expenses', val)} />
                </CollapsibleSection>
                <CollapsibleSection title="Reflection" icon={BookOpen} defaultOpen={false}>
                    <TextWidget value={dayData.journal} onChange={(val) => updateField('journal', val)} placeholder="Distill today's lessons." minHeight="h-48"/>
                </CollapsibleSection>
            </>
        )}
      </main>

      <SecondBrainPanel isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} appId={appId} db={db} setShowPricing={setShowPricing} userTier={userTier} />
      <Analytics />
    </div>
  );
}

// --- SUB COMPONENTS ---

const SecondBrainPanel = ({ isOpen, onClose, user, appId, db, setShowPricing, userTier }) => {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); 
  const [movingDocId, setMovingDocId] = useState(null); 
  const [confirmActionId, setConfirmActionId] = useState(null); 

  useEffect(() => {
    if (!user || !isOpen) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'docs'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocs(docsData);
    });
    return () => unsubscribe();
  }, [user, isOpen, appId, db]);

  const handleCreateDoc = async (category) => {
    // --- LIMIT CHECK ---
    if (userTier === 'free') {
        const count = docs.filter(d => d.category === category).length;
        const limits = { projects: 5, areas: 5, resources: 20 };
        // Archives usually unlimited
        if (limits[category] && count >= limits[category]) {
            setShowPricing(true);
            return;
        }
    }

    const newDoc = {
      title: 'Untitled Document',
      body: '',
      category: category,
      tags: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'docs'), newDoc);
    setSelectedDoc({ id: docRef.id, ...newDoc }); 
  };

  const handleMoveDoc = async (docId, newCategory) => {
     try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { 
            category: newCategory, 
            updatedAt: serverTimestamp() 
        });
        setMovingDocId(null); 
     } catch (e) { console.error(e); }
  };

  const handleSoftDelete = async (docId, e) => {
    e.stopPropagation();
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
      await updateDoc(docRef, { category: 'trash', updatedAt: serverTimestamp() });
    } catch (err) { console.error(err); }
  };

  const handleHardDelete = async (docId, e) => {
    e.stopPropagation();
    if (confirmActionId === docId) {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId));
        } catch (err) { console.error(err); }
        setConfirmActionId(null);
    } else {
        setConfirmActionId(docId);
        setTimeout(() => setConfirmActionId(null), 3000);
    }
  };

  const handleRestore = async (docId, e) => {
      e.stopPropagation();
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { category: 'projects', updatedAt: serverTimestamp() });
      } catch (err) { console.error(err); }
  };

  const renderDocList = (category) => {
    const categoryDocs = docs.filter(d => d.category === category);
    return (
      <div className="space-y-2 mt-2 pb-2">
        {categoryDocs.length === 0 && (
          <div className="text-center py-4 text-xs text-zinc-600 border border-dashed border-white/5 rounded-lg">
            No items in {category}.
          </div>
        )}
        {categoryDocs.map(doc => (
          <div 
            key={doc.id}
            className={`
              relative w-full bg-zinc-800/30 border border-white/5 rounded-lg overflow-hidden transition-all duration-300
              ${movingDocId === doc.id ? 'bg-zinc-800 border-zinc-600' : 'hover:bg-zinc-800 hover:border-white/10'}
            `}
          >
            {/* Main Row */}
            <div className="flex items-center justify-between p-1">
                <button 
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="flex-1 min-w-0 p-3 text-left z-0"
                >
                  <div className={`text-sm font-medium truncate ${category === 'trash' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>{doc.title || "Untitled"}</div>
                  <div className="flex items-center gap-2 mt-1">
                     {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1">
                          {doc.tags.map((tag, i) => (
                            <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">{tag}</span>
                          ))}
                        </div>
                     )}
                     <div className="text-[9px] text-zinc-600 font-mono">
                        {doc.updatedAt?.toDate ? doc.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                     </div>
                  </div>
                </button>

                <div className="flex items-center pr-2 gap-1">
                    {category === 'trash' ? (
                        <>
                            <button 
                                type="button"
                                onClick={(e) => handleRestore(doc.id, e)} 
                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                                title="Restore"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => handleHardDelete(doc.id, e)} 
                                className={`
                                    flex items-center justify-center transition-all duration-200 rounded
                                    ${confirmActionId === doc.id ? 'w-20 bg-red-600 text-white' : 'w-8 p-2 text-red-500 hover:bg-red-500/10'}
                                `}
                                title="Delete Permanently"
                            >
                                {confirmActionId === doc.id ? <span className="text-[10px] font-bold">CONFIRM</span> : <Trash2 size={16} />}
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMovingDocId(movingDocId === doc.id ? null : doc.id);
                                }}
                                className={`p-2 rounded transition-colors ${movingDocId === doc.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                title="Move"
                            >
                                <FolderInput size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => handleSoftDelete(doc.id, e)} 
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Move to Trash"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Inline Move Menu */}
            {movingDocId === doc.id && (
                <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                    {['projects','areas','resources','archives'].map(cat => (
                        cat !== category && (
                            <button key={cat} onClick={() => handleMoveDoc(doc.id, cat)} className="text-xs bg-black/40 hover:bg-zinc-700 text-zinc-400 hover:text-white py-2 rounded border border-white/5 capitalize">
                                {cat}
                            </button>
                        )
                    ))}
                </div>
            )}
          </div>
        ))}
        {category !== 'archives' && category !== 'trash' && (
            <button 
                type="button"
                onClick={() => handleCreateDoc(category)}
                className="w-full py-2 mt-2 text-xs font-medium text-zinc-500 hover:text-white border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                <Plus size={12} /> Add {category.slice(0, -1)}
            </button>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-900 border-l border-white/10 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-2">
           <Layers className="text-white" size={20} />
           <span className="font-bold text-white tracking-tight">Second Brain</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {selectedDoc ? (
          <DocEditor docData={selectedDoc} onBack={() => setSelectedDoc(null)} user={user} appId={appId} db={db} />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <CollapsibleSection title="Projects" icon={Briefcase} defaultOpen={true}>{renderDocList('projects')}</CollapsibleSection>
            <CollapsibleSection title="Areas" icon={Layout} defaultOpen={false}>{renderDocList('areas')}</CollapsibleSection>
            <CollapsibleSection title="Resources" icon={Globe} defaultOpen={false}>{renderDocList('resources')}</CollapsibleSection>
            <CollapsibleSection title="Archives" icon={Archive} defaultOpen={false}>{renderDocList('archives')}</CollapsibleSection>
            <div className="mt-8 pt-4 border-t border-white/5">
                <CollapsibleSection title="Trash" icon={Trash2} defaultOpen={false}>{renderDocList('trash')}</CollapsibleSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DocEditor = ({ docData, onBack, user, appId, db }) => {
  const [title, setTitle] = useState(docData.title);
  const [body, setBody] = useState(docData.body);
  const [category, setCategory] = useState(docData.category);
  const [tags, setTags] = useState(docData.tags ? docData.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const docTags = docData.tags || [];
    
    if (title === docData.title && body === docData.body && category === docData.category && JSON.stringify(tagsArray) === JSON.stringify(docTags)) return;

    setSaving(true);
    timeoutRef.current = setTimeout(async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docData.id);
      await updateDoc(docRef, { title, body, category, tags: tagsArray, updatedAt: serverTimestamp() });
      setSaving(false);
    }, 1000); 

    return () => clearTimeout(timeoutRef.current);
  }, [title, body, tags, category, appId, db, user.uid, docData]);

  const handleSoftDelete = async () => {
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docData.id);
        await updateDoc(docRef, { category: 'trash' });
        onBack();
    } catch(e) { console.error(e); }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-4">
             <div className="text-[10px] font-mono text-zinc-500 uppercase">{saving ? 'Saving...' : 'Saved'}</div>
             <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-zinc-800 text-xs text-zinc-300 border border-white/10 rounded px-2 py-1 outline-none focus:border-white/30"
             >
                 <option value="projects">Projects</option>
                 <option value="areas">Areas</option>
                 <option value="resources">Resources</option>
                 <option value="archives">Archives</option>
                 <option value="trash">Trash</option>
             </select>
             <button onClick={handleSoftDelete} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Document"
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-zinc-700 border-none outline-none mb-4"
        />
        <div className="flex items-center gap-2 mb-6">
            <Tag size={14} className="text-zinc-500" />
            <input 
              type="text" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags (e.g. Health, Q1 Goal)..."
              className="flex-1 bg-transparent text-xs text-emerald-400 placeholder-zinc-700 border-none outline-none font-mono"
            />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start typing..."
          className="w-full h-[calc(100%-150px)] bg-transparent text-sm leading-relaxed text-zinc-300 placeholder-zinc-800 border-none outline-none resize-none"
        />
      </div>
    </div>
  );
};

// --- SHARED WIDGETS ---

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, summary }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-zinc-400" />
          <span className="font-medium text-zinc-200 text-sm tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-3">
            {!isOpen && summary}
            {isOpen ? <ChevronUp size={16} className="text-zinc-500"/> : <ChevronDown size={16} className="text-zinc-500"/>}
        </div>
      </button>
      
      {isOpen && (
        <div className="border-t border-white/5 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const TimelineWidget = ({ currentDate, setCurrentDate }) => {
  const [view, setView] = useState('weekly'); 
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const renderContent = () => {
    if (view === 'daily') {
       return (
         <div className="flex items-center justify-between py-4">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={20}/></button>
            <div className="text-center">
              <div className="text-xl font-bold text-white tracking-tight">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
                {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight size={20}/></button>
         </div>
       );
    }
    if (view === 'weekly') {
      const startOfWeek = getStartOfWeek(currentDate);
      const weekDays = Array.from({length: 7}, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
      });
      return (
        <div className="grid grid-cols-7 gap-1 py-2">
          {weekDays.map(d => {
             const isSelected = generateDateKey(d) === generateDateKey(currentDate);
             const isToday = generateDateKey(d) === generateDateKey(new Date());
             return (
               <button 
                 key={d} 
                 onClick={() => setCurrentDate(d)}
                 className={`flex flex-col items-center p-2 rounded-lg transition-all ${isSelected ? 'bg-white text-black' : 'hover:bg-white/5 text-zinc-500'}`}
               >
                 <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0,1)}</span>
                 <span className={`text-sm font-bold ${isToday && !isSelected ? 'text-emerald-500' : ''}`}>{d.getDate()}</span>
               </button>
             )
          })}
        </div>
      );
    }
    if (view === 'monthly') {
       const daysInMonth = getDaysInMonth(year, month);
       const firstDay = getFirstDayOfMonth(year, month);
       return (
         <div className="py-2">
            <div className="flex justify-between items-center mb-4 px-2">
               <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d)}}><ChevronLeft size={16}/></button>
               <span className="text-xs font-mono">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric'})}</span>
               <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d)}}><ChevronRight size={16}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
               {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`}/>)}
               {Array.from({length: daysInMonth}, (_, i) => {
                  const d = new Date(year, month, i+1);
                  const isSelected = generateDateKey(d) === generateDateKey(currentDate);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setCurrentDate(d)}
                      className={`h-7 w-7 mx-auto flex items-center justify-center rounded text-xs ${isSelected ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {i + 1}
                    </button>
                  )
               })}
            </div>
         </div>
       )
    }
  };

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex justify-center gap-1 bg-zinc-950/50 p-1 rounded-lg mb-4 w-fit mx-auto border border-white/5">
        {['daily', 'weekly', 'monthly'].map(m => (
          <button 
            key={m}
            onClick={() => setView(m)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${view === m ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {m}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

const RoutineWidget = ({ schedule, onUpdate, config, setConfig }) => {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = Array.from({ length: (config.end - config.start + 1) }, (_, i) => {
    const h = i + config.start;
    return h < 10 ? `0${h}:00` : `${h}:00`;
  });

  const handleChange = (time, value) => {
    onUpdate({ ...schedule, [time]: value });
  };

  const getCurrentTask = () => {
      const key = currentHour < 10 ? `0${currentHour}:00` : `${currentHour}:00`;
      return schedule[key] || null;
  };

  const currentTask = getCurrentTask();

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                {isConfiguring ? 'Configure Day Range' : 'Schedule'}
            </div>
            <button onClick={() => setIsConfiguring(!isConfiguring)} className="text-zinc-500 hover:text-white p-1">
                <Settings size={14} />
            </button>
        </div>

        {isConfiguring ? (
            <div className="bg-zinc-950/50 p-4 rounded-lg border border-white/10 space-y-4 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Start Hour</span>
                    <input 
                        type="number" 
                        min="0" max="23" 
                        value={config.start} 
                        onChange={(e) => setConfig({...config, start: parseInt(e.target.value)})}
                        className="w-16 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">End Hour</span>
                    <input 
                        type="number" 
                        min="0" max="23" 
                        value={config.end} 
                        onChange={(e) => setConfig({...config, end: parseInt(e.target.value)})}
                        className="w-16 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                </div>
            </div>
        ) : (
            <div className="flex flex-col gap-1">
                {currentTask && (
                    <div className="mb-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3">
                        <Play size={16} className="text-emerald-400 fill-current" />
                        <div>
                            <div className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider">Now</div>
                            <div className="text-sm font-medium text-emerald-100">{currentTask}</div>
                        </div>
                    </div>
                )}

                {hours.map((time) => {
                const hour = parseInt(time.split(':')[0]);
                const isCurrent = hour === currentHour;
                
                return (
                    <div key={time} className={`group flex items-center transition-colors rounded ${isCurrent ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.02]'}`}>
                    <div className={`w-14 py-2 px-2 text-xs font-mono transition-colors ${isCurrent ? 'text-white font-bold' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                        {time}
                    </div>
                    <div className="flex-1">
                        <input
                        type="text"
                        value={schedule[time] || ''}
                        onChange={(e) => handleChange(time, e.target.value)}
                        placeholder="-"
                        className={`w-full bg-transparent border-none outline-none px-2 py-2 text-sm transition-colors rounded ${isCurrent ? 'text-white font-medium' : 'text-zinc-300 placeholder-zinc-800 focus:text-white'}`}
                        />
                    </div>
                    </div>
                );
                })}
            </div>
        )}
    </div>
  );
};

const Top3Widget = ({ top3, onUpdate }) => {
  const completedCount = top3.filter(t => t.done).length;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
          {top3.map((task, idx) => (
            <div key={idx} className="flex gap-3 items-start group">
              <span className={`font-mono text-lg font-bold transition-colors select-none mt-1 ${task.done ? 'text-emerald-600' : 'text-zinc-700 group-hover:text-zinc-500'}`}>
                0{idx + 1}
              </span>
              <textarea
                rows={1}
                value={task.text}
                onChange={(e) => {
                  const newTop3 = [...top3];
                  newTop3[idx] = { ...newTop3[idx], text: e.target.value };
                  onUpdate(newTop3);
                }}
                onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Critical Task..."
                className={`flex-1 bg-transparent border-b outline-none py-1.5 text-sm transition-colors resize-none overflow-hidden placeholder-zinc-800 ${
                    task.done ? 'text-zinc-600 line-through border-zinc-800' : 'text-zinc-200 border-zinc-800 focus:border-zinc-500'
                }`}
              />
              <button 
                onClick={() => {
                    const newTop3 = [...top3];
                    newTop3[idx] = { ...newTop3[idx], done: !newTop3[idx].done };
                    onUpdate(newTop3);
                }}
                className={`mt-1.5 p-0.5 rounded-full border transition-all ${
                    task.done 
                    ? 'bg-emerald-500 border-emerald-500 text-black' 
                    : 'border-zinc-700 hover:border-zinc-500 text-transparent'
                }`}
              >
                  <CheckCircle size={14} className={task.done ? 'fill-current' : ''} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

const ExpenseWidget = ({ expenses, onUpdate }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const add = () => {
    if (!desc || !amount) return;
    onUpdate([...expenses, { id: Date.now(), desc, amount: parseFloat(amount) }]);
    setDesc(''); setAmount('');
  };
  const remove = (id) => onUpdate(expenses.filter(e => e.id !== id));
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-zinc-500">Total Burn</span>
          <span className="font-mono text-white text-sm bg-zinc-800 px-2 py-0.5 rounded">${total.toFixed(2)}</span>
      </div>
      <div className="flex gap-2 mb-4">
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Desc" className="flex-1 bg-zinc-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$" className="w-20 bg-zinc-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors" />
        <button onClick={add} className="p-2 bg-white text-black hover:bg-zinc-200 rounded"><Plus size={14} /></button>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
         {expenses.map(exp => (
             <div key={exp.id} className="flex justify-between text-xs items-center group py-2 border-b border-white/5 last:border-0">
                 <span className="truncate pr-2 text-zinc-400">{exp.desc}</span>
                 <div className="flex items-center gap-3">
                     <span className="font-mono text-zinc-300">${exp.amount}</span>
                     <button onClick={() => remove(exp.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
};

const TextWidget = ({ value, onChange, placeholder, minHeight }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full bg-transparent resize-none outline-none text-sm leading-relaxed text-zinc-300 placeholder-zinc-700 custom-scrollbar ${minHeight || 'h-32'}`}
  />
);

const LandingPage = ({ onLogin }) => (
  <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
    <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-black">S</div>
        <span className="font-bold text-xl tracking-tight">SoloS</span>
      </div>
      <button onClick={onLogin} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Log In</button>
    </nav>

    <div className="max-w-3xl mx-auto px-6 py-32 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> V2.2 SYSTEM ONLINE
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">
        Execution + Strategy.
      </h1>
      <p className="text-lg text-zinc-500 mb-12 max-w-xl mx-auto leading-relaxed">
        The Daily Stack for execution. The Second Brain for strategy. 
        All in one minimalist OS.
      </p>
      <button 
        onClick={onLogin}
        className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
      >
        Initialize System
      </button>
    </div>
    <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 20px; }
    `}</style>
  </div>
);