import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Trash2, Tag } from 'lucide-react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, APP_ID } from '../../constants';

const NO_AREA_LABEL = 'Noise';

const DocEditor = ({ docData, onBack, user, areaOptions }) => {
  const [title, setTitle] = useState(docData.title);
  const [body, setBody] = useState(docData.body);
  const [category, setCategory] = useState(docData.category);
  const [tags, setTags] = useState(docData.tags ? docData.tags.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(
    docData.area && docData.area.trim() !== '' ? docData.area : NO_AREA_LABEL
  );
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const tagsArray = tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
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
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'docs', docData.id);
      await updateDoc(docRef, {
        title,
        body,
        category,
        area,
        tags: tagsArray,
        updatedAt: serverTimestamp(),
      });
      setSaving(false);
    }, 1000);

    return () => clearTimeout(timeoutRef.current);
  }, [title, body, tags, category, area, docData, user.uid]);

  const handleSoftDelete = async () => {
    const isInTrash = category === 'trash';

    if (isInTrash) {
      const confirmed = window.confirm('Delete this document permanently?');
      if (!confirmed) return;
    }

    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'docs', docData.id);
      if (isInTrash) {
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, { category: 'trash', updatedAt: serverTimestamp() });
      }
      onBack();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">
            {saving ? 'Saving...' : 'Saved'}
          </div>
          {category === 'projects' && (
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="text-xs bg-zinc-800 border border-white/10 rounded px-2 py-1 text-emerald-400 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer hover:bg-zinc-700"
            >
              <option value={NO_AREA_LABEL}>{NO_AREA_LABEL}</option>
              {areaOptions
                .filter((opt) => opt !== NO_AREA_LABEL)
                .map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
          )}
          <button onClick={handleSoftDelete} className="text-zinc-600 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
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

export default DocEditor;
