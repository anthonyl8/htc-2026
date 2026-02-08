import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

const API_KEY =
  import.meta.env.VITE_AIR_QUALITY_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "";

/**
 * Overlays Google Air Quality API heatmap tiles on the map.
 * Uses Google's pre-rendered AQI tile images — no backend needed.
 *
 * Available mapTypes:
 *  - UAQI_INDIGO_PERSIAN  (Universal AQI — indigo/persian palette)
 *  - US_AQI               (US AQI standard)
 *  - PM25 / PM10 / NO2 / O3 / CO / SO2  (individual pollutants)
 */
export default function AirQualityOverlay({
  visible,
  mapType = "UAQI_INDIGO_PERSIAN",
}) {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Remove existing overlay first
    if (overlayRef.current) {
      const arr = map.overlayMapTypes.getArray();
      const idx = arr.indexOf(overlayRef.current);
      if (idx !== -1) {
        map.overlayMapTypes.removeAt(idx);
      }
      overlayRef.current = null;
    }

    if (!visible) return;

    // Create the Air Quality tile overlay
    const tileLayer = new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) =>
        `https://airquality.googleapis.com/v1/mapTypes/${mapType}/heatmapTiles/${zoom}/${coord.x}/${coord.y}?key=${API_KEY}`,
      tileSize: new google.maps.Size(256, 256),
      maxZoom: 16,
      minZoom: 2,
      name: "Air Quality",
      opacity: 0.4,
    });

    map.overlayMapTypes.push(tileLayer);
    overlayRef.current = tileLayer;

    return () => {
      if (overlayRef.current && map) {
        try {
          const arr = map.overlayMapTypes.getArray();
          const idx = arr.indexOf(overlayRef.current);
          if (idx !== -1) {
            map.overlayMapTypes.removeAt(idx);
          }
        } catch {
          // map may already be disposed
        }
        overlayRef.current = null;
      }
    };
  }, [map, visible, mapType]);

  return null;
}
