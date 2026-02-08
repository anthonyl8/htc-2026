
/**
 * Before/After simulation panel that shows the cooling impact of planted trees.
 * Appears at the bottom-right of the screen.
 */
export default function SimulationPanel({ simulation, isOpen, onClose }) {
  if (!isOpen) return null;

  const loading = !simulation && isOpen;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Before / After Simulation</h3>
        <button onClick={onClose} style={styles.closeBtn}>
          &times;
        </button>
      </div>

      {loading && (
        <div style={styles.loadingBar}>
          <div style={styles.loadingFill} />
        </div>
      )}

      {simulation && !loading && (
        <div style={styles.content}>
          {/* Before/After Comparison */}
          <div style={styles.comparison}>
            <div style={styles.comparisonCard}>
              <span style={styles.compLabel}>BEFORE</span>
              <span style={{ ...styles.compTemp, color: getTempColor(simulation.before.avg_temperature_c) }}>
                {simulation.before.avg_temperature_c}°C
              </span>
              <span style={styles.compDetail}>
                Max: {simulation.before.max_temperature_c}°C
              </span>
              <div style={styles.redZoneBar}>
                <div
                  style={{
                    ...styles.redZoneFill,
                    width: `${simulation.before.red_zone_area_pct}%`,
                    background: "#ef4444",
                  }}
                />
              </div>
              <span style={styles.redZoneText}>
                {simulation.before.red_zone_area_pct}% Red Zone
              </span>
            </div>

            <div style={styles.arrow}>→</div>

            <div style={styles.comparisonCard}>
              <span style={styles.compLabel}>AFTER</span>
              <span style={{ ...styles.compTemp, color: getTempColor(simulation.after.avg_temperature_c) }}>
                {simulation.after.avg_temperature_c}°C
              </span>
              <span style={styles.compDetail}>
                Max: {simulation.after.max_temperature_c}°C
              </span>
              <div style={styles.redZoneBar}>
                <div
                  style={{
                    ...styles.redZoneFill,
                    width: `${simulation.after.red_zone_area_pct}%`,
                    background: "#f97316",
                  }}
                />
              </div>
              <span style={styles.redZoneText}>
                {simulation.after.red_zone_area_pct}% Red Zone
              </span>
            </div>
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Trees Planted</span>
              <span style={styles.summaryValue}>{simulation.trees_planted}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Area Cooling</span>
              <span style={{ ...styles.summaryValue, color: "#4ade80" }}>
                −{simulation.area_cooling_c}°C
              </span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Red Zone Reduction</span>
              <span style={{ ...styles.summaryValue, color: "#4ade80" }}>
                {simulation.before.red_zone_area_pct}% → {simulation.after.red_zone_area_pct}%
              </span>
            </div>
          </div>

          {/* Per-tree impacts */}
          {simulation.tree_impacts && simulation.tree_impacts.length > 0 && (
            <div style={styles.impacts}>
              <span style={styles.impactsTitle}>Per-Tree Impact</span>
              <div style={styles.impactsList}>
                {simulation.tree_impacts.slice(0, 6).map((t, i) => (
                  <div key={i} style={styles.impactRow}>
                    <span style={styles.impactTree}>🌳 #{i + 1}</span>
                    <span style={styles.impactTemp}>
                      {t.surface_temp_before}°C → {t.surface_temp_after}°C
                    </span>
                    <span style={styles.impactDelta}>−{t.cooling_c}°C</span>
                  </div>
                ))}
                {simulation.tree_impacts.length > 6 && (
                  <span style={styles.moreText}>
                    +{simulation.tree_impacts.length - 6} more trees...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!simulation && !loading && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            Plant some trees on the map, then open this panel to see the
            simulated cooling impact.
          </p>
        </div>
      )}
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
    right: "16px",
    width: "340px",
    background: "rgba(26,26,46,0.97)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
    zIndex: 100,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.4rem",
    cursor: "pointer",
    lineHeight: 1,
  },
  loadingBar: {
    height: "3px",
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  loadingFill: {
    height: "100%",
    width: "30%",
    background: "#4ade80",
    animation: "shimmer 1.2s ease-in-out infinite",
    borderRadius: "2px",
  },
  content: {
    padding: "14px 16px",
  },
  comparison: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
  },
  comparisonCard: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "center",
  },
  compLabel: {
    display: "block",
    color: "#888",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  compTemp: {
    display: "block",
    fontSize: "1.4rem",
    fontWeight: 800,
    marginBottom: "2px",
  },
  compDetail: {
    display: "block",
    color: "#999",
    fontSize: "0.75rem",
  },
  arrow: {
    color: "#4ade80",
    fontSize: "1.3rem",
    fontWeight: 700,
  },
  redZoneBar: {
    height: "4px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "2px",
    marginTop: "8px",
    overflow: "hidden",
  },
  redZoneFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.5s ease",
  },
  redZoneText: {
    display: "block",
    color: "#999",
    fontSize: "0.7rem",
    marginTop: "3px",
  },
  summary: {
    marginBottom: "12px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  summaryLabel: {
    color: "#999",
    fontSize: "0.82rem",
  },
  summaryValue: {
    color: "#fff",
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  impacts: {
    marginTop: "8px",
  },
  impactsTitle: {
    display: "block",
    color: "#888",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  },
  impactsList: {
    maxHeight: "140px",
    overflowY: "auto",
  },
  impactRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 0",
    fontSize: "0.8rem",
  },
  impactTree: {
    color: "#4ade80",
    width: "50px",
    flexShrink: 0,
  },
  impactTemp: {
    color: "#ccc",
    flex: 1,
  },
  impactDelta: {
    color: "#4ade80",
    fontWeight: 700,
    flexShrink: 0,
  },
  moreText: {
    display: "block",
    color: "#888",
    fontSize: "0.75rem",
    textAlign: "center",
    paddingTop: "4px",
  },
  empty: {
    padding: "24px 16px",
    textAlign: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },
};
