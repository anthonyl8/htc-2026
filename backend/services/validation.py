"""
Surface validation service.
Checks if intervention locations are valid:
- Trees: Must be on soil/grass/parks (not pavement/water)
- Cool Roofs: Must be on building footprints
- Bio-Swales: Must be near roads/parking, on permeable surface
"""

import httpx
from typing import Literal

# OpenStreetMap Overpass API
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

class ValidationService:
    """Validates intervention placement using OpenStreetMap data."""

    def __init__(self):
        self.cache = {}

    async def validate_tree_location(self, lat: float, lon: float) -> dict:
        """
        Check if a tree can be planted at this location.
        Returns: {valid: bool, reason: str, surface_type: str}
        """
        # Check land use via Overpass API
        query = f"""
        [out:json][timeout:5];
        (
          way(around:10,{lat},{lon})["landuse"~"grass|meadow|greenfield|recreation_ground|village_green"];
          way(around:10,{lat},{lon})["natural"~"wood|scrub|grassland|heath"];
          way(around:10,{lat},{lon})["leisure"~"park|garden|playground"];
          relation(around:10,{lat},{lon})["landuse"~"grass|meadow"];
        );
        out tags;
        """

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(OVERPASS_URL, data={"data": query})
                data = response.json()

            elements = data.get("elements", [])

            if elements:
                # Found green space
                tags = elements[0].get("tags", {})
                surface_type = tags.get("landuse") or tags.get("natural") or tags.get("leisure", "grass")
                return {
                    "valid": True,
                    "reason": f"Valid planting location: {surface_type}",
                    "surface_type": surface_type,
                    "confidence": "high",
                }

            # No explicit green space found - check for pavement/water
            forbidden_query = f"""
            [out:json][timeout:5];
            (
              way(around:10,{lat},{lon})["highway"];
              way(around:10,{lat},{lon})["waterway"];
              way(around:10,{lat},{lon})["natural"="water"];
              way(around:10,{lat},{lon})["building"];
            );
            out tags;
            """

            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(OVERPASS_URL, data={"data": forbidden_query})
                data = response.json()

            forbidden = data.get("elements", [])

            if forbidden:
                tags = forbidden[0].get("tags", {})
                if "highway" in tags:
                    return {
                        "valid": False,
                        "reason": "Cannot plant on roads or pavement",
                        "surface_type": "pavement",
                        "confidence": "high",
                    }
                elif "waterway" in tags or tags.get("natural") == "water":
                    return {
                        "valid": False,
                        "reason": "Cannot plant in water",
                        "surface_type": "water",
                        "confidence": "high",
                    }
                elif "building" in tags:
                    return {
                        "valid": False,
                        "reason": "Cannot plant on buildings (try Cool Roof instead)",
                        "surface_type": "building",
                        "confidence": "high",
                    }

            # No data - assume valid but low confidence
            return {
                "valid": True,
                "reason": "No OSM data available, assuming valid",
                "surface_type": "unknown",
                "confidence": "low",
            }

        except Exception as e:
            print(f"[Validation] OSM check failed: {e}")
            # Fallback: allow but warn
            return {
                "valid": True,
                "reason": "Validation unavailable (network error)",
                "surface_type": "unknown",
                "confidence": "none",
                "error": str(e),
            }

    async def validate_cool_roof_location(self, lat: float, lon: float) -> dict:
        """Check if a cool roof can be applied here (must be on a building)."""
        query = f"""
        [out:json][timeout:5];
        (
          way(around:15,{lat},{lon})["building"];
          relation(around:15,{lat},{lon})["building"];
        );
        out tags;
        """

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(OVERPASS_URL, data={"data": query})
                data = response.json()

            elements = data.get("elements", [])

            if elements:
                tags = elements[0].get("tags", {})
                building_type = tags.get("building", "yes")
                return {
                    "valid": True,
                    "reason": f"Building found: {building_type}",
                    "building_type": building_type,
                    "confidence": "high",
                }
            else:
                return {
                    "valid": False,
                    "reason": "No building at this location",
                    "building_type": None,
                    "confidence": "high",
                }

        except Exception as e:
            print(f"[Validation] Building check failed: {e}")
            return {
                "valid": True,
                "reason": "Validation unavailable",
                "building_type": "unknown",
                "confidence": "none",
                "error": str(e),
            }

    async def validate_bioswale_location(self, lat: float, lon: float) -> dict:
        """Check if a bio-swale makes sense here (near roads/parking)."""
        query = f"""
        [out:json][timeout:5];
        (
          way(around:25,{lat},{lon})["highway"];
          way(around:25,{lat},{lon})["amenity"="parking"];
        );
        out tags;
        """

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(OVERPASS_URL, data={"data": query})
                data = response.json()

            elements = data.get("elements", [])

            if elements:
                tags = elements[0].get("tags", {})
                near = tags.get("highway") or tags.get("amenity", "road")
                return {
                    "valid": True,
                    "reason": f"Good location near {near} (manages stormwater runoff)",
                    "near_feature": near,
                    "confidence": "high",
                }
            else:
                return {
                    "valid": True,
                    "reason": "No roads nearby, but bio-swale may still be beneficial",
                    "near_feature": None,
                    "confidence": "medium",
                }

        except Exception as e:
            print(f"[Validation] Bio-swale check failed: {e}")
            return {
                "valid": True,
                "reason": "Validation unavailable",
                "near_feature": "unknown",
                "confidence": "none",
                "error": str(e),
            }

    async def validate_intervention(
        self,
        intervention_type: Literal["tree", "cool_roof", "bio_swale"],
        lat: float,
        lon: float,
    ) -> dict:
        """Validate any intervention type."""
        if intervention_type == "tree":
            return await self.validate_tree_location(lat, lon)
        elif intervention_type == "cool_roof":
            return await self.validate_cool_roof_location(lat, lon)
        elif intervention_type == "bio_swale":
            return await self.validate_bioswale_location(lat, lon)
        else:
            return {"valid": False, "reason": "Unknown intervention type"}


# Singleton
validation_service = ValidationService()
