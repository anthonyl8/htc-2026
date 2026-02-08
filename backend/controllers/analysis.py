"""
Analysis controller — endpoints for hotspots, simulation, suggestions, vulnerability,
tree species, intervention types, and ROI calculation.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from services.analysis import analysis_service

router = APIRouter(prefix="/analysis", tags=["Analysis"])


# ─── Request Models ──────────────────────────────────────────────

class TreePosition(BaseModel):
    lat: float = 0
    lon: float = 0
    position: list[float] | None = None


class SimulationRequest(BaseModel):
    trees: list[TreePosition]


class InterventionItem(BaseModel):
    type: str = "tree"          # tree | cool_roof | bio_swale
    species: str | None = None  # oak | maple | pine (for trees)
    lat: float = 0
    lon: float = 0
    position: list[float] | None = None


class SimulateV2Request(BaseModel):
    interventions: list[InterventionItem]


class ROIRequest(BaseModel):
    interventions: list[InterventionItem]


# ─── Data Layer Endpoints ────────────────────────────────────────

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
    Uses temperature-based filtering (water is cooler, excluded automatically).
    """
    return analysis_service.get_suggestions()


@router.get("/vulnerability")
async def get_vulnerability():
    """
    Get social vulnerability overlay data using real OSM data.
    Identifies hospitals, schools, senior facilities, and community centers.
    """
    return await analysis_service.get_vulnerability_data()


# ─── Species & Intervention Types ────────────────────────────────

@router.get("/species")
async def get_species():
    """Get all available tree species with their cooling properties."""
    return analysis_service.get_species()


@router.get("/interventions")
async def get_intervention_types():
    """Get non-tree intervention types (cool roof, bio-swale)."""
    return analysis_service.get_intervention_types()


# ─── Simulation ──────────────────────────────────────────────────

@router.post("/simulate")
async def simulate_cooling(request: SimulationRequest):
    """
    Legacy: Simulate the cooling effect of planted trees.
    Returns before/after temperature comparisons and per-tree impact.
    """
    trees_dicts = []
    for t in request.trees:
        if t.position and len(t.position) >= 2:
            trees_dicts.append({"lon": t.position[0], "lat": t.position[1]})
        else:
            trees_dicts.append({"lat": t.lat, "lon": t.lon})
    return analysis_service.simulate_cooling(trees_dicts)


@router.post("/simulate-v2")
async def simulate_cooling_v2(request: SimulateV2Request):
    """
    Enhanced simulation handling all intervention types.
    Returns before/after comparison, per-item impacts, and ROI data.
    """
    items = []
    for item in request.interventions:
        d = {"type": item.type, "species": item.species}
        if item.position and len(item.position) >= 2:
            d["lon"] = item.position[0]
            d["lat"] = item.position[1]
        else:
            d["lat"] = item.lat
            d["lon"] = item.lon
        items.append(d)
    return analysis_service.simulate_cooling_v2(items)


# ─── ROI ─────────────────────────────────────────────────────────

@router.post("/roi")
async def calculate_roi(request: ROIRequest):
    """
    Calculate Return on Investment for a set of interventions.
    Returns cost breakdown, energy savings, and payback period.
    """
    items = []
    for item in request.interventions:
        d = {"type": item.type, "species": item.species}
        if item.position and len(item.position) >= 2:
            d["lon"] = item.position[0]
            d["lat"] = item.position[1]
        else:
            d["lat"] = item.lat
            d["lon"] = item.lon
        items.append(d)
    return analysis_service.calculate_roi(items)
