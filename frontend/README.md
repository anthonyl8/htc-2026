# ReLeaf Frontend

React + Vite + Deck.gl + Google Maps for the ReLeaf urban heat resilience platform.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: set VITE_GOOGLE_MAPS_API_KEY and VITE_API_URL (default http://localhost:8000/api)
```

**Google Maps:** Enable **Maps JavaScript API** (and optionally **Map Tiles API**) in [Google Cloud Console](https://console.cloud.google.com/apis/library), then create an API key.

Use **`.env`** or **`.env.local`** in the `frontend/` folder. The variable must be **`VITE_GOOGLE_MAPS_API_KEY`** (Vite only exposes `VITE_*` to the app). Restart the dev server after changing env.

### "AuthFailure" or map won't load

- **Variable name:** Use `VITE_GOOGLE_MAPS_API_KEY` (not `REACT_APP_GOOGLE_MAPS_API_KEY`).
- **No quotes:** `VITE_GOOGLE_MAPS_API_KEY=AIza...` not `VITE_GOOGLE_MAPS_API_KEY="AIza..."`.
- **APIs enabled:** In Cloud Console → APIs & Services → Enabled APIs, ensure **Maps JavaScript API** and **Places API** are on.
- **Restrictions:** If you use "Application restrictions", add `http://localhost:5173/*` and `http://127.0.0.1:5173/*` (or leave restrictions off for dev).

## Run

Start the **backend** first (in another terminal), then:

```bash
npm run dev
```

Runs at [http://localhost:5173](http://localhost:5173). Backend:

```bash
cd ../backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Features

- **3D map** — Photorealistic Google Map Tiles with Deck.gl layers
- **Heat tooltip & heatmap** — LST from backend `/api/heatmap/*`
- **Tree planting, cool roofs, bio-swales** — With OSM validation
- **Data layers** — Red zones, plant suggestions, vulnerability
- **Street View** — With ghost tree markers
- **AI Vision** — Gemini future-city generation via `/api/vision/generate`
- **Simulation & ROI** — Cooling impact and funding calculator
