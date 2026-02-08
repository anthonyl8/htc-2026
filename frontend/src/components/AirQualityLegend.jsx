/**
 * Shown when the Air Quality layer is active.
 * Explains green "clean air" zones around trees and optional AQI heatmap.
 */
export default function AirQualityLegend({ visible, treeCount }) {
  if (!visible) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🌬️</span>
        <span style={styles.title}>Air Quality</span>
      </div>
      <div style={styles.body}>
        <p style={styles.paragraph}>
          <strong>Green zones</strong> = clean air around planted trees (filters PM2.5 & CO₂).
        </p>
        {treeCount > 0 ? (
          <p style={styles.hint}>
            You have {treeCount} tree{treeCount !== 1 ? "s" : ""} — green circles show their air-cleaning radius.
          </p>
        ) : (
          <p style={styles.hint}>
            Plant trees to see clean air zones on the map.
          </p>
        )}
        <p style={styles.footer}>
          AQI heatmap tiles require the <strong>Air Quality API</strong> enabled in Google Cloud.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: 80,
    right: 16,
    width: 220,
    background: "linear-gradient(180deg, rgba(20,35,30,0.96), rgba(26,40,35,0.96))",
    border: "1px solid rgba(74,222,128,0.25)",
    borderRadius: 12,
    padding: "12px 14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    zIndex: 10,
    fontSize: "0.8rem",
    color: "#e5e7eb",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    borderBottom: "1px solid rgba(74,222,128,0.2)",
    paddingBottom: 8,
  },
  icon: { fontSize: "1.2rem" },
  title: { fontWeight: 600, color: "#a7f3d0" },
  body: { lineHeight: 1.5 },
  paragraph: { margin: "0 0 8px 0", color: "#d1d5db" },
  hint: { margin: "0 0 8px 0", color: "#9ca3af", fontSize: "0.78rem" },
  footer: { margin: 0, color: "#6b7280", fontSize: "0.72rem" },
};
