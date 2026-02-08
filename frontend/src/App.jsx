import { useState, useCallback, useEffect, useRef } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapView from "./components/MapView";
import SearchBar from "./components/SearchBar";
import Toolbar from "./components/Toolbar";
import SimulationPanel from "./components/SimulationPanel";
import StatsPanel from "./components/StatsPanel";
import StreetViewPanel from "./components/StreetViewPanel";
import TimeSlider from "./components/TimeSlider";
import ROIPanel from "./components/ROIPanel";
import FutureVision from "./components/FutureVision";
import ValidationToast from "./components/ValidationToast";
import { useTreePlanting } from "./hooks/useTreePlanting";
import {
  getHotspots,
  getSuggestions,
  getVulnerabilityData,
  simulateCoolingV2,
  validateLocation,
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

  // Tree species
  const [selectedSpecies, setSelectedSpecies] = useState("maple");

  // Time of day for sun path (null = disabled)
  const [timeOfDay, setTimeOfDay] = useState(null);
  const [timeSliderVisible, setTimeSliderVisible] = useState(false);

  // ROI panel
  const [roiOpen, setRoiOpen] = useState(false);

  // Future Vision
  const [visionOpen, setVisionOpen] = useState(false);

  // Validation toast
  const [validationMessage, setValidationMessage] = useState(null);
  const [validationType, setValidationType] = useState("warning");

  const {
    interventions,
    trees,
    coolRoofs,
    bioSwales,
    addTree,
    addCoolRoof,
    addBioSwale,
    removeLastTree,
    clearTrees,
    treeCount,
    interventionCount,
  } = useTreePlanting();

  const mapRef = useRef(null);

  const showToast = useCallback((message, type = "warning") => {
    setValidationMessage(message);
    setValidationType(type);
  }, []);

  // ─── Fetch initial data ────────────────────────────────────

  useEffect(() => {
    getHotspots()
      .then((data) => {
        setHotspots(data);
        setOriginalHotspots(data);
      })
      .catch((err) => console.error("[App] Hotspots fetch failed:", err));

    getSuggestions()
      .then((data) => {
        setSuggestions(data);
        setOriginalSuggestions(data);
      })
      .catch((err) => console.error("[App] Suggestions fetch failed:", err));

    getVulnerabilityData()
      .then((data) => setVulnerabilityData(data))
      .catch((err) => console.error("[App] Vulnerability fetch failed:", err));
  }, []);

  // ─── Re-simulate when interventions change ─────────────────

  useEffect(() => {
    if (interventions.length === 0) {
      setSimulation(null);
      return;
    }

    simulateCoolingV2(interventions)
      .then((data) => setSimulation(data))
      .catch((err) => console.error("[App] Simulation failed:", err));
  }, [interventions]);

  // ─── Dynamic data layer updates ────────────────────────────

  useEffect(() => {
    if (originalHotspots.length === 0) return;

    const updatedHotspots = originalHotspots.map((h) => {
      const nearbyCount = interventions.filter((t) => {
        const tLat = t.position?.[1] ?? t.lat ?? 0;
        const tLon = t.position?.[0] ?? t.lon ?? 0;
        const dist = Math.sqrt((h.lat - tLat) ** 2 + (h.lon - tLon) ** 2);
        return dist < 0.0005;
      }).length;

      const cooling =
        nearbyCount > 0 ? Math.min(10, nearbyCount * 1.5) : 0;

      return {
        ...h,
        temperature_c: Math.max(25, h.temperature_c - cooling),
        nearby_trees: nearbyCount,
      };
    });

    setHotspots(updatedHotspots);
  }, [interventions, originalHotspots]);

  useEffect(() => {
    if (originalSuggestions.length === 0) return;

    const updatedSuggestions = originalSuggestions.filter((s) => {
      const hasNearby = interventions.some((t) => {
        const tLat = t.position?.[1] ?? t.lat ?? 0;
        const tLon = t.position?.[0] ?? t.lon ?? 0;
        const dist = Math.sqrt((s.lat - tLat) ** 2 + (s.lon - tLon) ** 2);
        return dist < 0.0003;
      });
      return !hasNearby;
    });

    setSuggestions(updatedSuggestions);
  }, [interventions, originalSuggestions]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleTreePlant = useCallback(
    async (coordinate) => {
      if (mode !== "tree") return;
      
      const [lon, lat] = coordinate;
      
      // Validate location before planting
      try {
        const validation = await validateLocation("tree", lat, lon);
        
        if (!validation.valid) {
          showToast(`Cannot plant tree: ${validation.reason}`, "error");
          return;
        }
        
        if (validation.confidence === "low") {
          showToast(`Tree planted (${validation.reason})`, "info");
        } else if (validation.confidence === "medium") {
          showToast(`Tree planted on ${validation.surface_type}`, "info");
        }
        
        addTree(coordinate, selectedSpecies);
      } catch (err) {
        console.warn("Validation failed:", err);
        // Allow planting if validation service is down
        addTree(coordinate, selectedSpecies);
        showToast("Validation unavailable - tree planted anyway", "warning");
      }
    },
    [mode, addTree, selectedSpecies, showToast]
  );

  const handleCoolRoofPlace = useCallback(
    async (coordinate) => {
      if (mode !== "cool_roof") return;
      
      const [lon, lat] = coordinate;
      
      try {
        const validation = await validateLocation("cool_roof", lat, lon);
        
        if (!validation.valid) {
          showToast(`Cannot apply cool roof: ${validation.reason}`, "error");
          return;
        }
        
        if (validation.building_type && validation.building_type !== "unknown") {
          showToast(`Cool roof applied to ${validation.building_type}`, "info");
        }
        
        addCoolRoof(coordinate);
      } catch (err) {
        console.warn("Validation failed:", err);
        addCoolRoof(coordinate);
        showToast("Validation unavailable - cool roof placed anyway", "warning");
      }
    },
    [mode, addCoolRoof, showToast]
  );

  const handleBioSwalePlace = useCallback(
    async (coordinate) => {
      if (mode !== "bio_swale") return;
      
      const [lon, lat] = coordinate;
      
      try {
        const validation = await validateLocation("bio_swale", lat, lon);
        
        if (validation.near_feature) {
          showToast(`Bio-swale placed near ${validation.near_feature}`, "info");
        }
        
        addBioSwale(coordinate);
      } catch (err) {
        console.warn("Validation failed:", err);
        addBioSwale(coordinate);
      }
    },
    [mode, addBioSwale, showToast]
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

  const handleTimeSliderToggle = useCallback(() => {
    setTimeSliderVisible((v) => {
      const next = !v;
      if (next) {
        setTimeOfDay(13); // Default to 1 PM
      } else {
        setTimeOfDay(null);
      }
      return next;
    });
  }, []);

  const handleReportDownload = useCallback(() => {
    // Generate a printable report
    const s = simulation;
    const roi = s?.roi;
    const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ReLeaf Climate Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #222; max-width: 800px; margin: auto; }
    h1 { color: #16a34a; border-bottom: 3px solid #16a34a; padding-bottom: 8px; }
    h2 { color: #333; margin-top: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .kpi { background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #bbf7d0; }
    .kpi .value { font-size: 2rem; font-weight: 800; color: #16a34a; display: block; }
    .kpi .label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .footer { margin-top: 32px; color: #999; font-size: 0.8rem; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>🌿 ReLeaf Climate Intervention Report</h1>
  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  <p><strong>Location:</strong> Vancouver, BC (49.2827°N, 123.1207°W)</p>
  
  <div class="kpi-grid">
    <div class="kpi">
      <span class="value">${interventionCount}</span>
      <span class="label">Total Interventions</span>
    </div>
    <div class="kpi">
      <span class="value">${s ? `−${s.area_cooling_c}°C` : "—"}</span>
      <span class="label">Temperature Reduction</span>
    </div>
    <div class="kpi">
      <span class="value">$${roi?.total_cost?.toLocaleString() || 0}</span>
      <span class="label">Total Investment</span>
    </div>
  </div>

  <h2>📊 Before / After Analysis</h2>
  <table>
    <tr><th>Metric</th><th>Before</th><th>After</th><th>Change</th></tr>
    <tr>
      <td>Avg Temperature</td>
      <td>${s?.before?.avg_temperature_c || "—"}°C</td>
      <td>${s?.after?.avg_temperature_c || "—"}°C</td>
      <td style="color: #16a34a">−${s?.area_cooling_c || 0}°C</td>
    </tr>
    <tr>
      <td>Max Temperature</td>
      <td>${s?.before?.max_temperature_c || "—"}°C</td>
      <td>${s?.after?.max_temperature_c || "—"}°C</td>
      <td style="color: #16a34a">↓</td>
    </tr>
    <tr>
      <td>Red Zone Coverage</td>
      <td>${s?.before?.red_zone_area_pct || 35}%</td>
      <td>${s?.after?.red_zone_area_pct || 35}%</td>
      <td style="color: #16a34a">${s ? `−${(s.before.red_zone_area_pct - s.after.red_zone_area_pct).toFixed(1)}%` : "—"}</td>
    </tr>
  </table>

  <h2>🌳 Intervention Breakdown</h2>
  <table>
    <tr><th>Type</th><th>Count</th><th>Cost</th><th>Cooling</th></tr>
    <tr><td>🌳 Trees</td><td>${roi?.trees?.count || treeCount}</td><td>$${roi?.trees?.cost?.toLocaleString() || 0}</td><td>−${roi?.trees?.cooling_c || 0}°C</td></tr>
    <tr><td>🏠 Cool Roofs</td><td>${roi?.cool_roofs?.count || coolRoofs.length}</td><td>$${roi?.cool_roofs?.cost?.toLocaleString() || 0}</td><td>−${roi?.cool_roofs?.cooling_c || 0}°C</td></tr>
    <tr><td>💧 Bio-Swales</td><td>${roi?.bio_swales?.count || bioSwales.length}</td><td>$${roi?.bio_swales?.cost?.toLocaleString() || 0}</td><td>−${roi?.bio_swales?.cooling_c || 0}°C</td></tr>
  </table>

  <h2>💰 Return on Investment</h2>
  <table>
    <tr><td>Annual Energy Savings</td><td><strong>$${roi?.energy_saved_yearly?.toLocaleString() || 0}/year</strong></td></tr>
    <tr><td>CO₂ Offset</td><td><strong>${roi?.co2_offset_kg || 0} kg/year</strong></td></tr>
    <tr><td>People Benefited</td><td><strong>${roi?.people_benefited?.toLocaleString() || 0}</strong></td></tr>
    <tr><td>Payback Period</td><td><strong>${roi?.payback_years || "—"} years</strong></td></tr>
  </table>

  <div class="footer">
    <p>Generated by <strong>ReLeaf</strong> — The Digital Twin for Urban Heat Resilience</p>
    <p>This report was generated using satellite thermal data and AI-powered simulation models.</p>
  </div>
</body>
</html>`;

    const blob = new Blob([reportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 500);
      };
    }
  }, [simulation, interventionCount, treeCount, coolRoofs.length, bioSwales.length]);

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
          interventions={interventions}
          coolRoofs={coolRoofs}
          bioSwales={bioSwales}
          selectedSpecies={selectedSpecies}
          onTreePlant={handleTreePlant}
          onCoolRoofPlace={handleCoolRoofPlace}
          onBioSwalePlace={handleBioSwalePlace}
          onMapClick={handleMapClick}
          onTemperatureUpdate={handleTemperatureUpdate}
          heatmapVisible={activeDataLayer === "heatmap"}
          hotspotsVisible={activeDataLayer === "hotspots"}
          suggestionsVisible={activeDataLayer === "suggestions"}
          vulnerabilityVisible={activeDataLayer === "vulnerability"}
          airQualityVisible={activeDataLayer === "airquality"}
          hotspots={hotspots}
          suggestions={suggestions}
          vulnerabilityData={vulnerabilityData}
          timeOfDay={timeOfDay}
        />

        {/* Search Bar — top center */}
        <SearchBar onPlaceSelect={handlePlaceSelect} />

        {/* Toolbar — left side */}
        <Toolbar
          mode={mode}
          onModeChange={setMode}
          treeCount={treeCount}
          interventionCount={interventionCount}
          onUndo={removeLastTree}
          onClear={clearTrees}
          onSimulationToggle={() => {
            setSimulationOpen((v) => !v);
            setRoiOpen(false);
          }}
          simulationOpen={simulationOpen}
          onROIToggle={() => {
            setRoiOpen((v) => !v);
            setSimulationOpen(false);
          }}
          roiOpen={roiOpen}
          onVisionToggle={() => setVisionOpen(true)}
          onReportDownload={handleReportDownload}
          activeDataLayer={activeDataLayer}
          onDataLayerChange={setActiveDataLayer}
          selectedSpecies={selectedSpecies}
          onSpeciesChange={setSelectedSpecies}
          timeSliderVisible={timeSliderVisible}
          onTimeSliderToggle={handleTimeSliderToggle}
        />

        {/* Bottom Stats */}
        <StatsPanel
          temperature={temperature}
          treeCount={treeCount}
          interventionCount={interventionCount}
          simulation={simulation}
        />

        {/* Sun Path Slider */}
        {timeSliderVisible && (
          <TimeSlider
            timeOfDay={timeOfDay || 13}
            onTimeChange={setTimeOfDay}
          />
        )}

        {/* Simulation Panel — bottom right */}
        <SimulationPanel
          simulation={simulation}
          isOpen={simulationOpen}
          onClose={() => setSimulationOpen(false)}
        />

        {/* ROI Dashboard — bottom right */}
        <ROIPanel
          interventions={interventions}
          isOpen={roiOpen}
          onClose={() => setRoiOpen(false)}
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

        {/* Future Vision — Gemini AI */}
        <FutureVision
          isOpen={visionOpen}
          onClose={() => setVisionOpen(false)}
          viewport={mapRef.current?.getViewport?.()}
          treeCount={treeCount}
        />

        {/* Validation Toast */}
        <ValidationToast
          message={validationMessage}
          type={validationType}
          onClose={() => setValidationMessage(null)}
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
