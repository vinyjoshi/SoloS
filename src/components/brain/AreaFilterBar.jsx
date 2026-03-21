/**
 * AreaFilterBar.jsx
 * 
 * Complete area management system with:
 * - Real-time filtering (partial, exact, no match)
 * - Smart area creation with validation
 * - Batch delete with project reassignment
 * - 5-second undo functionality
 * - Responsive design (desktop/tablet/mobile)
 * - Full accessibility support
 */

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { doc } from 'firebase/firestore';

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
  // Constants
  const NO_AREA_LABEL = 'Noise';
  const DEFAULT_AREAS = ['Career', 'Health', 'Family', 'Finance'];
  const MAX_AREA_NAME_LENGTH = 25; // Character limit for area names
  
  // Undo state: tracks deleted area for 5-second undo window
  const [undoState, setUndoState] = useState(null);
  const undoTimeoutRef = React.useRef(null);

  // ===== BUILD AREA PILLS WITH SMART SORTING =====
  /**
   * Generates sorted array of area pills:
   * Order: ALL → NOISE → All active areas (sorted by lastUpdatedAt DESC)
   * - Tracks last update time from project level
   * - Filters out areas with 0 projects
   * - Treats default and custom areas equally
   */
  const getAreaPills = () => {
    const projects = docs.filter(d => d.category === 'projects');

    // Calculate counts and last update time per area
    const areaStats = {};
    projects.forEach(project => {
      const area = (project.area && project.area.trim() !== '') ? project.area : NO_AREA_LABEL;
      
      if (!areaStats[area]) {
        areaStats[area] = { count: 0, lastUpdatedAt: null };
      }

      areaStats[area].count += 1;

      // Track most recent project update in this area
      const projectUpdateTime = project.updatedAt?.toDate?.() || new Date(0);
      if (!areaStats[area].lastUpdatedAt || projectUpdateTime > areaStats[area].lastUpdatedAt) {
        areaStats[area].lastUpdatedAt = projectUpdateTime;
      }
    });

    // Build pills array
    const pills = [];

    // Always add ALL first
    pills.push({ 
      name: 'ALL', 
      count: projects.length, 
      type: 'special',
      lastUpdatedAt: new Date(0)
    });

    // Add NOISE second if it has projects
    if (areaStats[NO_AREA_LABEL] && areaStats[NO_AREA_LABEL].count > 0) {
      pills.push({ 
        name: NO_AREA_LABEL, 
        count: areaStats[NO_AREA_LABEL].count, 
        type: 'default',
        lastUpdatedAt: areaStats[NO_AREA_LABEL].lastUpdatedAt
      });
    }

    // Collect all other active areas (default + custom)
    const otherAreas = [];

    // Add default areas with projects
    DEFAULT_AREAS.forEach(area => {
      if (area !== NO_AREA_LABEL && areaStats[area] && areaStats[area].count > 0) {
        otherAreas.push({
          name: area,
          count: areaStats[area].count,
          type: 'default',
          lastUpdatedAt: areaStats[area].lastUpdatedAt
        });
      }
    });

    // Add custom areas with projects
    customAreas.forEach(area => {
      if (areaStats[area] && areaStats[area].count > 0) {
        otherAreas.push({
          name: area,
          count: areaStats[area].count,
          type: 'custom',
          lastUpdatedAt: areaStats[area].lastUpdatedAt
        });
      }
    });

    // Sort by last update (newest first)
    otherAreas.sort((a, b) => {
      const timeA = a.lastUpdatedAt?.getTime?.() || 0;
      const timeB = b.lastUpdatedAt?.getTime?.() || 0;
      return timeB - timeA;
    });

    pills.push(...otherAreas);
    return pills;
  };

  const allPills = getAreaPills();

  // ===== SMART INPUT FILTERING =====
  /**
   * Determines what to display based on user input:
   * - Empty: show all pills
   * - Partial match: show matching pills + create button
   * - Exact match: show matched pill only, auto-select
   * - No match: show create button only
   */
  const getFilterState = () => {
    const input = areaSearchInput.trim();

    if (!input) {
      return {
        type: 'empty',
        displayPills: allPills,
        showCreateButton: false,
      };
    }

    const inputLower = input.toLowerCase();

    // Find matching areas (case-insensitive)
    const matchingPills = allPills.filter(pill => 
      pill.name !== 'ALL' && 
      pill.name.toLowerCase().includes(inputLower) &&
      pill.count > 0
    );

    // Check for exact match
    const exactMatch = allPills.find(pill => 
      pill.name.toLowerCase() === inputLower && 
      pill.name !== 'ALL'
    );

    if (exactMatch) {
      return {
        type: 'exact-match',
        displayPills: [exactMatch],
        showCreateButton: false,
        matchedAreaName: exactMatch.name,
      };
    }

    if (matchingPills.length > 0) {
      return {
        type: 'partial-match',
        displayPills: matchingPills,
        showCreateButton: true,
        newAreaName: input,
      };
    }

    // No matches found
    return {
      type: 'no-match',
      displayPills: [],
      showCreateButton: true,
      newAreaName: input,
    };
  };

  const filterState = getFilterState();

  // ===== AUTO-SELECT ON EXACT MATCH =====
  /**
   * When user types exact area name, auto-filter projects instantly
   */
  useEffect(() => {
    if (filterState.type === 'exact-match') {
      const filterValue = filterState.matchedAreaName === 'ALL' ? 'all' : filterState.matchedAreaName;
      setAreaFilter(filterValue);
      setAreaSearchInput('');
    }
  }, [filterState.type, filterState.matchedAreaName, setAreaFilter, setAreaSearchInput]);


  // ===== HANDLE PILL SELECTION =====
  /**
   * Select area filter and clear search input
   * Projects auto-update via areaFilter state change
   */
  const handlePillClick = (pillName) => {
    const filterValue = pillName === 'ALL' ? 'all' : pillName;
    setAreaFilter(filterValue);
    setAreaSearchInput('');
  };

  // ===== HANDLE AREA CREATION =====
  /**
   * Create new area with validation:
   * - Empty check
   * - Length validation (3-25 chars)
   * - Case-insensitive duplicate detection
   * - Auto-select if exists
   * - Silent creation if new
   */
  const handleCreateArea = async (areaName) => {
    const trimmed = areaName.trim();

    // Validation: empty
    if (!trimmed || trimmed.length === 0) {
      return;
    }

    // Validation: length (3-25 chars)
    if (trimmed.length > MAX_AREA_NAME_LENGTH) {
      return;
    }
    if (trimmed.length < 3) {
      return;
    }

    // Validation: case-insensitive duplicate detection
    const allExistingAreas = [...DEFAULT_AREAS, ...customAreas];
    const existingMatchLower = allExistingAreas.find(
      area => area.toLowerCase() === trimmed.toLowerCase()
    );

    if (existingMatchLower) {
      // Area exists, just select it
      handlePillClick(existingMatchLower);
      return;
    }

    // Create new area
    const newAreas = [...customAreas, trimmed];
    setCustomAreas(newAreas);

    // Save to Firestore (silent operation)
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(
        profileRef,
        { customAreas: newAreas, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error creating area:', error);
    }

    // Auto-select and clear input
    setAreaFilter(trimmed);
    setAreaSearchInput('');
  };

  // ===== HANDLE AREA DELETION =====
  /**
   * Delete custom area:
   * - Show confirmation
   * - Reassign all projects in area → Noise
   * - Reset filter if area was selected
   * - Show 5-second undo option
   */
  const handleDeleteArea = async (areaName) => {
    // Confirmation
    if (!window.confirm(`Delete '${areaName}'? Projects will move to Noise.`)) return;

    // Store for undo
    setUndoState({ areaName, deletedAt: Date.now() });

    // Clear existing undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // 5-second undo window
    undoTimeoutRef.current = setTimeout(() => {
      setUndoState(null);
    }, 5000);

    // Remove from custom areas
    const newAreas = customAreas.filter(a => a !== areaName);
    setCustomAreas(newAreas);

    // Reassign all projects in this area to Noise
    try {
      const projectsInArea = docs.filter(
        doc => doc.category === 'projects' && doc.area === areaName
      );

      for (const project of projectsInArea) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'docs', project.id);
        await updateDoc(docRef, {
          area: NO_AREA_LABEL,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error reassigning projects:', error);
    }

    // Update Firestore
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(
        profileRef,
        { customAreas: newAreas, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error deleting area:', error);
    }

    // Reset filter if needed
    if (areaFilter === areaName) {
      setAreaFilter('all');
    }
  };

  // ===== HANDLE UNDO DELETE =====
  /**
   * Restore deleted area within 5-second window
   */
  const handleUndoDelete = async () => {
    if (!undoState) return;

    const { areaName } = undoState;

    // Clear timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Restore area
    const restoredAreas = [...customAreas, areaName];
    setCustomAreas(restoredAreas);

    // Update Firestore
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(
        profileRef,
        { customAreas: restoredAreas, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error undoing deletion:', error);
    }

    setUndoState(null);
  };

  // ===== RENDER =====
  return (
    <div className="border-b border-white/5 bg-zinc-900/50 sticky top-0 z-40">
      {/* Undo notification with 5-second auto-dismiss */}
      {undoState && (
        <div className="px-4 py-2 bg-amber-500/20 border-b border-amber-500/30 flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-xs text-amber-200">
            Deleted '<strong>{undoState.areaName}</strong>' • Projects moved to Noise
          </span>
          <button
            onClick={handleUndoDelete}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors px-3 py-1 rounded hover:bg-amber-500/20"
            aria-label={`Undo deletion of ${undoState.areaName}`}
          >
            Undo
          </button>
        </div>
      )}

      {/* Line 1: Horizontal scrollable area pills */}
      <div className="px-4 py-3 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2 min-w-min">
          {filterState.displayPills.length === 0 ? (
            <div className="text-xs text-zinc-500 italic">No matching areas</div>
          ) : (
            filterState.displayPills.map(pill => (
              <AreaPill
                key={pill.name}
                name={pill.name}
                count={pill.count}
                isSelected={areaFilter === (pill.name === 'ALL' ? 'all' : pill.name)}
                onClick={() => handlePillClick(pill.name)}
                onDelete={pill.type === 'custom' ? () => handleDeleteArea(pill.name) : null}
              />
            ))
          )}
        </div>
      </div>

      {/* Line 2: Search input + action buttons */}
      <div className="px-4 py-3 border-t border-white/5 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={areaSearchInput}
            onChange={(e) => setAreaSearchInput(e.target.value)}
            onKeyDown={(e) => {
              // Create area on Enter if create button is showing
              if (e.key === 'Enter' && filterState.showCreateButton) {
                e.preventDefault();
                handleCreateArea(areaSearchInput);
              }
              // Select exact match on Enter
              if (e.key === 'Enter' && filterState.type === 'exact-match') {
                e.preventDefault();
                handlePillClick(filterState.matchedAreaName);
              }
              // Clear input on Escape
              if (e.key === 'Escape') {
                setAreaSearchInput('');
              }
            }}
            maxLength={MAX_AREA_NAME_LENGTH}
            placeholder="Search or Create"
            className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors placeholder-zinc-600"
            aria-label="Search or create area"
          />

          {/* Create button: visible only when creating new area */}
          {filterState.showCreateButton && (
            <button
              onClick={() => handleCreateArea(areaSearchInput)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors flex items-center gap-1 whitespace-nowrap active:scale-95"
              title={`Create '${areaSearchInput}'`}
              aria-label={`Create new area '${areaSearchInput}'`}
            >
              <Plus size={12} /> Create
            </button>
          )}

          {/* Clear button: icon-only, visible when input has text */}
          {areaSearchInput && (
            <button
              onClick={() => setAreaSearchInput('')}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors flex-shrink-0 active:scale-95"
              title="Clear search (or press Escape)"
              aria-label="Clear search input"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Helper text: shows next action or character count */}
        {areaSearchInput && filterState.type !== 'exact-match' && (
          <div className="text-[10px] text-zinc-500 mt-2 ml-1 flex items-center justify-between">
            <span>
              {filterState.showCreateButton
                ? `Press Enter to add '${areaSearchInput}'`
                : `Search or Create`}
            </span>
            <span className={`font-mono ${areaSearchInput.length > MAX_AREA_NAME_LENGTH ? 'text-red-400' : 'text-zinc-600'}`}>
              {areaSearchInput.length}/{MAX_AREA_NAME_LENGTH}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== SUB-COMPONENT: AREA PILL =====
/**
 * Individual area pill with color coding:
 * - Special: ALL (white)
 * - Default: Noise, Career, Health, Family, Finance (muted colors)
 * - Custom: User-created areas (variable colors)
 */
const AreaPill = ({ name, count, isSelected, onClick, onDelete }) => {
  // Color palette for different area types
  const PILL_COLORS = {
    'ALL': 'bg-white text-black border-white',
    'Noise': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
    'Career': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'Health': 'bg-green-500/20 text-green-400 border-green-500/50',
    'Family': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    'Finance': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  };

  // Generate random color for custom areas (consistent per area)
  const getCustomAreaColor = (areaName) => {
    const colors = [
      'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'bg-pink-500/20 text-pink-400 border-pink-500/50',
      'bg-red-500/20 text-red-400 border-red-500/50',
      'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      'bg-rose-500/20 text-rose-400 border-rose-500/50',
    ];
    // Hash area name to get consistent color
    const hash = areaName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const colorClass = PILL_COLORS[name] || getCustomAreaColor(name);

  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap flex items-center gap-1 group ${
        isSelected
          ? colorClass + ' ring-2 ring-offset-1 ring-offset-[#09090b]'
          : colorClass + ' opacity-60 hover:opacity-100'
      }`}
      title={`Filter by ${name}: ${count} ${count === 1 ? 'project' : 'projects'}`}
      aria-pressed={isSelected}
      aria-label={`${name} area with ${count} ${count === 1 ? 'project' : 'projects'}`}
    >
      <span>{name}</span>
      <span className="text-[8px] opacity-75">({count})</span>

      {/* Delete button: appears on hover for custom areas only */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/50 rounded-full transition-all active:scale-95"
          title={`Delete '${name}' area`}
          aria-label={`Delete ${name} area`}
        >
          <X size={12} />
        </button>
      )}
    </button>
  );
};