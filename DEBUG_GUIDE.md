# Debug Session - ReLeaf Issues

## Changes Made

### 1. Fixed Street View Hook Dependencies
**Problem:** Street View was breaking when trees were nearby because `nearbyTrees.length` was in the `useEffect` dependency array, causing re-initialization.

**Fix:** Removed `nearbyTrees.length` from dependencies. Street View now only re-initializes when the `location` or `isOpen` changes.

```javascript
// Before: Re-initialized every time tree count changed
useEffect(() => {
  // ... Street View init logic
}, [isOpen, locationKey, location, nearbyTrees.length]); // BAD

// After: Only re-initializes on location change
useEffect(() => {
  // ... Street View init logic  
}, [isOpen, locationKey, location]); // GOOD
```

### 2. Added Comprehensive Logging
Added console logging throughout App.jsx to diagnose data layer issues:

- `[App] Fetching initial data layers...` - When data is being loaded
- `[App] Hotspots received: X items` - When hotspots are loaded
- `[App] Suggestions received: X items` - When suggestions are loaded  
- `[App] Recalculating hotspots with X trees` - When hotspots update
- `[App] Updated hotspots: X hotspots, sample temp: Y°C` - After recalculation
- `[App] Filtering suggestions with X trees` - When suggestions filter
- `[App] Updated suggestions: X of Y remaining` - After filtering
- `[App] Re-simulating with X trees` - When simulation runs
- `[App] Simulation updated:` - With full simulation data

### 3. Added Error Handling in StreetViewPanel
Added try-catch blocks to gracefully handle errors in:
- `nearbyTrees` calculation
- `layerInfo` calculation
- Street View initialization

## How to Debug

### Step 1: Open Browser Console
1. Refresh your frontend at `http://localhost:5173/`
2. Open DevTools (F12 or Cmd+Opt+I)
3. Go to the Console tab

### Step 2: Check Data Loading
You should see these messages on page load:

```
[App] Fetching initial data layers...
[App] Hotspots received: 12 items
[App] Suggestions received: 10 items
[App] Vulnerability data received: 8 items
[App] Waiting for originalHotspots to load...
[App] Recalculating hotspots with 0 trees
[App] Updated hotspots: 12 hotspots, sample temp: XX°C
```

**If you DON'T see these messages:**
- Backend is not running or not reachable
- Check `http://localhost:8000/docs` to verify backend is up
- Check for CORS errors in console

### Step 3: Test Data Layers
1. Click "Red Zones" in the toolbar
2. **Expected:** You should see orange/red circles on the map with temperature labels
3. **Console should show:** Nothing new (data already loaded)

**If Red Zones don't appear:**
- Check console for errors
- Verify `hotspotsVisible` prop is being passed to MapView
- Check if `hotspots` array has data (log it in MapView)

### Step 4: Test Tree Planting & Dynamic Updates
1. Click "Plant Trees" mode
2. Click on the map near a red zone to plant a tree
3. **Console should show:**
```
[App] Recalculating hotspots with 1 trees
[App] Updated hotspots: 12 hotspots, sample temp: XX°C
[App] Filtering suggestions with 1 trees
[App] Updated suggestions: 10 of 10 remaining
[App] Re-simulating with 1 trees
[App] Simulation updated: {before: {...}, after: {...}}
```

4. **Expected behavior:**
   - If tree is within 50m of a hotspot, its temperature should decrease
   - If tree is within 30m of a suggestion, that suggestion should disappear
   - Simulation panel should update

**If nothing happens:**
- Trees might not be close enough to data points
- Check tree coordinates in console: `console.log(trees)`
- Verify distance calculations are working

### Step 5: Test Street View
1. Click "Street View" mode
2. Click on any location on the map
3. **Console should show:**
```
Initializing Street View at: XX.XXXXXX,XX.XXXXXX
Street View initialized successfully
```

4. **Expected:** Street View panel opens showing Google Street View

**If Street View fails:**
- Check console for "Street View not available at this location"
- Try clicking in a different area (not all locations have Street View)
- Check for "Google Maps API not loaded yet" warning

### Step 6: Test Street View with Trees
1. Plant a tree in Plant Trees mode
2. Switch to Street View mode
3. Click near the tree you planted
4. **Expected:** Street View opens and shows "🌳 1 tree nearby" badge

**If Street View crashes:**
- Check console for error messages
- Verify `nearbyTrees` calculation doesn't throw errors
- Check that tree has valid `position` array

## Common Issues & Fixes

### Issue: "Data layers show for a split second then disappear"
**Cause:** useEffect might be running too many times, resetting state
**Fix:** Check console logs - if you see repeated "Recalculating" messages, dependencies might be wrong

### Issue: "Simulation stays at 0 trees even after planting"
**Cause:** `simulateCooling` API call might be failing
**Fix:** 
- Check Network tab for `/analysis/simulate` request
- Verify backend is receiving tree data
- Check backend console for errors

### Issue: "Street View loads then immediately closes"
**Cause:** Component re-rendering due to state changes
**Fix:** Already implemented - location uses `locationKeyRef` to prevent unnecessary re-renders

### Issue: "Red Zones don't show any markers"
**Cause:** Data not loaded or MapView not receiving props
**Debug:**
```javascript
// Add to MapView.jsx after receiving props:
console.log("MapView props:", { 
  hotspotsVisible, 
  hotspots: hotspots?.length,
  suggestionsVisible,
  suggestions: suggestions?.length
});
```

## Backend Check

If frontend logs show no data received, check backend:

```bash
# Terminal 1: Restart backend
cd backend
uvicorn main:app --reload

# Should show:
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Test endpoints manually:
```bash
curl http://localhost:8000/analysis/hotspots
curl http://localhost:8000/analysis/suggestions
curl http://localhost:8000/analysis/vulnerability
```

## If All Else Fails

Share the console output with me. Specifically:
1. All `[App]` prefixed logs
2. Any error messages (in red)
3. Network tab showing API requests (status codes)
4. What you clicked and what happened (or didn't happen)

The logging should now make it very clear where things are breaking!
