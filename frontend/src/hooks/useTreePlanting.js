import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook for managing all interventions:
 * trees (with species), cool roofs, and bio-swales.
 * Supports loading from project (Supabase) via loadInterventions.
 */
export function useTreePlanting() {
  const [interventions, setInterventions] = useState([]);

  const loadInterventions = useCallback((items) => {
    if (!items || !Array.isArray(items)) return;
    setInterventions(
      items.map((i) => ({
        id: i.id || `${Date.now()}-${Math.random()}`,
        type: i.type || "tree",
        species: i.species,
        position: i.position || [i.lon, i.lat],
        size: 15,
        timestamp: i.timestamp || Date.now(),
      }))
    );
  }, []);

  const addTree = useCallback((coordinate, species = "maple") => {
    const item = {
      id: Date.now() + Math.random(),
      type: "tree",
      species,
      position: coordinate, // [lon, lat, altitude]
      size: 15,
      timestamp: Date.now(),
    };
    setInterventions((prev) => [...prev, item]);
    return item;
  }, []);

  const addCoolRoof = useCallback((coordinate) => {
    const item = {
      id: Date.now() + Math.random(),
      type: "cool_roof",
      position: coordinate,
      timestamp: Date.now(),
    };
    setInterventions((prev) => [...prev, item]);
    return item;
  }, []);

  const addBioSwale = useCallback((coordinate) => {
    const item = {
      id: Date.now() + Math.random(),
      type: "bio_swale",
      position: coordinate,
      timestamp: Date.now(),
    };
    setInterventions((prev) => [...prev, item]);
    return item;
  }, []);

  const removeLastIntervention = useCallback(() => {
    setInterventions((prev) => prev.slice(0, -1));
  }, []);

  const clearInterventions = useCallback(() => {
    setInterventions([]);
  }, []);

  // Derived state
  const trees = useMemo(
    () => interventions.filter((i) => i.type === "tree"),
    [interventions]
  );
  const coolRoofs = useMemo(
    () => interventions.filter((i) => i.type === "cool_roof"),
    [interventions]
  );
  const bioSwales = useMemo(
    () => interventions.filter((i) => i.type === "bio_swale"),
    [interventions]
  );

  return {
    interventions,
    trees,
    coolRoofs,
    bioSwales,
    addTree,
    addCoolRoof,
    addBioSwale,
    removeLastTree: removeLastIntervention,
    clearTrees: clearInterventions,
    loadInterventions,
    treeCount: trees.length,
    interventionCount: interventions.length,
  };
}
