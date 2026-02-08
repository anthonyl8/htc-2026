"""
Heatmap controller — endpoints for satellite temperature data.
"""

from fastapi import APIRouter, Query

from services.satellite import satellite_service

router = APIRouter(prefix="/heatmap", tags=["Heatmap"])


@router.get("/temperature")
async def get_temperature(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Get Land Surface Temperature at a specific coordinate."""
    return satellite_service.get_temperature_at(lat, lon)


@router.get("/bounds")
async def get_bounds():
    """Get the geographic bounds of the available heat data."""
    bounds = satellite_service.get_bounds()
    if bounds is None:
        return {"error": "No heat map data loaded"}
    return bounds


@router.get("/grid")
async def get_heatmap_grid(
    resolution: int = Query(50, ge=10, le=200, description="Grid resolution (NxN)"),
):
    """
    Get a grid of temperature values for the heatmap overlay.
    Returns an array of {lat, lon, temperature_c, intensity} objects.
    """
    return satellite_service.get_heatmap_grid(resolution)
