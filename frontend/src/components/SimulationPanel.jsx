import "./SimulationPanel.css";

/**
 * Before/After simulation panel that shows the cooling impact of all interventions.
 * Appears at the bottom-right of the screen.
 */
export default function SimulationPanel({ simulation, isOpen, onClose, interventionCount = 0, style = {}, className = "" }) {
  if (!isOpen) return null;

  const isEmpty = interventionCount === 0;
  const isLoading = !isEmpty && !simulation;

  return (
    <div className={`SimulationPanel panel ${className}`.trim()} style={style}>
      <div className="SimulationPanel-header">
        <h3 className="SimulationPanel-title">Before / After Simulation</h3>
        <button onClick={onClose} className="SimulationPanel-closeBtn">
          &times;
        </button>
      </div>

      {isLoading && (
        <div className="loading-bar">
          <div className="loading-fill" />
        </div>
      )}

      {simulation && !isLoading && (
        <div className="SimulationPanel-contentWrap">
        <div className="SimulationPanel-content">
          {/* Before/After Comparison */}
          <div className="SimulationPanel-comparison">
            <div className="SimulationPanel-comparisonCard">
              <span className="SimulationPanel-compLabel">BEFORE</span>
              <span className="SimulationPanel-compTemp" style={{ color: getTempColor(simulation.before.avg_temperature_c) }}>
                {simulation.before.avg_temperature_c}°C
              </span>
              <span className="SimulationPanel-compDetail">
                Max: {simulation.before.max_temperature_c}°C
              </span>
              <div className="SimulationPanel-redZoneBar">
                <div
                  className="SimulationPanel-redZoneFill"
                  style={{
                    width: `${simulation.before.red_zone_area_pct}%`,
                    background: "#ef4444",
                  }}
                />
              </div>
              <span className="SimulationPanel-redZoneText">
                {simulation.before.red_zone_area_pct}% Red Zone
              </span>
            </div>

            <div className="SimulationPanel-arrow">→</div>

            <div className="SimulationPanel-comparisonCard">
              <span className="SimulationPanel-compLabel">AFTER</span>
              <span className="SimulationPanel-compTemp" style={{ color: getTempColor(simulation.after.avg_temperature_c) }}>
                {simulation.after.avg_temperature_c}°C
              </span>
              <span className="SimulationPanel-compDetail">
                Max: {simulation.after.max_temperature_c}°C
              </span>
              <div className="SimulationPanel-redZoneBar">
                <div
                  className="SimulationPanel-redZoneFill"
                  style={{
                    width: `${simulation.after.red_zone_area_pct}%`,
                    background: "#f97316",
                  }}
                />
              </div>
              <span className="SimulationPanel-redZoneText">
                {simulation.after.red_zone_area_pct}% Red Zone
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="SimulationPanel-summary">
            <div className="SimulationPanel-summaryRow">
              <span className="SimulationPanel-summaryLabel">Interventions</span>
              <span className="SimulationPanel-summaryValue">{simulation.interventions_total || simulation.trees_planted}</span>
            </div>
            <div className="SimulationPanel-summaryRow">
              <span className="SimulationPanel-summaryLabel">Area Cooling</span>
              <span className="SimulationPanel-summaryValue SimulationPanel-summaryValue--success">
                −{simulation.area_cooling_c}°C
              </span>
            </div>
            <div className="SimulationPanel-summaryRow">
              <span className="SimulationPanel-summaryLabel">Red Zone Reduction</span>
              <span className="SimulationPanel-summaryValue SimulationPanel-summaryValue--success">
                {simulation.before.red_zone_area_pct}% → {simulation.after.red_zone_area_pct}%
              </span>
            </div>
          </div>

          {/* Per-item impacts */}
          {simulation.tree_impacts && simulation.tree_impacts.length > 0 && (
            <div className="SimulationPanel-impacts">
              <span className="SimulationPanel-impactsTitle">Per-Item Impact</span>
              <div className="SimulationPanel-impactsList">
                {simulation.tree_impacts.slice(0, 8).map((t, i) => (
                  <div key={i} className="SimulationPanel-impactRow">
                    <span className="SimulationPanel-impactTree">
                      {t.type === "cool_roof" ? "🏠" : t.type === "bio_swale" ? "💧" : "🌳"} #{i + 1}
                    </span>
                    <span className="SimulationPanel-impactTemp">
                      {t.surface_temp_before}°C → {t.surface_temp_after}°C
                    </span>
                    <span className="SimulationPanel-impactDelta">−{t.cooling_c}°C</span>
                  </div>
                ))}
                {simulation.tree_impacts.length > 8 && (
                  <span className="SimulationPanel-moreText">
                    +{simulation.tree_impacts.length - 8} more...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {isEmpty && (
        <div className="empty-state">
          <p className="empty-text">
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
