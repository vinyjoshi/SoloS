import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, APP_ID } from '../../constants';

const RoutineWidget = ({ schedule, onUpdate, config, setConfig, user }) => {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localStart, setLocalStart] = useState(config.start);
  const [localEnd, setLocalEnd] = useState(config.end);

  const startTimeoutRef = useRef(null);
  const endTimeoutRef = useRef(null);

  // Sync local state when config changes externally
  useEffect(() => {
    setLocalStart(config.start);
    setLocalEnd(config.end);
  }, [config]);

  // Update current hour every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    };
  }, []);

  const saveRoutineConfig = async (newStart, newEnd) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
      await setDoc(
        userRef,
        { routineConfig: { start: newStart, end: newEnd }, lastUpdated: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving routine config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartChange = (value) => {
    if (value === '') { setLocalStart(''); return; }
    const newStart = parseInt(value, 10);
    if (isNaN(newStart)) return;
    const clamped = Math.min(Math.max(newStart, 0), 24);
    setLocalStart(clamped);
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = setTimeout(() => {
      const adjustedEnd = config.end < clamped ? clamped : config.end;
      setConfig({ ...config, start: clamped, end: adjustedEnd });
      saveRoutineConfig(clamped, adjustedEnd);
    }, 2000);
  };

  const handleEndChange = (value) => {
    if (value === '') { setLocalEnd(''); return; }
    const newEnd = parseInt(value, 10);
    if (isNaN(newEnd)) return;
    const clamped = Math.min(Math.max(newEnd, 0), 24);
    setLocalEnd(clamped);
    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    endTimeoutRef.current = setTimeout(() => {
      const adjustedStart = config.start > clamped ? clamped : config.start;
      setConfig({ ...config, start: adjustedStart, end: clamped });
      saveRoutineConfig(adjustedStart, clamped);
    }, 2000);
  };

  const handleChange = (time, value) => {
    onUpdate({ ...schedule, [time]: value });
  };

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

      {/* Config Panel */}
      {isConfiguring && (
        <div className="bg-zinc-950/50 px-6 py-1 rounded-lg border border-white/10 space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Start Hour</span>
            <div className="flex items-center gap-1">
              <input
                type="number" min="0" max="23"
                value={localStart}
                onChange={(e) => handleStartChange(e.target.value)}
                disabled={isSaving}
                className="w-12 bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
              />
              <span className="text-xs font-bold text-zinc-500">: 00</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">End Hour</span>
            <div className="flex items-center gap-1">
              <input
                type="number" min="0" max="23"
                value={localEnd}
                onChange={(e) => handleEndChange(e.target.value)}
                disabled={isSaving}
                className="w-12 font-bold bg-zinc-900 border border-white/10 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
              />
              <span className="text-xs font-bold text-zinc-500">: 00</span>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="space-y-0">
        <div className="grid grid-cols-[40px_1fr_1fr] px-4 py-1 text-[12px] font-bold text-zinc-600 uppercase tracking-wider">
          <div>Hour</div>
          <div className="text-center text-[12px]">00</div>
          <div className="text-center text-[12px]">30</div>
        </div>

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
              <div className={`text-xs font-mono font-bold ${isCurrent ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {hourStr}
              </div>
              <input
                type="text"
                value={schedule[time00] || ''}
                onChange={(e) => handleChange(time00, e.target.value)}
                placeholder=""
                className="bg-transparent border-none outline-none text-xs text-zinc-300 placeholder-zinc-700 focus:text-zinc-200 text-center transition-colors"
              />
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

export default RoutineWidget;
