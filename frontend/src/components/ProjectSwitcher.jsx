import { useState, useRef, useEffect } from "react";

export default function ProjectSwitcher({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onOpenDashboard,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  return (
    <div ref={ref} style={styles.wrapper}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={compact ? styles.btnCompact : styles.btn}
        title={currentProject?.name || "Select proposal"}
      >
        {currentProject ? currentProject.name : "Untitled Proposal"}
        <span style={styles.caret}>▼</span>
      </button>
      {open && (
        <div style={styles.dropdown}>
          <button
            onClick={() => {
              onNewProject?.();
              setOpen(false);
            }}
            style={styles.dropItem}
          >
            + New Proposal
          </button>
          {projects?.length > 0 && (
            <>
              <div style={styles.sep} />
              {projects.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject?.(p);
                    setOpen(false);
                  }}
                  style={{
                    ...styles.dropItem,
                    ...(currentProject?.id === p.id ? styles.dropItemActive : {}),
                  }}
                >
                  {p.name}
                </button>
              ))}
            </>
          )}
          <div style={styles.sep} />
          <button
            onClick={() => {
              onOpenDashboard?.();
              setOpen(false);
            }}
            style={styles.dropItem}
          >
            Open all proposals →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: "relative" },
  btn: {
    padding: "8px 14px",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnCompact: {
    padding: "6px 10px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "6px",
    color: "#a7f3d0",
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  caret: { fontSize: "0.7rem", opacity: 0.8 },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "4px",
    minWidth: "220px",
    background: "rgba(20, 40, 32, 0.98)",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    padding: "8px 0",
    zIndex: 1000,
  },
  dropItem: {
    width: "100%",
    padding: "10px 16px",
    background: "none",
    border: "none",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    textAlign: "left",
    cursor: "pointer",
  },
  dropItemActive: { background: "rgba(74, 222, 128, 0.15)", color: "#4ade80" },
  sep: { height: "1px", background: "rgba(255,255,255,0.1)", margin: "4px 0" },
};
