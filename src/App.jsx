import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { handleRazorpayPayment } from '../utils/payment';
import { AreaFilterBar } from './components/AreaFilterBar';

import { 
  CheckCircle, Circle, Trash2, Plus, DollarSign, Brain, BookOpen, 
  Calendar as CalendarIcon, Target, ChevronLeft, ChevronRight, 
  Moon, Sun, LogOut, Layout, Shield, Clock, Hash, AlignLeft,
  ChevronDown, ChevronUp, Layers, Menu, X, Folder, FileText,
  Briefcase, Globe, Archive, Save, Tag, Loader2, ArrowRight,
  FolderInput, RotateCcw, AlertTriangle, Play, Settings, User, MoreVertical, Lock, CreditCard
} from 'lucide-react';

import { 
  getAuth, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInAnonymously
} from 'firebase/auth';

import { 
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDocs, getDoc 
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
  const diff = d.getDate() - day; 
  return new Date(d.setDate(diff));
};

const emptyDayState = {
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

const ensureHeaderToastStyles = () => {
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


// --- COMPONENT: LOGIN PAGE ---
const LoginPage = ({ onLogin, onDemoMode }) => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
      <img src="/SolOS.png" alt="SolOS Logo" className="w-full h-full object-cover"/>
    </div>
    
    <h1 className="text-4xl md:text-6xl font-bold text-zinc-600 mb-6 tracking-tight">
      Sol<span className="text-white">OS</span>
    </h1>
    
    <p className="text-zinc-400 max-w-md mb-12 text-lg leading-relaxed">
      The ruthlessly minimalist Operating System for Beginners. 
      Execution on the left. Strategy on the right.
    </p>
    
    {/* CONSTRAINED BUTTONS CONTAINER */}
    <div className="w-full max-w-xs space-y-3">
      {/* Google Sign In */}
      <button 
        onClick={onLogin}
        className="group relative flex items-center justify-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-all duration-200 active:scale-95 w-full"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="hidden sm:inline">Google</span>
        <span className="sm:hidden">Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-xs text-zinc-500 font-mono">OR</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      {/* Demo Mode */}
      <button 
        onClick={onDemoMode}
        className="group relative flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all duration-200 active:scale-95 w-full"
      >
        <span className="hidden sm:inline">Guest Mode</span>
        <span className="sm:hidden">Demo</span>
      </button>
    </div>

    <div className="mt-12 text-xs text-zinc-600 font-mono">V3 • SECURE • ENCRYPTED</div>
  </div>
);

// --- COMPONENT: PRICING MODAL ---
const PricingModal = ({ onClose, headerOffset = 0, user, db, appId, setUserTier }) => {
  const [isIndia, setIsIndia] = useState(true);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', {
          method: 'GET',
          headers: { Accept: 'application/json' }
        });
        const data = await response.json();
        
        // Default to India, only set false if confirmed NOT India
        if (data.country_code && data.country_code !== 'IN') {
          setIsIndia(false);
        }
      } catch (error) {
        console.error('GeoIP Detection failed:', error);
        // Default to India on error
        setIsIndia(true);
      } finally {
        setIsLoadingGeo(false);
      }
    };

    detectLocation();
  }, []);

  const handleSuccessfulPayment = async (plan, response) => {
    setPaymentProcessing(true);
    try {
      // Calculate expiration date based on plan
      const now = new Date();
      let expiresAt = new Date(now);
      
      switch(plan) {
        case 'weekly':
          expiresAt.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          expiresAt.setMonth(now.getMonth() + 1);
          break;
        case 'yearly':
          expiresAt.setFullYear(now.getFullYear() + 1);
          break;
        case 'international':
          // Set to 2 years from now (effectively 1 + 1 free)
          expiresAt.setFullYear(now.getFullYear() + 2);
          break;
        case 'lifetime':
          // Set to 100 years from now (effectively lifetime)
          expiresAt.setFullYear(now.getFullYear() + 100);
          break;
        default:
          expiresAt.setMonth(now.getMonth() + 1); // Default to 1 month
      }
      
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(userRef, { 
        tier: 'pro',
        plan: plan,
        paymentId: response.razorpay_payment_id || response.id,
        source: isIndia ? 'razorpay' : 'paypal',
        lastPayment: serverTimestamp(),
        expiresAt: expiresAt, 
        purchasedAt: serverTimestamp() 
      }, { merge: true });

      setUserTier('pro');

      // Success toast: slide out from header, then disappear back into it
      const headerEl = document.querySelector('[data-header="main"]') || document.body;

      ensureHeaderToastStyles();
      const toast = document.createElement('div');
      toast.className =
        'absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[10000] ' +
        'max-w-[92vw] w-[360px] bg-emerald-500 text-black px-4 py-3 rounded-2xl ' +
        'shadow-[0_18px_40px_-18px_rgba(16,185,129,0.7)] border border-emerald-300/50 ' +
        'backdrop-blur';

      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-black/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="text-sm font-extrabold tracking-tight">Welcome to SolOS Pro!</div>
        </div>
      `;

      // animation class applied via inline style
      toast.style.animation = 'headerToast 3.6s ease forwards';

      headerEl.appendChild(toast);
      setTimeout(() => toast.remove(), 3800);

      setPaymentProcessing(false);
      onClose();
    } catch (error) {
      console.error('Error updating tier:', error);
      setPaymentProcessing(false);
      alert('Payment successful but failed to update account. Please contact support.');
    }
  };

  const handleRazorpayClick = (planType, inrAmount, description) => {
    setPaymentProcessing(true);
    handleRazorpayPayment(user, inrAmount, description, (response) => {
      setPaymentProcessing(false);
      handleSuccessfulPayment(planType, response);
    }).catch(() => {
      setPaymentProcessing(false);
    });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center px-4 md:px-6 pb-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      style={{ paddingTop: `calc(${headerOffset + 16}px + env(safe-area-inset-top))` }}
      onClick={onClose}
    >
      <div 
        className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden"
        style={{ maxHeight: `calc(100vh - ${headerOffset + 32}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur z-20 flex justify-end px-3 py-3 md:px-4 md:py-4">
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div 
          className="grid md:grid-cols-2 overflow-y-auto"
          style={{ maxHeight: `calc(100vh - ${headerOffset + 96}px)` }}
        >
          {/* Left: Value Prop */}
          <div className="p-8 md:p-12 bg-zinc-900 flex flex-col justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20">
              <Shield className="text-black" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Unlock Your Potential.</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              SolOS Free is designed for starters. SolOS Pro is designed for finishers.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Unlimited History</li>
              <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Unlimited Projects & Areas</li>
              <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Priority Support</li>
            </ul>
          </div>

          {/* Right: Pricing Options */}
          <div className="p-8 md:p-12 flex flex-col gap-4">
            <h3 className="text-lg font-medium text-white mb-2">Choose your commitment</h3>

            {isLoadingGeo ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-emerald-500"></div>
                <div className="text-zinc-400 text-sm mt-3">Detecting your region...</div>
              </div>
            ) : isIndia ? (
              // ===== INDIA - RAZORPAY =====
              <>
                <button 
                  onClick={() => handleRazorpayClick('weekly',99, 'Weekly Grind')}
                  disabled={paymentProcessing}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex justify-between items-center group cursor-pointer disabled:opacity-50"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-emerald-400">Weekly Grind</div>
                    <div className="text-xs text-zinc-500">Perfect for sprints</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">₹99</div>
                    <div className="text-[10px] text-zinc-500">/ week</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleRazorpayClick('monthly', 499, 'Monthly Focus')}
                  disabled={paymentProcessing}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex justify-between items-center group cursor-pointer relative disabled:opacity-50"
                >
                  <div className="absolute -top-3 left-4 px-2 bg-emerald-500 text-black text-[10px] font-bold rounded-full">POPULAR</div>
                  <div>
                    <div className="font-bold text-white group-hover:text-emerald-400">Monthly Focus</div>
                    <div className="text-xs text-zinc-500">Standard plan</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">₹499</div>
                    <div className="text-[10px] text-zinc-500">/ month</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleRazorpayClick('yearly', 4999, 'Yearly Commit')}
                  disabled={paymentProcessing}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex justify-between items-center group cursor-pointer disabled:opacity-50"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-emerald-400">Yearly Commit</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">₹4,999</div>
                    <div className="text-[10px] text-zinc-500">/ year</div>
                  </div>
                </button>

                <button 
                  onClick={() => handleRazorpayClick('lifetime', 9999, 'Founder Mode')}
                  disabled={paymentProcessing}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all text-left flex justify-between items-center group mt-4 cursor-pointer disabled:opacity-50"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-purple-400">Founder Mode</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">₹9,999</div>
                    <div className="text-[10px] text-zinc-500">lifetime</div>
                  </div>
                </button>
              </>
            ) : (
              // ===== INTERNATIONAL - PAYPAL =====
              <PayPalScriptProvider options={{ 
                "client-id": "AcpJ7YJGWMMci3LKX6dzVuub7nhFGXnV9AMYrMjqVGi4Zx1Ea21zEC35XJh9gTOyKYsxRPvGEgh3ehPE", 
                currency: "USD", 
                intent: "capture" 
              }}>
                <div className="w-full">
                  <div className="mb-4 p-4 rounded-xl border border-white/10 bg-zinc-900">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-white">Global Access</div>
                      <div className="font-mono text-xl text-white">$49</div>
                    </div>
                    <div className="text-xs text-zinc-400">1 Year Access + 1 Year Free</div>
                  </div>

                  {paymentProcessing && (
                    <div className="text-center py-4 text-zinc-400 text-sm">Processing payment...</div>
                  )}

                  {!paymentProcessing && (
                    <PayPalButtons 
                      style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [{
                            amount: {
                              currency_code: "USD",
                              value: "49.00"
                            },
                            description: "SolOS Pro International"
                          }],
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then(async (details) => {
                          handleSuccessfulPayment('international', details);
                        });
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                        alert("PayPal could not process the payment. Please try again.");
                      }}
                    />
                  )}
                  <div className="text-[10px] text-center text-zinc-600 mt-2">Secured by PayPal</div>
                </div>
              </PayPalScriptProvider>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};


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
  const [headerHeight, setHeaderHeight] = useState(80);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState(null);

  const profileMenuRef = useRef(null);
  const headerRef = useRef(null);

  // Ensure pricing modal always sits on top and locks background scroll
  useEffect(() => {
    if (showPricing) {
      setIsMenuOpen(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showPricing]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'settings', 'profile');
        
        // === NEW: Check if user profile exists ===
        try {
          const docSnapshot = await getDoc(userRef);
          
          // If profile doesn't exist, create it with initial data
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
        
        // === EXISTING: Listen for profile updates ===
        const unsubscribeProfile = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data();
            
            // Check if pro subscription has expired
            if (profileData.tier === 'pro' && profileData.expiresAt) {
              const expirationDate = profileData.expiresAt instanceof Date 
                ? profileData.expiresAt 
                : profileData.expiresAt.toDate();
              
              const now = new Date();
              
              if (now > expirationDate) {
                // Subscription expired - downgrade to free
                console.log('Pro subscription expired. Downgrading to free tier.');
                
                try {
                  await setDoc(userRef, {
                    tier: 'free',
                    expiredAt: serverTimestamp(),
                    previousPlan: profileData.plan || 'unknown'
                  }, { merge: true });
                  
                  setUserTier('free');
                  
                  // Show expiration notice
                  alert('Your SolOS Pro subscription has expired. Please renew to continue using Pro features.');
                } catch (error) {
                  console.error('Error downgrading expired user:', error);
                }
                
                return; // Exit early
              }
            }
            
            // Load tier
            if (profileData.tier) {
              setUserTier(profileData.tier);
              // Store expiration date for display
              if (profileData.tier === 'pro' && profileData.expiresAt) {
                const expDate = profileData.expiresAt instanceof Date 
                  ? profileData.expiresAt 
                  : profileData.expiresAt.toDate();
                setProExpiresAt(expDate);
              } else {
                setProExpiresAt(null);
              }
            }
            
            // Load routine config
            if (profileData.routineConfig) {
              setRoutineConfig(profileData.routineConfig);
            }
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


  // Measure header height to offset modal below it (especially on mobile)
  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setHeaderHeight(rect.height || 80);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
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
    
    if (isLocked) {
        setDayData(emptyDayState);
        return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'days', dateKey);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let safeTop3 = data.top3 || emptyDayState.top3;
        
        // Ensure we always have 5 items if migrating from older data
        if (safeTop3.length < 5) {
            const missing = 5 - safeTop3.length;
            for(let i=0; i<missing; i++) safeTop3.push({ text: '', done: false });
        }

        // Migration logic for string -> object
        if (safeTop3.length > 0 && typeof safeTop3[0] === 'string') {
            safeTop3 = safeTop3.map(text => ({ text, done: false }));
             // Ensure 5 items after map
             if (safeTop3.length < 5) {
                const missing = 5 - safeTop3.length;
                for(let i=0; i<missing; i++) safeTop3.push({ text: '', done: false });
             }
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
  
  const handleDemoMode = async () => {
    try {
      await signInAnonymously(auth);
      setIsDemoMode(true);
    } catch (error) {
      console.error('Guest mode failed:', error);
      alert('Failed to start guest mode. Please try again.');
    }
  };
  
  const handleLogin = async () => {
    try { 
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
    } catch (e) { 
      console.error("Login failed", e);
      if (e.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`Domain not authorized.\nAdd ${domain} to Firebase Console -> Auth -> Settings -> Authorized Domains`);
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
  const top3Summary = <div className={`text-[10px] font-bold tracking-widest ${top3Completed === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>[{top3Completed}/5 DONE]</div>;
  const dailyBurn = dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const burnSummary = <div className="flex gap-2 text-[10px] font-mono text-zinc-500"><span>DAY: <span className="text-zinc-300">${dailyBurn.toFixed(0)}</span></span><span className="text-zinc-700">|</span><span>MO: <span className="text-zinc-300">${monthlyTotal.toFixed(0)}</span></span></div>;

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono animate-pulse">BOOTING KERNEL...</div>;

  if (!user) return <LoginPage onLogin={handleLogin} onDemoMode={handleDemoMode} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* DEMO MODE BANNER */}
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
            appId={appId}
            setUserTier={setUserTier}
        />
      )}

      <header ref={headerRef} data-header="main" className="relative overflow-visibleborder-b border-white/5 flex justify-center items-center sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md">
        <div className="w-full max-w-5xl px-4 md:px-6 py-1 flex justify-between items-center">
            <div className="flex items-center gap-1">
                <div className="w-13 h-12 bg-black text-black rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-white/15">
                <img src="/SolOS.png" alt="SolOS" className="w-full h-full object-cover rounded-full"/>
                </div>
                {/* <div className="hidden md:block">
                  <h1 className="font-bold text-[45px] text-zinc-700 tracking-tight leading-none">
                    Sol<span className="text-white">OS</span>
                  </h1>
                </div> */}
            </div>
            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden md:flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                    <div className={`w-1.5 h-1.5 rounded-full ${synced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    {synced ? 'Synced' : 'Saving'}
                </div>
                
                {/* User Profile / Logout */}
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
                        
                        {/* Current Plan Display */}
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
                                  {/* Show expiration date */}
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
                        
                        {/* Menu Actions */}
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

      <main className={`p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-20 transition-all duration-300 ${isMenuOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <TimelineWidget currentDate={currentDate} setCurrentDate={setCurrentDate} />
        
        {isLocked ? (
            <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden group cursor-pointer" onClick={() => setShowPricing(true)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50"></div>
                <Lock size={48} className="text-zinc-600 mb-4 z-10 group-hover:text-emerald-500 transition-colors" />
                <h3 className="text-xl font-bold text-white z-10">History Locked</h3>
                <p className="text-zinc-500 text-sm mt-2 z-10">Upgrade to Pro to access past data.</p>
                <button className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-sm transition-colors z-10">Unlock History</button>
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
                    <RoutineWidget
                      schedule={dayData.schedule}
                      onUpdate={(val) => updateField('schedule', val)}
                      config={routineConfig}
                      setConfig={setRoutineConfig}
                      user={user}
                      db={db}
                      appId={appId}
                    />
                </CollapsibleSection>
                <CollapsibleSection title="Burn Rate" icon={DollarSign} defaultOpen={false} summary={burnSummary}>
                  <ExpenseWidget 
                    expenses={dayData.expenses} 
                    onUpdate={(val) => updateField('expenses', val)} 
                    currentDate={currentDate}
                    user={user}
                    db={db}
                    appId={appId}
                  />
              </CollapsibleSection>
                <CollapsibleSection title="Reflection" icon={BookOpen} defaultOpen={false}>
                    <TextWidget value={dayData.journal} onChange={(val) => updateField('journal', val)} placeholder="Distill today's lessons." minHeight="h-48"/>
                </CollapsibleSection>
            </>
        )}
      </main>

      <SecondBrainPanel isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} appId={appId} db={db} setShowPricing={setShowPricing} userTier={userTier} />
    </div>
  );
}

// --- SUB COMPONENTS ---

const SecondBrainPanel = ({ isOpen, onClose, user, appId, db, setShowPricing, userTier }) => {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); 
  const [openMenuId, setOpenMenuId] = useState(null);
  const DEFAULT_AREAS = ['Work', 'Health', 'Family', 'Money', 'Love']; 
  const NO_AREA_LABEL = 'Noise';
  const menuRef = useRef(null);
  const [areaFilter, setAreaFilter] = useState('all');
  const [customAreas, setCustomAreas] = useState([]);
  const [areaSearchInput, setAreaSearchInput] = useState('');
  const [areaPills, setAreaPills] = useState([]);
  const areaOptions = [
    ...new Set([
      NO_AREA_LABEL,
      ...DEFAULT_AREAS,
      ...customAreas,
      ...docs
        .filter((d) => d.category === 'projects' && d.area)
        .map((d) => d.area),
    ]),
  ];
  
  const AREA_COLORS = {
    'Noise': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30 hover:border-zinc-400/60',
    'Career': 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-400/60',
    'Health': 'bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-400/60',
    'Family': 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-400/60',
    'Finance': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400/60',
  };
  
  const getAreaColor = (area) => {
    return AREA_COLORS[area] || 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:border-orange-400/60';
  };

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const docsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'docs');
    const q = query(docsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedDocs = [];
      snapshot.forEach((doc) => {
        fetchedDocs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setDocs(fetchedDocs);
    }, (error) => {
      console.error("Error fetching documents:", error);
    });

    return () => unsubscribe();
  }, [user, isOpen, appId, db]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || !isOpen) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data();
      if (data && Array.isArray(data.customAreas)) {
        setCustomAreas(data.customAreas);
      } else {
        setCustomAreas([]);
      }
    });
    return () => unsubscribe();
  }, [user, isOpen, appId, db]);


  useEffect(() => {
    if (!openMenuId) return;

    const positionMenu = () => {
      const menuElement = document.getElementById(`menu-${openMenuId}`);
      const triggerButton = document.querySelector(`button[data-menu-trigger="${openMenuId}"]`);
      
      if (!menuElement || !triggerButton) return;

      const triggerRect = triggerButton.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = menuElement.offsetHeight;
      const padding = 16;

      // Calculate position
      let left = triggerRect.left - menuWidth - padding; // Open to the LEFT
      let top = triggerRect.top;

      // If menu goes off-screen left, flip to right
      if (left < padding) {
        left = triggerRect.right + padding;
      }

      // Prevent menu from going off bottom
      if (top + menuHeight > window.innerHeight - padding) {
        top = window.innerHeight - menuHeight - padding;
      }

      // Prevent menu from going off top
      if (top < padding) {
        top = padding;
      }

      menuElement.style.left = `${left}px`;
      menuElement.style.top = `${top}px`;
    };

    // Position on mount and on window resize
    positionMenu();
    window.addEventListener('resize', positionMenu);
    
    return () => window.removeEventListener('resize', positionMenu);
  }, [openMenuId]);

  const handleCreateDoc = async (category) => {
    // --- LIMIT CHECK ---
    if (userTier === 'free') {
        const count = docs.filter(d => d.category === category).length;
        const limits = { projects: 5, resources: 20 };
        if (limits[category] && count >= limits[category]) {
            setShowPricing(true);
            return;
        }
    }

    // Default to 'Noise' for new projects
    const defaultArea =
      category === 'projects' && areaFilter !== 'all' && areaFilter !== NO_AREA_LABEL
        ? areaFilter
        : NO_AREA_LABEL;

    const newDoc = {
      title: 'Untitled Document',
      body: '',
      category: category,
      tags: [],
      ...(category === 'projects' ? { area: defaultArea } : {}),
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
        setOpenMenuId(null); 
     } catch (e) { console.error(e); }
  };

  const handleDeleteDoc = async (docId) => {
    const confirmed = window.confirm('Delete this document permanently?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId));
      
      // Close menu
      setOpenMenuId(null);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleRestore = async (docId) => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { category: 'projects', updatedAt: serverTimestamp() });
        setOpenMenuId(null);
      } catch (err) { console.error(err); }
  };

  const handleMoveToTrash = async (docId) => {
    // const confirmed = window.confirm('Move to Trash?');
    // if (!confirmed) return;

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
      await updateDoc(docRef, { 
        category: 'trash',
        updatedAt: serverTimestamp()
      });
      
      setOpenMenuId(null);
      
    } catch (error) {
      console.error('Error moving to trash:', error);
      alert('Failed to move document to trash. Please try again.');
    }
  };

  const saveCustomAreas = async (areas) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    await setDoc(profileRef, { customAreas: areas, updatedAt: serverTimestamp() }, { merge: true });
  };

  const handleAddArea = async () => {
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...customAreas, trimmed]));
    setCustomAreas(next);
    setNewAreaName('');
    await saveCustomAreas(next);
  };

  const renderDocList = (category) => {
    const categoryDocs = docs.filter((d) => {
      if (d.category !== category) return false;
      if (category === 'projects' && areaFilter !== 'all') {
        // Treat empty/undefined areas as 'Noise' for backward compatibility
        const docArea = d.area && d.area.trim() !== '' ? d.area : NO_AREA_LABEL;
        return docArea === areaFilter;
      }
      return true;
    });

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
            className="relative w-full flex items-center justify-between bg-zinc-800/30 border border-white/5 rounded-lg hover:bg-zinc-800 hover:border-white/10 transition-all text-left group"
          >
            {/* Main Click Area */}
            <button 
              type="button"
              onClick={() => setSelectedDoc(doc)}
              className="flex-1 min-w-0 p-2.5 text-left z-0"
            >
              <div className={`text-sm font-medium truncate ${category === 'trash' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                {doc.title || "Untitled"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const docArea = category === 'projects' 
                    ? (doc.area && doc.area.trim() !== '' ? doc.area : NO_AREA_LABEL)
                    : null;
                  
                  const docTags = [
                    ...(docArea ? [docArea] : []),
                    ...(doc.tags || []),
                  ];

                  if (docTags.length === 0) return null;

                  return (
                    <div className="flex gap-1">
                      {docTags.map((tag, i) => {
                        const isAreaTag = i === 0 && category === 'projects';
                        
                        // Get area-specific color if it's an area tag
                        let badgeColor = 'bg-emerald-500/10 text-emerald-400'; // Default for regular tags
                        
                        if (isAreaTag) {
                          const areaColors = {
                            'Noise': 'bg-zinc-500/10 text-zinc-500',
                            'Career': 'bg-blue-500/10 text-blue-400',
                            'Health': 'bg-green-500/10 text-green-400',
                            'Family': 'bg-purple-500/10 text-purple-400',
                            'Finance': 'bg-emerald-500/10 text-emerald-400',
                          };
                          badgeColor = areaColors[tag] || 'bg-orange-500/10 text-orange-400';
                        }
                        
                        return (
                          <span
                            key={`${tag}-${i}`}
                            className={`text-[12px] px-1.5 py-0.5 rounded font-mono ${badgeColor}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="text-[9px] text-zinc-600 font-mono">
                  {doc.updatedAt?.toDate ? doc.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                </div>
              </div>
            </button>

            {/* 3-Dot Menu Trigger */}
            <div className="relative pr-2">
              <button 
                data-menu-trigger={doc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors z-10"
              >
                <MoreVertical size={16} />
              </button>

              {/* Dropdown Menu using Portal */}
              {openMenuId === doc.id && createPortal(
                <div 
                  className="fixed w-48 bg-[#18181b] border border-white/10 rounded-lg shadow-2xl z-[9998] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    top: '0',
                    left: '0',
                    // Will be positioned by JavaScript below
                  }}
                  ref={menuRef}
                  id={`menu-${doc.id}`}
                >
                  {category === 'trash' ? (
                    <>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRestore(doc.id); 
                        }} 
                        className="w-full text-left px-4 py-2.5 text-xs text-emerald-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteDoc(doc.id); 
                        }} 
                        className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5 transition-colors"
                      >
                        <Trash2 size={14} /> Delete Permanently
                      </button>
                    </>
                  ) : (
                    <>
                      {['projects','resources','archives'].map(cat => (
                        cat !== category && (
                          <button 
                            key={cat} 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleMoveDoc(doc.id, cat); 
                            }} 
                            className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 capitalize transition-colors"
                          >
                            <FolderInput size={14} /> Move to {cat}
                          </button>
                        )
                      ))}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleMoveToTrash(doc.id); 
                        }} 
                        className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5 transition-colors"
                      >
                        <Trash2 size={14} /> Move to Trash
                      </button>
                    </>
                  )}
                </div>,
                document.body
              )}
            </div>
          </div>
        ))}
        
        {category !== 'archives' && category !== 'trash' && category !== 'areas' && (
          <button 
            type="button"
            onClick={() => handleCreateDoc(category)}
            className="w-full py-2.5 mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add {category.slice(0, -1)}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#09090b] border-l border-white/10 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b] flex-shrink-0">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
             <Layers className="text-white" size={18} />
           </div>
           <span className="font-bold text-white tracking-tight text-lg">Second Brain</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {selectedDoc ? (
          <DocEditor
            docData={selectedDoc}
            onBack={() => setSelectedDoc(null)}
            user={user}
            appId={appId}
            db={db}
            areaOptions={areaOptions}
            defaultArea={areaOptions[0] || 'Career'}
          />

        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col bg-[#09090b]">
            {/* NEW: AreaFilterBar at top */}
            <AreaFilterBar
              areaFilter={areaFilter}
              setAreaFilter={setAreaFilter}
              customAreas={customAreas}
              setCustomAreas={setCustomAreas}
              user={user}
              db={db}
              appId={appId}
              docs={docs}
              areaSearchInput={areaSearchInput}
              setAreaSearchInput={setAreaSearchInput}
            />

            {/* Projects list scrolls below */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <CollapsibleSection title="Projects" icon={Briefcase} defaultOpen={true}>{renderDocList('projects')}</CollapsibleSection>
              <CollapsibleSection title="Resources" icon={Globe} defaultOpen={false}>{renderDocList('resources')}</CollapsibleSection>
              <CollapsibleSection title="Archives" icon={Archive} defaultOpen={false}>{renderDocList('archives')}</CollapsibleSection>
              <div className="mt-8 pt-4 border-t border-white/5">
                <CollapsibleSection title="Trash" icon={Trash2} defaultOpen={false}>{renderDocList('trash')}</CollapsibleSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DocEditor = ({ docData, onBack, user, appId, db, areaOptions, defaultArea }) => {
  const [title, setTitle] = useState(docData.title);
  const [body, setBody] = useState(docData.body);
  const [category, setCategory] = useState(docData.category);
  const [tags, setTags] = useState(docData.tags ? docData.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef(null);
  const NO_AREA_LABEL = 'Noise';
  const [area, setArea] = useState(
    docData.area && docData.area.trim() !== '' ? docData.area : NO_AREA_LABEL
  );
  
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const docTags = docData.tags || [];
    
    if (
      title === docData.title &&
      body === docData.body &&
      category === docData.category &&
      area === (docData.area || '') &&
      JSON.stringify(tagsArray) === JSON.stringify(docTags)
    ) return;


    setSaving(true);
    timeoutRef.current = setTimeout(async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docData.id);
      await updateDoc(docRef, {
        title,
        body,
        category,
        area,
        tags: tagsArray,
        updatedAt: serverTimestamp()
      });

      setSaving(false);
    }, 1000); 

    return () => clearTimeout(timeoutRef.current);
  }, [title, body, tags, category, area, appId, db, user.uid, docData]);


  const handleSoftDelete = async () => {
      // Check if item is in trash
      const isInTrash = category === 'trash';

      let confirmMessage = '';
      
      if (isInTrash) {
        confirmMessage = 'Delete this document permanently?';
        // Confirmation dialog FIRST
        const confirmed = window.confirm(confirmMessage);
          if (!confirmed) return;  // User cancelled
      }

      // Proceed with deletion/move (only if confirmed)
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docData.id);
        
        if (isInTrash) {
          // PERMANENT DELETE
          await deleteDoc(docRef);
        } else {
          // Move to Trash
          await updateDoc(docRef, { 
            category: 'trash',
            updatedAt: serverTimestamp()
          });
        }

        // Close the editor and return to list
        onBack();
        
      } catch(error) { 
        console.error('Delete error:', error);
        alert('Failed to delete document. Please try again.');
      }
    };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-4">
             <div className="text-[10px] font-mono text-zinc-500 uppercase">{saving ? 'Saving...' : 'Saved'}</div>
             {category === 'projects' && (
                <select 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="text-xs bg-zinc-800 border border-white/10 rounded px-2 py-1 text-emerald-400 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer hover:bg-zinc-700"
                >
                  <option value={NO_AREA_LABEL}>{NO_AREA_LABEL}</option>
                  {areaOptions
                    .filter(opt => opt !== NO_AREA_LABEL)
                    .map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                </select>
              )}
                          
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
              placeholder="Add tags (comma separated)"
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
        <div className="border-t border-white/5 px-4 py-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const TimelineWidget = ({ currentDate, setCurrentDate }) => {
  const [view, setView] = useState('daily'); 
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

/* RoutineWidget - Minimalist Column Layout */

const RoutineWidget = ({ schedule, onUpdate, config, setConfig, user, db, appId }) => {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // ===== Local state for instant UI feedback =====
  const [localStart, setLocalStart] = useState(config.start);
  const [localEnd, setLocalEnd] = useState(config.end);
  
  // ===== Debounce timeout refs =====
  const startTimeoutRef = useRef(null);
  const endTimeoutRef = useRef(null);
  
  // Sync local state with config when config changes
  useEffect(() => {
    setLocalStart(config.start);
    setLocalEnd(config.end);
  }, [config]);
  
  // Update current hour every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ===== TIME CHANGE HANDLERS =====
  const handleStartChange = (value) => {
    // Allow empty input
    if (value === '') {
      setLocalStart('');
      // Clear existing timeout
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
      return;
    }

    const newStart = Number.parseInt(value, 10);
    if (Number.isNaN(newStart)) return;

    // Clamp value
    const clampedStart = Math.min(Math.max(newStart, 0), 24);
    
    // Update local state immediately (instant visual feedback)
    setLocalStart(clampedStart);

    // Clear existing timeout
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
    }

    // Debounce: save to Firestore after 3 seconds
    startTimeoutRef.current = setTimeout(() => {
      const adjustedEnd = config.end < clampedStart ? clampedStart : config.end;
      setConfig({ ...config, start: clampedStart, end: adjustedEnd });
      saveRoutineConfig(clampedStart, adjustedEnd);
    }, 2000);
  };

  const handleEndChange = (value) => {
    // Allow empty input
    if (value === '') {
      setLocalEnd('');
      // Clear existing timeout
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
      }
      return;
    }

    const newEnd = Number.parseInt(value, 10);
    if (Number.isNaN(newEnd)) return;

    // Clamp value
    const clampedEnd = Math.min(Math.max(newEnd, 0), 24);
    
    // Update local state immediately (instant visual feedback)
    setLocalEnd(clampedEnd);

    // Clear existing timeout
    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current);
    }

    // Debounce: save to Firestore after 3 seconds
    endTimeoutRef.current = setTimeout(() => {
      const adjustedStart = config.start > clampedEnd ? clampedEnd : config.start;
      setConfig({ ...config, start: adjustedStart, end: clampedEnd });
      saveRoutineConfig(adjustedStart, clampedEnd);
    }, 2000);
  };

  // ===== SCHEDULE CHANGE HANDLER =====
  const handleChange = (time, value) => {
    onUpdate({ ...schedule, [time]: value });
  };

  // ===== FIRESTORE SAVE =====
  const saveRoutineConfig = async (newStart, newEnd) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(
        userRef,
        {
          routineConfig: {
            start: newStart,
            end: newEnd
          },
          lastUpdated: serverTimestamp()
        },
        { merge: true }
      );
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving routine config:', error);
      setIsSaving(false);
    }
  };

// Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    };
  }, []);

  // ===== RENDER =====
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
          {isConfiguring ? 'Configure Time Range' : ''}
        </div>
        <div className="flex items-center gap-1">
          {isSaving && <div className="text-[10px] text-emerald-400 animate-pulse">Saving...</div>}
          <button 
            onClick={() => setIsConfiguring(!isConfiguring)} 
            className="text-zinc-500 hover:text-white p-1 transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Config Section - Debounced Saves */}
      {isConfiguring && (
        <div className="bg-zinc-950/50 px-6 py-1 rounded-lg border border-white/10 space-y-1 mb-2">
          {/* Start Hour */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Start Hour</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={localStart} 
                onChange={(e) => handleStartChange(e.target.value)}
                placeholder=""
                className="w-12 bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                disabled={isSaving}
              />
              <span className="text-xs font-bold text-zinc-500">: 00</span>
            </div>
          </div>

          {/* End Hour */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">End Hour</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={localEnd} 
                onChange={(e) => handleEndChange(e.target.value)}
                placeholder=""
                className="w-12 font-bold bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                disabled={isSaving}
              />
              <span className="text-xs font-bold text-zinc-500">: 00</span>
            </div>
          </div>
        </div>
      )}

      {/* Schedule - Minimalist Design */}
      <div className="space-y-0">
        
        {/* Column Headers - Subtle */}
        <div className="grid grid-cols-[40px_1fr_1fr] px-4 py-1 text-[12px] font-bold text-zinc-600 uppercase tracking-wider">
          <div>Hour</div>
          <div className="text-center text-[12px]">00</div>
          <div className="text-center text-[12px]">30</div>
        </div>

        {/* Schedule Rows */}
        {Array.from({ length: config.end - config.start }, (_, i) => {
          const hour = config.start + i;
          const hourStr = String(hour).padStart(2, '0');
          const time00 = `${hourStr}:00`;
          const time30 = `${hourStr}:30`;
          
          const isCurrent = hour === currentHour;

          return (
            <div 
              key={hour} 
              className={`grid grid-cols-[40px_1fr_1fr] px-4 py-2 transition-all ${
                isCurrent 
                  ? 'border-l-2 border-emerald-500 bg-emerald-900/10' 
                  : 'border-l-2 border-transparent hover:bg-white/[0.02]'
              }`}
            >
              
              {/* Hour Column */}
              <div className={`text-xs font-mono font-bold ${
                isCurrent ? 'text-emerald-400' : 'text-zinc-500'
              }`}>
                {hourStr}
              </div>

              {/* :00 Slot */}
              <input
                type="text"
                value={schedule[time00] || ''}
                onChange={(e) => handleChange(time00, e.target.value)}
                placeholder=""
                className="bg-transparent border-none outline-none text-xs text-zinc-300 placeholder-zinc-700 focus:text-zinc-200 text-center transition-colors"
              />

              {/* :30 Slot */}
              <input
                type="text"
                value={schedule[time30] || ''}
                onChange={(e) => handleChange(time30, e.target.value)}
                placeholder=""
                className="bg-transparent border-none outline-none text-xs text-zinc-300 placeholder-zinc-700 focus:text-zinc-200 text-center transition-colors"
              />

            </div>
          );
        })}
      </div>
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

const ExpenseWidget = ({ expenses, onUpdate, currentDate, user, db, appId }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [customCategoryColors, setCustomCategoryColors] = useState({});

  const CATEGORY_COLOR_PALETTES = [
    { id: 'purple', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', bg: 'bg-purple-500/20 border-l-4 border-purple-500' },
    { id: 'pink', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30', bg: 'bg-pink-500/20 border-l-4 border-pink-500' },
    { id: 'indigo', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', bg: 'bg-indigo-500/20 border-l-4 border-indigo-500' },
    { id: 'cyan', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', bg: 'bg-cyan-500/20 border-l-4 border-cyan-500' },
    { id: 'amber', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', bg: 'bg-amber-500/20 border-l-4 border-amber-500' },
    { id: 'lime', color: 'bg-lime-500/10 text-lime-400 border-lime-500/30', bg: 'bg-lime-500/20 border-l-4 border-lime-500' },
    { id: 'rose', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', bg: 'bg-rose-500/20 border-l-4 border-rose-500' },
    { id: 'teal', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', bg: 'bg-teal-500/20 border-l-4 border-teal-500' },
  ];

  const getRandomColor = () => {
    return CATEGORY_COLOR_PALETTES[Math.floor(Math.random() * CATEGORY_COLOR_PALETTES.length)];
  };
  
  // Get today's date key
  const getTodayKey = () => {
    const d = new Date(currentDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Get current month key
  const getCurrentMonthKey = () => {
    const d = new Date(currentDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const todayKey = getTodayKey();
  const monthKey = getCurrentMonthKey();
  
  // Predefined expense categories
  const PREDEFINED_CATEGORIES = [
    { id: 'food', label: 'Food', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    { id: 'transport', label: 'Transport', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { id: 'bills', label: 'Bills', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    { id: 'home', label: 'Home Essentials', color: 'bg-green-500/10 text-green-400 border-green-500/30' }
  ];

  // Combine predefined + custom categories
  const allCategories = [
    ...PREDEFINED_CATEGORIES,
    ...customCategories.map(cat => ({
      id: `custom-${cat}`,
      label: cat,
      // color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      isCustom: true
    }))
  ];

  // Fetch custom categories from Firestore on mount
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data();
      if (data && Array.isArray(data.customExpenseCategories)) {
        setCustomCategories(data.customExpenseCategories);
      } else {
        setCustomCategories([]);
      }
      if (data && typeof data.customCategoryColors === 'object') {
        setCustomCategoryColors(data.customCategoryColors);
      } else {
        setCustomCategoryColors({});
      }
    });
    return () => unsubscribe();
  }, [user, db, appId]);

  // Migrate expenses - add dateKey if missing
  useEffect(() => {
    if (expenses.length === 0) return;
    
    const needsMigration = expenses.some(exp => !exp.dateKey);
    if (!needsMigration) return;

    const migratedExpenses = expenses.map(exp => {
      if (exp.dateKey) return exp; // Already has dateKey
      // Add dateKey (use today's date as default for old expenses)
      return {
        ...exp,
        dateKey: todayKey
      };
    });

    // Only update if migration actually needed
    if (JSON.stringify(migratedExpenses) !== JSON.stringify(expenses)) {
      onUpdate(migratedExpenses);
    }
  }, [expenses, todayKey, onUpdate]);

  // Fetch all expenses for the current month
  useEffect(() => {
    if (!user) return;

    const fetchMonthlyExpenses = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const allMonthExpenses = [];

      // Fetch each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRef = doc(db, 'artifacts', appId, 'users', user.uid, 'days', dateStr);
        
        try {
          const daySnap = await getDoc(dayRef);
          if (daySnap.exists()) {
            const dayData = daySnap.data();
            if (Array.isArray(dayData.expenses)) {
              allMonthExpenses.push(...dayData.expenses.map(exp => ({
                ...exp,
                dateKey: dateStr // Add dateKey if not present
              })));
            }
          }
        } catch (error) {
          console.error(`Error fetching day ${dateStr}:`, error);
        }
      }

      setMonthlyExpenses(allMonthExpenses);
    };

    fetchMonthlyExpenses();
  }, [user, currentDate, db, appId]);

  // Save custom categories to Firestore
  const saveCustomCategories = async (categories) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    await setDoc(
      profileRef,
      { customExpenseCategories: categories, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  // Save custom category colors to Firestore
  const saveCustomCategoryColors = async (colors) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    await setDoc(
      profileRef,
      { customCategoryColors: colors, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  // Add new custom category
  const handleAddCustomCategory = async () => {
    const trimmed = newCustomCategory.trim();
    if (!trimmed) return;
    if (customCategories.length >= 10) {
      alert('Maximum 10 custom categories allowed');
      return;
    }
    if (customCategories.includes(trimmed)) {
      alert('This category already exists');
      return;
    }

    setIsSavingCustom(true);
    const updatedCategories = [...customCategories, trimmed];
    
    // Assign random color to this new category
    const randomColor = getRandomColor();
    const updatedColors = {
      ...customCategoryColors,
      [trimmed]: randomColor.id
    };
    
    setCustomCategories(updatedCategories);
    setCustomCategoryColors(updatedColors);
    setNewCustomCategory('');
    
    await saveCustomCategories(updatedCategories);
    await saveCustomCategoryColors(updatedColors);
    setIsSavingCustom(false);
  };

  // Delete custom category
  const handleDeleteCustomCategory = async (categoryToDelete) => {
    const updatedCategories = customCategories.filter(cat => cat !== categoryToDelete);
    setCustomCategories(updatedCategories);
    setSelectedCategory(null);
    await saveCustomCategories(updatedCategories);
  };

  // Calculate monthly total for a category
  const getMonthlyTotal = (categoryId) => {
    return monthlyExpenses
      .filter(exp => exp.category === categoryId)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  // Calculate totals
  const dailyTotal = expenses
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyTotal = monthlyExpenses
    .reduce((acc, curr) => acc + curr.amount, 0);

  const add = () => {
    if (!desc || !amount || !selectedCategory) {
      alert('Please select a category, add description, and amount');
      return;
    }
    
    onUpdate([
      ...expenses, 
      { 
        id: Date.now(), 
        category: selectedCategory,
        desc, 
        amount: parseFloat(amount),
        dateKey: todayKey
      }
    ]);
    
    setDesc('');
    setAmount('');
    setSelectedCategory(null);
  };

  const remove = (id) => onUpdate(expenses.filter(e => e.id !== id));

  const getCategoryLabel = (categoryId) => {
    return allCategories.find(c => c.id === categoryId)?.label || 'Misc';
  };

  const getCategoryColor = (categoryId) => {
    // For custom categories, use the stored color
    if (categoryId.startsWith('custom-')) {
      const catLabel = categoryId.replace('custom-', '');
      const colorId = customCategoryColors[catLabel];
      if (colorId) {
        const palette = CATEGORY_COLOR_PALETTES.find(p => p.id === colorId);
        if (palette) return palette.color;
      }
    }
    return allCategories.find(c => c.id === categoryId)?.color || 'bg-zinc-500/10 text-zinc-400';
  };

  const getCategoryBgColor = (categoryId) => {
    // For custom categories, use the stored color
    if (categoryId.startsWith('custom-')) {
      const catLabel = categoryId.replace('custom-', '');
      const colorId = customCategoryColors[catLabel];
      if (colorId) {
        const palette = CATEGORY_COLOR_PALETTES.find(p => p.id === colorId);
        if (palette) return palette.bg;
      }
      // return 'bg-purple-500/20 border-l-4 border-purple-500';
      return allCategories.find(c => c.id === categoryId)?.color || 'bg-zinc-500/10 text-zinc-400';
    }

    const colorMap = {
      food: 'bg-orange-500/20 border-l-4 border-orange-500',
      transport: 'bg-blue-500/20 border-l-4 border-blue-500',
      bills: 'bg-red-500/20 border-l-4 border-red-500',
      home: 'bg-green-500/20 border-l-4 border-green-500',
    };
    
    return colorMap[categoryId] || 'bg-zinc-500/20 border-l-4 border-zinc-500';
  };
  
  return (
    <div>
      {/* Total Burn - Daily & Monthly */}
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-xs text-zinc-500">Total Burn</span>
        <div className="flex gap-4">
          <span className="font-mono text-[11px]">D: <span className="text-white-600">${dailyTotal.toFixed(2)}</span></span>
          <span className="font-mono text-[11px]">M: <span className="text-white-200">${monthlyTotal.toFixed(2)}</span></span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2 custom-scrollbar">
          {/* All categories (predefined + custom) in one row */}
          {allCategories.map(cat => (
            cat.isCustom ? (
              <div key={cat.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? `${getCategoryColor(cat.id)} ring-2 ring-offset-1 ring-offset-[#09090b]`
                      : `${getCategoryColor(cat.id)} opacity-60 hover:opacity-100`
                  }`}
                >
                  {cat.label}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCustomCategory(cat.label); }}
                  title="Delete category"
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? `${getCategoryColor(cat.id)} ring-2 ring-offset-1 ring-offset-[#09090b]`
                    : `${getCategoryColor(cat.id)} opacity-60 hover:opacity-100`
                }`}
              >
                {cat.label}
              </button>
            )
          ))}

          {/* Add new category inline */}
          {customCategories.length < 10 && (
            <div className="flex gap-1 flex-shrink-0">
              <input
                type="text"
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                placeholder="+ Add"
                disabled={isSavingCustom}
                className="bg-zinc-950/50 border border-dashed border-white/10 rounded-full px-3 py-2 text-xs text-zinc-400 outline-none focus:border-white/30 focus:text-white transition-colors placeholder-zinc-700 disabled:opacity-50 w-24"
              />
              {newCustomCategory && (
                <button
                  onClick={() => setNewCustomCategory('')}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Clear input"
                >
                  ✕
                </button>
              )}
            </div>  
          )}
        </div>

        {customCategories.length >= 10 && (
          <div className="text-[10px] text-zinc-500">Max categories reached</div>
        )}
      </div>

      {/* Selected Category Indicator */}
      {selectedCategory && (
        <div className="mb-4 p-2 rounded-lg bg-zinc-900/50 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getCategoryColor(selectedCategory)}`}>
              {getCategoryLabel(selectedCategory)}
            </div>
            <span className="text-[10px] text-zinc-500">Selected</span>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Fields */}
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={desc} 
          onChange={(e) => setDesc(e.target.value)} 
          placeholder="Description" 
          className="flex-1 bg-zinc-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors placeholder-zinc-700" 
        />
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="$" 
          className="w-20 bg-zinc-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors placeholder-zinc-700" 
        />
        <button 
          onClick={add} 
          disabled={!selectedCategory}
          className="p-2 bg-white text-black hover:bg-zinc-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Category Summary */}
      <div className="mb-4 space-y-2 bg-zinc-900/30 border border-white/5 rounded-lg p-3">
        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-2">Category Breakdown</div>
        {allCategories.map(cat => {
          const dailySum = expenses
            .filter(exp => exp.category === cat.id)
            .reduce((acc, curr) => acc + curr.amount, 0);
          const monthlySum = getMonthlyTotal(cat.id);
          // Only show categories that have expenses or are frequently used
          if (dailySum === 0 && monthlySum === 0 && !PREDEFINED_CATEGORIES.find(p => p.id === cat.id)) return null;
          
          return (
            <div key={cat.id} className="flex justify-between items-center px-2 rounded hover:bg-white/5 transition-colors">
              <div className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${getCategoryColor(cat.id)}`}>
                {cat.label}
              </div>
              <div className="text-[10px] font-mono text-zinc-300 flex gap-3">
                <span>D: <span className="text-white">${dailySum.toFixed(2)}</span></span>
                <span>M: <span className="text-white">${monthlySum.toFixed(2)}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense List */}
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-600">
            No expenses yet. Select a category and add one!
          </div>
        ) : (
          expenses.map(exp => (
            <div 
              key={exp.id} 
              className={`flex justify-between items-center group py-3 px-3 rounded-lg transition-all ${getCategoryBgColor(exp.category)}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${getCategoryColor(exp.category)}`}>
                  {getCategoryLabel(exp.category)}
                </div>
                <span className="text-xs text-zinc-300 truncate">
                  {exp.desc}
                </span>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <span className="font-mono text-zinc-300 text-xs whitespace-nowrap">${exp.amount.toFixed(2)}</span>
                <button 
                  onClick={() => remove(exp.id)} 
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
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
        <span className="font-bold text-xl tracking-tight">SolOS</span>
      </div>
      <button onClick={onLogin} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Log In</button>
    </nav>

    <div className="max-w-3xl mx-auto px-6 py-32 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> v3 SYSTEM ONLINE
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
