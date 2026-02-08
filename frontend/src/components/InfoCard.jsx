/**
 * InfoCard - displays detailed information about clicked map items
 * (trees, cool roofs, hotspots, suggestions, vulnerability zones)
 */
export default function InfoCard({ item, onClose }) {
  if (!item) return null;

  const renderContent = () => {
    switch (item.type) {
      case "tree":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>🌳</span>
              <h3 style={styles.title}>Planted Tree</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Species</div>
              <div style={styles.value}>{item.species || "Maple"}</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cooling Effect</div>
              <div style={styles.value}>
                {item.species === "oak"
                  ? "−4.0°C"
                  : item.species === "pine"
                  ? "−1.5°C"
                  : "−2.5°C"}
              </div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cost</div>
              <div style={styles.value}>
                ${item.species === "oak" ? "450" : item.species === "pine" ? "200" : "300"}
              </div>
            </div>
            <div style={styles.description}>
              {item.species === "oak" &&
                "Large canopy tree providing maximum cooling. Best for parks and wide streets. Slow growth, long lifespan (80 years)."}
              {item.species === "pine" &&
                "Evergreen providing year-round shade. Low cooling but stays green in winter. Very low maintenance."}
              {(!item.species || item.species === "maple") &&
                "Medium canopy with aesthetic fall colors. Ideal for residential streets and sidewalks. Medium growth rate."}
            </div>
          </>
        );

      case "cool_roof":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>🏠</span>
              <h3 style={styles.title}>Cool Roof</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cooling Effect</div>
              <div style={styles.value}>−4.0°C</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cost</div>
              <div style={styles.value}>$3,000</div>
            </div>
            <div style={styles.description}>
              Reflective roof coating lowers building surface temperature by 3–5°C,
              reducing A/C load and energy costs. Reflects solar radiation, keeping
              building and surrounding area cooler.
            </div>
          </>
        );

      case "bio_swale":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>💧</span>
              <h3 style={styles.title}>Bio-Swale</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cooling Effect</div>
              <div style={styles.value}>−2.0°C</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cost</div>
              <div style={styles.value}>$1,000</div>
            </div>
            <div style={styles.description}>
              Rain garden replacing concrete — absorbs stormwater runoff and cools
              through evapotranspiration. Reduces flooding while creating green
              infrastructure.
            </div>
          </>
        );

      case "hotspot":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>⚠️</span>
              <h3 style={styles.title}>Red Zone Hotspot</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Temperature</div>
              <div style={{ ...styles.value, color: "#ef4444" }}>
                {item.temperature_c}°C
              </div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Severity</div>
              <div style={styles.value}>
                {item.severity?.toUpperCase() || "HIGH"}
              </div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Type</div>
              <div style={styles.value}>
                {item.type === "parking"
                  ? "Parking Lot"
                  : item.type === "bus_stop"
                  ? "Bus Stop"
                  : item.type === "intersection"
                  ? "Intersection"
                  : "Walkway"}
              </div>
            </div>
            <div style={styles.description}>{item.description}</div>
          </>
        );

      case "suggestion":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>💡</span>
              <h3 style={styles.title}>Planting Suggestion</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Cooling Potential</div>
              <div style={{ ...styles.value, color: "#4ade80" }}>
                −{item.cooling_potential}°C
              </div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Priority</div>
              <div style={styles.value}>
                {item.priority === "high" ? "HIGH" : "MEDIUM"}
              </div>
            </div>
            {item.temperature_c && (
              <div style={styles.section}>
                <div style={styles.label}>Current Temperature</div>
                <div style={styles.value}>{item.temperature_c}°C</div>
              </div>
            )}
            <div style={styles.description}>{item.reason}</div>
          </>
        );

      case "vulnerability":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>🛡️</span>
              <h3 style={styles.title}>Vulnerable Area</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Location</div>
              <div style={styles.value}>{item.label}</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Vulnerability Score</div>
              <div
                style={{
                  ...styles.value,
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
            <div style={styles.section}>
              <div style={styles.label}>Population</div>
              <div style={styles.value}>
                {item.population?.toLocaleString() || "Unknown"}
              </div>
            </div>
            <div style={styles.description}>{item.factors}</div>
          </>
        );

      case "heatmap":
        return (
          <>
            <div style={styles.header}>
              <span style={styles.icon}>🌡️</span>
              <h3 style={styles.title}>Heat Map Layer</h3>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Data Source</div>
              <div style={styles.value}>Sentinel-2 Satellite</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Resolution</div>
              <div style={styles.value}>10-30 meters</div>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>Temperature Range</div>
              <div style={styles.value}>25°C - 55°C</div>
            </div>
            <div style={styles.description}>
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
            <div style={styles.header}>
              <span style={styles.icon}>ℹ️</span>
              <h3 style={styles.title}>Map Information</h3>
            </div>
            <div style={styles.description}>
              Click on trees, buildings, hotspots, or suggestions to see detailed information.
              Use the toolbar to switch between different visualization layers and planting modes.
            </div>
          </>
        );
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={onClose} style={styles.closeButton} aria-label="Close">
        ×
      </button>
      {renderContent()}
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: "80px",
    right: "20px",
    width: "320px",
    maxHeight: "500px",
    background: "linear-gradient(135deg, rgba(20,30,25,0.98) 0%, rgba(25,35,30,0.98) 100%)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(74,222,128,0.3)",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(74,222,128,0.1)",
    zIndex: 100,
    color: "#e5e5e5",
    overflowY: "auto",
  },
  closeButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#e5e5e5",
    fontSize: "24px",
    fontWeight: "300",
    lineHeight: "1",
    transition: "all 0.2s",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(74,222,128,0.2)",
  },
  icon: {
    fontSize: "2rem",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#4ade80",
    margin: 0,
  },
  section: {
    marginBottom: "12px",
  },
  label: {
    fontSize: "0.75rem",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  value: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#e5e5e5",
  },
  description: {
    fontSize: "0.875rem",
    lineHeight: 1.6,
    color: "#bbb",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(74,222,128,0.1)",
  },
};
