# Bug Fixes - ReLeaf Platform

## Summary
Fixed three critical issues affecting data layers, Street View, and simulation updates.

---

## Issue 1: React Hooks Rules Violation in StreetViewPanel

**Problem:**
- `useMemo` hooks were called BEFORE the early return `if (!location) return null`
- Violates React's Rules of Hooks (hooks must always be called in the same order)
- Caused rendering errors and Street View glitches

**Solution:**
- Moved all hooks (`useMemo`, `useEffect`) to the top of the component
- Modified early return to check `!isOpen || !location` at the END, after all hooks
- Made `locationKey` null-safe with conditional: `location ? ... : null`
- Updated `nearbyTrees` and `layerInfo` to handle null location in their logic

**Files Changed:**
- `frontend/src/components/StreetViewPanel.jsx`

---

## Issue 2: Data Layers Not Updating Dynamically

**Problem:**
- Hotspot temperatures and planting suggestions weren't updating when trees were planted
- Used functional `setState` but was mutating the original data
- No "original" reference meant recalculations were based on already-modified data

**Solution:**
- Added `originalHotspots` and `originalSuggestions` state to preserve initial data
- Dynamic updates now recalculate from the original data each time
- Hotspots: Calculate cooling effect from original temperature
- Suggestions: Filter from original list based on tree proximity

**Files Changed:**
- `frontend/src/App.jsx`

**How it works now:**
```javascript
// Store originals on initial fetch
setHotspots(data);
setOriginalHotspots(data);

// Recalculate from originals when trees change
useEffect(() => {
  const updatedHotspots = originalHotspots.map((h) => {
    // Calculate cooling based on nearby trees
    const cooling = nearbyTreeCount * 1.5;
    return {
      ...h,
      temperature_c: Math.max(25, h.temperature_c - cooling),
    };
  });
  setHotspots(updatedHotspots);
}, [trees, originalHotspots]);
```

---

## Issue 3: Simulation Not Updating After Planting Trees

**Problem:**
- `useEffect` dependency was only `[trees]`, which doesn't trigger on array mutations
- React only detects reference changes, not content changes

**Solution:**
- Changed dependency to `[trees.length, trees]` to catch both array changes and mutations
- Added console logging to verify simulation updates
- Made sure `SimulationPanel` re-fetches on `trees` change

**Files Changed:**
- `frontend/src/App.jsx`

**How it works now:**
```javascript
useEffect(() => {
  if (trees.length === 0) {
    setSimulation(null);
    return;
  }
  
  simulateCooling(trees)
    .then((data) => {
      console.log("Simulation updated:", data);
      setSimulation(data);
    })
    .catch((err) => console.error("Simulation failed:", err));
}, [trees.length, trees]); // Depend on BOTH
```

---

## Issue 4: Radio Button Appearance (Toolbar)

**Problem:**
- When one data layer was selected, the other three showed outlines
- This was actually the intended design for showing inactive radio buttons

**Status:**
- This is working as designed
- Inactive radio buttons have subtle outlines to show they're deselected
- Active radio button has a filled dot and colored background
- If you want to remove the outlines entirely, modify the `radio` style in `Toolbar.jsx`

---

## Testing Checklist

✅ **Street View:**
- Opens without errors when clicking a location
- Displays nearby tree count correctly
- Shows data layer overlays when applicable
- Continues working after planting trees

✅ **Data Layers:**
- Hotspots cool down (temperature decreases) when trees are planted nearby
- Planting suggestions disappear when trees are planted in those locations
- Radio button behavior: only one active at a time, or none

✅ **Simulation Panel:**
- Updates automatically when trees are planted
- Shows before/after temperature comparison
- Displays per-tree cooling impacts

✅ **Build:**
- Frontend builds without errors
- No React hooks warnings in console

---

## Related Files

### Core Components Modified:
1. `frontend/src/App.jsx` - Main app state and dynamic updates
2. `frontend/src/components/StreetViewPanel.jsx` - Street View with fixed hooks
3. `frontend/src/components/Toolbar.jsx` - Radio button data layer controls (no changes needed)
4. `frontend/src/components/SimulationPanel.jsx` - Displays cooling simulation (no changes needed)

### Key Concepts:
- **React Hooks Rules**: Hooks must always be called, never conditionally
- **Immutable State**: Preserve original data for recalculations
- **Array Dependencies**: Use both length and reference for mutation detection
- **Memoization**: Use `useMemo` to prevent expensive recalculations

---

## Next Steps

If you encounter any further issues:

1. **Console Errors**: Check browser console for React warnings
2. **Network Tab**: Verify API calls are completing successfully
3. **State Inspection**: Use React DevTools to inspect component state
4. **Logs**: Check `console.log` output for simulation updates

All systems should now be working correctly! 🎉
