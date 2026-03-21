import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, APP_ID } from '../constants';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState('free');
  const [proExpiresAt, setProExpiresAt] = useState(null);
  const [routineConfig, setRoutineConfig] = useState({ start: 6, end: 23 });
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const userRef = doc(db, 'artifacts', APP_ID, 'users', u.uid, 'settings', 'profile');

        // Create profile if it doesn't exist
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

        // Listen for profile updates
        const unsubscribeProfile = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data();

            // Check if pro subscription has expired
            if (profileData.tier === 'pro' && profileData.expiresAt) {
              const expirationDate =
                profileData.expiresAt instanceof Date
                  ? profileData.expiresAt
                  : profileData.expiresAt.toDate();

              if (new Date() > expirationDate) {
                console.log('Pro subscription expired. Downgrading to free tier.');
                try {
                  await setDoc(
                    userRef,
                    {
                      tier: 'free',
                      expiredAt: serverTimestamp(),
                      previousPlan: profileData.plan || 'unknown'
                    },
                    { merge: true }
                  );
                  setUserTier('free');
                  alert('Your SolOS Pro subscription has expired. Please renew to continue using Pro features.');
                } catch (error) {
                  console.error('Error downgrading expired user:', error);
                }
                return;
              }
            }

            // Set tier
            if (profileData.tier) {
              setUserTier(profileData.tier);
              if (profileData.tier === 'pro' && profileData.expiresAt) {
                const expDate =
                  profileData.expiresAt instanceof Date
                    ? profileData.expiresAt
                    : profileData.expiresAt.toDate();
                setProExpiresAt(expDate);
              } else {
                setProExpiresAt(null);
              }
            }

            // Set routine config
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

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
    } catch (e) {
      console.error('Login failed', e);
      if (e.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`Domain not authorized.\nAdd ${domain} to Firebase Console -> Auth -> Settings -> Authorized Domains`);
      } else if (e.code !== 'auth/popup-closed-by-user') {
        alert(`Login error: ${e.message}`);
      }
    }
  };

  const handleDemoMode = async () => {
    try {
      await signInAnonymously(auth);
      setIsDemoMode(true);
    } catch (error) {
      console.error('Guest mode failed:', error);
      alert('Failed to start guest mode. Please try again.');
    }
  };

  const handleLogout = () => signOut(auth);

  return {
    user,
    loading,
    userTier,
    setUserTier,
    proExpiresAt,
    routineConfig,
    setRoutineConfig,
    isDemoMode,
    handleLogin,
    handleDemoMode,
    handleLogout
  };
};
