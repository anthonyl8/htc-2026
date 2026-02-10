import "./StatsPanel.css";

/**
 * Compact stats panel shown at the bottom of the screen.
 * Displays key metrics: temperature, interventions, heat reduction.
 */
export default function StatsPanel({ temperature, interventionCount, treeCount, simulation }) {
  const cooling = simulation ? simulation.area_cooling_c : 0;
  const redBefore = simulation ? simulation.before.red_zone_area_pct : 35;
  const redAfter = simulation ? simulation.after.red_zone_area_pct : 35;

  return (
    <div className="StatsPanel">
      <Stat
        label="Surface Temp"
        value={temperature !== null ? `${temperature}°C` : "—"}
        color={temperature !== null ? getTempColor(temperature) : "#888"}
      />
      <div className="StatsPanel-divider" />
      <Stat
        label="Interventions"
        value={interventionCount}
        color="#4ade80"
      />
      <div className="StatsPanel-divider" />
      <Stat
        label="Est. Cooling"
        value={cooling > 0 ? `−${cooling}°C` : "—"}
        color={cooling > 0 ? "#4ade80" : "#888"}
      />
      <div className="StatsPanel-divider" />
      <Stat
        label="Red Zone"
        value={interventionCount > 0 ? `${redBefore}% → ${redAfter}%` : `${redBefore}%`}
        color={redAfter < redBefore ? "#4ade80" : "#f97316"}
      />
      {simulation?.roi && (
        <>
          <div className="StatsPanel-divider" />
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
    <div className="StatsPanel-stat">
      <span className="StatsPanel-statLabel">{label}</span>
      <span className="StatsPanel-statValue" style={{ color }}>{value}</span>
    </div>
  );
}

function getTempColor(temp) {
  if (temp < 28) return "#60a5fa";
  if (temp < 32) return "#fbbf24";
  if (temp < 36) return "#f97316";
  return "#ef4444";
}
