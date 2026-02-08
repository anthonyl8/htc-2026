import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  getProject,
  getInterventions,
  updateProject,
  insertIntervention,
  deleteIntervention,
  replaceInterventions,
} from "../services/projectService";

const ProjectContext = createContext(null);

export function ProjectProvider({ children, projectId, interventions, onInterventionsChange }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    setLoading(true);
    setError(null);
    getProject(projectId)
      .then(setProject)
      .catch((e) => {
        setError(e.message);
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const saveInterventions = useCallback(
    async (items) => {
      if (!projectId) return;
      try {
        await replaceInterventions(projectId, items);
        onInterventionsChange?.();
      } catch (e) {
        setError(e.message);
        throw e;
      }
    },
    [projectId, onInterventionsChange]
  );

  const saveMapState = useCallback(
    async (centerLat, centerLon, zoomLevel) => {
      if (!projectId) return;
      try {
        await updateProject(projectId, {
          center_lat: centerLat,
          center_lon: centerLon,
          zoom_level: zoomLevel,
        });
        setProject((p) =>
          p
            ? {
                ...p,
                center_lat: centerLat,
                center_lon: centerLon,
                zoom_level: zoomLevel,
              }
            : null
        );
      } catch (e) {
        setError(e.message);
      }
    },
    [projectId]
  );

  return (
    <ProjectContext.Provider
      value={{
        project,
        loading,
        error,
        saveInterventions,
        saveMapState,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  return ctx;
}
