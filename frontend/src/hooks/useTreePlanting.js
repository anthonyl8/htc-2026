import { useState, useCallback } from "react";

/**
 * Custom hook for managing planted trees state.
 */
export function useTreePlanting() {
  const [trees, setTrees] = useState([]);

  const addTree = useCallback((coordinate) => {
    const newTree = {
      id: Date.now() + Math.random(),
      position: coordinate, // [lon, lat, altitude]
      size: 15,
      timestamp: Date.now(),
    };
    setTrees((prev) => [...prev, newTree]);
    return newTree;
  }, []);

  const removeLastTree = useCallback(() => {
    setTrees((prev) => prev.slice(0, -1));
  }, []);

  const clearTrees = useCallback(() => {
    setTrees([]);
  }, []);

  return {
    trees,
    addTree,
    removeLastTree,
    clearTrees,
    treeCount: trees.length,
  };
}
