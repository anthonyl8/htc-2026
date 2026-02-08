import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { ScatterplotLayer, TextLayer, ColumnLayer } from "@deck.gl/layers";
import { getTemperature } from "../services/api";
import { useHeatmapLayer } from "./HeatmapOverlay";
import { useTreeLayers } from "./TreeLayer";

const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "";

// ─── Deck.gl overlay rendered inside Google Maps ───────────

function DeckGLOverlay({ layers }) {
  const map = useMap();
  const overlay = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (!overlay.current) {
      overlay.current = new GoogleMapsOverlay({ interleaved: true });
    }
    overlay.current.setMap(map);
    return () => {
      overlay.current.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (overlay.current) {
      overlay.current.setProps({ layers });
    }
  }, [layers]);

  return null;
}

// ─── Component that captures the map instance ──────────────

function MapInstanceCapture({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

// ─── Main MapView ──────────────────────────────────────────

const MapView = forwardRef(function MapView(
  {
    mode,
    trees,
    onTreePlant,
    onMapClick,
    heatmapVisible,
    onTemperatureUpdate,
    hotspots,
    hotspotsVisible,
    suggestions,
    suggestionsVisible,
    vulnerabilityData,
    vulnerabilityVisible,
  },
  ref
) {
  const [mapInstance, setMapInstance] = useState(null);

  // Expose flyTo + getViewport to parent
  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom) => {
      if (!mapInstance) return;
      mapInstance.panTo({ lat, lng });
      if (zoom) mapInstance.setZoom(zoom);
    },
    getViewport: () => {
      if (!mapInstance) return null;
      const center = mapInstance.getCenter();
      return {
        lat: center.lat(),
        lng: center.lng(),
        zoom: mapInstance.getZoom(),
        heading: mapInstance.getHeading() || 0,
        tilt: mapInstance.getTilt() || 0,
      };
    },
  }));

  // ─── Deck.gl layers ────────────────────────────────────────

  const heatmapLayer = useHeatmapLayer(heatmapVisible);
  const treeLayers = useTreeLayers(trees);

  // Hotspot layers (Red Zones)
  const hotspotLayers = useMemo(() => {
    console.log("[MapView] Hotspot layers:", { hotspotsVisible, hotspots: hotspots?.length });
    if (!hotspotsVisible || !hotspots?.length) return [];
    console.log("[MapView] Rendering", hotspots.length, "hotspot markers");
    return [
      new ScatterplotLayer({
        id: "hotspot-glow",
        data: hotspots,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) =>
          d.type === "parking" ? 55 : d.type === "bus_stop" ? 35 : 30,
        getFillColor: (d) => {
          const t = d.temperature_c || 45;
          if (t >= 50) return [220, 20, 20, 100];
          if (t >= 45) return [240, 80, 20, 80];
          return [240, 140, 20, 60];
        },
        radiusMinPixels: 14,
        radiusMaxPixels: 50,
        pickable: true,
      }),
      new ScatterplotLayer({
        id: "hotspot-core",
        data: hotspots,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 10,
        getFillColor: [220, 38, 38, 230],
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        radiusMinPixels: 5,
        radiusMaxPixels: 14,
      }),
      new TextLayer({
        id: "hotspot-labels",
        data: hotspots,
        getPosition: (d) => [d.lon, d.lat],
        getText: (d) => `${d.temperature_c}°C`,
        getSize: 13,
        getColor: [255, 255, 255, 240],
        getTextAnchor: "middle",
        getAlignmentBaseline: "top",
        getPixelOffset: [0, 16],
        fontFamily: "monospace",
        fontWeight: "bold",
        outlineWidth: 3,
        outlineColor: [0, 0, 0, 200],
        billboard: true,
      }),
    ];
  }, [hotspotsVisible, hotspots]);

  // Suggestion layers
  const suggestionLayers = useMemo(() => {
    console.log("[MapView] Suggestion layers:", { suggestionsVisible, suggestions: suggestions?.length });
    if (!suggestionsVisible || !suggestions?.length) return [];
    console.log("[MapView] Rendering", suggestions.length, "suggestion markers");
    return [
      new ScatterplotLayer({
        id: "suggestion-ring",
        data: suggestions,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 22,
        getFillColor: [74, 222, 128, 60],
        getLineColor: [74, 222, 128, 200],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        radiusMinPixels: 10,
        radiusMaxPixels: 28,
        pickable: true,
      }),
      new TextLayer({
        id: "suggestion-labels",
        data: suggestions,
        getPosition: (d) => [d.lon, d.lat],
        getText: (d) => `−${d.cooling_potential}°C`,
        getSize: 12,
        getColor: [74, 222, 128, 255],
        getTextAnchor: "middle",
        getAlignmentBaseline: "top",
        getPixelOffset: [0, 14],
        fontFamily: "monospace",
        fontWeight: "bold",
        outlineWidth: 2,
        outlineColor: [0, 0, 0, 180],
        billboard: true,
      }),
    ];
  }, [suggestionsVisible, suggestions]);

  // Vulnerability overlay
  const vulnerabilityLayers = useMemo(() => {
    console.log("[MapView] Vulnerability layers:", { vulnerabilityVisible, vulnerabilityData: vulnerabilityData?.length });
    if (!vulnerabilityVisible || !vulnerabilityData?.length) return [];
    console.log("[MapView] Rendering", vulnerabilityData.length, "vulnerability markers");
    return [
      new ScatterplotLayer({
        id: "vulnerability",
        data: vulnerabilityData,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => 30 + d.vulnerability_score * 40,
        getFillColor: (d) => {
          const s = d.vulnerability_score;
          if (s >= 0.7) return [147, 51, 234, 70];
          if (s >= 0.4) return [217, 119, 6, 60];
          return [59, 130, 246, 40];
        },
        radiusMinPixels: 15,
        radiusMaxPixels: 55,
        stroked: true,
        getLineColor: (d) => {
          const s = d.vulnerability_score;
          if (s >= 0.7) return [147, 51, 234, 150];
          if (s >= 0.4) return [217, 119, 6, 120];
          return [59, 130, 246, 80];
        },
        lineWidthMinPixels: 1,
        pickable: true,
      }),
      new TextLayer({
        id: "vulnerability-labels",
        data: vulnerabilityData.filter((d) => d.vulnerability_score >= 0.5),
        getPosition: (d) => [d.lon, d.lat],
        getText: (d) => d.label || "Vulnerable",
        getSize: 11,
        getColor: [255, 255, 255, 200],
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        fontFamily: "sans-serif",
        outlineWidth: 2,
        outlineColor: [0, 0, 0, 160],
        billboard: true,
      }),
    ];
  }, [vulnerabilityVisible, vulnerabilityData]);

  // Combine all layers
  const allLayers = useMemo(() => {
    const layers = [
      ...treeLayers,
      ...hotspotLayers,
      ...suggestionLayers,
      ...vulnerabilityLayers,
    ];
    if (heatmapLayer) layers.push(heatmapLayer);
    return layers;
  }, [treeLayers, hotspotLayers, suggestionLayers, vulnerabilityLayers, heatmapLayer]);

  // ─── Map click handler ─────────────────────────────────────

  const handleMapClick = useCallback(
    async (e) => {
      if (!e.detail?.latLng) return;
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;

      if (mode === "plant") {
        onTreePlant([lng, lat, 0]);
      } else if (mode === "streetview") {
        onMapClick?.({ lat, lng });
      }

      try {
        const tempData = await getTemperature(lat, lng);
        if (tempData.temperature_c !== null) {
          onTemperatureUpdate(tempData.temperature_c);
        }
      } catch (err) {
        console.warn("Temperature fetch failed:", err);
      }
    },
    [mode, onTreePlant, onMapClick, onTemperatureUpdate]
  );

  // ─── Render ────────────────────────────────────────────────

  const mapOptions = {
    mapTypeId: "hybrid",
    gestureHandling: "greedy",
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  // If a Map ID is set, enable 3D tilt; otherwise flat satellite
  if (GOOGLE_MAPS_MAP_ID) {
    mapOptions.mapId = GOOGLE_MAPS_MAP_ID;
    mapOptions.tilt = 45;
    mapOptions.heading = 0;
  }

  return (
    <div id="map-container" style={styles.container}>
      <Map
        defaultCenter={{ lat: 49.2827, lng: -123.1207 }}
        defaultZoom={15}
        {...mapOptions}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
        reuseMaps={true}
      >
        <MapInstanceCapture onMapReady={setMapInstance} />
        <DeckGLOverlay layers={allLayers} />
      </Map>

      {/* Mode indicator */}
      {mode === "plant" && (
        <div style={styles.modeIndicator}>
          Click anywhere to plant a tree
        </div>
      )}
      {mode === "streetview" && (
        <div
          style={{
            ...styles.modeIndicator,
            background: "rgba(251,191,36,0.9)",
          }}
        >
          📍 Click a location to open Street View
        </div>
      )}
    </div>
  );
});

export default MapView;

const styles = {
  container: {
    width: "100%",
    height: "100%",
    position: "relative",
    background: "#0a0a1a",
  },
  modeIndicator: {
    position: "absolute",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(74,222,128,0.9)",
    color: "#000",
    padding: "8px 20px",
    borderRadius: "20px",
    fontSize: "0.82rem",
    fontWeight: 600,
    pointerEvents: "none",
    zIndex: 50,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
};
