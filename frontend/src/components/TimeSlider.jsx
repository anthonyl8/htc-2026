import { useMemo } from "react";

/**
 * Sun Path / Time-of-Day slider.
 * Controls the simulated sun position for shadow visualization.
 * Range: 6 AM to 8 PM. Affects Deck.gl SunLight effect.
 */
export default function TimeSlider({ timeOfDay, onTimeChange }) {
  const timeLabel = useMemo(() => {
    const h = Math.floor(timeOfDay);
    const m = Math.round((timeOfDay - h) * 60);
    const suffix = h >= 12 ? "PM" : "AM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, "0")} ${suffix}`;
  }, [timeOfDay]);

  // Sun icon position (percentage along the arc)
  const progress = ((timeOfDay - 6) / 14) * 100;

  // Sun color shifts from warm orange at dawn/dusk to bright yellow at noon
  const sunColor = useMemo(() => {
    const noon = 13;
    const dist = Math.abs(timeOfDay - noon) / 7; // 0 at noon, 1 at edges
    const r = Math.round(255);
    const g = Math.round(200 + (1 - dist) * 55);
    const b = Math.round(50 + (1 - dist) * 100);
    return `rgb(${r},${g},${b})`;
  }, [timeOfDay]);

  return (
    <div style={styles.container}>
      {/* Sun arc indicator */}
      <div style={styles.arcContainer}>
        <div
          style={{
            ...styles.sunIcon,
            left: `${Math.max(2, Math.min(98, progress))}%`,
            color: sunColor,
            textShadow: `0 0 12px ${sunColor}`,
          }}
        >
          ☀
        </div>
      </div>

      {/* Slider row */}
      <div style={styles.sliderRow}>
        <span style={styles.edgeLabel}>6 AM</span>

        <div style={styles.sliderWrapper}>
          <input
            type="range"
            min={6}
            max={20}
            step={0.5}
            value={timeOfDay}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            style={styles.slider}
            className="time-slider"
          />
          {/* Gradient track behind slider */}
          <div style={styles.trackGradient} />
        </div>

        <span style={styles.edgeLabel}>8 PM</span>
      </div>

      {/* Current time label */}
      <div style={styles.timeLabel}>{timeLabel}</div>
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    bottom: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    background: "linear-gradient(135deg, rgba(20,35,30,0.92) 0%, rgba(26,40,35,0.92) 100%)",
    padding: "10px 24px 8px",
    borderRadius: "14px",
    border: "1px solid rgba(74,222,128,0.2)",
    backdropFilter: "blur(12px)",
    zIndex: 95,
    width: "340px",
    boxShadow: "0 4px 20px rgba(74,222,128,0.12)",
  },
  arcContainer: {
    position: "relative",
    width: "100%",
    height: "16px",
  },
  sunIcon: {
    position: "absolute",
    top: 0,
    transform: "translateX(-50%)",
    fontSize: "1.1rem",
    transition: "left 0.3s ease, color 0.3s ease",
    pointerEvents: "none",
  },
  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  edgeLabel: {
    color: "#666",
    fontSize: "0.65rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    minWidth: "32px",
    textAlign: "center",
  },
  sliderWrapper: {
    position: "relative",
    flex: 1,
    height: "20px",
    display: "flex",
    alignItems: "center",
  },
  slider: {
    width: "100%",
    height: "6px",
    appearance: "none",
    WebkitAppearance: "none",
    background: "transparent",
    cursor: "pointer",
    position: "relative",
    zIndex: 2,
    outline: "none",
  },
  trackGradient: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: "4px",
    transform: "translateY(-50%)",
    borderRadius: "2px",
    background:
      "linear-gradient(90deg, #f97316 0%, #fbbf24 30%, #fde047 50%, #fbbf24 70%, #f97316 100%)",
    opacity: 0.5,
    zIndex: 1,
    pointerEvents: "none",
  },
  timeLabel: {
    color: "#fbbf24",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.3px",
  },
};
