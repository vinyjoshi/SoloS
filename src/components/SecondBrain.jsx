
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AreaFilterBar } from './AreaFilterBar';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { 
  Layers, X, Briefcase, Globe, Archive, Trash2, Plus, MoreVertical, FolderInput, RotateCcw, Tag, ChevronLeft
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const DocEditor = ({ docData, onBack, user, appId, db, areaOptions, defaultArea }) => {
  const [title, setTitle] = useState(docData.title);
  const [body, setBody] = useState(docData.body);
  const [category, setCategory] = useState(docData.category);
  const [tags, setTags] = useState(docData.tags ? docData.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef(null);
  const NO_AREA_LABEL = 'Noise';
  const [area, setArea] = useState(
    docData.area && docData.area.trim() !== '' ? docData.area : NO_AREA_LABEL
  );
  
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const docTags = docData.tags || [];
    
    if (
      title === docData.title &&
      body === docData.body &&
      category === docData.category &&
      area === (docData.area || '') &&
      JSON.stringify(tagsArray) === JSON.stringify(docTags)
    ) return;


    setSaving(true);
    timeoutRef.current = setTimeout(async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docData.id);
      await updateDoc(docRef, {
        title,
        body,
        category,
        area,
        tags: tagsArray,
        updatedAt: serverTimestamp()
      });

      setSaving(false);
    }, 1000); 

    return () => clearTimeout(timeoutRef.current);
  }, [title, body, tags, category, area, appId, db, user.uid, docData]);


  const handleSoftDelete = async () => {
      // Check if item is in trash
      const isInTrash = category === 'trash';

      let confirmMessage = '';
      
      if (isInTrash) {
        confirmMessage = 'Delete this document permanently?';
        // Confirmation dialog FIRST
        const confirmed = window.confirm(confirmMessage);
          if (!confirmed) return;  // User cancelled
      }

      // Proceed with deletion/move (only if confirmed)
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docData.id);
        
        if (isInTrash) {
          // PERMANENT DELETE
          await deleteDoc(docRef);
        } else {
          // Move to Trash
          await updateDoc(docRef, { 
            category: 'trash',
            updatedAt: serverTimestamp()
          });
        }

        // Close the editor and return to list
        onBack();
        
      } catch(error) { 
        console.error('Delete error:', error);
        alert('Failed to delete document. Please try again.');
      }
    };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-4">
             <div className="text-[10px] font-mono text-zinc-500 uppercase">{saving ? 'Saving...' : 'Saved'}</div>
             {category === 'projects' && (
                <select 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="text-xs bg-zinc-800 border border-white/10 rounded px-2 py-1 text-emerald-400 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer hover:bg-zinc-700"
                >
                  <option value={NO_AREA_LABEL}>{NO_AREA_LABEL}</option>
                  {areaOptions
                    .filter(opt => opt !== NO_AREA_LABEL)
                    .map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                </select>
              )}
                          
             <button onClick={handleSoftDelete} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Document"
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-zinc-700 border-none outline-none mb-4"
        />
        <div className="flex items-center gap-2 mb-6">
            <Tag size={14} className="text-zinc-500" />
            <input 
              type="text" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags (comma separated)"
              className="flex-1 bg-transparent text-xs text-emerald-400 placeholder-zinc-700 border-none outline-none font-mono"
            />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start typing..."
          className="w-full h-[calc(100%-150px)] bg-transparent text-sm leading-relaxed text-zinc-300 placeholder-zinc-800 border-none outline-none resize-none"
        />
      </div>
    </div>
  );
};

