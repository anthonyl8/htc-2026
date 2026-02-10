/**
 * Top header bar - green sustainability theme.
 * Matches Figma "Urban Heat Resilience Platform" layout.
 */
import SearchBar from "./SearchBar";
import ProjectSwitcher from "./ProjectSwitcher";
import "./HeaderBar.css";

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
  return (
    <header className="HeaderBar">
      {/* Brand + Project Switcher (left) */}
      <div className="HeaderBar-brandSection">
        <span className="HeaderBar-logo">🌿</span>
        <div className="HeaderBar-brand">
          <span className="HeaderBar-title">ReLeaf</span>
          <span className="HeaderBar-subtitle">Resilience Platform</span>
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
              className="HeaderBar-saveBtn"
              title="Save proposal"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>

      {/* Search + Save + Auth (Right) */}
      <div className="HeaderBar-searchSection">
        {persistenceEnabled && (
          <>
            {user ? (
              <div className="HeaderBar-userRow">
                <span className="HeaderBar-userEmail">{user.email}</span>
                <button onClick={onSignOut} className="HeaderBar-signOutBtn" title="Sign out">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={onSignIn} className="HeaderBar-signInBtn">
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
