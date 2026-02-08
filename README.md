# ReLeaf — The Digital Twin for Urban Heat Resilience

A 3D interactive platform that lets city planners visualize heat islands and use GenAI to simulate cooling interventions in real-time.

## What is ReLeaf?

ReLeaf is a smart urban planning tool designed to help cities and communities combat the Urban Heat Island (UHI) effect. It combines photorealistic 3D city visualization, real satellite thermal data, and Google's Gemini AI to provide actionable insights for greener, cooler cities.

## Features

- **3D City Visualization** — Photorealistic 3D map powered by Google Map Tiles API
- **Satellite Heat Mapping** — Real Land Surface Temperature data from Sentinel-2 imagery
- **Interactive Tree Planting** — Click to place trees and visualize cooling interventions
- **AI Vision Analysis** — Gemini AI analyzes the urban landscape and recommends green interventions
- **Temperature Querying** — Click anywhere to see the surface temperature at that point

## Tech Stack

| Component     | Technology                  |
| ------------- | --------------------------- |
| Frontend      | React + Vite + Deck.gl      |
| Backend       | Python (FastAPI)             |
| Map Base      | Google Map Tiles API (3D)    |
| Heat Data     | Sentinel-2 (GeoTIFF / LST)  |
| AI Vision     | Google Gemini 2.0 Flash      |
| Libraries     | rasterio, numpy, html2canvas |

## Project Structure

```
htc-2026/
├── backend/
│   ├── controllers/        # API route handlers
│   │   ├── heatmap.py      # Temperature & heatmap endpoints
│   │   └── vision.py       # AI vision generation endpoint
│   ├── services/           # Business logic
│   │   ├── satellite.py    # GeoTIFF processing & temperature extraction
│   │   └── gemini.py       # Gemini AI integration
│   ├── core/               # App configuration
│   │   └── config.py       # Environment variable management
│   ├── data/               # Satellite data (GeoTIFF files)
│   ├── main.py             # FastAPI entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI components
│   │   │   ├── MapView.jsx         # 3D map with Deck.gl + Google Tiles
│   │   │   ├── HeatmapOverlay.jsx  # Heat visualization layer
│   │   │   ├── TreeLayer.jsx       # Tree planting visualization
│   │   │   ├── Toolbar.jsx         # Floating control panel
│   │   │   └── VisionModal.jsx     # AI vision generation modal
│   │   ├── services/       # API client functions
│   │   │   └── api.js
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useTreePlanting.js
│   │   ├── App.jsx         # Root component
│   │   └── main.jsx        # Entry point
│   ├── .env.example        # Frontend env template
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Google Cloud API key (with Map Tiles API enabled)
- A Google AI Studio API key (for Gemini)
- (Optional) A Sentinel-2 GeoTIFF file for real thermal data

### 1. Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your VITE_GOOGLE_MAPS_API_KEY

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### API Keys Needed

1. **Google Maps API Key** — Go to [Google Cloud Console](https://console.cloud.google.com/), enable "Map Tiles API", and create an API key.
2. **Google AI (Gemini) API Key** — Go to [Google AI Studio](https://aistudio.google.com/apikey) and create an API key.

### Satellite Data (Optional)

The app includes a synthetic data fallback, but for real data:

1. Go to [Sentinel Hub EO Browser](https://apps.sentinel-hub.com/eo-browser/)
2. Search for your city, filter for Cloud Cover < 10%
3. Select Sentinel-2 L2A
4. Download B11/B12 bands or a pre-calculated LST script as GeoTIFF
5. Place the file as `backend/data/heat_map.tif`

## API Endpoints

| Method | Endpoint                         | Description                          |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/api/heatmap/temperature`       | Get temperature at a coordinate      |
| GET    | `/api/heatmap/bounds`            | Get geographic bounds of heat data   |
| GET    | `/api/heatmap/grid`              | Get NxN grid of temperature values   |
| POST   | `/api/vision/generate`           | Generate AI urban vision from screenshot |
| GET    | `/health`                        | Health check                         |
| GET    | `/docs`                          | Interactive API documentation        |
