/**
 * Project and intervention CRUD — direct to Supabase (hybrid architecture).
 * Python backend is only used for simulation, ROI, AI, heatmap.
 */

import { supabase } from "../lib/supabase";

// ─── Projects ───────────────────────────────────────────────────

export async function listProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, center_lat, center_lon, zoom_level, simulation_results, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProject(name = "New Proposal", description = "") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      description,
    })
    .select("id, name, description, center_lat, center_lon, zoom_level, simulation_results, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function getProject(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, center_lat, center_lon, zoom_level, simulation_results, created_at, updated_at")
    .eq("id", projectId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(projectId) {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function duplicateProject(projectId) {
  const { data, error } = await supabase.rpc("duplicate_project", { project_id: projectId });
  if (error) throw error;
  return data; // Returns new project UUID
}

// ─── Interventions (via view + RPC) ──────────────────────────────

/**
 * Fetch interventions for a project (lon/lat from PostGIS view).
 */
export async function getInterventions(projectId) {
  const { data, error } = await supabase
    .from("interventions_with_coords")
    .select("id, project_id, type, metadata, lon, lat, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeIntervention);
}

/**
 * Insert a single intervention (uses PostGIS RPC).
 */
export async function insertIntervention(projectId, type, lon, lat, metadata = {}) {
  const { data, error } = await supabase.rpc("insert_intervention", {
    p_project_id: projectId,
    p_type: type,
    p_lon: lon,
    p_lat: lat,
    p_metadata: metadata,
  });
  if (error) throw error;
  return data; // Returns new intervention UUID
}

/**
 * Delete an intervention by id.
 */
export async function deleteIntervention(interventionId) {
  const { error } = await supabase.from("interventions").delete().eq("id", interventionId);
  if (error) throw error;
}

/**
 * Replace all interventions for a project (delete all, then insert).
 */
export async function replaceInterventions(projectId, interventions) {
  const { error: delErr } = await supabase
    .from("interventions")
    .delete()
    .eq("project_id", projectId);
  if (delErr) throw delErr;

  for (const i of interventions) {
    const [lon, lat] = Array.isArray(i.position) ? i.position : [i.lon, i.lat];
    const metadata = i.species ? { species: i.species } : {};
    await insertIntervention(projectId, i.type || "tree", lon, lat, metadata);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function normalizeIntervention(row) {
  const [lon, lat] = [row.lon, row.lat];
  const position = [lon, lat];
  return {
    id: row.id,
    type: row.type,
    species: row.metadata?.species,
    position,
    lat,
    lon,
    metadata: row.metadata || {},
    timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}
