import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers, X, Plus, Trash2, MoreVertical, FolderInput, RotateCcw,
  Briefcase, Globe, Archive
} from 'lucide-react';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db, APP_ID } from '../../constants';
import CollapsibleSection from '../shared/CollapsibleSection';
import DocEditor from './DocEditor';
import { AreaFilterBar } from './AreaFilterBar';

const NO_AREA_LABEL = 'Noise';

const SecondBrainPanel = ({ isOpen, onClose, user, setShowPricing, userTier }) => {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [areaFilter, setAreaFilter] = useState('all');
  const [customAreas, setCustomAreas] = useState([]);
  const [areaSearchInput, setAreaSearchInput] = useState('');
  const menuRef = useRef(null);

  const areaOptions = [
    ...new Set([
      NO_AREA_LABEL,
      ...customAreas,
      ...docs.filter((d) => d.category === 'projects' && d.area).map((d) => d.area),
    ]),
  ];

  // Fetch docs
  useEffect(() => {
    if (!user || !isOpen) return;
    const docsRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'docs');
    const q = query(docsRef, orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      setDocs(fetched);
    });
    return () => unsubscribe();
  }, [user, isOpen]);

  // Fetch custom areas
  useEffect(() => {
    if (!user || !isOpen) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data();
      if (data && Array.isArray(data.customAreas)) setCustomAreas(data.customAreas);
      else setCustomAreas([]);
    });
    return () => unsubscribe();
  }, [user, isOpen]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position dropdown menu
  useEffect(() => {
    if (!openMenuId) return;
    const positionMenu = () => {
      const menuElement = document.getElementById(`menu-${openMenuId}`);
      const triggerButton = document.querySelector(`button[data-menu-trigger="${openMenuId}"]`);
      if (!menuElement || !triggerButton) return;
      const triggerRect = triggerButton.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = menuElement.offsetHeight;
      const padding = 16;
      let left = triggerRect.left - menuWidth - padding;
      let top = triggerRect.top;
      if (left < padding) left = triggerRect.right + padding;
      if (top + menuHeight > window.innerHeight - padding) top = window.innerHeight - menuHeight - padding;
      if (top < padding) top = padding;
      menuElement.style.left = `${left}px`;
      menuElement.style.top = `${top}px`;
    };
    positionMenu();
    window.addEventListener('resize', positionMenu);
    return () => window.removeEventListener('resize', positionMenu);
  }, [openMenuId]);

  const handleCreateDoc = async (category) => {
    if (userTier === 'free') {
      const count = docs.filter((d) => d.category === category).length;
      const limits = { projects: 5, resources: 20 };
      if (limits[category] && count >= limits[category]) {
        setShowPricing(true);
        return;
      }
    }

    const defaultArea =
      category === 'projects' && areaFilter !== 'all' && areaFilter !== NO_AREA_LABEL
        ? areaFilter
        : NO_AREA_LABEL;

    const newDoc = {
      title: 'Untitled Document',
      body: '',
      category,
      tags: [],
      ...(category === 'projects' ? { area: defaultArea } : {}),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'docs'),
      newDoc
    );
    setSelectedDoc({ id: docRef.id, ...newDoc });
  };

  const handleMoveDoc = async (docId, newCategory) => {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'docs', docId);
      await updateDoc(docRef, { category: newCategory, updatedAt: serverTimestamp() });
      setOpenMenuId(null);
    } catch (e) { console.error(e); }
  };

  const handleMoveToTrash = async (docId) => {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'docs', docId);
      await updateDoc(docRef, { category: 'trash', updatedAt: serverTimestamp() });
      setOpenMenuId(null);
    } catch (error) { console.error(error); }
  };

  const handleRestore = async (docId) => {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'docs', docId);
      await updateDoc(docRef, { category: 'projects', updatedAt: serverTimestamp() });
      setOpenMenuId(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteDoc = async (docId) => {
    const confirmed = window.confirm('Delete this document permanently?');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'docs', docId));
      setOpenMenuId(null);
    } catch (error) { console.error(error); }
  };

  const renderDocList = (category) => {
    const categoryDocs = docs.filter((d) => {
      if (d.category !== category) return false;
      if (category === 'projects' && areaFilter !== 'all') {
        const docArea = d.area && d.area.trim() !== '' ? d.area : NO_AREA_LABEL;
        return docArea === areaFilter;
      }
      return true;
    });

    return (
      <div className="space-y-2 mt-2 pb-2">
        {categoryDocs.length === 0 && (
          <div className="text-center py-4 text-xs text-zinc-600 border border-dashed border-white/5 rounded-lg">
            No items in {category}.
          </div>
        )}

        {categoryDocs.map((d) => (
          <div
            key={d.id}
            className="relative w-full flex items-center justify-between bg-zinc-800/30 border border-white/5 rounded-lg hover:bg-zinc-800 hover:border-white/10 transition-all text-left group"
          >
            {/* Main click area */}
            <button
              type="button"
              onClick={() => setSelectedDoc(d)}
              className="flex-1 min-w-0 p-2.5 text-left z-0"
            >
              <div className={`text-sm font-medium truncate ${category === 'trash' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                {d.title || 'Untitled'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const docArea = category === 'projects'
                    ? (d.area && d.area.trim() !== '' ? d.area : NO_AREA_LABEL)
                    : null;
                  const docTags = [...(docArea ? [docArea] : []), ...(d.tags || [])];
                  if (docTags.length === 0) return null;

                  const areaColors = {
                    Noise: 'bg-zinc-500/10 text-zinc-500',
                    Career: 'bg-blue-500/10 text-blue-400',
                    Health: 'bg-green-500/10 text-green-400',
                    Family: 'bg-purple-500/10 text-purple-400',
                    Finance: 'bg-emerald-500/10 text-emerald-400',
                  };

                  return (
                    <div className="flex gap-1">
                      {docTags.map((tag, i) => {
                        const isAreaTag = i === 0 && category === 'projects';
                        const badgeColor = isAreaTag
                          ? (areaColors[tag] || 'bg-orange-500/10 text-orange-400')
                          : 'bg-emerald-500/10 text-emerald-400';
                        return (
                          <span key={`${tag}-${i}`} className={`text-[12px] px-1.5 py-0.5 rounded font-mono ${badgeColor}`}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
                <div className="text-[9px] text-zinc-600 font-mono">
                  {d.updatedAt?.toDate ? d.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                </div>
              </div>
            </button>

            {/* 3-dot menu */}
            <div className="relative pr-2">
              <button
                data-menu-trigger={d.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === d.id ? null : d.id);
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors z-10"
              >
                <MoreVertical size={16} />
              </button>

              {openMenuId === d.id && createPortal(
                <div
                  className="fixed w-48 bg-[#18181b] border border-white/10 rounded-lg shadow-2xl z-[9998] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                  style={{ top: '0', left: '0' }}
                  ref={menuRef}
                  id={`menu-${d.id}`}
                >
                  {category === 'trash' ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleRestore(d.id); }} className="w-full text-left px-4 py-2.5 text-xs text-emerald-400 hover:bg-white/5 flex items-center gap-2 transition-colors">
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id); }} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5 transition-colors">
                        <Trash2 size={14} /> Delete Permanently
                      </button>
                    </>
                  ) : (
                    <>
                      {['projects', 'resources', 'archives'].map((cat) =>
                        cat !== category ? (
                          <button key={cat} onClick={(e) => { e.stopPropagation(); handleMoveDoc(d.id, cat); }} className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 capitalize transition-colors">
                            <FolderInput size={14} /> Move to {cat}
                          </button>
                        ) : null
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleMoveToTrash(d.id); }} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5 transition-colors">
                        <Trash2 size={14} /> Move to Trash
                      </button>
                    </>
                  )}
                </div>,
                document.body
              )}
            </div>
          </div>
        ))}

        {category !== 'archives' && category !== 'trash' && (
          <button
            type="button"
            onClick={() => handleCreateDoc(category)}
            className="w-full py-2.5 mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add {category.slice(0, -1)}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#09090b] border-l border-white/10 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Layers className="text-white" size={18} />
          </div>
          <span className="font-bold text-white tracking-tight text-lg">Second Brain</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {selectedDoc ? (
          <DocEditor
            docData={selectedDoc}
            onBack={() => setSelectedDoc(null)}
            user={user}
            areaOptions={areaOptions}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
            <AreaFilterBar
              areaFilter={areaFilter}
              setAreaFilter={setAreaFilter}
              customAreas={customAreas}
              setCustomAreas={setCustomAreas}
              user={user}
              db={db}
              appId={APP_ID}
              docs={docs}
              areaSearchInput={areaSearchInput}
              setAreaSearchInput={setAreaSearchInput}
            />
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <CollapsibleSection title="Projects" icon={Briefcase} defaultOpen={true}>
                {renderDocList('projects')}
              </CollapsibleSection>
              <CollapsibleSection title="Resources" icon={Globe} defaultOpen={false}>
                {renderDocList('resources')}
              </CollapsibleSection>
              <CollapsibleSection title="Archives" icon={Archive} defaultOpen={false}>
                {renderDocList('archives')}
              </CollapsibleSection>
              <div className="mt-8 pt-4 border-t border-white/5">
                <CollapsibleSection title="Trash" icon={Trash2} defaultOpen={false}>
                  {renderDocList('trash')}
                </CollapsibleSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondBrainPanel;