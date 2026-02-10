import { useEffect, useState } from "react";
import { calculateROI } from "../services/api";
import "./ROIPanel.css";

/**
 * Cooling ROI (Return on Investment) Dashboard.
 * Shows real-time cost/benefit analysis as interventions are added.
 */
export default function ROIPanel({ interventions, isOpen, onClose, onGenerateProposal, style = {}, className = "" }) {
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
    <div className={`ROIPanel panel ${className}`.trim()} style={style}>
      <div className="ROIPanel-header">
        <h3 className="ROIPanel-title">💰 Cooling ROI Dashboard</h3>
        <button onClick={onClose} className="ROIPanel-closeBtn">
          &times;
        </button>
      </div>

      {loading && (
        <div className="loading-bar">
          <div className="loading-fill" />
        </div>
      )}

      {roi && !loading && (
        <div className="ROIPanel-contentWrap">
        <div className="ROIPanel-scrollContent">
        <div className="ROIPanel-content">
          {/* Top KPI cards */}
          <div className="ROIPanel-kpiRow">
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
          <div className="ROIPanel-breakdown">
            <span className="ROIPanel-breakdownTitle">BREAKDOWN</span>
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
          <div className="ROIPanel-metrics">
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
              <div className="section-title">💰 Realistic Budget (Vancouver)</div>
              <div className="ROIPanel-budgetGrid">
                <BudgetRow label="Materials" value={`$${roi.realistic_costs.itemized.materials.toLocaleString()}`} />
                <BudgetRow label="Labor" value={`$${roi.realistic_costs.itemized.labor.toLocaleString()}`} />
                <BudgetRow label="Design" value={`$${roi.realistic_costs.itemized.design_engineering.toLocaleString()}`} />
                <BudgetRow label="Permits" value={`$${roi.realistic_costs.itemized.permits.toLocaleString()}`} />
              </div>
              <div className="ROIPanel-totalRow">
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
              <div className="section-title">🏛️ Funding Sources</div>
              <div className="ROIPanel-fundingList">
                {roi.funding.funding_sources.map((source, i) => (
                  <div key={i} className="ROIPanel-fundingRow">
                    <span className="ROIPanel-fundingSource">{source.source}</span>
                    <span
                      className="ROIPanel-fundingAmount"
                      style={{
                        color: source.type === "revenue" ? "#4ade80" : source.type === "grant" ? "#60a5fa" : "#fbbf24"
                      }}
                    >
                      ${source.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ROIPanel-netCostRow">
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
          <div className="ROIPanel-grantSection">
            <div className="section-title">📝 Grant Automator</div>
            <button
              onClick={onGenerateProposal}
              className="ROIPanel-grantBtn"
            >
              Generate FEMA Grant Proposal
            </button>
            <p className="ROIPanel-grantHint">
              Opens a new card with the full proposal.
            </p>
          </div>
        </div>
      )}

      {(!roi || interventions.length === 0) && !loading && (
        <div className="empty-state">
          <p className="empty-text">
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
    <div className="ROIPanel-kpiCard">
      <span className="ROIPanel-kpiIcon">{icon}</span>
      <span className="ROIPanel-kpiValue" style={{ color }}>{value}</span>
      <span className="ROIPanel-kpiLabel">{label}</span>
    </div>
  );
}

function BreakdownRow({ icon, label, cost, cooling }) {
  return (
    <div className="ROIPanel-breakdownRow">
      <span className="ROIPanel-breakdownIcon">{icon}</span>
      <span className="ROIPanel-breakdownLabel">{label}</span>
      <span className="ROIPanel-breakdownCost">{cost}</span>
      <span className="ROIPanel-breakdownCooling">{cooling}</span>
    </div>
  );
}

function MetricRow({ label, value, icon }) {
  return (
    <div className="ROIPanel-metricRow">
      <span className="ROIPanel-metricIcon">{icon}</span>
      <span className="ROIPanel-metricLabel">{label}</span>
      <span className="ROIPanel-metricValue">{value}</span>
    </div>
  );
}

function BudgetRow({ label, value }) {
  return (
    <div className="ROIPanel-budgetRow">
      <span className="ROIPanel-budgetLabel">{label}</span>
      <span className="ROIPanel-budgetValue">{value}</span>
    </div>
  );
}

