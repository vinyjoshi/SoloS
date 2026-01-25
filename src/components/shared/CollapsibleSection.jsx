
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, summary }) => {
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
            {isOpen ? <ChevronUp size={16} className="text-zinc-500"/> : <ChevronDown size={16} className="text-zinc-500" />}
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
