"""
Vision controller — endpoints for Gemini AI urban vision generation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.gemini import gemini_service


router = APIRouter(prefix="/vision", tags=["Vision"])


class VisionRequest(BaseModel):
    center_lat: float
    center_lon: float
    zoom: int = 17
    tree_count: int = 0
    trees: list[dict] | None = None


@router.post("/generate")
def generate_vision(request: VisionRequest):
    """
    Generate an AI-powered urban vision.
    Fetches a satellite image at the given viewport, then uses Gemini
    to generate a green-transformed version + text analysis.

    Note: This is a sync endpoint (def, not async def) because the
    google-genai SDK and httpx calls are synchronous. FastAPI runs
    this in a threadpool automatically.
    """
    try:
        result = gemini_service.generate_vision(
            center_lat=request.center_lat,
            center_lon=request.center_lon,
            zoom=request.zoom,
            tree_count=request.tree_count,
            trees=request.trees,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Vision generation failed"),
        )

    return result
