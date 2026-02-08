/**
 * Compact stats panel shown at the bottom of the screen.
 * Displays key metrics: temperature, interventions, heat reduction.
 */
export default function StatsPanel({ temperature, interventionCount, treeCount, simulation }) {
  const cooling = simulation ? simulation.area_cooling_c : 0;
  const redBefore = simulation ? simulation.before.red_zone_area_pct : 35;
  const redAfter = simulation ? simulation.after.red_zone_area_pct : 35;

  return (
    <div style={styles.container}>
      <Stat
        label="Surface Temp"
        value={temperature !== null ? `${temperature}°C` : "—"}
        color={temperature !== null ? getTempColor(temperature) : "#888"}
      />
      <div style={styles.divider} />
      <Stat
        label="Interventions"
        value={interventionCount}
        color="#4ade80"
      />
      <div style={styles.divider} />
      <Stat
        label="Est. Cooling"
        value={cooling > 0 ? `−${cooling}°C` : "—"}
        color={cooling > 0 ? "#4ade80" : "#888"}
      />
      <div style={styles.divider} />
      <Stat
        label="Red Zone"
        value={interventionCount > 0 ? `${redBefore}% → ${redAfter}%` : `${redBefore}%`}
        color={redAfter < redBefore ? "#4ade80" : "#f97316"}
      />
      {simulation?.roi && (
        <>
          <div style={styles.divider} />
          <Stat
            label="Investment"
            value={`$${simulation.roi.total_cost?.toLocaleString() || 0}`}
            color="#fbbf24"
          />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color }}>{value}</span>
    </div>
  );
}

function getTempColor(temp) {
  if (temp < 28) return "#60a5fa";
  if (temp < 32) return "#fbbf24";
  if (temp < 36) return "#f97316";
  return "#ef4444";
}

const styles = {
  container: {
    position: "absolute",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "0",
    background: "linear-gradient(135deg, rgba(20,40,32,0.95) 0%, rgba(26,45,35,0.95) 100%)",
    padding: "10px 20px",
    borderRadius: "14px",
    border: "1px solid rgba(74,222,128,0.25)",
    backdropFilter: "blur(12px)",
    zIndex: 90,
    boxShadow: "0 4px 20px rgba(74,222,128,0.15)",
  },
  divider: {
    width: "1px",
    height: "30px",
    background: "rgba(255,255,255,0.1)",
    margin: "0 16px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "80px",
  },
  statLabel: {
    color: "#888",
    fontSize: "0.68rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "2px",
  },
  statValue: {
    fontSize: "1rem",
    fontWeight: 700,
  },
};
