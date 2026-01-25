
import { CheckCircle } from 'lucide-react';

export const Top3Widget = ({ top3, onUpdate }) => {
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
