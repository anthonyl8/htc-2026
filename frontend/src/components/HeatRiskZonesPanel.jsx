/**
 * Heat Risk Zones - 2x3 grid of temperature zones.
 * Matches Figma layout with green sustainability accents.
 */
export default function HeatRiskZonesPanel({ hotspots }) {
  const temps = (hotspots || []).map((h) => h.temperature_c ?? 0);
  const sorted = [...temps].sort((a, b) => b - a);

  // Build 6 zones: top 6 temps, or pad with placeholder values
  const zones = [];
  for (let i = 0; i < 6; i++) {
    const temp = sorted[i] ?? (30 - i * 2);
    zones.push({
      temp: Math.round(temp),
      tempF: Math.round(temp * 1.8 + 32),
      color: getZoneColor(temp),
    });
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Heat Risk Zones</h3>
      <div style={styles.grid}>
        {zones.map((z, i) => (
          <div key={i} style={{ ...styles.box, background: z.color }}>
            <span style={styles.temp}>{z.tempF}°F</span>
            <span style={styles.tempC}>{z.temp}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getZoneColor(temp) {
  if (temp >= 42) return "#ef4444";
  if (temp >= 38) return "#f97316";
  if (temp >= 35) return "#eab308";
  if (temp >= 32) return "#84cc16";
  if (temp >= 28) return "#22c55e";
  return "#16a34a";
}

const styles = {
  container: {
    background: "linear-gradient(135deg, rgba(20, 40, 32, 0.95) 0%, rgba(26, 45, 38, 0.95) 100%)",
    borderRadius: "12px",
    border: "1px solid rgba(74, 222, 128, 0.25)",
    padding: "14px 16px",
    backdropFilter: "blur(12px)",
    minWidth: "200px",
  },
  title: {
    color: "#4ade80",
    fontSize: "0.9rem",
    fontWeight: 700,
    marginBottom: "12px",
    letterSpacing: "0.3px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  box: {
    padding: "12px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  temp: {
    display: "block",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 800,
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
  tempC: {
    display: "block",
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.7rem",
    marginTop: "2px",
  },
};
