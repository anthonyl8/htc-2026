import "./AlertBar.css";

/**
 * Dismissible alert bar - green-tinted for sustainability theme.
 * Shows heat resilience alerts when hotspots exist.
 */
export default function AlertBar({ hotspots, dismissed, onDismiss }) {
  if (dismissed || !hotspots?.length) return null;

  const count = hotspots.length;
  const hottest = Math.max(...hotspots.map((h) => h.temperature_c ?? 0), 0);

  return (
    <div className="AlertBar">
      <span className="AlertBar-icon">ℹ️</span>
      <span className="AlertBar-text">
        {count} heat hotspot{count !== 1 ? "s" : ""} detected (up to {Math.round(hottest)}°C).
        Add trees, cool roofs, or bio-swales to reduce urban heat.
      </span>
      <button
        onClick={onDismiss}
        className="AlertBar-closeBtn"
        title="Dismiss"
        aria-label="Dismiss alert"
      >
        ×
      </button>
    </div>
  );
}
