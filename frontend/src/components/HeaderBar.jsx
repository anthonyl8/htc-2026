/**
 * Top header bar - green sustainability theme.
 * Matches Figma "Urban Heat Resilience Platform" layout.
 */
import SearchBar from "./SearchBar";
import ProjectSwitcher from "./ProjectSwitcher";

/**
 * Top header bar - green sustainability theme.
 * Integrated Navigation and Search to reduce UI clutter.
 */
export default function HeaderBar({
  activeTab,
  onTabChange,
  onPlaceSelect,
  persistenceEnabled,
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onOpenDashboard,
  onSave,
  saving,
  user,
  onSignOut,
  onSignIn,
}) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "heatmap", label: "Heat Map" },
    { id: "carbon", label: "Carbon & ROI" },
  ];

  return (
    <header style={styles.header}>
      {/* Brand + Project Switcher (left) */}
      <div style={styles.brandSection}>
        <span style={styles.logo}>🌿</span>
        <div style={styles.brand}>
          <span style={styles.title}>ReLeaf</span>
          <span style={styles.subtitle}>Resilience Platform</span>
        </div>
        {persistenceEnabled && (
          <>
            <ProjectSwitcher
              currentProject={currentProject}
              projects={projects}
              onSelectProject={onSelectProject}
              onNewProject={onNewProject}
              onOpenDashboard={onOpenDashboard}
              compact
            />
            <button
              onClick={onSave}
              disabled={saving}
              style={{ ...styles.saveBtn, marginLeft: '12px' }}
              title="Save proposal"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>

      {/* Navigation (center) */}
      <div style={styles.centerSection}>
        <nav style={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
        </nav>
      </div>

      {/* Search + Save + Auth (Right) */}
      <div style={styles.searchSection}>
        {persistenceEnabled && (
          <>
            {user ? (
              <div style={styles.userRow}>
                <span style={styles.userEmail}>{user.email}</span>
                <button onClick={onSignOut} style={styles.signOutBtn} title="Sign out">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={onSignIn} style={styles.signInBtn}>
                Sign in
              </button>
            )}
          </>
        )}
        <SearchBar onPlaceSelect={onPlaceSelect} />
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "0 24px",
    height: "64px",
    background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
    color: "#fff",
    zIndex: 200,
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: "200px",
  },
  logo: {
    fontSize: "1.8rem",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  title: {
    fontSize: "1.2rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    lineHeight: 1,
  },
  subtitle: {
    fontSize: "0.7rem",
    opacity: 0.8,
    fontWeight: 500,
    letterSpacing: "0.5px",
  },
  centerSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  nav: {
    display: "flex",
    gap: "4px",
    background: "rgba(0,0,0,0.15)",
    padding: "4px",
    borderRadius: "8px",
  },
  saveBtn: {
    padding: "6px 14px",
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  userRow: { display: "flex", alignItems: "center", gap: "8px" },
  userEmail: { fontSize: "0.8rem", opacity: 0.9 },
  signOutBtn: {
    padding: "4px 10px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  signInBtn: {
    padding: "6px 12px",
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  tab: {
    padding: "8px 16px",
    background: "transparent",
    color: "#a7f3d0",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    color: "#fff",
    background: "rgba(255,255,255,0.15)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  searchSection: {
    minWidth: "260px",
    display: "flex",
    justifyContent: "flex-end",
  },
};
