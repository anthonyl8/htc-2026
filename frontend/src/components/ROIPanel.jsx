import { useEffect, useState } from "react";
import { calculateROI } from "../services/api";

/**
 * Cooling ROI (Return on Investment) Dashboard.
 * Shows real-time cost/benefit analysis as interventions are added.
 */
export default function ROIPanel({ interventions, isOpen, onClose, onGenerateProposal, style = {} }) {
  const [roi, setRoi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!interventions || interventions.length === 0) {
      setRoi(null);
      return;
    }

    setLoading(true);
    calculateROI(interventions)
      .then(setRoi)
      .catch((err) => console.warn("ROI calc failed:", err))
      .finally(() => setLoading(false));
  }, [isOpen, interventions]);

  if (!isOpen) return null;

  return (
    <div style={{ ...styles.container, ...style }}>
      <div style={styles.header}>
        <h3 style={styles.title}>💰 Cooling ROI Dashboard</h3>
        <button onClick={onClose} style={styles.closeBtn}>
          &times;
        </button>
      </div>

      {loading && (
        <div style={styles.loadingBar}>
          <div style={styles.loadingFill} />
        </div>
      )}

      {roi && !loading && (
        <div style={styles.contentWrap}>
        <div style={styles.scrollContent}>
        <div style={styles.content}>
          {/* Top KPI cards */}
          <div style={styles.kpiRow}>
            <KPI
              label="Investment"
              value={`$${roi.total_cost.toLocaleString()}`}
              color="#f97316"
              icon="💵"
            />
            <KPI
              label="Cooling"
              value={`−${roi.total_cooling_c}°C`}
              color="#4ade80"
              icon="❄️"
            />
            <KPI
              label="Energy Saved"
              value={`$${roi.energy_saved_yearly.toLocaleString()}/yr`}
              color="#60a5fa"
              icon="⚡"
            />
          </div>

          {/* Breakdown */}
          <div style={styles.breakdown}>
            <span style={styles.breakdownTitle}>BREAKDOWN</span>
            {roi.trees.count > 0 && (
              <BreakdownRow
                icon="🌳"
                label={`${roi.trees.count} Trees`}
                cost={`$${roi.trees.cost.toLocaleString()}`}
                cooling={`−${roi.trees.cooling_c}°C`}
              />
            )}
            {roi.cool_roofs.count > 0 && (
              <BreakdownRow
                icon="🏠"
                label={`${roi.cool_roofs.count} Cool Roofs`}
                cost={`$${roi.cool_roofs.cost.toLocaleString()}`}
                cooling={`−${roi.cool_roofs.cooling_c}°C`}
              />
            )}
            {roi.bio_swales.count > 0 && (
              <BreakdownRow
                icon="💧"
                label={`${roi.bio_swales.count} Bio-Swales`}
                cost={`$${roi.bio_swales.cost.toLocaleString()}`}
                cooling={`−${roi.bio_swales.cooling_c}°C`}
              />
            )}
          </div>

          {/* Summary metrics */}
          <div style={styles.metrics}>
            <MetricRow label="CO₂ Offset" value={`${roi.co2_offset_kg} kg/yr`} icon="🌍" />
            <MetricRow label="People Benefited" value={roi.people_benefited.toLocaleString()} icon="👥" />
            <MetricRow
              label="Payback Period"
              value={roi.payback_years > 0 ? `${roi.payback_years} years` : "—"}
              icon="📈"
            />
          </div>

          {/* Realistic Costs & Funding */}
          {roi.realistic_costs && (
            <>
              <div style={styles.sectionTitle}>💰 Realistic Budget (Vancouver)</div>
              <div style={styles.budgetGrid}>
                <BudgetRow label="Materials" value={`$${roi.realistic_costs.itemized.materials.toLocaleString()}`} />
                <BudgetRow label="Labor" value={`$${roi.realistic_costs.itemized.labor.toLocaleString()}`} />
                <BudgetRow label="Design" value={`$${roi.realistic_costs.itemized.design_engineering.toLocaleString()}`} />
                <BudgetRow label="Permits" value={`$${roi.realistic_costs.itemized.permits.toLocaleString()}`} />
              </div>
              <div style={styles.totalRow}>
                <span>Total Project Cost</span>
                <span style={{ color: "#f97316", fontWeight: 800 }}>
                  ${roi.realistic_costs.total_cost.toLocaleString()}
                </span>
              </div>
            </>
          )}

          {/* Funding Sources */}
          {roi.funding && (
            <>
              <div style={styles.sectionTitle}>🏛️ Funding Sources</div>
              <div style={styles.fundingList}>
                {roi.funding.funding_sources.map((source, i) => (
                  <div key={i} style={styles.fundingRow}>
                    <span style={styles.fundingSource}>{source.source}</span>
                    <span style={{ 
                      ...styles.fundingAmount,
                      color: source.type === "revenue" ? "#4ade80" : source.type === "grant" ? "#60a5fa" : "#fbbf24"
                    }}>
                      ${source.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div style={styles.netCostRow}>
                <span>Net City Cost</span>
                <span style={{ color: "#4ade80", fontWeight: 800 }}>
                  ${roi.funding.net_city_cost.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
        </div>

          {/* Grant section pinned to bottom */}
          <div style={styles.grantSection}>
            <div style={styles.sectionTitle}>📝 Grant Automator</div>
            <button 
              onClick={onGenerateProposal} 
              style={styles.grantBtn}
            >
              Generate FEMA Grant Proposal
            </button>
            <p style={styles.grantHint}>
              Opens a new card with the full proposal.
            </p>
          </div>
        </div>
      )}

      {(!roi || interventions.length === 0) && !loading && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>
            Add interventions (trees, cool roofs, bio-swales) to see the
            cost-benefit analysis.
          </p>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color, icon }) {
  return (
    <div style={styles.kpiCard}>
      <span style={styles.kpiIcon}>{icon}</span>
      <span style={{ ...styles.kpiValue, color }}>{value}</span>
      <span style={styles.kpiLabel}>{label}</span>
    </div>
  );
}

function BreakdownRow({ icon, label, cost, cooling }) {
  return (
    <div style={styles.breakdownRow}>
      <span style={styles.breakdownIcon}>{icon}</span>
      <span style={styles.breakdownLabel}>{label}</span>
      <span style={styles.breakdownCost}>{cost}</span>
      <span style={styles.breakdownCooling}>{cooling}</span>
    </div>
  );
}

function MetricRow({ label, value, icon }) {
  return (
    <div style={styles.metricRow}>
      <span style={styles.metricIcon}>{icon}</span>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}</span>
    </div>
  );
}

function BudgetRow({ label, value }) {
  return (
    <div style={styles.budgetRow}>
      <span style={styles.budgetLabel}>{label}</span>
      <span style={styles.budgetValue}>{value}</span>
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    width: "360px",
    maxHeight: "85vh", // Prevent cutoff on small screens
    overflowY: "hidden",
    background: "linear-gradient(135deg, rgba(20,35,30,0.97) 0%, rgba(26,40,35,0.97) 100%)",
    borderRadius: "14px",
    border: "1px solid rgba(74,222,128,0.2)",
    backdropFilter: "blur(12px)",
    zIndex: 100,
    boxShadow: "0 8px 32px rgba(74,222,128,0.15)",
    scrollbarWidth: "none", // Hide scrollbar for cleaner look
  },
  header: {
    flexShrink: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.4rem",
    cursor: "pointer",
    lineHeight: 1,
    outline: "none",
  },
  loadingBar: {
    height: "3px",
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  loadingFill: {
    height: "100%",
    width: "30%",
    background: "#4ade80",
    animation: "shimmer 1.2s ease-in-out infinite",
    borderRadius: "2px",
  },
  contentWrap: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },
  scrollContent: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },
  content: {
    padding: "12px 14px",
    paddingBottom: "12px",
  },
  kpiRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "10px",
  },
  kpiCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(74,222,128,0.08)",
    borderRadius: "8px",
    padding: "8px 6px",
    gap: "1px",
    border: "1px solid rgba(74,222,128,0.15)",
  },
  kpiIcon: { fontSize: "1rem" },
  kpiValue: {
    fontSize: "0.9rem",
    fontWeight: 800,
  },
  kpiLabel: {
    color: "#888",
    fontSize: "0.6rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.2px",
  },
  breakdown: {
    marginBottom: "6px",
  },
  breakdownTitle: {
    display: "block",
    color: "#555",
    fontSize: "0.55rem",
    fontWeight: 700,
    letterSpacing: "0.8px",
    marginBottom: "4px",
  },
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  breakdownIcon: { fontSize: "0.75rem", width: "16px" },
  breakdownLabel: { flex: 1, color: "#ccc", fontSize: "0.72rem" },
  breakdownCost: { color: "#f97316", fontSize: "0.7rem", fontWeight: 600, width: "55px", textAlign: "right" },
  breakdownCooling: { color: "#4ade80", fontSize: "0.7rem", fontWeight: 700, width: "42px", textAlign: "right" },
  metrics: {
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: "6px",
  },
  metricRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "2px 0",
  },
  metricIcon: { fontSize: "0.75rem", width: "16px" },
  metricLabel: { flex: 1, color: "#999", fontSize: "0.72rem" },
  metricValue: { color: "#fff", fontSize: "0.72rem", fontWeight: 700 },
  empty: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 14px",
    textAlign: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  sectionTitle: {
    display: "block",
    color: "#4ade80",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.5px",
    marginTop: "10px",
    marginBottom: "6px",
    paddingTop: "8px",
    borderTop: "1px solid rgba(74,222,128,0.15)",
  },
  budgetGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  budgetRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 0",
    fontSize: "0.68rem",
  },
  budgetLabel: {
    color: "#999",
  },
  budgetValue: {
    color: "#ccc",
    fontWeight: 600,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    marginTop: "4px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    fontSize: "0.78rem",
    color: "#fff",
    fontWeight: 700,
  },
  fundingList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  fundingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 0",
    fontSize: "0.68rem",
  },
  fundingSource: {
    color: "#ccc",
    flex: 1,
  },
  fundingAmount: {
    fontWeight: 700,
  },
  netCostRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    marginTop: "4px",
    borderTop: "2px solid rgba(74,222,128,0.3)",
    fontSize: "0.8rem",
    color: "#fff",
    fontWeight: 700,
  },
  grantSection: {
    flexShrink: 0,
    padding: "12px 14px 14px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  grantHint: {
    fontSize: "0.7rem",
    color: "#888",
    marginTop: "4px",
    marginBottom: 0,
  },
  grantBtn: {
    width: "100%",
    padding: "8px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.78rem",
    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
  },
  grantResult: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  grantTextarea: {
    width: "100%",
    height: "150px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    color: "#ddd",
    fontSize: "0.75rem",
    padding: "8px",
    resize: "vertical",
  },
  copyBtn: {
    padding: "6px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.75rem",
  },
};
