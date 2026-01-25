
import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const AreaFilterBar = ({
  areaFilter,
  setAreaFilter,
  customAreas,
  setCustomAreas,
  user,
  db, 
  appId,
  docs,
  areaSearchInput,
  setAreaSearchInput,
}) => {
  const [newAreaName, setNewAreaName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const NO_AREA_LABEL = 'Noise';

  const docCounts = docs.reduce((acc, doc) => {
    if (doc.category === 'projects') {
      const area = doc.area && doc.area.trim() !== '' ? doc.area : NO_AREA_LABEL;
      acc[area] = (acc[area] || 0) + 1;
    }
    return acc;
  }, {});

  const allPills = [
    'all',
    ...new Set([
      ...customAreas,
      ...docs.filter(d => d.category === 'projects' && d.area).map(d => d.area),
    ]),
  ];

  const filteredPills = allPills.filter(
    pill =>
      pill &&
      pill.toLowerCase().includes(areaSearchInput.toLowerCase())
  );

  const handleAddArea = async () => {
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...customAreas, trimmed]));
    setCustomAreas(next);
    setNewAreaName('');
    setIsAdding(false);
    await saveCustomAreas(next);
  };

  const saveCustomAreas = async (areas) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    await setDoc(profileRef, { customAreas: areas, updatedAt: serverTimestamp() }, { merge: true });
  };

  return (
    <div className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Search size={16} className="text-zinc-500" />
        <input
          type="text"
          placeholder="Filter areas..."
          value={areaSearchInput}
          onChange={e => setAreaSearchInput(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none border-none"
        />
        {areaSearchInput && (
          <button onClick={() => setAreaSearchInput('')} className="text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {filteredPills.map(pill => (
          <button
            key={pill}
            onClick={() => setAreaFilter(pill)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              areaFilter === pill
                ? 'bg-emerald-500 text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {pill === 'all' ? 'All' : pill}
            <span className="ml-1.5 text-xs opacity-60">
              {pill === 'all'
                ? docs.filter(d => d.category === 'projects').length
                : docCounts[pill] || 0}
            </span>
          </button>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddArea()}
              placeholder="New area name"
              className="bg-zinc-700 w-28 text-white text-xs rounded-full px-2.5 py-1 outline-none"
            />
            <button
              onClick={handleAddArea}
              className="p-1.5 bg-emerald-500 text-black rounded-full hover:bg-emerald-400"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1.5 bg-zinc-700 text-white rounded-full hover:bg-zinc-600"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            + New
          </button>
        )}
      </div>
    </div>
  );
};
