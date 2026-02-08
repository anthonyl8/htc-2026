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
import {
  ScatterplotLayer,
  TextLayer,
  ColumnLayer,
  PolygonLayer,
} from "@deck.gl/layers";
import { LightingEffect, AmbientLight, _SunLight as SunLight } from "@deck.gl/core";
import { getTemperature } from "../services/api";
import { useHeatmapLayer } from "./HeatmapOverlay";

const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "";

// ─── Species color mapping ──────────────────────────────────

const SPECIES_COLORS = {
  oak: [34, 120, 34, 200],
  maple: [60, 160, 40, 200],
  pine: [20, 100, 50, 200],
};

const SPECIES_RADIUS = {
  oak: 12,
  maple: 8,
  pine: 5,
};

// ─── Deck.gl overlay with lighting effects ──────────────────

function DeckGLOverlay({ layers, effects }) {
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
      const props = { layers };
      if (effects && effects.length > 0) {
        props.effects = effects;
      }
      overlay.current.setProps(props);
    }
  }, [layers, effects]);

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
    interventions,
    coolRoofs,
    bioSwales,
    selectedSpecies,
    onTreePlant,
    onCoolRoofPlace,
    onBioSwalePlace,
    onMapClick,
    heatmapVisible,
    onTemperatureUpdate,
    hotspots,
    hotspotsVisible,
    suggestions,
    suggestionsVisible,
    vulnerabilityData,
    vulnerabilityVisible,
    timeOfDay,
    onItemClick,
  },
  ref
) {
  const [mapInstance, setMapInstance] = useState(null);
  const [tooltip, setTooltip] = useState(null);

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

  // ─── Sun Lighting Effect ──────────────────────────────────

  const lightingEffects = useMemo(() => {
    if (timeOfDay == null) return [];

    const date = new Date();
    date.setHours(Math.floor(timeOfDay), (timeOfDay % 1) * 60, 0, 0);

    // Intensity varies by time of day
    const noon = 13;
    const dist = Math.abs(timeOfDay - noon) / 7;
    const sunIntensity = Math.max(0.3, 1.0 - dist * 0.7);

    try {
      const sunLight = new SunLight({
        timestamp: date.getTime(),
        color: [255, 255, 255],
        intensity: sunIntensity,
      });
      const ambientLight = new AmbientLight({
        color: [255, 255, 255],
        intensity: 0.4,
      });
      return [new LightingEffect({ ambientLight, sunLight })];
    } catch (err) {
      console.warn("SunLight not available:", err);
      return [];
    }
  }, [timeOfDay]);

  // ─── Deck.gl layers ────────────────────────────────────────

  const heatmapLayer = useHeatmapLayer(heatmapVisible);

  // Enhanced tree layers with realistic 3D appearance
  const enhancedTreeLayers = useMemo(() => {
    if (!trees || trees.length === 0) return [];

    // Get trunk height and canopy size per species
    const getTreeMetrics = (species) => {
      const sp = species || "maple";
      if (sp === "oak") return { trunkHeight: 18, canopyRadius: 12, canopyLayers: 4 };
      if (sp === "pine") return { trunkHeight: 25, canopyRadius: 5, canopyLayers: 6 };
      return { trunkHeight: 15, canopyRadius: 8, canopyLayers: 3 }; // maple
    };

    return [
      // Tree trunks (ColumnLayer)
      new ColumnLayer({
        id: "tree-trunk-layer",
        data: trees,
        getPosition: (d) => [d.position[0], d.position[1]],
        getElevation: (d) => getTreeMetrics(d.species).trunkHeight,
        diskResolution: 12,
        radius: 1.2,
        getFillColor: (d) =>
          d.species === "pine" ? [80, 60, 30] : [101, 67, 33],
        elevationScale: 1,
        pickable: false,
      }),
      
      // Canopy Layer 1 (bottom) - largest, at trunk top
      new ScatterplotLayer({
        id: "tree-canopy-bottom",
        data: trees,
        getPosition: (d) => {
          const metrics = getTreeMetrics(d.species);
          return [d.position[0], d.position[1], metrics.trunkHeight];
        },
        getRadius: (d) => getTreeMetrics(d.species).canopyRadius,
        getFillColor: (d) => SPECIES_COLORS[d.species] || [34, 139, 34, 220],
        radiusScale: 1,
        radiusMinPixels: 8,
        radiusMaxPixels: 35,
        pickable: true,
        onClick: (info) => {
          if (info.object && onItemClick) {
            onItemClick({ type: "tree", ...info.object });
          }
        },
        onHover: (info) => {
          if (info.object) {
            const sp = info.object.species || "maple";
            setTooltip({
              x: info.x,
              y: info.y,
              text: `🌳 ${sp.charAt(0).toUpperCase() + sp.slice(1)} Tree`,
            });
          } else {
            setTooltip(null);
          }
        },
      }),
      
      // Canopy Layer 2 (middle) - medium size
      new ScatterplotLayer({
        id: "tree-canopy-middle",
        data: trees,
        getPosition: (d) => {
          const metrics = getTreeMetrics(d.species);
          return [d.position[0], d.position[1], metrics.trunkHeight + 3];
        },
        getRadius: (d) => getTreeMetrics(d.species).canopyRadius * 0.85,
        getFillColor: (d) => {
          const color = SPECIES_COLORS[d.species] || [34, 139, 34, 200];
          // Slightly lighter for depth
          return [color[0] + 10, color[1] + 10, color[2] + 5, 200];
        },
        radiusScale: 1,
        radiusMinPixels: 6,
        radiusMaxPixels: 28,
        pickable: false,
      }),
      
      // Canopy Layer 3 (top) - smallest, creates rounded top
      new ScatterplotLayer({
        id: "tree-canopy-top",
        data: trees,
        getPosition: (d) => {
          const metrics = getTreeMetrics(d.species);
          return [d.position[0], d.position[1], metrics.trunkHeight + 5];
        },
        getRadius: (d) => getTreeMetrics(d.species).canopyRadius * 0.6,
        getFillColor: (d) => {
          const color = SPECIES_COLORS[d.species] || [34, 139, 34, 200];
          // Even lighter for highlights
          return [color[0] + 20, color[1] + 20, color[2] + 10, 180];
        },
        radiusScale: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 20,
        pickable: false,
      }),
    ];
  }, [trees, onItemClick]);

  // Cool Roof layers
  const coolRoofLayers = useMemo(() => {
    if (!coolRoofs || coolRoofs.length === 0) return [];
    return [
      new ScatterplotLayer({
        id: "cool-roof-glow",
        data: coolRoofs,
        getPosition: (d) => [d.position[0], d.position[1]],
        getRadius: 20,
        getFillColor: [200, 220, 255, 60],
        getLineColor: [150, 190, 255, 200],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        radiusMinPixels: 12,
        radiusMaxPixels: 35,
        pickable: true,
        onClick: (info) => {
          if (info.object && onItemClick) {
            onItemClick({ type: "cool_roof", ...info.object });
          }
        },
        onHover: (info) => {
          if (info.object) {
            setTooltip({ x: info.x, y: info.y, text: "🏠 Cool Roof — reflective coating" });
          } else {
            setTooltip(null);
          }
        },
      }),
      new TextLayer({
        id: "cool-roof-labels",
        data: coolRoofs,
        getPosition: (d) => [d.position[0], d.position[1]],
        getText: () => "🏠",
        getSize: 18,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        billboard: true,
      }),
    ];
  }, [coolRoofs]);

  // Bio-Swale layers
  const bioSwaleLayers = useMemo(() => {
    if (!bioSwales || bioSwales.length === 0) return [];
    return [
      new ScatterplotLayer({
        id: "bio-swale-glow",
        data: bioSwales,
        getPosition: (d) => [d.position[0], d.position[1]],
        getRadius: 15,
        getFillColor: [60, 140, 200, 70],
        getLineColor: [56, 189, 248, 200],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        radiusMinPixels: 10,
        radiusMaxPixels: 28,
        pickable: true,
        onClick: (info) => {
          if (info.object && onItemClick) {
            onItemClick({ type: "bio_swale", ...info.object });
          }
        },
        onHover: (info) => {
          if (info.object) {
            setTooltip({ x: info.x, y: info.y, text: "💧 Bio-Swale — rain garden" });
          } else {
            setTooltip(null);
          }
        },
      }),
      new TextLayer({
        id: "bio-swale-labels",
        data: bioSwales,
        getPosition: (d) => [d.position[0], d.position[1]],
        getText: () => "💧",
        getSize: 16,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        billboard: true,
      }),
    ];
  }, [bioSwales]);

  // Hotspot layers (Red Zones)
  const hotspotLayers = useMemo(() => {
    if (!hotspotsVisible || !hotspots?.length) return [];
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
        onClick: (info) => {
          if (info.object && onItemClick) {
            onItemClick({ type: "hotspot", ...info.object });
          }
        },
        onHover: (info) => {
          if (info.object) {
            const d = info.object;
            setTooltip({
              x: info.x,
              y: info.y,
              text: `⚠️ ${d.temperature_c}°C | ${d.severity?.toUpperCase()} | ${d.description}`,
            });
          } else {
            setTooltip(null);
          }
        },
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
    if (!suggestionsVisible || !suggestions?.length) return [];
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
        onClick: (info) => {
          if (info.object && onItemClick) {
            onItemClick({ type: "suggestion", ...info.object });
          }
        },
        onHover: (info) => {
          if (info.object) {
            const d = info.object;
            setTooltip({
              x: info.x,
              y: info.y,
              text: `💡 −${d.cooling_potential}°C | ${d.reason}`,
            });
          } else {
            setTooltip(null);
          }
        },
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

  // Vulnerability overlay with enhanced tooltips
  const vulnerabilityLayers = useMemo(() => {
    if (!vulnerabilityVisible || !vulnerabilityData?.length) return [];
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
        onClick: (info) => {
          if (info.object && onItemClick) {
            onItemClick({ type: "vulnerability", ...info.object });
          }
        },
        onHover: (info) => {
          if (info.object) {
            const d = info.object;
            const level =
              d.vulnerability_score >= 0.7
                ? "CRITICAL"
                : d.vulnerability_score >= 0.4
                ? "HIGH"
                : "MODERATE";
            setTooltip({
              x: info.x,
              y: info.y,
              text: `🛡️ ${d.label} | Risk: ${level} | Pop: ${d.population?.toLocaleString()} | ${d.factors}`,
            });
          } else {
            setTooltip(null);
          }
        },
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
  // Order matters: data layers first (bottom), user interventions last (top, click priority)
  const allLayers = useMemo(() => {
    const layers = [
      // Data layers (bottom)
      ...hotspotLayers,
      ...suggestionLayers,
      ...vulnerabilityLayers,
      // User interventions (top - get click priority over data layers)
      ...enhancedTreeLayers,
      ...coolRoofLayers,
      ...bioSwaleLayers,
    ];
    if (heatmapLayer) layers.push(heatmapLayer);
    return layers;
  }, [
    enhancedTreeLayers,
    coolRoofLayers,
    bioSwaleLayers,
    hotspotLayers,
    suggestionLayers,
    vulnerabilityLayers,
    heatmapLayer,
  ]);

  // ─── Map click handler ─────────────────────────────────────

  const handleMapClick = useCallback(
    async (e) => {
      if (!e.detail?.latLng) return;
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;

      // Close info card when clicking empty space (not in intervention mode)
      if (mode === "explore" && onItemClick) {
        onItemClick(null);
      }

      if (mode === "tree") {
        onTreePlant([lng, lat, 0]);
      } else if (mode === "cool_roof") {
        onCoolRoofPlace?.([lng, lat, 0]);
      } else if (mode === "bio_swale") {
        onBioSwalePlace?.([lng, lat, 0]);
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
    [mode, onTreePlant, onCoolRoofPlace, onBioSwalePlace, onMapClick, onTemperatureUpdate, onItemClick]
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
    clickableIcons: false,
    styles: [
      // Hide ALL points of interest (businesses, attractions, schools, etc.)
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }]
      },
      // Hide transit (bus stops, train stations)
      {
        featureType: "transit",
        stylers: [{ visibility: "off" }]
      },
      // Hide labels for small residential streets
      {
        featureType: "road.local",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      // Hide building footprints for cleaner look
      {
        featureType: "landscape.man_made",
        stylers: [{ visibility: "off" }]
      },
      // Explicitly ensure natural features remain visible
      {
        featureType: "landscape.natural",
        stylers: [{ visibility: "on" }]
      },
      // Keep water features visible
      {
        featureType: "water",
        stylers: [{ visibility: "on" }]
      },
    ],
  };

  if (GOOGLE_MAPS_MAP_ID) {
    mapOptions.mapId = GOOGLE_MAPS_MAP_ID;
    mapOptions.tilt = 45;
    mapOptions.heading = 0;
  }

  const isIntervention = mode === "tree" || mode === "cool_roof" || mode === "bio_swale";

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
        <DeckGLOverlay layers={allLayers} effects={lightingEffects} />
      </Map>

      {/* Mode indicators */}
      {mode === "tree" && (
        <div style={styles.modeIndicator}>
          🌳 Click anywhere to plant a tree
        </div>
      )}
      {mode === "cool_roof" && (
        <div style={{ ...styles.modeIndicator, background: "rgba(150,190,255,0.9)" }}>
          🏠 Click a building to apply Cool Roof
        </div>
      )}
      {mode === "bio_swale" && (
        <div style={{ ...styles.modeIndicator, background: "rgba(56,189,248,0.9)" }}>
          💧 Click to place a Bio-Swale
        </div>
      )}
      {mode === "streetview" && (
        <div style={{ ...styles.modeIndicator, background: "rgba(251,191,36,0.9)" }}>
          📍 Click a location to open Street View
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            ...styles.tooltip,
            left: tooltip.x + 12,
            top: tooltip.y - 8,
          }}
        >
          {tooltip.text}
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
    background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
    color: "#000",
    padding: "8px 20px",
    borderRadius: "20px",
    fontSize: "0.82rem",
    fontWeight: 700,
    pointerEvents: "none",
    zIndex: 50,
    boxShadow: "0 4px 16px rgba(74,222,128,0.4), 0 0 20px rgba(74,222,128,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
  },
  tooltip: {
    position: "absolute",
    background: "linear-gradient(135deg, rgba(20,35,30,0.98) 0%, rgba(26,40,35,0.98) 100%)",
    color: "#e5e5e5",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: 500,
    maxWidth: "350px",
    pointerEvents: "none",
    zIndex: 200,
    border: "1px solid rgba(74,222,128,0.3)",
    boxShadow: "0 4px 16px rgba(74,222,128,0.2)",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
