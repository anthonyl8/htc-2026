# ReLeaf Backend

FastAPI backend for the ReLeaf geospatial + AI pipeline.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GEMINI_API_KEY
```

## GeoTIFF (Heatmap Data)

1. Download LST GeoTIFF from [Sentinel Hub EO Browser](https://apps.sentinel-hub.com/eo-browser/) for your city.
2. Save as `backend/data/heat_map.tif`.
3. If the file is missing, `/heatmap/{lat}/{lon}` returns a fallback value (for demo).

Optional: export a transparent PNG (Red=Hot, Transparent=Cool) from Sentinel Hub and save as `backend/data/heat_overlay.png`. The frontend will overlay it via `GET /heat-overlay`.

## Run

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

- **Health:** `GET http://localhost:8000/`
- **Heat overlay PNG:** `GET http://localhost:8000/heat-overlay` (optional; place `data/heat_overlay.png`)
- **Heatmap sample:** `GET http://localhost:8000/heatmap/49.2827/-123.1207`
- **Vision (future city):** `POST http://localhost:8000/generate-vision` with JSON `{ "image_base64": "..." }`
