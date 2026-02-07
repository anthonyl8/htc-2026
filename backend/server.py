"""
ReLeaf Backend - Geospatial pipeline + Gemini vision.
"""
import os
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

load_dotenv()

# ---------------------------------------------------------------------------
# Geospatial pipeline (rasterio)
# ---------------------------------------------------------------------------
HEATMAP_PATH = os.getenv("HEATMAP_TIFF_PATH", str(Path(__file__).resolve().parent / "data" / "heat_map.tif"))


def sample_heat_at(lat: float, lon: float) -> float | None:
    """
    Sample Land Surface Temperature at (lat, lon) from the GeoTIFF.
    Reprojects WGS84 (lat/lon) to the raster CRS and reads the pixel value.
    """
    try:
        import rasterio
        from rasterio.crs import CRS
        from rasterio.warp import transform_xy
    except ImportError:
        return None

    if not os.path.isfile(HEATMAP_PATH):
        return None

    with rasterio.open(HEATMAP_PATH) as src:
        wgs84 = CRS.from_epsg(4326)
        dst_crs = src.crs

        xs, ys = transform_xy(wgs84, dst_crs, [lon], [lat])
        x, y = xs[0], ys[0]

        row, col = src.index(x, y)

        if row < 0 or row >= src.height or col < 0 or col >= src.width:
            return None

        window = rasterio.windows.Window(col, row, 1, 1)
        data = src.read(window=window)
        value = float(np.nanmean(data))
        return value if not np.isnan(value) else None


# ---------------------------------------------------------------------------
# Gemini vision
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VISION_PROMPT = """You are an urban planner. This is a screenshot of a city street.
Keep the building geometry exactly the same.
Replace the roads with pedestrian-friendly green spaces, add mature oak trees,
and make it look like a sustainable eco-city. Photorealistic style."""


def generate_future_city_image(image_base64: str) -> str:
    """Return base64 of the generated image from Gemini."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")
    import base64

    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_bytes = base64.b64decode(image_base64)
    image_part = {"mime_type": "image/png", "data": image_bytes}
    response = model.generate_content([VISION_PROMPT, image_part])

    if not response.candidates or not response.candidates[0].content.parts:
        raise ValueError("No image in response")
    part = response.candidates[0].content.parts[0]
    if hasattr(part, "inline_data") and part.inline_data:
        return base64.b64encode(part.inline_data.data).decode("utf-8")
    raise ValueError("Response part has no inline_data")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ReLeaf API",
    description="Geospatial heat pipeline + Gemini vision for urban heat resilience.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VisionRequest(BaseModel):
    image_base64: str


class VisionResponse(BaseModel):
    image_base64: str


@app.get("/")
def root():
    return {"service": "ReLeaf Backend", "docs": "/docs"}


HEAT_OVERLAY_PATH = Path(__file__).resolve().parent / "data" / "heat_overlay.png"


@app.get("/heat-overlay")
def heat_overlay():
    """
    Optional: serve a transparent PNG overlay (Red=Hot, Transparent=Cool)
    from Sentinel Hub. Place at backend/data/heat_overlay.png.
    """
    if HEAT_OVERLAY_PATH.is_file():
        return FileResponse(HEAT_OVERLAY_PATH, media_type="image/png")
    raise HTTPException(status_code=404, detail="heat_overlay.png not found")


@app.get("/heatmap/{lat}/{lon}")
def heatmap(lat: float, lon: float):
    """
    Sample LST at (lat, lon). Returns Celsius.
    Hackathon fallback: if no GeoTIFF, returns a demo value for Vancouver area.
    """
    value = sample_heat_at(lat, lon)
    if value is not None:
        return {"lat": lat, "lon": lon, "temperature_c": round(value, 2), "source": "geotiff"}
    return {"lat": lat, "lon": lon, "temperature_c": 28.5, "source": "demo"}


@app.post("/generate-vision", response_model=VisionResponse)
def generate_vision(body: VisionRequest):
    """Accept base64 screenshot; return base64 of Gemini-generated future city image."""
    try:
        out_b64 = generate_future_city_image(body.image_base64)
        return VisionResponse(image_base64=out_b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
