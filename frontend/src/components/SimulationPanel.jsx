/**
 * Before/After simulation panel that shows the cooling impact of all interventions.
 * Appears at the bottom-right of the screen.
 */
export default function SimulationPanel({ simulation, isOpen, onClose, interventionCount = 0 }) {
  if (!isOpen) return null;

  const isEmpty = interventionCount === 0;
  const isLoading = !isEmpty && !simulation;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Before / After Simulation</h3>
        <button onClick={onClose} style={styles.closeBtn}>
          &times;
        </button>
      </div>

      {isLoading && (
        <div style={styles.loadingBar}>
          <div style={styles.loadingFill} />
        </div>
      )}

      {simulation && !isLoading && (
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
              <span style={styles.summaryLabel}>Interventions</span>
              <span style={styles.summaryValue}>{simulation.interventions_total || simulation.trees_planted}</span>
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

          {/* Per-item impacts */}
          {simulation.tree_impacts && simulation.tree_impacts.length > 0 && (
            <div style={styles.impacts}>
              <span style={styles.impactsTitle}>Per-Item Impact</span>
              <div style={styles.impactsList}>
                {simulation.tree_impacts.slice(0, 8).map((t, i) => (
                  <div key={i} style={styles.impactRow}>
                    <span style={styles.impactTree}>
                      {t.type === "cool_roof" ? "🏠" : t.type === "bio_swale" ? "💧" : "🌳"} #{i + 1}
                    </span>
                    <span style={styles.impactTemp}>
                      {t.surface_temp_before}°C → {t.surface_temp_after}°C
                    </span>
                    <span style={styles.impactDelta}>−{t.cooling_c}°C</span>
                  </div>
                ))}
                {simulation.tree_impacts.length > 8 && (
                  <span style={styles.moreText}>
                    +{simulation.tree_impacts.length - 8} more...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isEmpty && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            Add interventions on the map, then open this panel to see the simulated cooling impact.
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
    background: "linear-gradient(135deg, rgba(20,35,30,0.97) 0%, rgba(26,40,35,0.97) 100%)",
    borderRadius: "14px",
    border: "1px solid rgba(74,222,128,0.2)",
    backdropFilter: "blur(12px)",
    zIndex: 100,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(74,222,128,0.15)",
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
    outline: "none",
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
    padding: "40px 16px",
    textAlign: "center",
  },
  emptyText: {
    color: "#bbb",
    fontSize: "0.9rem",
    lineHeight: 1.6,
  },
};
