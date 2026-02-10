import { useState } from "react";
import { visualizeItem } from "../services/api";
import "./InfoCard.css";

/**
 * InfoCard - displays detailed information about clicked map items
 * (trees, cool roofs, hotspots, suggestions, vulnerability zones)
 * Includes "Real Life View" button for user-placed interventions.
 */
export default function InfoCard({ item, onClose }) {
  const [realLifeView, setRealLifeView] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const handleRealLifeView = async () => {
    if (!item.position && (!item.lat || !item.lng)) return;
    
    const lat = item.position ? item.position[1] : item.lat;
    const lng = item.position ? item.position[0] : item.lng;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await visualizeItem(lat, lng, item.type, item.species);
      setRealLifeView(result);
      setLoading(false);
    } catch (err) {
      console.error("Real Life View failed:", err);
      setError(err.message || "Failed to generate visualization");
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case "tree":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">🌳</span>
              <h3 className="InfoCard-title">Planted Tree</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Species</div>
              <div className="InfoCard-value">{item.species || "Maple"}</div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cooling Effect</div>
              <div className="InfoCard-value">
                {item.species === "oak"
                  ? "−4.0°C"
                  : item.species === "pine"
                  ? "−1.5°C"
                  : "−2.5°C"}
              </div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cost</div>
              <div className="InfoCard-value">
                ${item.species === "oak" ? "450" : item.species === "pine" ? "200" : "300"}
              </div>
            </div>
            <div className="InfoCard-description">
              {item.species === "oak" &&
                "Large canopy tree providing maximum cooling. Best for parks and wide streets. Slow growth, long lifespan (80 years)."}
              {item.species === "pine" &&
                "Evergreen providing year-round shade. Low cooling but stays green in winter. Very low maintenance."}
              {(!item.species || item.species === "maple") &&
                "Medium canopy with aesthetic fall colors. Ideal for residential streets and sidewalks. Medium growth rate."}
            </div>
            <button onClick={handleRealLifeView} disabled={loading} className="InfoCard-actionBtn">
              {loading ? "🔄 Generating..." : "📸 Real Life View"}
            </button>
          </>
        );

      case "cool_roof":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">🏠</span>
              <h3 className="InfoCard-title">Cool Roof</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cooling Effect</div>
              <div className="InfoCard-value">−4.0°C</div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cost</div>
              <div className="InfoCard-value">$3,000</div>
            </div>
            <div className="InfoCard-description">
              Reflective roof coating lowers building surface temperature by 3–5°C,
              reducing A/C load and energy costs. Reflects solar radiation, keeping
              building and surrounding area cooler.
            </div>
            <button onClick={handleRealLifeView} disabled={loading} className="InfoCard-actionBtn">
              {loading ? "🔄 Generating..." : "📸 Real Life View"}
            </button>
          </>
        );

      case "bio_swale":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">💧</span>
              <h3 className="InfoCard-title">Bio-Swale</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cooling Effect</div>
              <div className="InfoCard-value">−2.0°C</div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cost</div>
              <div className="InfoCard-value">$1,000</div>
            </div>
            <div className="InfoCard-description">
              Rain garden replacing concrete — absorbs stormwater runoff and cools
              through evapotranspiration. Reduces flooding while creating green
              infrastructure.
            </div>
            <button onClick={handleRealLifeView} disabled={loading} className="InfoCard-actionBtn">
              {loading ? "🔄 Generating..." : "📸 Real Life View"}
            </button>
          </>
        );

      case "hotspot":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">⚠️</span>
              <h3 className="InfoCard-title">Red Zone Hotspot</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Temperature</div>
              <div className="InfoCard-value InfoCard-value--danger">
                {item.temperature_c}°C
              </div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Severity</div>
              <div className="InfoCard-value">
                {item.severity?.toUpperCase() || "HIGH"}
              </div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Type</div>
              <div className="InfoCard-value">
                {item.type === "parking"
                  ? "Parking Lot"
                  : item.type === "bus_stop"
                  ? "Bus Stop"
                  : item.type === "intersection"
                  ? "Intersection"
                  : "Walkway"}
              </div>
            </div>
            <div className="InfoCard-description">{item.description}</div>
          </>
        );

      case "suggestion":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">💡</span>
              <h3 className="InfoCard-title">Planting Suggestion</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Cooling Potential</div>
              <div className="InfoCard-value InfoCard-value--success">
                −{item.cooling_potential}°C
              </div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Priority</div>
              <div className="InfoCard-value">
                {item.priority === "high" ? "HIGH" : "MEDIUM"}
              </div>
            </div>
            {item.temperature_c && (
              <div className="InfoCard-section">
                <div className="InfoCard-label">Current Temperature</div>
                <div className="InfoCard-value">{item.temperature_c}°C</div>
              </div>
            )}
            <div className="InfoCard-description">{item.reason}</div>
          </>
        );

      case "vulnerability":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">🛡️</span>
              <h3 className="InfoCard-title">Vulnerable Area</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Location</div>
              <div className="InfoCard-value">{item.label}</div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Vulnerability Score</div>
              <div
                className="InfoCard-value"
                style={{
                  color:
                    item.vulnerability_score >= 0.7
                      ? "#9333ea"
                      : item.vulnerability_score >= 0.4
                      ? "#f59e0b"
                      : "#3b82f6",
                }}
              >
                {(item.vulnerability_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Population</div>
              <div className="InfoCard-value">
                {item.population?.toLocaleString() || "Unknown"}
              </div>
            </div>
            <div className="InfoCard-description">{item.factors}</div>
          </>
        );

      case "heatmap":
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">🌡️</span>
              <h3 className="InfoCard-title">Heat Map Layer</h3>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Data Source</div>
              <div className="InfoCard-value">Sentinel-2 Satellite</div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Resolution</div>
              <div className="InfoCard-value">10-30 meters</div>
            </div>
            <div className="InfoCard-section">
              <div className="InfoCard-label">Temperature Range</div>
              <div className="InfoCard-value">25°C - 55°C</div>
            </div>
            <div className="InfoCard-description">
              Real-time Land Surface Temperature (LST) data from satellite imagery.
              The heatmap shows thermal patterns across the city, with red/orange areas
              indicating urban heat islands and blue/green areas showing cooler zones.
              This data helps identify where cooling interventions will have the most impact.
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="InfoCard-header">
              <span className="InfoCard-icon">ℹ️</span>
              <h3 className="InfoCard-title">Map Information</h3>
            </div>
            <div className="InfoCard-description">
              Click on trees, buildings, hotspots, or suggestions to see detailed information.
              Use the toolbar to switch between different visualization layers and planting modes.
            </div>
          </>
        );
    }
  };

  return (
    <>
      <div className="InfoCard">
        <button onClick={onClose} className="InfoCard-close" aria-label="Close">
          ×
        </button>
        {renderContent()}
        {error && (
          <div className="InfoCard-error">{error}</div>
        )}
      </div>

      {/* Real Life View Modal */}
      {realLifeView && (
        <div className="InfoCard-modalOverlay" onClick={() => setRealLifeView(null)}>
          <div className="InfoCard-modalPanel" onClick={(e) => e.stopPropagation()}>
            <div className="InfoCard-modalHeader">
              <span className="InfoCard-modalTitle">📸 Real Life View</span>
              <button onClick={() => setRealLifeView(null)} className="InfoCard-modalClose">
                ✕
              </button>
            </div>
            
            <div className="InfoCard-splitView">
              <div className="InfoCard-imageContainer">
                <div className="InfoCard-labelBefore">BEFORE</div>
                <img
                  src={`data:image/jpeg;base64,${realLifeView.before_image}`}
                  alt="Current location"
                  className="InfoCard-viewImage"
                />
              </div>
              <div className="InfoCard-imageContainer">
                <div className="InfoCard-labelAfter">
                  AFTER — {item.type === "tree" ? `${(item.species || "Maple").toUpperCase()} TREE` : item.type.toUpperCase()} ADDED
                </div>
                <img
                  src={`data:image/jpeg;base64,${realLifeView.after_image}`}
                  alt="With intervention"
                  className="InfoCard-viewImage"
                />
              </div>
            </div>
            
            <div className="InfoCard-modalFooter">
              AI-generated visualization of this {item.type} at its exact coordinates
            </div>
          </div>
        </div>
      )}
    </>
  );
}

