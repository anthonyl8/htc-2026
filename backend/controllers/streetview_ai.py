"""
Street View AI controller — endpoint for visualizing individual planted items in real-life context.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.streetview_ai import streetview_ai_service

router = APIRouter(prefix="/streetview-ai", tags=["Street View AI"])


class VisualizeItemRequest(BaseModel):
    item_lat: float
    item_lng: float
    item_type: str  # tree | cool_roof | bio_swale
    species: str | None = None  # For trees


@router.post("/visualize")
async def visualize_item(request: VisualizeItemRequest):
    """
    Generate a real-life visualization of a specific planted item.
    
    Fetches a Street View image near the item's location and uses Gemini AI
    to composite the item at its exact position.
    
    Returns before/after images as base64-encoded JPEGs.
    """
    try:
        result = await streetview_ai_service.visualize_item(
            item_lat=request.item_lat,
            item_lng=request.item_lng,
            item_type=request.item_type,
            species=request.species,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[StreetViewAI Controller] Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Real-life visualization failed: {str(e)}",
        )
