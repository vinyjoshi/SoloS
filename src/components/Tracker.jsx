
import { useState, useEffect } from 'react';
import { Lock, Brain, Target, Clock, DollarSign, BookOpen } from 'lucide-react';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { TimelineWidget } from './shared/TimelineWidget';
import { RoutineWidget } from './shared/RoutineWidget';
import { Top3Widget } from './shared/Top3Widget';
import { ExpenseWidget } from './shared/ExpenseWidget';
import { TextWidget } from './shared/TextWidget';
import { getStartOfCurrentWeek, generateDateKey } from '../utils/date';
import { doc, onSnapshot, setDoc, getDocs, collection } from 'firebase/firestore';

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

export const Tracker = ({ user, db, userTier, setShowPricing }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayData, setDayData] = useState(emptyDayState);
  const [synced, setSynced] = useState(true);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [routineConfig, setRoutineConfig] = useState({ start: 6, end: 23 });

  const dateKey = generateDateKey(currentDate);

  const isDateLocked = () => {
      if (userTier === 'pro') return false;
      const startOfWeek = getStartOfCurrentWeek();
      const checkDate = new Date(currentDate);
      checkDate.setHours(0,0,0,0);
      return checkDate < startOfWeek;
  };
  
  const isLocked = isDateLocked();

  useEffect(() => {
    setDayData(emptyDayState);
    setSynced(true);

    if (!user) return;
    
    if (isLocked) {
        setDayData(emptyDayState);
        return;
    }

    const docRef = doc(db, 'artifacts', 'solos-web', 'users', user.uid, 'days', dateKey);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let safeTop3 = data.top3 || emptyDayState.top3;
        
        if (safeTop3.length < 5) {
            const missing = 5 - safeTop3.length;
            for(let i=0; i<missing; i++) safeTop3.push({ text: '', done: false });
        }

        if (safeTop3.length > 0 && typeof safeTop3[0] === 'string') {
            safeTop3 = safeTop3.map(text => ({ text, done: false }));
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
    }, (error) => {
        console.error("Sync error:", error);
    });

    return () => unsubscribe();
  }, [user, dateKey, isLocked]);

  useEffect(() => {
      if (!user) return;
      const fetchMonthlyBurn = async () => {
          const colRef = collection(db, 'artifacts', 'solos-web', 'users', user.uid, 'days');
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

  const saveData = async (newData) => {
    if (isLocked) {
      console.log("Save prevented: Date is locked.");
      return;
    }
    setDayData(newData);
    setSynced(false);
    if (!user) {
      console.log("Save prevented: No user is logged in.");
      return;
    }
    try {
      const sanitizedData = JSON.parse(JSON.stringify(newData));
      const docRef = doc(db, 'artifacts', 'solos-web', 'users', user.uid, 'days', dateKey);
      await setDoc(docRef, sanitizedData, { merge: true });
      setSynced(true);
      console.log("Save successful!");
    } catch (e) {
      console.error("Save failed with error:", e);
    }
  };

  const updateField = (field, value) => {
    saveData({ ...dayData, [field]: value });
  };

  const top3Completed = dayData.top3.filter(t => t.done).length;
  const top3Summary = <div className={`text-[10px] font-bold tracking-widest ${top3Completed === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>[{top3Completed}/5 DONE]</div>;
  const dailyBurn = dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const burnSummary = <div className="flex gap-2 text-[10px] font-mono text-zinc-500"><span>DAY: <span className="text-zinc-300">${dailyBurn.toFixed(0)}</span></span><span className="text-zinc-700">|</span><span>MO: <span className="text-zinc-300">${monthlyTotal.toFixed(0)}</span></span></div>;

  return (
    <main className={`p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-20 transition-all duration-300`}>
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
                    appId={'solos-web'}
                  />
              </CollapsibleSection>
              <CollapsibleSection title="Burn Rate" icon={DollarSign} defaultOpen={false} summary={burnSummary}>
                <ExpenseWidget 
                  expenses={dayData.expenses} 
                  onUpdate={(val) => updateField('expenses', val)} 
                  currentDate={currentDate}
                  user={user}
                  db={db}
                  appId={'solos-web'}
                />
            </CollapsibleSection>
              <CollapsibleSection title="Reflection" icon={BookOpen} defaultOpen={false}>
                  <TextWidget value={dayData.journal} onChange={(val) => updateField('journal', val)} placeholder="Distill today's lessons." minHeight="h-48"/>
              </CollapsibleSection>
          </>
      )}
    </main>
  );
};
