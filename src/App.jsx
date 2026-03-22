import { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { Brain, Target, Clock, DollarSign, BookOpen, Lock } from 'lucide-react';

// Constants & Utils
import { auth } from './constants';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useDayData } from './hooks/useDayData';

// Components
import LoginPage from './components/auth/LoginPage';
import Header from './components/layout/Header';
import PricingModal from './components/modals/PricingModal';
import CollapsibleSection from './components/shared/CollapsibleSection';
import TimelineWidget from './components/daily/TimelineWidget';
import Top3Widget from './components/daily/Top3Widget';
import RoutineWidget from './components/daily/RoutineWidget';
import ExpenseWidget from './components/daily/ExpenseWidget';
import TextWidget from './components/daily/TextWidget';
import SecondBrainPanel from './components/brain/SecondBrainPanel';

export default function SoloS() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const headerRef = useRef(null);

  const {
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
  } = useAuth();

  const {
    dayData,
    synced,
    monthlyTotal,
    isLocked,
    updateField,
  } = useDayData(user, userTier, currentDate);

  // Lock scroll when pricing modal is open
  useEffect(() => {
    if (showPricing) {
      setIsMenuOpen(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showPricing]);

  // Measure header height for modal offset
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

  // Derived state for summaries
  const top3Completed = dayData.top3.filter((t) => t.done).length;
  const top3Summary = (
    <div className={`text-[10px] font-bold tracking-widest ${top3Completed === 5 ? 'text-emerald-400' : 'text-zinc-500'}`}>
      [{top3Completed}/5 DONE]
    </div>
  );

  const dailyBurn = dayData.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const burnSummary = (
    <div className="flex gap-2 text-[10px] font-mono text-zinc-500">
      <span>DAY: <span className="text-zinc-300">₹{dailyBurn.toFixed(0)}</span></span>
      <span className="text-zinc-700">|</span>
      <span>MO: <span className="text-zinc-300">₹{monthlyTotal.toFixed(0)}</span></span>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono animate-pulse">
        BOOTING KERNEL...
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} onDemoMode={handleDemoMode} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/50 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Guest MODE • Data will be lost on logout
            </span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
          >
            Exit
          </button>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          headerOffset={headerHeight}
          user={user}
          setUserTier={setUserTier}
        />
      )}

      {/* Header */}
      <Header
        user={user}
        synced={synced}
        userTier={userTier}
        proExpiresAt={proExpiresAt}
        isDemoMode={isDemoMode}
        setShowPricing={setShowPricing}
        setIsMenuOpen={setIsMenuOpen}
        headerRef={headerRef}
      />

      {/* Main Content */}
      <main className={`p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-20 transition-all duration-300 ${isMenuOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <TimelineWidget currentDate={currentDate} setCurrentDate={setCurrentDate} />

        {isLocked ? (
          <div
            className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden group cursor-pointer"
            onClick={() => setShowPricing(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
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
              <TextWidget
                value={dayData.brainDump}
                onChange={(val) => updateField('brainDump', val)}
                placeholder="Capture phase. Dump raw thoughts here. Refactor into Docs later."
                minHeight="h-48"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Top Priorities" icon={Target} defaultOpen={true} summary={top3Summary}>
              <Top3Widget
                top3={dayData.top3}
                onUpdate={(val) => updateField('top3', val)}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Routine" icon={Clock} defaultOpen={false}>
              <RoutineWidget
                schedule={dayData.schedule}
                onUpdate={(val) => updateField('schedule', val)}
                config={routineConfig}
                setConfig={setRoutineConfig}
                user={user}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Burn Rate" icon={DollarSign} defaultOpen={false} summary={burnSummary}>
              <ExpenseWidget
                expenses={dayData.expenses}
                onUpdate={(val) => updateField('expenses', val)}
                currentDate={currentDate}
                user={user}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Reflection" icon={BookOpen} defaultOpen={false}>
              <TextWidget
                value={dayData.journal}
                onChange={(val) => updateField('journal', val)}
                placeholder="Distill today's lessons."
                minHeight="h-48"
              />
            </CollapsibleSection>
          </>
        )}
      </main>

      {/* Second Brain Side Panel */}
      <SecondBrainPanel
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        setShowPricing={setShowPricing}
        userTier={userTier}
      />
    </div>
  );
}
