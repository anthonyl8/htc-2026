import React from "react";
import "./HeatmapLegend.css";

/**
 * Map Legend - Shows legends for different active data layers.
 * Supports: Heatmap, Hotspots (Red Zones), Suggestions, Vulnerability.
 */
export default function HeatmapLegend({ activeLayer, onInfoClick, style = {} }) {
  if (!activeLayer) return null;

  const config = getLegendConfig(activeLayer);
  if (!config) return null;

  return (
    <div className="HeatmapLegend" style={style}>
      <div className="HeatmapLegend-header">
        <span className="HeatmapLegend-icon">{config.icon}</span>
        <span className="HeatmapLegend-title">{config.title}</span>
        {onInfoClick && (
          <button
            onClick={() => onInfoClick({ type: activeLayer })}
            className="HeatmapLegend-infoBtn"
            title={`Show ${config.title} information`}
          >
            ℹ️
          </button>
        )}
      </div>

      <div className="HeatmapLegend-content">
        {config.items.map((item, i) => (
          <div key={i} className="HeatmapLegend-row">
            <div
              className="HeatmapLegend-colorBox"
              style={{
                background: item.color,
                border: item.border || "1px solid rgba(255,255,255,0.3)",
                borderRadius: item.shape === "circle" ? "50%" : "4px",
              }}
            />
            <div className="HeatmapLegend-labelContainer">
              <span className="HeatmapLegend-label">{item.label}</span>
              {item.desc && <span className="HeatmapLegend-desc">{item.desc}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="HeatmapLegend-footer">
        <span className="HeatmapLegend-source">{config.source}</span>
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

    case "equity":
      return {
        title: "Equity (Income Zones)",
        icon: "📊",
        source: "Census & Income Data",
        items: [
          { 
            label: "Low Income (<$40k)", 
            desc: "High heat exposure risk", 
            color: "rgba(255, 0, 0, 0.6)",
            border: "1px solid rgb(255, 100, 100)",
          },
          { 
            label: "Middle Income", 
            desc: "$40k - $70k", 
            color: "rgba(255, 165, 0, 0.6)",
            border: "1px solid rgb(255, 200, 100)",
          },
          { 
            label: "High Income (>$70k)", 
            desc: "Lower heat exposure", 
            color: "rgba(0, 255, 0, 0.6)",
            border: "1px solid rgb(100, 255, 100)",
          },
        ],
      };

    default:
      return null;
  }
}