export const SecondBrainPanel = ({ isOpen, onClose, user, appId, db, setShowPricing, userTier }) => {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); 
  const [openMenuId, setOpenMenuId] = useState(null);
  const DEFAULT_AREAS = ['Work', 'Health', 'Family', 'Money', 'Love']; 
  const NO_AREA_LABEL = 'Noise';
  const menuRef = useRef(null);
  const [areaFilter, setAreaFilter] = useState('all');
  const [customAreas, setCustomAreas] = useState([]);
  const [areaSearchInput, setAreaSearchInput] = useState('');
  const [areaPills, setAreaPills] = useState([]);
  const areaOptions = [
    ...new Set([
      NO_AREA_LABEL,
      ...DEFAULT_AREAS,
      ...customAreas,
      ...docs
        .filter((d) => d.category === 'projects' && d.area)
        .map((d) => d.area),
    ]),
  ];
  
  const AREA_COLORS = {
    'Noise': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30 hover:border-zinc-400/60',
    'Career': 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-400/60',
    'Health': 'bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-400/60',
    'Family': 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-400/60',
    'Finance': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-400/60',
  };
  
  const getAreaColor = (area) => {
    return AREA_COLORS[area] || 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:border-orange-400/60';
  };

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const docsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'docs');
    const q = query(docsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedDocs = [];
      snapshot.forEach((doc) => {
        fetchedDocs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setDocs(fetchedDocs);
    }, (error) => {
      console.error("Error fetching documents:", error);
    });

    return () => unsubscribe();
  }, [user, isOpen, appId, db]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || !isOpen) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data();
      if (data && Array.isArray(data.customAreas)) {
        setCustomAreas(data.customAreas);
      } else {
        setCustomAreas([]);
      }
    });
    return () => unsubscribe();
  }, [user, isOpen, appId, db]);


  useEffect(() => {
    if (!openMenuId) return;

    const positionMenu = () => {
      const menuElement = document.getElementById(`menu-${openMenuId}`);
      const triggerButton = document.querySelector(`button[data-menu-trigger="${openMenuId}"]`);
      
      if (!menuElement || !triggerButton) return;

      const triggerRect = triggerButton.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = menuElement.offsetHeight;
      const padding = 16;

      // Calculate position
      let left = triggerRect.left - menuWidth - padding; // Open to the LEFT
      let top = triggerRect.top;

      // If menu goes off-screen left, flip to right
      if (left < padding) {
        left = triggerRect.right + padding;
      }

      // Prevent menu from going off bottom
      if (top + menuHeight > window.innerHeight - padding) {
        top = window.innerHeight - menuHeight - padding;
      }

      // Prevent menu from going off top
      if (top < padding) {
        top = padding;
      }

      menuElement.style.left = `${left}px`;
      menuElement.style.top = `${top}px`;
    };

    // Position on mount and on window resize
    positionMenu();
    window.addEventListener('resize', positionMenu);
    
    return () => window.removeEventListener('resize', positionMenu);
  }, [openMenuId]);

  const handleCreateDoc = async (category) => {
    // --- LIMIT CHECK ---
    if (userTier === 'free') {
        const count = docs.filter(d => d.category === category).length;
        const limits = { projects: 5, resources: 20 };
        if (limits[category] && count >= limits[category]) {
            setShowPricing(true);
            return;
        }
    }

    // Default to 'Noise' for new projects
    const defaultArea =
      category === 'projects' && areaFilter !== 'all' && areaFilter !== NO_AREA_LABEL
        ? areaFilter
        : NO_AREA_LABEL;

    const newDoc = {
      title: 'Untitled Document',
      body: '',
      category: category,
      tags: [],
      ...(category === 'projects' ? { area: defaultArea } : {}),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'docs'), newDoc);    
    setSelectedDoc({ id: docRef.id, ...newDoc }); 
  };

  const handleMoveDoc = async (docId, newCategory) => {
     try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { 
            category: newCategory, 
            updatedAt: serverTimestamp() 
        });
        setOpenMenuId(null); 
     } catch (e) { console.error(e); }
  };

  const handleDeleteDoc = async (docId) => {
    const confirmed = window.confirm('Delete this document permanently?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId));
      
      // Close menu
      setOpenMenuId(null);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleRestore = async (docId) => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { category: 'projects', updatedAt: serverTimestamp() });
        setOpenMenuId(null);
      } catch (err) { console.error(err); }
  };

  const handleMoveToTrash = async (docId) => {
    // const confirmed = window.confirm('Move to Trash?');
    // if (!confirmed) return;

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', docId);
      await updateDoc(docRef, { 
        category: 'trash',
        updatedAt: serverTimestamp()
      });
      
      setOpenMenuId(null);
      
    } catch (error) {
      console.error('Error moving to trash:', error);
      alert('Failed to move document to trash. Please try again.');
    }
  };

  const saveCustomAreas = async (areas) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    await setDoc(profileRef, { customAreas: areas, updatedAt: serverTimestamp() }, { merge: true });
  };

  const handleAddArea = async () => {
    const trimmed = newAreaName.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...customAreas, trimmed]));
    setCustomAreas(next);
    setNewAreaName('');
    await saveCustomAreas(next);
  };

  const renderDocList = (category) => {
    const categoryDocs = docs.filter((d) => {
      if (d.category !== category) return false;
      if (category === 'projects' && areaFilter !== 'all') {
        // Treat empty/undefined areas as 'Noise' for backward compatibility
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
        {categoryDocs.map(doc => (
          <div 
            key={doc.id}
            className="relative w-full flex items-center justify-between bg-zinc-800/30 border border-white/5 rounded-lg hover:bg-zinc-800 hover:border-white/10 transition-all text-left group"
          >
            {/* Main Click Area */}
            <button 
              type="button"
              onClick={() => setSelectedDoc(doc)}
              className="flex-1 min-w-0 p-2.5 text-left z-0"
            >
              <div className={`text-sm font-medium truncate ${category === 'trash' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                {doc.title || "Untitled"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const docArea = category === 'projects' 
                    ? (doc.area && doc.area.trim() !== '' ? doc.area : NO_AREA_LABEL)
                    : null;
                  
                  const docTags = [
                    ...(docArea ? [docArea] : []),
                    ...(doc.tags || []),
                  ];

                  if (docTags.length === 0) return null;

                  return (
                    <div className="flex gap-1">
                      {docTags.map((tag, i) => {
                        const isAreaTag = i === 0 && category === 'projects';
                        
                        // Get area-specific color if it's an area tag
                        let badgeColor = 'bg-emerald-500/10 text-emerald-400'; // Default for regular tags
                        
                        if (isAreaTag) {
                          const areaColors = {
                            'Noise': 'bg-zinc-500/10 text-zinc-500',
                            'Career': 'bg-blue-500/10 text-blue-400',
                            'Health': 'bg-green-500/10 text-green-400',
                            'Family': 'bg-purple-500/10 text-purple-400',
                            'Finance': 'bg-emerald-500/10 text-emerald-400',
                          };
                          badgeColor = areaColors[tag] || 'bg-orange-500/10 text-orange-400';
                        }
                        
                        return (
                          <span
                            key={`${tag}-${i}`}
                            className={`text-[12px] px-1.5 py-0.5 rounded font-mono ${badgeColor}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="text-[9px] text-zinc-600 font-mono">
                  {doc.updatedAt?.toDate ? doc.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                </div>
              </div>
            </button>

            {/* 3-Dot Menu Trigger */}
            <div className="relative pr-2">
              <button 
                data-menu-trigger={doc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors z-10"
              >
                <MoreVertical size={16} />
              </button>

              {/* Dropdown Menu using Portal */}
              {openMenuId === doc.id && createPortal(
                <div 
                  className="fixed w-48 bg-[#18181b] border border-white/10 rounded-lg shadow-2xl z-[9998] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    top: '0',
                    left: '0',
                    // Will be positioned by JavaScript below
                  }}
                  ref={menuRef}
                  id={`menu-${doc.id}`}
                >
                  {category === 'trash' ? (
                    <>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleRestore(doc.id); 
                        }} 
                        className="w-full text-left px-4 py-2.5 text-xs text-emerald-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteDoc(doc.id); 
                        }} 
                        className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5 transition-colors"
                      >
                        <Trash2 size={14} /> Delete Permanently
                      </button>
                    </>
                  ) : (
                    <>
                      {['projects','resources','archives'].map(cat => (
                        cat !== category && (
                          <button 
                            key={cat} 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleMoveDoc(doc.id, cat); 
                            }} 
                            className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 capitalize transition-colors"
                          >
                            <FolderInput size={14} /> Move to {cat}
                          </button>
                        )
                      ))}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleMoveToTrash(doc.id); 
                        }} 
                        className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5 transition-colors"
                      >
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
        
        {category !== 'archives' && category !== 'trash' && category !== 'areas' && (
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

      <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
        {selectedDoc ? (
          <DocEditor
            docData={selectedDoc}
            onBack={() => setSelectedDoc(null)}
            user={user}
            appId={appId}
            db={db}
            areaOptions={areaOptions}
            defaultArea={areaOptions[0] || 'Career'}
          />

        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col bg-[#09090b]">
            {/* NEW: AreaFilterBar at top */}
            <AreaFilterBar
              areaFilter={areaFilter}
              setAreaFilter={setAreaFilter}
              customAreas={customAreas}
              setCustomAreas={setCustomAreas}
              user={user}
              db={db}
              appId={appId}
              docs={docs}
              areaSearchInput={areaSearchInput}
              setAreaSearchInput={setAreaSearchInput}
            />

            {/* Projects list scrolls below */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <CollapsibleSection title="Projects" icon={Briefcase} defaultOpen={true}>{renderDocList('projects')}</CollapsibleSection>
              <CollapsibleSection title="Resources" icon={Globe} defaultOpen={false}>{renderDocList('resources')}</CollapsibleSection>
              <CollapsibleSection title="Archives" icon={Archive} defaultOpen={false}>{renderDocList('archives')}</CollapsibleSection>
              <div className="mt-8 pt-4 border-t border-white/5">
                <CollapsibleSection title="Trash" icon={Trash2} defaultOpen={false}>{renderDocList('trash')}</CollapsibleSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
