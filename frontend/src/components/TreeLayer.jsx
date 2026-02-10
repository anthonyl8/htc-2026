import { ScatterplotLayer } from "@deck.gl/layers";
import { ColumnLayer } from "@deck.gl/layers";

/**
 * Creates Deck.gl layers to visualize planted trees.
 * Uses a green column + circle to represent each tree.
 */
export function useTreeLayers(trees) {
  if (!trees || trees.length === 0) return [];

  // Tree trunk as a column
  const trunkLayer = new ColumnLayer({
    id: "tree-trunk-layer",
    data: trees,
    getPosition: (d) => [d.position[0], d.position[1]],
    getElevation: 20,
    diskResolution: 8,
    radius: 1.5,
    getFillColor: [101, 67, 33],
    elevationScale: 1,
    pickable: false,
  });

  // Tree canopy as a green circle
  const canopyLayer = new ScatterplotLayer({
    id: "tree-canopy-layer",
    data: trees,
    getPosition: (d) => [d.position[0], d.position[1]],
    getRadius: 8,
    getFillColor: [34, 139, 34, 200],
    getLineColor: [0, 100, 0],
    lineWidthMinPixels: 2,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 30,
    pickable: true,
  });

  return [trunkLayer, canopyLayer];
}
