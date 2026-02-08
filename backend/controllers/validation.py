"""
Validation controller — check if interventions can be placed at locations.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from services.validation import validation_service

router = APIRouter(prefix="/validation", tags=["Validation"])


class ValidationRequest(BaseModel):
    type: str  # tree | cool_roof | bio_swale
    lat: float
    lon: float


@router.post("/check")
async def validate_location(request: ValidationRequest):
    """
    Validate if an intervention can be placed at this location.
    Uses OpenStreetMap data to check land use, buildings, etc.
    """
    result = await validation_service.validate_intervention(
        request.type, request.lat, request.lon
    )
    return result
