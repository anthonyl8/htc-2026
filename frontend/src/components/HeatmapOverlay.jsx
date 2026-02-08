import { useEffect, useState } from "react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { getHeatmapGrid } from "../services/api";

// Fallback grid when backend is unreachable (Vancouver-area, warm temps)
function fallbackGrid() {
  const out = [];
  const base = { lat: 49.28, lon: -123.12 };
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      out.push({
        lat: base.lat + (i - 6) * 0.004,
        lon: base.lon + (j - 6) * 0.004,
        temperature_c: 30 + (i + j) / 4 + Math.sin(i) * 2,
      });
    }
  }
  return out;
}

/**
 * Fetches heatmap grid data from the backend and returns a Deck.gl layer.
 * Uses ScatterplotLayer with geographic radius for proper zoom scaling.
 */
export function useHeatmapLayer(visible) {
  const [gridData, setGridData] = useState([]);

  useEffect(() => {
    if (!visible) return;

    getHeatmapGrid(80)
      .then((data) => setGridData(Array.isArray(data) ? data : []))
      .catch(() => setGridData(fallbackGrid()));
  }, [visible]);

  if (!visible || gridData.length === 0) return null;

  // Filter to only show heat islands (warm/hot areas)
  const hotData = gridData.filter((d) => d.temperature_c >= 30);
  const dataToShow = hotData.length > 0 ? hotData : gridData;

  // Helper function to get color based on temperature
  const getTempColor = (temp) => {
    if (temp >= 42) return [220, 20, 20, 240];      // Bright dark red (>42°C)
    if (temp >= 38) return [255, 70, 30, 220];      // Bright red (38-42°C)
    if (temp >= 34) return [255, 150, 50, 200];     // Bright orange (34-38°C)
    return [255, 215, 80, 180];                      // Bright yellow (30-34°C)
  };

  return new ScatterplotLayer({
    id: "heatmap-layer",
    data: dataToShow,
    getPosition: (d) => [d.lon, d.lat],
    getFillColor: (d) => getTempColor(d.temperature_c),
    getRadius: 35,  // Balanced radius
    radiusUnits: 'meters',
    radiusMinPixels: 4,     // Visible when zoomed out
    radiusMaxPixels: 60,    // Prominent when zoomed in
    opacity: 0.9,           // High opacity
    pickable: false,
    stroked: true,
    getLineColor: (d) => {
      // Color-matched stroke for better definition
      const temp = d.temperature_c;
      if (temp >= 42) return [255, 100, 100, 200];
      if (temp >= 38) return [255, 140, 100, 180];
      return [255, 220, 120, 160];
    },
    lineWidthMinPixels: 2,  // Thicker stroke
  });
}
