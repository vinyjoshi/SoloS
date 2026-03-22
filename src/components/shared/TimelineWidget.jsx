
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateDateKey, getDaysInMonth, getFirstDayOfMonth, getStartOfWeek } from '../../utils/date';

export const TimelineWidget = ({ currentDate, setCurrentDate }) => {
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
