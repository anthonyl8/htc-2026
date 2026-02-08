import SpeciesSelector from "./SpeciesSelector";

/**
 * Left-side floating toolbar.
 * Mode switching, intervention toolbox, species selector, layer toggles,
 * tree actions, dashboard toggles.
 */
export default function Toolbar({
  mode,
  onModeChange,
  treeCount,
  interventionCount,
  onUndo,
  onClear,
  onSimulationToggle,
  simulationOpen,
  onROIToggle,
  roiOpen,
  onVisionToggle,
  onReportDownload,
  activeDataLayer,
  onDataLayerChange,
  selectedSpecies,
  onSpeciesChange,
  timeSliderVisible,
  onTimeSliderToggle,
}) {
  // Radio button behavior: toggle off if clicking active layer
  const handleLayerClick = (layerId) => {
    if (activeDataLayer === layerId) {
      onDataLayerChange(null); // Deselect
    } else {
      onDataLayerChange(layerId);
    }
  };

  const isIntervention = mode === "tree" || mode === "cool_roof" || mode === "bio_swale";

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
          active={mode === "streetview"}
          onClick={() => onModeChange("streetview")}
          icon="📍"
          label="Street View"
          activeColor="#fbbf24"
        />
      </Section>

      {/* Intervention Toolbox */}
      <Section>
        <SectionLabel>INTERVENTIONS</SectionLabel>
        <ModeBtn
          active={mode === "tree"}
          onClick={() => onModeChange("tree")}
          icon="🌳"
          label="Plant Tree"
          activeColor="#4ade80"
        />
        <ModeBtn
          active={mode === "cool_roof"}
          onClick={() => onModeChange("cool_roof")}
          icon="🏠"
          label="Cool Roof"
          activeColor="#93c5fd"
        />
        <ModeBtn
          active={mode === "bio_swale"}
          onClick={() => onModeChange("bio_swale")}
          icon="💧"
          label="Bio-Swale"
          activeColor="#38bdf8"
        />
      </Section>

      {/* Species selector — only when planting trees */}
      {mode === "tree" && (
        <SpeciesSelector
          selectedSpecies={selectedSpecies}
          onSpeciesChange={onSpeciesChange}
        />
      )}

      {/* Interventions count + undo/clear */}
      {interventionCount > 0 && (
        <Section>
          <div style={styles.treeRow}>
            <span style={{ fontSize: "0.85rem" }}>🌳</span>
            <span style={styles.treeCount}>{interventionCount}</span>
            <span style={styles.treeLabel}>placed</span>
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

      {/* Dashboard & Tools */}
      <Section>
        <SectionLabel>TOOLS</SectionLabel>
        <ActionBtn
          active={simulationOpen}
          onClick={onSimulationToggle}
          icon="📊"
          label="Simulation"
        />
        <ActionBtn
          active={roiOpen}
          onClick={onROIToggle}
          icon="💰"
          label="ROI Dashboard"
        />
        <ActionBtn
          active={timeSliderVisible}
          onClick={onTimeSliderToggle}
          icon="☀️"
          label="Sun Path"
        />
        <ActionBtn
          onClick={onVisionToggle}
          icon="📸"
          label="Future Vision"
        />
        <ActionBtn
          onClick={onReportDownload}
          icon="📄"
          label="Download Report"
        />
      </Section>
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
          : { borderColor: "transparent" }),
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

function ActionBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.actionItemBtn,
        ...(active
          ? {
              background: "rgba(59,130,246,0.12)",
              color: "#60a5fa",
            }
          : {}),
      }}
    >
      {icon} {label}
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
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "none",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, rgba(20,35,30,0.95) 0%, rgba(26,40,35,0.95) 100%)",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(74,222,128,0.2)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 2px 12px rgba(74,222,128,0.08)",
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
    background: "linear-gradient(135deg, rgba(20,35,30,0.92) 0%, rgba(26,40,35,0.92) 100%)",
    padding: "8px 6px",
    borderRadius: "12px",
    border: "1px solid rgba(74,222,128,0.15)",
    backdropFilter: "blur(16px)",
  },
  sectionLabel: {
    color: "#4ade80",
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: "1.2px",
    padding: "0 8px 4px",
    opacity: 0.7,
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
    outline: "none",
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
    outline: "none",
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
    outline: "none",
  },
  actionItemBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    background: "transparent",
    color: "#888",
    border: "none",
    borderRadius: "7px",
    fontSize: "0.76rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    outline: "none",
  },
};
