
import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const RoutineWidget = ({ schedule, onUpdate, config, setConfig, user, db, appId }) => {
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
