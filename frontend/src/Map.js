/**
 * ReLeaf - 3D map with Deck.gl overlay on Google Maps.
 * Vancouver: 49.2827, -123.1207. Locked view for hackathon (data coverage).
 */
import React, { useCallback, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ColumnLayer, BitmapLayer } from '@deck.gl/layers';

const VANCOUVER_CENTER = { lat: 49.2827, lng: -123.1207 };
const DEFAULT_ZOOM = 18;
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Optional: heat overlay PNG from Sentinel Hub (Red=Hot, Transparent=Cool).
// Set REACT_APP_HEAT_OVERLAY_URL or pass heatOverlayImage in props.
const HEAT_BOUNDS = [
  [VANCOUVER_CENTER.lng - 0.01, VANCOUVER_CENTER.lat - 0.01],
  [VANCOUVER_CENTER.lng + 0.01, VANCOUVER_CENTER.lat + 0.01],
];

export default function Map({
  trees,
  heatOverlayImage = null,
  onMapLoad,
  onClick,
  onHover,
  cursorLat,
  cursorLon,
  temperature,
}) {
  const [overlay, setOverlay] = useState(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'releaf-google-maps',
  });

  const layers = useMemo(() => {
    const list = [];

    // Heat overlay (transparent PNG from Sentinel Hub)
    if (heatOverlayImage) {
      list.push(
        new BitmapLayer({
          id: 'heat-overlay',
          image: heatOverlayImage,
          bounds: HEAT_BOUNDS,
          opacity: 0.6,
        })
      );
    }

    // Planted trees: ColumnLayer (green cylinders) – works without .glb.
    // For ScenegraphLayer + .glb, use: scenegraph: 'https://your-cdn.com/tree.glb'
    if (trees && trees.length > 0) {
      list.push(
        new ColumnLayer({
          id: 'trees',
          data: trees,
          getPosition: (d) => d.position,
          getRadius: (d) => (d.size != null ? d.size : 10),
          getElevation: (d) => (d.size != null ? d.size * 3 : 30),
          getFillColor: [34, 139, 34],
          radiusMinPixels: 4,
          radiusMaxPixels: 40,
          elevationScale: 1,
          extruded: true,
          pickable: true,
        })
      );
    }

    return list;
  }, [trees, heatOverlayImage]);

  const overlayInstance = useMemo(
    () => new GoogleMapsOverlay({ interleaved: true }),
    []
  );

  const onLoad = useCallback(
    (map) => {
      map.setTilt(45);
      if (overlayInstance) {
        overlayInstance.setMap(map);
        setOverlay(overlayInstance);
      }
      onMapLoad && onMapLoad(map);
    },
    [overlayInstance, onMapLoad]
  );

  const onUnmount = useCallback(() => {
    if (overlay) overlay.setMap(null);
    setOverlay(null);
  }, [overlay]);

  React.useEffect(() => {
    if (overlay) overlay.setProps({ layers });
  }, [overlay, layers]);

  const handleClick = useCallback(
    (e) => {
      if (e.latLng && onClick) {
        onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [onClick]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (e.latLng && onHover) {
        onHover({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [onHover]
  );

  if (loadError) {
    return (
      <div style={{ padding: 20, color: '#c00' }}>
        Failed to load Google Maps. Check REACT_APP_GOOGLE_MAPS_API_KEY and Map Tiles / Maps JavaScript API.
      </div>
    );
  }

  if (!isLoaded) {
    return <div style={{ padding: 20 }}>Loading map…</div>;
  }

  return (
    <>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={VANCOUVER_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        mapContainerClassName="releaf-google-map"
        options={{
          mapTypeId: 'hybrid',
          tilt: 45,
          restriction: {
            latLngBounds: {
              north: VANCOUVER_CENTER.lat + 0.02,
              south: VANCOUVER_CENTER.lat - 0.02,
              east: VANCOUVER_CENTER.lng + 0.02,
              west: VANCOUVER_CENTER.lng - 0.02,
            },
            strictBounds: true,
          },
        }}
      />
      {temperature != null && cursorLat != null && cursorLon != null && (
        <div
          className="heat-tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 14,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {cursorLat.toFixed(5)}, {cursorLon.toFixed(5)} · {temperature}°C (LST)
        </div>
      )}
    </>
  );
}
