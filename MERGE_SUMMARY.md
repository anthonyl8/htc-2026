# Merge Summary — ReLeaf

This document describes how the two project variants were merged and which choices were made.

## The Two Variants

| Aspect | **HEAD (kept)** | **Incoming / draft (discarded for conflicts)** |
|--------|------------------|--------------------------------------------------|
| **Frontend** | React + **Vite** + **Deck.gl** + @vis.gl/react-google-maps | React + **Create React App** + @react-google-maps/api + html2canvas |
| **Backend** | **main.py** + controllers/ + services/ (heatmap, analysis, vision, validation) | **server.py** single-file (GeoTIFF + Gemini only) |
| **Features** | Full platform: data layers, Street View, ROI, species, cool roofs, bio-swales, OSM validation | Simpler: map, heat tooltip, tree planting, “Simulate Future” screenshot → Gemini |
| **API** | `/api/heatmap/*`, `/api/analysis/*`, `/api/vision/generate`, `/api/validation/*` | `/heatmap/{lat}/{lon}`, `POST /generate-vision` (screenshot base64) |

## Decisions

1. **Frontend = HEAD (full platform)**  
   Kept Vite, Deck.gl, and the existing `frontend/src/` app (MapView, StreetViewPanel, Toolbar, SimulationPanel, etc.). This keeps the richer feature set and modern tooling.

2. **Backend entry = main.py**  
   Start script now runs `uvicorn main:app` so the app uses the full API (analysis, heatmap, vision, validation). `server.py` remains in the repo but is not the default entry point.

3. **Package.json**  
   Kept HEAD’s dependencies (Deck.gl, @vis.gl/react-google-maps, Vite, etc.) and added **html2canvas** from the draft for any future capture/export use.

4. **Styles**  
   Kept HEAD’s `App.css` (resets, animations, time-slider, scrollbars). Merged useful base rules from the draft into `index.css` (e.g. `html, body, #root` height).

5. **Env and config**  
   Kept HEAD’s `.env.example` and `config` shape: `VITE_API_URL=http://localhost:8000/api`, `VITE_GOOGLE_MAPS_API_KEY`, backend `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `HEATMAP_TIFF_PATH`, etc.

## Resolved Files

- `frontend/src/index.css` — merged (base styles from both)
- `frontend/src/App.css` — HEAD only
- `frontend/package.json` — HEAD + html2canvas
- `frontend/package-lock.json` — HEAD, then `npm install`
- `frontend/README.md`, `frontend/.gitignore`, `frontend/.env.example` — HEAD, updated for Vite
- `backend/requirements.txt`, `backend/.env.example` — HEAD (full deps and env)
- `scripts/start-backend.sh` — `server:app` → `main:app`

## What You Have After the Merge

- **One frontend:** Vite app in `frontend/src/` with the full ReLeaf UI (map, layers, Street View, simulation, ROI, validation, etc.).
- **One backend:** FastAPI app in `backend/` started via `main.py` with all controllers and services.
- **Run:** `./scripts/start-backend.sh` then `./scripts/start-frontend.sh` (or `./scripts/start-all.sh`), then open http://localhost:5173.

If you need the draft’s “screenshot → Gemini” flow later, it can be added as an extra route in `main.py` (or a thin wrapper that calls the same logic as `server.py`).
