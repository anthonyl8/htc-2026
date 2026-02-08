import React from "react";

/**
 * Map Legend - Shows legends for different active data layers.
 * Supports: Heatmap, Hotspots (Red Zones), Suggestions, Vulnerability.
 */
export default function HeatmapLegend({ activeLayer, onInfoClick }) {
  if (!activeLayer) return null;

  const config = getLegendConfig(activeLayer);
  if (!config) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>{config.icon}</span>
        <span style={styles.title}>{config.title}</span>
        {onInfoClick && (
          <button
            onClick={() => onInfoClick({ type: activeLayer })}
            style={styles.infoButton}
            title={`Show ${config.title} information`}
          >
            ℹ️
          </button>
        )}
      </div>

      <div style={styles.content}>
        {config.items.map((item, i) => (
          <div key={i} style={styles.row}>
            <div
              style={{
                ...styles.colorBox,
                background: item.color,
                border: item.border || "1px solid rgba(255,255,255,0.3)",
                borderRadius: item.shape === "circle" ? "50%" : "4px",
              }}
            />
            <div style={styles.labelContainer}>
              <span style={styles.label}>{item.label}</span>
              {item.desc && <span style={styles.desc}>{item.desc}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <span style={styles.source}>{config.source}</span>
      </div>
    </div>
  );
}

// ─── Configuration ───────────────────────────────────────────

function getLegendConfig(layer) {
  switch (layer) {
    case "heatmap":
      return {
        title: "Surface Temperature",
        icon: "🌡️",
        source: "Sentinel-2 LST Data",
        items: [
          { label: "42°C+", desc: "Extreme Heat", color: "#dc1426" },
          { label: "38°C", desc: "Very Hot", color: "#f03b20" },
          { label: "34°C", desc: "Hot", color: "#fd8d3c" },
          { label: "30°C", desc: "Warm", color: "#fed750" },
        ],
      };

    case "hotspots":
      return {
        title: "Red Zones (Hotspots)",
        icon: "⚠️",
        source: "Urban Heat Island Analysis",
        items: [
          { 
            label: "≥ 50°C", 
            desc: "Critical Heat Stress", 
            color: "rgba(255, 30, 30, 0.8)",
            shape: "circle" 
          },
          { 
            label: "45–49°C", 
            desc: "Severe Heat Risk", 
            color: "rgba(255, 100, 30, 0.8)",
            shape: "circle" 
          },
          { 
            label: "< 45°C", 
            desc: "Elevated Temperature", 
            color: "rgba(255, 180, 30, 0.8)",
            shape: "circle" 
          },
        ],
      };

    case "suggestions":
      return {
        title: "Planting Suggestions",
        icon: "💡",
        source: "AI Cooling Potential Model",
        items: [
          { 
            label: "High Impact", 
            desc: "Max cooling potential", 
            color: "rgba(100, 255, 150, 0.6)",
            border: "2px solid rgb(150, 255, 180)",
            shape: "circle" 
          },
          { 
            label: "Recommended", 
            desc: "Ideal planting site", 
            color: "rgba(100, 255, 150, 0.3)",
            border: "1px solid rgb(150, 255, 180)",
            shape: "circle" 
          },
        ],
      };

    case "vulnerability":
      return {
        title: "Vulnerability Index",
        icon: "🛡️",
        source: "Socio-Economic & Health Data",
        items: [
          { 
            label: "Critical Risk (0.7+)", 
            desc: "High exposure & sensitivity", 
            color: "rgba(200, 100, 255, 0.6)",
            border: "2px solid rgb(230, 150, 255)",
            shape: "circle" 
          },
          { 
            label: "High Risk (0.4–0.7)", 
            desc: "Moderate resilience", 
            color: "rgba(255, 180, 50, 0.6)",
            border: "2px solid rgb(255, 200, 100)",
            shape: "circle" 
          },
          { 
            label: "Moderate Risk (<0.4)", 
            desc: "Standard resilience", 
            color: "rgba(100, 180, 255, 0.6)",
            border: "2px solid rgb(150, 210, 255)",
            shape: "circle" 
          },
        ],
      };

    default:
      return null;
  }
}

// ─── Styles ──────────────────────────────────────────────────

const styles = {
  container: {
    position: "absolute",
    top: "16px",
    right: "16px",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, rgba(20,35,30,0.95) 0%, rgba(26,40,35,0.95) 100%)",
    borderRadius: "12px",
    border: "1px solid rgba(74,222,128,0.2)",
    backdropFilter: "blur(16px)",
    zIndex: 150,
    minWidth: "220px",
    boxShadow: "0 4px 20px rgba(74,222,128,0.15)",
    transition: "all 0.3s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  infoButton: {
    marginLeft: "auto",
    background: "rgba(74,222,128,0.15)",
    border: "1px solid rgba(74,222,128,0.3)",
    borderRadius: "6px",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s",
    color: "#4ade80",
    opacity: 0.8,
  },
  icon: {
    fontSize: "1rem",
  },
  title: {
    color: "#4ade80",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "0.3px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 14px",
    gap: "8px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  colorBox: {
    width: "20px",
    height: "20px",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  labelContainer: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  desc: {
    color: "#aaa",
    fontSize: "0.65rem",
    fontWeight: 500,
    marginTop: "1px",
  },
  footer: {
    padding: "8px 14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  source: {
    color: "#666",
    fontSize: "0.62rem",
    fontWeight: 600,
    letterSpacing: "0.3px",
    textTransform: "uppercase",
  },
};
