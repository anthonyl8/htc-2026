/**
 * Tree Species Selector panel.
 * Appears when the user is in "plant tree" mode.
 * Shows Oak, Maple, Pine with stats.
 */

const SPECIES = [
  {
    id: "oak",
    name: "Oak",
    icon: "🌳",
    canopy: "Large",
    cooling: "−4.0°C",
    cost: "$450",
    color: "#22783e",
    desc: "Max shade, long-term",
  },
  {
    id: "maple",
    name: "Maple",
    icon: "🍁",
    canopy: "Medium",
    cooling: "−2.5°C",
    cost: "$300",
    color: "#3ca028",
    desc: "Aesthetic, balanced",
  },
  {
    id: "pine",
    name: "Pine",
    icon: "🌲",
    canopy: "Small",
    cooling: "−1.5°C",
    cost: "$200",
    color: "#146432",
    desc: "Evergreen, low-cost",
  },
];

export default function SpeciesSelector({ selectedSpecies, onSpeciesChange }) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>TREE SPECIES</span>
      {SPECIES.map((sp) => {
        const active = selectedSpecies === sp.id;
        return (
          <button
            key={sp.id}
            onClick={() => onSpeciesChange(sp.id)}
            style={{
              ...styles.card,
              ...(active
                ? {
                    background: `${sp.color}22`,
                    color: "#fff",
                  }
                : {}),
            }}
          >
            <span style={styles.icon}>{sp.icon}</span>
            <div style={styles.info}>
              <span style={{ ...styles.name, ...(active ? { color: sp.color } : {}) }}>
                {sp.name}
              </span>
              <span style={styles.desc}>{sp.desc}</span>
            </div>
            <div style={styles.stats}>
              <span style={{ ...styles.cooling, color: active ? "#4ade80" : "#888" }}>
                {sp.cooling}
              </span>
              <span style={styles.cost}>{sp.cost}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Also export for use in other components
export { SPECIES };

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    background: "linear-gradient(135deg, rgba(20,35,30,0.94) 0%, rgba(26,40,35,0.94) 100%)",
    padding: "8px 6px",
    borderRadius: "12px",
    border: "1px solid rgba(74,222,128,0.2)",
    backdropFilter: "blur(16px)",
  },
  label: {
    color: "#4ade80",
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: "1.2px",
    padding: "0 8px 4px",
    opacity: 0.8,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    background: "transparent",
    color: "#999",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.76rem",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    outline: "none",
  },
  icon: {
    fontSize: "1.1rem",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  name: {
    fontWeight: 700,
    fontSize: "0.78rem",
    color: "#ccc",
  },
  desc: {
    fontSize: "0.62rem",
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  cooling: {
    fontSize: "0.72rem",
    fontWeight: 700,
  },
  cost: {
    fontSize: "0.6rem",
    color: "#666",
  },
};
