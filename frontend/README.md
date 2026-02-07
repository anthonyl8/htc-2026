# ReLeaf Frontend

React + Deck.gl + Google Maps 3D for the ReLeaf urban heat resilience platform.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: set REACT_APP_GOOGLE_MAPS_API_KEY and optionally REACT_APP_API_URL
```

**Google Maps:** Enable **Maps JavaScript API** (and optionally **Map Tiles API**) in [Google Cloud Console](https://console.cloud.google.com/apis/library), then create an API key.

## Run

```bash
npm start
```

Runs at [http://localhost:3000](http://localhost:3000). Start the backend first so heat tooltip and "Simulate Future" work:

```bash
cd ../backend && uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

## Features

- **3D map:** Vancouver (49.2827, -123.1207), tilted view, bounds locked for hackathon.
- **Heat tooltip:** Hover to see LST from backend (`/heatmap/{lat}/{lon}`).
- **Tree planting:** Click to place a tree (green column); state is in React.
- **Simulate Future:** Captures the map with html2canvas, sends to backend Gemini, shows Before/After modal.

## Optional

- **Heat overlay:** If the backend serves `GET /heat-overlay` (PNG), the frontend overlays it via Deck.gl `BitmapLayer`.
- **3D tree model:** To use a `.glb` instead of columns, switch to `ScenegraphLayer` in `Map.js` and pass a `scenegraph` URL (e.g. Kenney Assets tree).
