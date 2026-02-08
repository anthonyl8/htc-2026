import { useState, useCallback, useEffect, useRef } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapView from "./components/MapView";
import SearchBar from "./components/SearchBar";
import Toolbar from "./components/Toolbar";
import SimulationPanel from "./components/SimulationPanel";
import StatsPanel from "./components/StatsPanel";
import StreetViewPanel from "./components/StreetViewPanel";
import { useTreePlanting } from "./hooks/useTreePlanting";
import {
  getHotspots,
  getSuggestions,
  getVulnerabilityData,
  simulateCooling,
} from "./services/api";
import "./App.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

function App() {
  const [mode, setMode] = useState("explore");
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [temperature, setTemperature] = useState(null);

  // Active data layer (radio button: only one at a time, or null)
  const [activeDataLayer, setActiveDataLayer] = useState(null);

  // Street View state
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState(null);

  // Layer data (with original copies for dynamic updates)
  const [hotspots, setHotspots] = useState([]);
  const [originalHotspots, setOriginalHotspots] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [originalSuggestions, setOriginalSuggestions] = useState([]);
  const [vulnerabilityData, setVulnerabilityData] = useState([]);
  const [simulation, setSimulation] = useState(null);

  const { trees, addTree, removeLastTree, clearTrees, treeCount } =
    useTreePlanting();

  const mapRef = useRef(null);

  // ─── Fetch initial data ────────────────────────────────────

  useEffect(() => {
    console.log("[App] Fetching initial data layers...");
    // Prefetch all data layers on mount
    getHotspots().then((data) => {
      console.log("[App] Hotspots received:", data.length, "items");
      setHotspots(data);
      setOriginalHotspots(data);
    }).catch(err => console.error("[App] Hotspots fetch failed:", err));
    
    getSuggestions().then((data) => {
      console.log("[App] Suggestions received:", data.length, "items");
      setSuggestions(data);
      setOriginalSuggestions(data);
    }).catch(err => console.error("[App] Suggestions fetch failed:", err));
    
    getVulnerabilityData().then((data) => {
      console.log("[App] Vulnerability data received:", data.length, "items");
      setVulnerabilityData(data);
    }).catch(err => console.error("[App] Vulnerability fetch failed:", err));
  }, []);

  // ─── Re-simulate when trees change ─────────────────────────

  useEffect(() => {
    if (trees.length === 0) {
      console.log("[App] No trees, clearing simulation");
      setSimulation(null);
      return;
    }
    
    console.log("[App] Re-simulating with", trees.length, "trees");
    // Force re-simulation by passing trees array
    simulateCooling(trees)
      .then((data) => {
        console.log("[App] Simulation updated:", data);
        setSimulation(data);
      })
      .catch((err) => console.error("[App] Simulation failed:", err));
  }, [trees.length, trees]); // Depend on both length and array

  // ─── Dynamic data layer updates ────────────────────────────

  useEffect(() => {
    if (originalHotspots.length === 0) {
      console.log("[App] Waiting for originalHotspots to load...");
      return;
    }

    console.log("[App] Recalculating hotspots with", trees.length, "trees");
    // Recalculate hotspot temperatures based on nearby trees
    const updatedHotspots = originalHotspots.map((h) => {
      const nearbyTreeCount = trees.filter((t) => {
        const tLat = t.position?.[1] ?? t.lat ?? 0;
        const tLon = t.position?.[0] ?? t.lon ?? 0;
        const dist = Math.sqrt((h.lat - tLat) ** 2 + (h.lon - tLon) ** 2);
        return dist < 0.0005; // ~50m radius
      }).length;

      // Calculate cooling effect: each tree provides ~1.5°C cooling
      const cooling = nearbyTreeCount > 0 ? Math.min(10, nearbyTreeCount * 1.5) : 0;

      return {
        ...h,
        temperature_c: Math.max(25, h.temperature_c - cooling),
        nearby_trees: nearbyTreeCount,
      };
    });

    console.log("[App] Updated hotspots:", updatedHotspots.length, "hotspots, sample temp:", updatedHotspots[0]?.temperature_c);
    setHotspots(updatedHotspots);
  }, [trees, originalHotspots]);

  useEffect(() => {
    if (originalSuggestions.length === 0) {
      console.log("[App] Waiting for originalSuggestions to load...");
      return;
    }

    console.log("[App] Filtering suggestions with", trees.length, "trees");
    // Remove suggestions where trees have been planted
    const updatedSuggestions = originalSuggestions.filter((s) => {
      const hasTreeNearby = trees.some((t) => {
        const tLat = t.position?.[1] ?? t.lat ?? 0;
        const tLon = t.position?.[0] ?? t.lon ?? 0;
        const dist = Math.sqrt((s.lat - tLat) ** 2 + (s.lon - tLon) ** 2);
        return dist < 0.0003; // ~30m radius - suggestion is "filled"
      });
      return !hasTreeNearby;
    });

    console.log("[App] Updated suggestions:", updatedSuggestions.length, "of", originalSuggestions.length, "remaining");
    setSuggestions(updatedSuggestions);
  }, [trees, originalSuggestions]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleTreePlant = useCallback(
    (coordinate) => {
      if (mode === "plant") addTree(coordinate);
    },
    [mode, addTree]
  );

  const handleMapClick = useCallback(
    (location) => {
      if (mode === "streetview") {
        setStreetViewLocation(location);
        setStreetViewOpen(true);
      }
    },
    [mode]
  );

  const handleTemperatureUpdate = useCallback((temp) => {
    setTemperature(temp);
  }, []);

  const handlePlaceSelect = useCallback((place) => {
    mapRef.current?.flyTo(place.lat, place.lng, 16);
  }, []);

  // ─── Missing API key guard ─────────────────────────────────

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={styles.setupScreen}>
        <div style={styles.setupCard}>
          <span style={{ fontSize: "2.5rem" }}>🌿</span>
          <h1 style={styles.setupTitle}>ReLeaf Setup</h1>
          <p style={styles.setupText}>
            Add your Google Maps API key to <code>frontend/.env</code>:
          </p>
          <pre style={styles.setupCode}>
            VITE_GOOGLE_MAPS_API_KEY=your_key_here
          </pre>
          <p style={styles.setupText}>
            Required APIs: <strong>Maps JavaScript API</strong>,{" "}
            <strong>Places API</strong>, <strong>Maps Static API</strong>
          </p>
          <p style={styles.setupHint}>
            Then restart the dev server with <code>npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div style={styles.app}>
        {/* Google Maps 3D */}
        <MapView
          ref={mapRef}
          mode={mode}
          trees={trees}
          onTreePlant={handleTreePlant}
          onMapClick={handleMapClick}
          onTemperatureUpdate={handleTemperatureUpdate}
          heatmapVisible={activeDataLayer === "heatmap"}
          hotspotsVisible={activeDataLayer === "hotspots"}
          suggestionsVisible={activeDataLayer === "suggestions"}
          vulnerabilityVisible={activeDataLayer === "vulnerability"}
          hotspots={hotspots}
          suggestions={suggestions}
          vulnerabilityData={vulnerabilityData}
        />

        {/* Search Bar — top center */}
        <SearchBar onPlaceSelect={handlePlaceSelect} />

        {/* Toolbar — left side */}
        <Toolbar
          mode={mode}
          onModeChange={setMode}
          treeCount={treeCount}
          onUndo={removeLastTree}
          onClear={clearTrees}
          onSimulationToggle={() => setSimulationOpen((v) => !v)}
          simulationOpen={simulationOpen}
          activeDataLayer={activeDataLayer}
          onDataLayerChange={setActiveDataLayer}
        />

        {/* Bottom Stats */}
        <StatsPanel
          temperature={temperature}
          treeCount={treeCount}
          simulation={simulation}
        />

        {/* Simulation Panel — bottom right */}
        <SimulationPanel
          simulation={simulation}
          isOpen={simulationOpen}
          onClose={() => setSimulationOpen(false)}
        />

        {/* Street View Panel */}
        <StreetViewPanel
          isOpen={streetViewOpen}
          onClose={() => {
            setStreetViewOpen(false);
            setMode("explore");
          }}
          location={streetViewLocation}
          trees={trees}
          activeDataLayer={activeDataLayer}
          layerData={{
            hotspots,
            suggestions,
            vulnerability: vulnerabilityData,
          }}
        />
      </div>
    </APIProvider>
  );
}

const styles = {
  app: {
    width: "100vw",
    height: "100vh",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  // ─── Setup screen ──────────────────────────────────────────
  setupScreen: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a1a",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  setupCard: {
    background: "#1a1a2e",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    maxWidth: "480px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  setupTitle: {
    color: "#4ade80",
    fontSize: "1.5rem",
    marginTop: "12px",
    marginBottom: "16px",
  },
  setupText: {
    color: "#bbb",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    marginBottom: "12px",
  },
  setupCode: {
    background: "rgba(255,255,255,0.06)",
    color: "#4ade80",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    textAlign: "left",
    marginBottom: "16px",
    border: "1px solid rgba(74,222,128,0.2)",
    overflowX: "auto",
  },
  setupHint: {
    color: "#888",
    fontSize: "0.82rem",
  },
};

export default App;
