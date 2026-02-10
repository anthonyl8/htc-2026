# ReLeaf: The Digital Twin for Urban Heat Resilience

A 3D interactive platform that lets city planners visualize heat islands and use GenAI to simulate cooling interventions in real-time.

## What is ReLeaf?

ReLeaf is a smart urban planning tool designed to help cities and communities combat the Urban Heat Island (UHI) effect. It combines photorealistic 3D city visualization, real satellite thermal data, and Google's Gemini AI to provide actionable insights for greener, cooler cities.

## Features

- Photorealistic 3D map powered by Google Map Tiles API
- Real land surface temperature data from Sentinel-2 satellite imagery
- Can click to place trees and visualize other cooling interventions
- Click any planted tree or other intervention to fetch the actual Google Street View panorama of that coordinate. Uses Google Gemini to place the intervention into the scene with photorealistic lighting and perspective.
- Can generate a FEMA-compliant grant narrative ready for submission to funding bodies like the BRIC program.
- Click anywhere to see the surface temperature at that point

## Tech Stack

**Frontend**: React + Vite + Deck.gl 
**Backend**: Python (FastAPI)
**Map Base**: Google Map Tiles API (3D)
**Heat Data**: Sentinel-2 (GeoTIFF / LST)
**AI Vision**: Google Gemini
**Other Libraries**: rasterio, numpy, html2canvas

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Google Cloud API key (with Map Tiles API enabled)
- A Google AI Studio API key (for Gemini)
- Supabase Project (Optional, required for saving)
- A Sentinel-2 GeoTIFF file for real thermal data (Optional, required for real data)

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
# Edit .env
# GEMINI_API_KEY=AIzaSy...
# GOOGLE_MAPS_API_KEY=AIzaSy...
# SUPABASE_URL=...
# SUPABASE_SERVICE_KEY=..

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
# Edit .env
# VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Start dev server
npm run dev
```

### 3. Database Setup (Supabase)

If you want to use project saving and caching:

1. Create a new Supabase project.
2. Go to the SQL Editor.
3. Copy and run the contents of supabase/migrations/20260208000000_initial.sql.
4. Run 20260208000002_streetview_cache.sql to enable AI-generated image caching.

The app will be available at `http://localhost:5173`.

### Basic Usage Flow

1. Open the app to see the Heatmap. Hover over "Red Zones" to see surface temperatures >42°C.
2. Select "Plant Tree" from the toolbar. Click on a hotspot.
*Note*: The app will validate your click. You cannot plant on roads, water, or buildings.
3. Open the Simulation Panel to see the immediate temperature drop and ROI.
4. Click your planted tree -> "Real Life View". Wait ~5s for Gemini to hallucinate the tree into the real street view.
5. Click "Generate Grant Proposal" to get a fully written funding application based on your data.

### API Keys
1. **Google Maps API Key** (Required)

* Go to the Google Cloud Console and create a project. You must enable the following APIs for that key:
* Map Tiles API (For the 3D City Map)
* Maps JavaScript API (For the map container)
* Street View Static API (For the AI "Real Life View" feature)

2. **Google AI (Gemini) API Key** (Required)

* Go to Google AI Studio and create a key.

*Used for*: Image generation and grant writing.

3. **Supabase API Key** (Optional)

* Go to Supabase.
* Anon Key: Safe for the Frontend (Project saving).
* Service Role Key: Backend only (AI Caching).
* Note: If skipped, the app will run in "Demo Mode" (no saving).

### Satellite Data (Optional)

The app includes a synthetic data fallback, but for real data:

1. Go to [Sentinel Hub EO Browser](https://apps.sentinel-hub.com/eo-browser/)
2. Search for your city, filter for Cloud Cover < 10%
3. Select Sentinel-2 L2A
4. Download B11/B12 bands or a pre-calculated LST script as GeoTIFF
5. Place the file as `backend/data/heat_map.tif`
