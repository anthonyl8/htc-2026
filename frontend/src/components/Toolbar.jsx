import SpeciesSelector from "./SpeciesSelector";
import "./Toolbar.css";

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
  onReportDownload,
  onGenerateProposal,
  activeDataLayer,
  onDataLayerChange,
  selectedSpecies,
  onSpeciesChange,
  timeSliderVisible,
  onTimeSliderToggle,
  embedded = false, // when true, no absolute positioning (inside sidebar)
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
    <div className={`Toolbar ${embedded ? "Toolbar--embedded" : ""}`}>
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
          <div className="Toolbar-treeRow">
            <span style={{ fontSize: "0.85rem" }}>🌳</span>
            <span className="Toolbar-treeCount">{interventionCount}</span>
            <span className="Toolbar-treeLabel">placed</span>
            <div className="Toolbar-spacer" />
            <button onClick={onUndo} className="Toolbar-iconBtn" title="Undo">
              ↩
            </button>
            <button onClick={onClear} className="Toolbar-iconBtn" title="Clear">
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
        <RadioLayerToggle
          active={activeDataLayer === "equity"}
          onClick={() => handleLayerClick("equity")}
          color="#60a5fa"
          label="Equity (Income)"
        />
        <RadioLayerToggle
          active={activeDataLayer === "air_quality"}
          onClick={() => handleLayerClick("air_quality")}
          color="#34d399"
          label="Air Quality"
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
  return <div className="Toolbar-section">{children}</div>;
}

function SectionLabel({ children }) {
  return <span className="Toolbar-sectionLabel">{children}</span>;
}

function ModeBtn({ active, onClick, icon, label, activeColor = "#60a5fa" }) {
  return (
    <button
      onClick={onClick}
      className="Toolbar-modeBtn"
      style={active ? { background: `${activeColor}18`, color: activeColor } : undefined}
    >
      {icon} {label}
    </button>
  );
}

function RadioLayerToggle({ active, onClick, color, label }) {
  return (
    <button
      onClick={onClick}
      className="Toolbar-layerBtn"
      style={
        active
          ? { background: `${color}15`, color, borderColor: `${color}33` }
          : { borderColor: "transparent" }
      }
    >
      <span
        className="Toolbar-radio"
        style={{
          borderColor: active ? color : "rgba(255,255,255,0.15)",
          background: active ? "transparent" : "rgba(255,255,255,0.03)",
        }}
      >
        {active && (
          <span className="Toolbar-radioDot" style={{ background: color }} />
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
      className={`Toolbar-actionItemBtn ${active ? "is-active" : ""}`}
    >
      {icon} {label}
    </button>
  );
}
