import "./LeftPanel.css";

/**
 * Compact summary line: Peak temp + Cooling from interventions.
 * Replaces redundant data panels to prioritize toolbar.
 */
export default function LeftPanel({ hotspots, simulation }) {
  const temps = (hotspots || []).map((h) => h.temperature_c ?? 0);
  const peakTemp = temps.length ? Math.max(...temps).toFixed(1) : "—";
  const cooling = simulation?.area_cooling_c;

  return (
    <div className="LeftPanel">
      <span className="LeftPanel-peak">Peak: {peakTemp}°C</span>
      {cooling > 0 && (
        <>
          <span className="LeftPanel-dot">·</span>
          <span className="LeftPanel-cooling">Cooling: −{cooling}°C</span>
        </>
      )}
    </div>
  );
}
