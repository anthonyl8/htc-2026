/**
 * Left-side floating toolbar.
 * Mode switching, layer toggles (radio button style), tree actions, simulation toggle.
 */
export default function Toolbar({
  mode,
  onModeChange,
  treeCount,
  onUndo,
  onClear,
  onSimulationToggle,
  simulationOpen,
  activeDataLayer,
  onDataLayerChange,
}) {
  // Radio button behavior: toggle off if clicking active layer
  const handleLayerClick = (layerId) => {
    if (activeDataLayer === layerId) {
      onDataLayerChange(null); // Deselect
    } else {
      onDataLayerChange(layerId);
    }
  };

  return (
    <div style={styles.container}>
      {/* Brand */}
      <div style={styles.brand}>
        <span style={styles.logo}>🌿</span>
        <div>
          <span style={styles.brandName}>ReLeaf</span>
          <span style={styles.tagline}>Heat Resilience</span>
        </div>
      </div>

      {/* Mode */}
      <Section>
        <SectionLabel>MODE</SectionLabel>
        <ModeBtn
          active={mode === "explore"}
          onClick={() => onModeChange("explore")}
          icon="🗺"
          label="Explore"
        />
        <ModeBtn
          active={mode === "plant"}
          onClick={() => onModeChange("plant")}
          icon="🌳"
          label="Plant Trees"
          activeColor="#4ade80"
        />
        <ModeBtn
          active={mode === "streetview"}
          onClick={() => onModeChange("streetview")}
          icon="📍"
          label="Street View"
          activeColor="#fbbf24"
        />
      </Section>

      {/* Data Layers (Radio Button Style) */}
      <Section>
        <SectionLabel>DATA LAYERS</SectionLabel>
        <RadioLayerToggle
          active={activeDataLayer === "heatmap"}
          onClick={() => handleLayerClick("heatmap")}
          color="#ef4444"
          label="Heat Map"
        />
        <RadioLayerToggle
          active={activeDataLayer === "hotspots"}
          onClick={() => handleLayerClick("hotspots")}
          color="#f97316"
          label="Red Zones"
        />
        <RadioLayerToggle
          active={activeDataLayer === "suggestions"}
          onClick={() => handleLayerClick("suggestions")}
          color="#4ade80"
          label="Plant Suggestions"
        />
        <RadioLayerToggle
          active={activeDataLayer === "vulnerability"}
          onClick={() => handleLayerClick("vulnerability")}
          color="#a78bfa"
          label="Vulnerability"
        />
      </Section>

      {/* Trees */}
      {treeCount > 0 && (
        <Section>
          <div style={styles.treeRow}>
            <span style={{ fontSize: "1rem" }}>🌳</span>
            <span style={styles.treeCount}>{treeCount}</span>
            <span style={styles.treeLabel}>planted</span>
            <div style={{ flex: 1 }} />
            <button onClick={onUndo} style={styles.iconBtn} title="Undo">
              ↩
            </button>
            <button onClick={onClear} style={styles.iconBtn} title="Clear">
              ✕
            </button>
          </div>
        </Section>
      )}

      {/* Simulation */}
      <button
        onClick={onSimulationToggle}
        style={{
          ...styles.actionBtn,
          ...(simulationOpen ? styles.actionBtnActive : {}),
        }}
      >
        📊 Simulation
      </button>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function Section({ children }) {
  return <div style={styles.section}>{children}</div>;
}

function SectionLabel({ children }) {
  return <span style={styles.sectionLabel}>{children}</span>;
}

function ModeBtn({ active, onClick, icon, label, activeColor = "#60a5fa" }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.modeBtn,
        ...(active
          ? { background: `${activeColor}18`, color: activeColor }
          : {}),
      }}
    >
      {icon} {label}
    </button>
  );
}

function RadioLayerToggle({ active, onClick, color, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.layerBtn,
        ...(active
          ? { background: `${color}15`, color, borderColor: `${color}33` }
          : {}),
      }}
    >
      <span
        style={{
          ...styles.radio,
          borderColor: active ? color : "rgba(255,255,255,0.15)",
          background: active ? "transparent" : "rgba(255,255,255,0.03)",
        }}
      >
        {active && (
          <span
            style={{
              ...styles.radioDot,
              background: color,
            }}
          />
        )}
      </span>
      {label}
    </button>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = {
  container: {
    position: "absolute",
    top: "16px",
    left: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    zIndex: 100,
    width: "190px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(26,26,46,0.94)",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
  },
  logo: { fontSize: "1.5rem" },
  brandName: {
    display: "block",
    color: "#4ade80",
    fontWeight: 800,
    fontSize: "1.1rem",
    lineHeight: 1.1,
    letterSpacing: "-0.3px",
  },
  tagline: {
    display: "block",
    color: "#777",
    fontSize: "0.6rem",
    fontWeight: 500,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    background: "rgba(26,26,46,0.94)",
    padding: "8px 6px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
  },
  sectionLabel: {
    color: "#555",
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: "1.2px",
    padding: "0 8px 4px",
  },
  modeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    background: "transparent",
    color: "#888",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  },
  layerBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    background: "transparent",
    color: "#888",
    border: "1px solid transparent",
    borderRadius: "7px",
    fontSize: "0.76rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  radio: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "2px solid",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  radioDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  treeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
  },
  treeCount: { color: "#4ade80", fontWeight: 700, fontSize: "0.95rem" },
  treeLabel: { color: "#888", fontSize: "0.75rem" },
  iconBtn: {
    width: "26px",
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.08)",
    color: "#aaa",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  actionBtn: {
    padding: "10px 14px",
    background: "rgba(26,26,46,0.94)",
    color: "#bbb",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    backdropFilter: "blur(16px)",
    textAlign: "left",
    transition: "all 0.15s",
  },
  actionBtnActive: {
    background: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    borderColor: "rgba(59,130,246,0.25)",
  },
};
