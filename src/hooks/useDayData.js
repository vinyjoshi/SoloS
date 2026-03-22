import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { db, APP_ID, emptyDayState } from '../constants';
import { generateDateKey, getStartOfCurrentWeek } from '../utils/dateUtils';

export const useDayData = (user, userTier, currentDate) => {
  const [dayData, setDayData] = useState(emptyDayState);
  const [synced, setSynced] = useState(true);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const dateKey = generateDateKey(currentDate);

  // --- GATEKEEPER: lock dates before current week for free tier ---
  const isDateLocked = () => {
    if (userTier === 'pro') return false;
    const startOfWeek = getStartOfCurrentWeek();
    const checkDate = new Date(currentDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < startOfWeek;
  };

  const isLocked = isDateLocked();

  // --- DAY DATA SYNC ---
  useEffect(() => {
    if (!user) return;

    if (isLocked) {
      setDayData(emptyDayState);
      return;
    }

    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'days', dateKey);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let safeTop3 = data.top3 || emptyDayState.top3;

          // Ensure 5 items
          if (safeTop3.length < 5) {
            const missing = 5 - safeTop3.length;
            for (let i = 0; i < missing; i++) safeTop3.push({ text: '', done: false });
          }

          // Migrate string[] -> object[]
          if (safeTop3.length > 0 && typeof safeTop3[0] === 'string') {
            safeTop3 = safeTop3.map((text) => ({ text, done: false }));
            if (safeTop3.length < 5) {
              const missing = 5 - safeTop3.length;
              for (let i = 0; i < missing; i++) safeTop3.push({ text: '', done: false });
            }
          }

          setDayData({ ...emptyDayState, ...data, top3: safeTop3 });
        } else {
          setDayData(emptyDayState);
        }
        setSynced(true);
      },
      (error) => console.error('Sync error:', error)
    );

    return () => unsubscribe();
  }, [user, dateKey, isLocked]);

  // --- MONTHLY EXPENSE AGGREGATOR ---
  useEffect(() => {
    if (!user) return;
    const fetchMonthlyBurn = async () => {
      const currentMonthPrefix = dateKey.substring(0, 7); // "YYYY-MM"
      const colRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'days');
      
      const q = query(
        colRef,
        where('__name__', '>=', currentMonthPrefix + '-01'),
        where('__name__', '<=', currentMonthPrefix + '-31')
      );

      try {
        const snapshot = await getDocs(q);
        let total = 0;
        snapshot.forEach((doc) => {
          const exps = doc.data().expenses || [];
          total += exps.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        });
        setMonthlyTotal(total);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMonthlyBurn();
  }, [user, currentDate, dateKey]);

  // --- SAVE ---
  const saveData = async (newData) => {
    if (isLocked) return;
    setDayData(newData);
    setSynced(false);
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'days', dateKey);
      await setDoc(docRef, newData);
      setSynced(true);
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const updateField = (field, value) => {
    saveData({ ...dayData, [field]: value });
  };

  return {
    dayData,
    synced,
    monthlyTotal,
    isLocked,
    dateKey,
    saveData,
    updateField
  };
};