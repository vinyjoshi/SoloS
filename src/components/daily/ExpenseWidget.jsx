import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db, APP_ID } from '../../constants';
import { generateDateKey } from '../../utils/dateUtils';

const PREDEFINED_CATEGORIES = [
  { id: 'food', label: 'Food', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'transport', label: 'Transport', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'bills', label: 'Bills', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  { id: 'home', label: 'Home Essentials', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
];

const CATEGORY_COLOR_PALETTES = [
  { id: 'purple', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', bg: 'bg-purple-500/20 border-l-4 border-purple-500' },
  { id: 'pink', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30', bg: 'bg-pink-500/20 border-l-4 border-pink-500' },
  { id: 'indigo', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', bg: 'bg-indigo-500/20 border-l-4 border-indigo-500' },
  { id: 'cyan', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', bg: 'bg-cyan-500/20 border-l-4 border-cyan-500' },
  { id: 'amber', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', bg: 'bg-amber-500/20 border-l-4 border-amber-500' },
  { id: 'lime', color: 'bg-lime-500/10 text-lime-400 border-lime-500/30', bg: 'bg-lime-500/20 border-l-4 border-lime-500' },
  { id: 'rose', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', bg: 'bg-rose-500/20 border-l-4 border-rose-500' },
  { id: 'teal', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', bg: 'bg-teal-500/20 border-l-4 border-teal-500' },
];

const getRandomColor = () =>
  CATEGORY_COLOR_PALETTES[Math.floor(Math.random() * CATEGORY_COLOR_PALETTES.length)];

const ExpenseWidget = ({ expenses, onUpdate, currentDate, user }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [customCategoryColors, setCustomCategoryColors] = useState({});

  const todayKey = generateDateKey(currentDate);

  const allCategories = [
    ...PREDEFINED_CATEGORIES,
    ...customCategories.map((cat) => ({
      id: `custom-${cat}`,
      label: cat,
      isCustom: true,
    })),
  ];

  // Fetch custom categories from Firestore
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data();
      if (data && Array.isArray(data.customExpenseCategories)) {
        setCustomCategories(data.customExpenseCategories);
      }
      if (data && typeof data.customCategoryColors === 'object') {
        setCustomCategoryColors(data.customCategoryColors);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch monthly expenses
  useEffect(() => {
    if (!user) return;
    const fetchMonthlyExpenses = async () => {
      const currentMonthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const colRef = collection(db, 'artifacts', APP_ID, 'users', user.uid, 'days');

      const q = query(
        colRef,
        where('__name__', '>=', currentMonthPrefix + '-01'),
        where('__name__', '<=', currentMonthPrefix + '-31')
      );

      try {
        const snapshot = await getDocs(q);
        const allMonthExpenses = [];
        snapshot.forEach((doc) => {
          const exps = doc.data().expenses || [];
          allMonthExpenses.push(...exps.map(exp => ({ ...exp, dateKey: doc.id })));
        });
        setMonthlyExpenses(allMonthExpenses);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMonthlyExpenses();
  }, [user, currentDate]);

  const saveCustomCategories = async (categories) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
    await setDoc(profileRef, { customExpenseCategories: categories, updatedAt: serverTimestamp() }, { merge: true });
  };

  const saveCustomCategoryColors = async (colors) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
    await setDoc(profileRef, { customCategoryColors: colors, updatedAt: serverTimestamp() }, { merge: true });
  };

  const handleAddCustomCategory = async () => {
    const trimmed = newCustomCategory.trim();
    if (!trimmed || customCategories.length >= 10 || customCategories.includes(trimmed)) return;
    setIsSavingCustom(true);
    const updatedCategories = [...customCategories, trimmed];
    const randomColor = getRandomColor();
    const updatedColors = { ...customCategoryColors, [trimmed]: randomColor.id };
    setCustomCategories(updatedCategories);
    setCustomCategoryColors(updatedColors);
    setNewCustomCategory('');
    await saveCustomCategories(updatedCategories);
    await saveCustomCategoryColors(updatedColors);
    setIsSavingCustom(false);
  };

  const handleDeleteCustomCategory = async (categoryToDelete) => {
    const updatedCategories = customCategories.filter((cat) => cat !== categoryToDelete);
    setCustomCategories(updatedCategories);
    setSelectedCategory(null);
    await saveCustomCategories(updatedCategories);
  };

  const getCategoryColor = (categoryId) => {
    if (categoryId.startsWith('custom-')) {
      const catLabel = categoryId.replace('custom-', '');
      const colorId = customCategoryColors[catLabel];
      if (colorId) {
        const palette = CATEGORY_COLOR_PALETTES.find((p) => p.id === colorId);
        if (palette) return palette.color;
      }
    }
    return allCategories.find((c) => c.id === categoryId)?.color || 'bg-zinc-500/10 text-zinc-400';
  };

  const getCategoryBgColor = (categoryId) => {
    if (categoryId.startsWith('custom-')) {
      const catLabel = categoryId.replace('custom-', '');
      const colorId = customCategoryColors[catLabel];
      if (colorId) {
        const palette = CATEGORY_COLOR_PALETTES.find((p) => p.id === colorId);
        if (palette) return palette.bg;
      }
    }
    const colorMap = {
      food: 'bg-orange-500/20 border-l-4 border-orange-500',
      transport: 'bg-blue-500/20 border-l-4 border-blue-500',
      bills: 'bg-red-500/20 border-l-4 border-red-500',
      home: 'bg-green-500/20 border-l-4 border-green-500',
    };
    return colorMap[categoryId] || 'bg-zinc-500/20 border-l-4 border-zinc-500';
  };

  const getCategoryLabel = (categoryId) =>
    allCategories.find((c) => c.id === categoryId)?.label || 'Misc';

  const getMonthlyTotal = (categoryId) =>
    monthlyExpenses.filter((exp) => exp.category === categoryId).reduce((acc, curr) => acc + curr.amount, 0);

  const dailyTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyTotal = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const add = () => {
    if (!desc || !amount || !selectedCategory) {
      alert('Please select a category, add description, and amount');
      return;
    }
    onUpdate([
      ...expenses,
      { id: Date.now(), category: selectedCategory, desc, amount: parseFloat(amount), dateKey: todayKey },
    ]);
    setDesc('');
    setAmount('');
    setSelectedCategory(null);
  };

  const remove = (id) => onUpdate(expenses.filter((e) => e.id !== id));

  return (
    <div>
      {/* Totals */}
      <div className="flex justify-between items-center mb-4">
        <span className="font-bold text-xs text-zinc-500">Total Burn</span>
        <div className="flex gap-4">
          <span className="font-mono text-[11px]">D: <span className="text-white">₹{dailyTotal.toFixed(2)}</span></span>
          <span className="font-mono text-[11px]">M: <span className="text-white">₹{monthlyTotal.toFixed(2)}</span></span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2 custom-scrollbar">
          {allCategories.map((cat) =>
            cat.isCustom ? (
              <div key={cat.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? `${getCategoryColor(cat.id)} ring-2 ring-offset-1 ring-offset-[#09090b]`
                      : `${getCategoryColor(cat.id)} opacity-60 hover:opacity-100`
                  }`}
                >
                  {cat.label}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCustomCategory(cat.label); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-2 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? `${getCategoryColor(cat.id)} ring-2 ring-offset-1 ring-offset-[#09090b]`
                    : `${getCategoryColor(cat.id)} opacity-60 hover:opacity-100`
                }`}
              >
                {cat.label}
              </button>
            )
          )}

          {/* Add custom category */}
          {customCategories.length < 10 && (
            <div className="flex gap-1 flex-shrink-0">
              <input
                type="text"
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                placeholder="+ Add"
                disabled={isSavingCustom}
                className="bg-zinc-950/50 border border-dashed border-white/10 rounded-full px-3 py-2 text-xs text-zinc-400 outline-none focus:border-white/30 focus:text-white transition-colors placeholder-zinc-700 disabled:opacity-50 w-24"
              />
              {newCustomCategory && (
                <button onClick={() => setNewCustomCategory('')} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0">✕</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Category Indicator */}
      {selectedCategory && (
        <div className="mb-4 p-2 rounded-lg bg-zinc-900/50 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${getCategoryColor(selectedCategory)}`}>
              {getCategoryLabel(selectedCategory)}
            </div>
            <span className="text-[10px] text-zinc-500">Selected</span>
          </div>
          <button onClick={() => setSelectedCategory(null)} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">✕</button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2 mb-4">
        <input
          type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          className="flex-1 bg-zinc-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors placeholder-zinc-700"
        />
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="₹"
          className="w-20 bg-zinc-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors placeholder-zinc-700"
        />
        <button onClick={add} disabled={!selectedCategory} className="p-2 bg-white text-black hover:bg-zinc-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          <Plus size={14} />
        </button>
      </div>

      {/* Category Breakdown */}
      <div className="mb-4 space-y-2 bg-zinc-900/30 border border-white/5 rounded-lg p-3">
        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-2">Category Breakdown</div>
        {allCategories.map((cat) => {
          const dailySum = expenses.filter((exp) => exp.category === cat.id).reduce((acc, curr) => acc + curr.amount, 0);
          const monthlySum = getMonthlyTotal(cat.id);
          if (dailySum === 0 && monthlySum === 0 && !PREDEFINED_CATEGORIES.find((p) => p.id === cat.id)) return null;
          return (
            <div key={cat.id} className="flex justify-between items-center px-2 rounded hover:bg-white/5 transition-colors">
              <div className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${getCategoryColor(cat.id)}`}>
                {cat.label}
              </div>
              <div className="text-[10px] font-mono text-zinc-300 flex gap-3">
                <span>D: <span className="text-white">₹{dailySum.toFixed(2)}</span></span>
                <span>M: <span className="text-white">₹{monthlySum.toFixed(2)}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense List */}
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-600">No expenses yet. Select a category and add one!</div>
        ) : (
          expenses.map((exp) => (
            <div key={exp.id} className={`flex justify-between items-center group py-3 px-3 rounded-lg transition-all ${getCategoryBgColor(exp.category)}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${getCategoryColor(exp.category)}`}>
                  {getCategoryLabel(exp.category)}
                </div>
                <span className="text-xs text-zinc-300 truncate">{exp.desc}</span>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <span className="font-mono text-zinc-300 text-xs whitespace-nowrap">₹{exp.amount.toFixed(2)}</span>
                <button onClick={() => remove(exp.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseWidget;
