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
import AirQualityOverlay from "./AirQualityOverlay";
import "./MapView.css";

const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "";

// ─── Species color mapping (high contrast, vibrant) ──────────

const SPECIES_COLORS = {
  oak: [50, 200, 50, 255],      // Bright green
  maple: [100, 255, 70, 255],   // Vivid lime green
  pine: [30, 180, 90, 255],     // Deep forest green
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
    equityData,
    equityVisible,
    airQualityVisible,
    timeOfDay,
    onItemClick,
    hoverLocation,
    validationStatus,
    onHover,
  },
  ref
) {
  const [mapInstance, setMapInstance] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const isIntervention = mode === "tree" || mode === "cool_roof" || mode === "bio_swale";

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

  // ─── Ghost Layer (Minecraft-style placement) ───────────────

  const handleMouseMove = useCallback((e) => {
    if (!isIntervention) {
      if (onHover) onHover(null);
      return;
    }
    
    if (!e.detail?.latLng) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    
    if (onHover) onHover({ lat, lng });
  }, [isIntervention, onHover]);

  const ghostLayer = useMemo(() => {
    if (!isIntervention || !hoverLocation) return null;

    const { lat, lng } = hoverLocation;
    
    // Determine color
    let color = [100, 200, 255, 100]; // Blue pending
    let lineColor = [150, 220, 255, 150];
    
    if (validationStatus && !validationStatus.loading) {
      if (validationStatus.valid) {
        color = [50, 255, 50, 120]; // Green valid
        lineColor = [100, 255, 100, 200];
      } else {
        color = [255, 50, 50, 120]; // Red invalid
        lineColor = [255, 100, 100, 200];
      }
    }

    const radius = mode === "tree" ? 8 : mode === "cool_roof" ? 20 : 15;

    // We use a simple scatterplot for the ghost to represent the footprint
    return new ScatterplotLayer({
      id: "ghost-layer",
      data: [{ position: [lng, lat] }],
      getPosition: (d) => d.position,
      getRadius: radius,
      getFillColor: color,
      getLineColor: lineColor,
      lineWidthMinPixels: 2,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 5,
      radiusMaxPixels: 50,
      pickable: false, // Don't block clicks
    });
  }, [isIntervention, hoverLocation, validationStatus, mode]);

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
        getFillColor: (d) => SPECIES_COLORS[d.species] || [100, 255, 70, 255],
        getLineColor: [255, 255, 255, 200],  // White outline for contrast
        lineWidthMinPixels: 2,
        stroked: true,
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
        getFillColor: [150, 200, 255, 120],  // Brighter blue fill
        getLineColor: [200, 230, 255, 255],  // Vivid light blue outline
        lineWidthMinPixels: 3,  // Thicker outline
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
        getFillColor: [100, 200, 255, 130],  // Brighter cyan fill
        getLineColor: [150, 230, 255, 255],  // Vivid cyan outline
        lineWidthMinPixels: 3,  // Thicker outline
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
          if (t >= 50) return [255, 30, 30, 150];  // Brighter red
          if (t >= 45) return [255, 100, 30, 130];  // Bright orange
          return [255, 180, 30, 110];  // Bright yellow-orange
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
        getFillColor: [255, 50, 50, 255],  // Vivid red core
        getLineColor: [255, 255, 255, 255],  // Bright white outline
        lineWidthMinPixels: 3,  // Thicker outline
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
        getFillColor: [100, 255, 150, 120],  // Brighter green fill
        getLineColor: [150, 255, 180, 255],  // Vivid light green outline
        lineWidthMinPixels: 3,  // Thicker outline
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
          if (s >= 0.7) return [200, 100, 255, 130];  // Bright purple
          if (s >= 0.4) return [255, 180, 50, 110];   // Bright amber
          return [100, 180, 255, 90];  // Bright blue
        },
        radiusMinPixels: 15,
        radiusMaxPixels: 55,
        stroked: true,
        getLineColor: (d) => {
          const s = d.vulnerability_score;
          if (s >= 0.7) return [230, 150, 255, 255];  // Vivid purple outline
          if (s >= 0.4) return [255, 200, 100, 255];  // Vivid amber outline
          return [150, 210, 255, 255];  // Vivid blue outline
        },
        lineWidthMinPixels: 3,  // Thicker outline
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

  // Equity (Census Tracts) Layer
  const equityLayer = useMemo(() => {
    if (!equityVisible || !equityData?.features) return null;
    return new PolygonLayer({
      id: "equity-layer",
      data: equityData.features,
      getPolygon: d => d.geometry.coordinates,
      getFillColor: d => d.properties.fillColor || [200, 200, 200, 100],
      getLineColor: [255, 255, 255, 100],
      getLineWidth: 2,
      filled: true,
      stroked: true,
      lineWidthMinPixels: 1,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 50],
      onHover: (info) => {
        if (info.object) {
          const p = info.object.properties;
          setTooltip({
            x: info.x,
            y: info.y,
            text: `📊 ${p.zone_type} | Avg Income: $${p.income.toLocaleString()} | Temp: ${p.temperature_c}°C`,
          });
        } else {
          setTooltip(null);
        }
      },
    });
  }, [equityVisible, equityData]);

  // Combine all layers
  // Order matters: data layers first (bottom), user interventions last (top, click priority)
  const allLayers = useMemo(() => {
    const layers = [
      // Data layers (bottom)
      ...hotspotLayers,
      ...suggestionLayers,
      ...vulnerabilityLayers,
      ...enhancedTreeLayers,
      ...coolRoofLayers,
      ...bioSwaleLayers,
    ];
    if (heatmapLayer) layers.push(heatmapLayer);
    if (equityLayer) layers.push(equityLayer); // Equity layer
    if (ghostLayer) layers.push(ghostLayer);
    return layers;
  }, [
    enhancedTreeLayers,
    coolRoofLayers,
    bioSwaleLayers,
    hotspotLayers,
    suggestionLayers,
    vulnerabilityLayers,
    heatmapLayer,
    equityLayer,
    ghostLayer,
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
    mapTypeId: "satellite",
    gestureHandling: "greedy",
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: [
      // Reduce overall saturation to make icons stand out
      { elementType: "geometry", stylers: [{ saturation: -50 }, { lightness: -10 }] },
      
      // Mute roads to reduce distraction
      { featureType: "road", elementType: "geometry", stylers: [{ saturation: -70 }, { lightness: -15 }] },
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

  return (
    <div id="map-container" className="MapView">
      <Map
        defaultCenter={{ lat: 49.2827, lng: -123.1207 }}
        defaultZoom={15}
        {...mapOptions}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        style={{ width: "100%", height: "100%" }}
        reuseMaps={true}
      >
        <MapInstanceCapture onMapReady={setMapInstance} />
        <DeckGLOverlay layers={allLayers} effects={lightingEffects} />
        <AirQualityOverlay visible={airQualityVisible} />
      </Map>

      {/* Mode indicators */}
      {mode === "tree" && (
        <div className="MapView-modeIndicator">
          🌳 Click anywhere to plant a tree
        </div>
      )}
      {mode === "cool_roof" && (
        <div className="MapView-modeIndicator MapView-modeIndicator--coolRoof">
          🏠 Click a building to apply Cool Roof
        </div>
      )}
      {mode === "bio_swale" && (
        <div className="MapView-modeIndicator MapView-modeIndicator--bioSwale">
          💧 Click to place a Bio-Swale
        </div>
      )}
      {mode === "streetview" && (
        <div className="MapView-modeIndicator MapView-modeIndicator--streetview">
          📍 Click a location to open Street View
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="MapView-tooltip"
          style={{
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
