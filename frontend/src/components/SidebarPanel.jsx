import { useState } from "react";
import LeftPanel from "./LeftPanel";
import Toolbar from "./Toolbar";

/**
 * Unified left sidebar: data panels + tools.
 * Collapsible for more map space. Fully scrollable when expanded.
 */
export default function SidebarPanel({
  hotspots,
  simulation,
  showDataPanels, // when to show Temperature + Alerts (Overview / Hotspots)
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
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Collapsed: floating expand button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={styles.expandBtn}
          title="Open tools & data"
        >
          <span style={styles.expandIcon}>☰</span>
          <span style={styles.expandLabel}>Tools</span>
        </button>
      )}

      {/* Expanded: full sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          ...(collapsed ? styles.sidebarCollapsed : {}),
        }}
      >
        <div style={styles.sidebarInner}>
          {/* Header with collapse */}
          <div style={styles.header}>
            <span style={styles.headerTitle}>ReLeaf</span>
            <button
              onClick={() => setCollapsed(true)}
              style={styles.collapseBtn}
              title="Collapse sidebar"
            >
              ◀
            </button>
          </div>

          <div style={styles.scrollArea}>
            {showDataPanels && (
              <div style={styles.section}>
                <LeftPanel hotspots={hotspots} simulation={simulation} />
              </div>
            )}

            <div style={styles.toolbarSection}>
              <Toolbar
                mode={mode}
                onModeChange={onModeChange}
                treeCount={treeCount}
                interventionCount={interventionCount}
                onUndo={onUndo}
                onClear={onClear}
                onSimulationToggle={onSimulationToggle}
                simulationOpen={simulationOpen}
                onROIToggle={onROIToggle}
                roiOpen={roiOpen}
                onReportDownload={onReportDownload}
                onGenerateProposal={onGenerateProposal}
                activeDataLayer={activeDataLayer}
                onDataLayerChange={onDataLayerChange}
                selectedSpecies={selectedSpecies}
                onSpeciesChange={onSpeciesChange}
                timeSliderVisible={timeSliderVisible}
                onTimeSliderToggle={onTimeSliderToggle}
                embedded
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

const styles = {
  expandBtn: {
    position: "absolute",
    top: "16px",
    left: "0",
    zIndex: 150,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "linear-gradient(135deg, rgba(20, 50, 35, 0.98) 0%, rgba(26, 55, 40, 0.98) 100%)",
    border: "1px solid rgba(74, 222, 128, 0.35)",
    borderLeft: "none",
    borderTopRightRadius: "12px",
    borderBottomRightRadius: "12px",
    color: "#4ade80",
    cursor: "pointer",
    boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
    transition: "all 0.2s",
  },
  expandIcon: { fontSize: "1.2rem" },
  expandLabel: { fontSize: "0.85rem", fontWeight: 600 },
  sidebar: {
    width: "280px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(180deg, rgba(15, 35, 28, 0.98) 0%, rgba(18, 40, 32, 0.98) 100%)",
    borderRight: "1px solid rgba(74, 222, 128, 0.2)",
    zIndex: 100,
  },
  sidebarCollapsed: {
    width: 0,
    minWidth: 0,
    overflow: "hidden",
    borderRight: "none",
  },
  sidebarInner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(74, 222, 128, 0.15)",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#4ade80",
    fontSize: "1rem",
    fontWeight: 800,
  },
  collapseBtn: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(74, 222, 128, 0.12)",
    border: "1px solid rgba(74, 222, 128, 0.25)",
    borderRadius: "6px",
    color: "#4ade80",
    cursor: "pointer",
    fontSize: "0.75rem",
    transition: "all 0.2s",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "24px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  toolbarSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
    minHeight: 0,
  },
};
