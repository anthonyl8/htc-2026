import { useEffect, useState } from "react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { getHeatmapGrid } from "../services/api";

/**
 * Fetches heatmap grid data from the backend and returns a Deck.gl HeatmapLayer.
 */
export function useHeatmapLayer(visible) {
  const [gridData, setGridData] = useState([]);

  useEffect(() => {
    if (!visible) return;

    getHeatmapGrid(60)
      .then((data) => setGridData(data))
      .catch((err) => console.warn("Heatmap load failed:", err));
  }, [visible]);

  if (!visible || gridData.length === 0) return null;

  return new HeatmapLayer({
    id: "heatmap-layer",
    data: gridData,
    getPosition: (d) => [d.lon, d.lat],
    getWeight: (d) => d.intensity,
    radiusPixels: 60,
    intensity: 1.5,
    threshold: 0.1,
    colorRange: [
      [255, 255, 178],
      [254, 204, 92],
      [253, 141, 60],
      [240, 59, 32],
      [189, 0, 38],
    ],
    opacity: 0.6,
  });
}
