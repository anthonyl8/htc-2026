/**
 * API service for communicating with the ReLeaf backend.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── Heatmap ──────────────────────────────────────────────────

export async function getTemperature(lat, lon) {
  const res = await fetch(
    `${API_URL}/heatmap/temperature?lat=${lat}&lon=${lon}`
  );
  if (!res.ok) throw new Error("Failed to fetch temperature");
  return res.json();
}

export async function getHeatmapBounds() {
  const res = await fetch(`${API_URL}/heatmap/bounds`);
  if (!res.ok) throw new Error("Failed to fetch bounds");
  return res.json();
}

export async function getHeatmapGrid(resolution = 50) {
  const res = await fetch(`${API_URL}/heatmap/grid?resolution=${resolution}`);
  if (!res.ok) throw new Error("Failed to fetch heatmap grid");
  return res.json();
}

// ─── Analysis ─────────────────────────────────────────────────

export async function getHotspots() {
  const res = await fetch(`${API_URL}/analysis/hotspots`);
  if (!res.ok) throw new Error("Failed to fetch hotspots");
  return res.json();
}

export async function getSuggestions() {
  const res = await fetch(`${API_URL}/analysis/suggestions`);
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

export async function getVulnerabilityData() {
  const res = await fetch(`${API_URL}/analysis/vulnerability`);
  if (!res.ok) throw new Error("Failed to fetch vulnerability data");
  return res.json();
}

// ─── Species & Interventions ──────────────────────────────────

export async function getSpecies() {
  const res = await fetch(`${API_URL}/analysis/species`);
  if (!res.ok) throw new Error("Failed to fetch species");
  return res.json();
}

export async function getInterventionTypes() {
  const res = await fetch(`${API_URL}/analysis/interventions`);
  if (!res.ok) throw new Error("Failed to fetch intervention types");
  return res.json();
}

// ─── Simulation ───────────────────────────────────────────────

export async function simulateCooling(trees) {
  const res = await fetch(`${API_URL}/analysis/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trees: trees.map((t) => ({
        position: t.position || [t.lon || 0, t.lat || 0],
        lat: t.lat || (t.position ? t.position[1] : 0),
        lon: t.lon || (t.position ? t.position[0] : 0),
      })),
    }),
  });
  if (!res.ok) throw new Error("Failed to simulate cooling");
  return res.json();
}

export async function simulateCoolingV2(interventions) {
  const res = await fetch(`${API_URL}/analysis/simulate-v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interventions: interventions.map((item) => ({
        type: item.type || "tree",
        species: item.species || null,
        position: item.position || [item.lon || 0, item.lat || 0],
        lat: item.lat || (item.position ? item.position[1] : 0),
        lon: item.lon || (item.position ? item.position[0] : 0),
      })),
    }),
  });
  if (!res.ok) throw new Error("Failed to simulate cooling v2");
  return res.json();
}

// ─── ROI ──────────────────────────────────────────────────────

export async function calculateROI(interventions) {
  const res = await fetch(`${API_URL}/analysis/roi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interventions: interventions.map((item) => ({
        type: item.type || "tree",
        species: item.species || null,
        position: item.position || [item.lon || 0, item.lat || 0],
        lat: item.lat || (item.position ? item.position[1] : 0),
        lon: item.lon || (item.position ? item.position[0] : 0),
      })),
    }),
  });
  if (!res.ok) throw new Error("Failed to calculate ROI");
  return res.json();
}

// ─── Validation ───────────────────────────────────────────────

export async function validateLocation(type, lat, lon) {
  const res = await fetch(`${API_URL}/validation/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, lat, lon }),
  });
  if (!res.ok) throw new Error("Failed to validate location");
  return res.json();
}

// ─── Vision ───────────────────────────────────────────────────

/**
 * Generate AI vision. Sends viewport info to backend, which fetches
 * the satellite image and generates the AI-modified version.
 */
export async function generateVision(
  centerLat,
  centerLng,
  zoom,
  treeCount = 0
) {
  const res = await fetch(`${API_URL}/vision/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      center_lat: centerLat,
      center_lon: centerLng,
      zoom: Math.round(zoom),
      tree_count: treeCount,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate vision");
  }
  return res.json();
}
