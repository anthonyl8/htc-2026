import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getInterventions } from "../services/projectService";

/**
 * Subscribe to interventions changes for a project (Realtime "multiplayer").
 * When another tab or user modifies interventions, we refetch and sync.
 */
export function useRealtimeInterventions(projectId, onInterventionsChange) {
  useEffect(() => {
    if (!projectId || !onInterventionsChange) return;

    const channel = supabase
      .channel(`interventions:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interventions",
          filter: `project_id=eq.${projectId}`,
        },
        async () => {
          try {
            const data = await getInterventions(projectId);
            onInterventionsChange(data);
          } catch (e) {
            console.warn("[Realtime] Failed to refetch interventions:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onInterventionsChange]);
}
