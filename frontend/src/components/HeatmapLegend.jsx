/**
 * Heat Map Legend - Shows temperature scale and color gradient.
 * Appears when heat map layer is active.
 */
export default function HeatmapLegend({ visible }) {
  if (!visible) return null;

  const gradientStops = [
    { temp: "42°C+", color: "#dc1426", label: "Extreme Heat" },
    { temp: "38°C", color: "#f03b20", label: "Very Hot" },
    { temp: "34°C", color: "#fd8d3c", label: "Hot" },
    { temp: "30°C", color: "#fed750", label: "Warm" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🌡️</span>
        <span style={styles.title}>Surface Temperature</span>
      </div>

      <div style={styles.gradient}>
        {gradientStops.map((stop, i) => (
          <div key={i} style={styles.stopRow}>
            <div
              style={{
                ...styles.colorBox,
                background: stop.color,
              }}
            />
            <span style={styles.tempLabel}>{stop.temp}</span>
            <span style={styles.description}>{stop.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <span style={styles.source}>Sentinel-2 LST Data</span>
      </div>
    </div>
  );
}

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
    minWidth: "200px",
    boxShadow: "0 4px 20px rgba(74,222,128,0.15)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  icon: {
    fontSize: "1rem",
  },
  title: {
    color: "#4ade80",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.3px",
  },
  gradient: {
    display: "flex",
    flexDirection: "column",
    padding: "8px 14px",
    gap: "6px",
  },
  stopRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  colorBox: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  tempLabel: {
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 700,
    fontFamily: "monospace",
    minWidth: "42px",
  },
  description: {
    color: "#999",
    fontSize: "0.68rem",
    fontWeight: 500,
  },
  footer: {
    padding: "6px 14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  source: {
    color: "#666",
    fontSize: "0.62rem",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
};
