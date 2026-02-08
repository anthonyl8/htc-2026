"""
Analysis controller — endpoints for hotspots, simulation, suggestions, vulnerability.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from services.analysis import analysis_service

router = APIRouter(prefix="/analysis", tags=["Analysis"])


class TreePosition(BaseModel):
    lat: float = 0
    lon: float = 0
    position: list[float] | None = None


class SimulationRequest(BaseModel):
    trees: list[TreePosition]


@router.get("/hotspots")
async def get_hotspots():
    """
    Get Red Zone hotspots — bus stops, parking lots, walkways
    in dangerously hot areas (45°C+ surface temperatures).
    """
    return analysis_service.get_hotspots()


@router.get("/suggestions")
async def get_suggestions():
    """
    Get optimal tree planting locations ranked by cooling potential.
    """
    return analysis_service.get_suggestions()


@router.get("/vulnerability")
async def get_vulnerability():
    """
    Get social vulnerability overlay data — neighborhoods with
    heat-sensitive populations (elderly, children, low-income).
    """
    return analysis_service.get_vulnerability_data()


@router.post("/simulate")
async def simulate_cooling(request: SimulationRequest):
    """
    Simulate the cooling effect of planted trees.
    Returns before/after temperature comparisons and per-tree impact.
    """
    trees_dicts = []
    for t in request.trees:
        if t.position and len(t.position) >= 2:
            trees_dicts.append({"lon": t.position[0], "lat": t.position[1]})
        else:
            trees_dicts.append({"lat": t.lat, "lon": t.lon})
    return analysis_service.simulate_cooling(trees_dicts)
