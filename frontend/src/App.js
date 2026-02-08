/**
 * ReLeaf - The Digital Twin for Urban Heat Resilience.
 * 3D map, heat tooltip, tree planting, and Gemini "Simulate Future" before/after.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Map from './Map';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function App() {
  const [trees, setTrees] = useState([]);
  const [cursorLat, setCursorLat] = useState(null);
  const [cursorLon, setCursorLon] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [visionModal, setVisionModal] = useState(null); // { before, after } or null
  const [visionLoading, setVisionLoading] = useState(false);
  const [heatOverlayImage, setHeatOverlayImage] = useState(null);

  // Optional: load heat overlay PNG from backend (Red=Hot, Transparent=Cool)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setHeatOverlayImage(img);
    img.onerror = () => {}; // 404 or missing – tooltip still works
    img.src = `${API_URL}/heat-overlay`;
  }, []);

  const fetchTemperature = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(`${API_URL}/heatmap/${lat}/${lon}`);
      const data = await res.json();
      return data.temperature_c != null ? data.temperature_c : null;
    } catch {
      return null;
    }
  }, []);

  const onMapHover = useCallback(
    async (coords) => {
      setCursorLat(coords.lat);
      setCursorLon(coords.lng);
      const temp = await fetchTemperature(coords.lat, coords.lng);
      setTemperature(temp);
    },
    [fetchTemperature]
  );

  const onMapClick = useCallback((coords) => {
    setTrees((prev) => [
      ...prev,
      { position: [coords.lng, coords.lat], size: 10 },
    ]);
  }, []);

  const captureAndGenerateVision = useCallback(async () => {
    setVisionLoading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const mapEl = document.querySelector('.releaf-google-map');
      if (!mapEl) throw new Error('Map container not found');
      const canvas = await html2canvas(mapEl, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1,
      });
      const beforeBase64 = canvas.toDataURL('image/png');

      const res = await fetch(`${API_URL}/generate-vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: beforeBase64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }
      const { image_base64 } = await res.json();
      const afterDataUrl = `data:image/png;base64,${image_base64}`;
      setVisionModal({ before: beforeBase64, after: afterDataUrl });
    } catch (e) {
      console.error(e);
      alert('Vision generation failed: ' + (e.message || String(e)));
    } finally {
      setVisionLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>ReLeaf</h1>
        <p className="tagline">The Digital Twin for Urban Heat Resilience</p>
        <div className="controls">
          <button
            type="button"
            className="btn btn-primary"
            onClick={captureAndGenerateVision}
            disabled={visionLoading}
          >
            {visionLoading ? 'Generating…' : 'Simulate Future'}
          </button>
        </div>
      </header>

      <div className="map-wrapper">
        <Map
          trees={trees}
          heatOverlayImage={heatOverlayImage}
          onClick={onMapClick}
          onHover={onMapHover}
          cursorLat={cursorLat}
          cursorLon={cursorLon}
          temperature={temperature}
        />
      </div>

      <div className="hint">
        Click on the map to place a tree. Hover to see LST (Land Surface Temperature).
      </div>

      {visionModal && (
        <div
          className="modal-backdrop"
          onClick={() => setVisionModal(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setVisionModal(null)}
          aria-label="Close"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Before / After</h2>
            <div className="before-after">
              <div className="slide-panel">
                <span className="label">Before</span>
                <img src={visionModal.before} alt="Before" />
              </div>
              <div className="slide-panel">
                <span className="label">After (AI)</span>
                <img src={visionModal.after} alt="After" />
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setVisionModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
