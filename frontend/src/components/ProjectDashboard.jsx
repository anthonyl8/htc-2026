import { useState, useEffect } from "react";
import {
  listProjects,
  createProject,
  deleteProject,
  duplicateProject,
} from "../services/projectService";

export default function ProjectDashboard({ onSelectProject, onCreateNew, projects: propProjects }) {
  const [localProjects, setLocalProjects] = useState([]);
  const [loading, setLoading] = useState(!propProjects);
  const [error, setError] = useState(null);

  // Use props if available, otherwise local state
  const projects = propProjects || localProjects;

  useEffect(() => {
    if (propProjects) {
      setLoading(false);
      return;
    }
    listProjects()
      .then(setLocalProjects)
      .catch((e) => {
        setError(e.message);
        setLocalProjects([]);
      })
      .finally(() => setLoading(false));
  }, [propProjects]);

  const handleCreate = async () => {
    if (onCreateNew) {
      onCreateNew();
      return;
    }
    try {
      const p = await createProject();
      setLocalProjects((prev) => [p, ...prev]);
      onSelectProject?.(p);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this proposal?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const newId = await duplicateProject(id);
      const updated = await listProjects();
      setProjects(updated);
      const newProject = updated.find((p) => p.id === newId);
      if (newProject) onSelectProject?.(newProject);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.loading}>Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Your Proposals</h1>
          <button onClick={handleCreate} style={styles.newBtn}>
            + New Proposal
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {projects.length === 0 ? (
          <div style={styles.empty}>
            <p>No proposals yet.</p>
            <button onClick={handleCreate} style={styles.emptyBtn}>
              Create your first proposal
            </button>
          </div>
        ) : (
          <div style={styles.list}>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProject?.(p)}
                style={styles.item}
              >
                <div style={styles.itemMain}>
                  <span style={styles.itemName}>{p.name}</span>
                  <span style={styles.itemMeta}>
                    {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.itemActions}>
                  <button
                    onClick={(e) => handleDuplicate(p.id, e)}
                    style={styles.iconBtn}
                    title="Duplicate"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    style={styles.iconBtn}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0a1a 0%, #16231a 100%)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: "rgba(20, 40, 32, 0.98)",
    borderRadius: "16px",
    padding: "32px",
    width: "100%",
    maxWidth: "560px",
    border: "1px solid rgba(74, 222, 128, 0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    color: "#4ade80",
    fontSize: "1.5rem",
    margin: 0,
  },
  newBtn: {
    padding: "10px 20px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#f87171", marginBottom: "16px", fontSize: "0.9rem" },
  loading: { color: "#94a3b8", textAlign: "center" },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "40px 0",
  },
  emptyBtn: {
    marginTop: "16px",
    padding: "12px 24px",
    background: "rgba(74, 222, 128, 0.2)",
    color: "#4ade80",
    border: "1px solid rgba(74, 222, 128, 0.4)",
    borderRadius: "8px",
    cursor: "pointer",
  },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
  },
  itemMain: { display: "flex", flexDirection: "column", gap: "4px" },
  itemName: { color: "#fff", fontWeight: 500 },
  itemMeta: { color: "#94a3b8", fontSize: "0.85rem" },
  itemActions: { display: "flex", gap: "8px" },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    padding: "4px",
  },
};
