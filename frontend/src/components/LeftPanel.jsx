/**
 * Compact summary line: Peak temp + Cooling from interventions.
 * Replaces redundant data panels to prioritize toolbar.
 */
export default function LeftPanel({ hotspots, simulation }) {
  const temps = (hotspots || []).map((h) => h.temperature_c ?? 0);
  const peakTemp = temps.length ? Math.max(...temps).toFixed(1) : "—";
  const cooling = simulation?.area_cooling_c;

  return (
    <div style={styles.container}>
      <span style={styles.peak}>Peak: {peakTemp}°C</span>
      {cooling > 0 && (
        <>
          <span style={styles.dot}>·</span>
          <span style={styles.cooling}>Cooling: −{cooling}°C</span>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    background: "rgba(74, 222, 128, 0.08)",
    borderRadius: "8px",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    fontSize: "0.8rem",
  },
  peak: {
    color: "#ccc",
    fontWeight: 600,
  },
  dot: {
    color: "#666",
  },
  cooling: {
    color: "#4ade80",
    fontWeight: 700,
  },
};
