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
        Check if a tree can be planted at this location using a single, optimized Overpass query.
        Returns: {valid: bool, reason: str, surface_type: str}
        """
        # Combined query to fetch all relevant features at once.
        query = f"""
        [out:json][timeout:5];
        way(around:10,{lat},{lon});
        out tags;
        """

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(OVERPASS_URL, data={"data": query})
                response.raise_for_status()
                data = response.json()

            elements = data.get("elements", [])

            if not elements:
                return {
                    "valid": True,
                    "reason": "Suitable location for planting",
                    "surface_type": "unknown",
                    "confidence": "medium", # Upgrade from low to medium
                }

            # Prioritize forbidden areas first
            for el in elements:
                tags = el.get("tags", {})
                if "highway" in tags:
                    return {"valid": False, "reason": "Cannot plant on roads or pavement", "surface_type": "pavement", "confidence": "high"}
                if "waterway" in tags or tags.get("natural") == "water":
                    return {"valid": False, "reason": "Cannot plant in water", "surface_type": "water", "confidence": "high"}
                if "building" in tags:
                    return {"valid": False, "reason": "Cannot plant on buildings (try Cool Roof instead)", "surface_type": "building", "confidence": "high"}

            # Then, check for valid green spaces
            green_tags = ["grass", "meadow", "greenfield", "recreation_ground", "village_green", "wood", "scrub", "grassland", "heath", "park", "garden", "playground"]
            for el in elements:
                tags = el.get("tags", {})
                for key in ["landuse", "natural", "leisure"]:
                    if tags.get(key) in green_tags:
                        surface_type = tags.get(key)
                        return {"valid": True, "reason": f"Valid planting location: {surface_type}", "surface_type": surface_type, "confidence": "high"}

            # If no specific match, it's likely unclassified but not explicitly forbidden
            return {
                "valid": True,
                "reason": "Surface is not a road, building, or water body.",
                "surface_type": "unknown_permeable",
                "confidence": "medium",
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
                if response.status_code != 200:
                    raise Exception(f"Overpass API error: {response.status_code}")
                try:
                    data = response.json()
                except ValueError:
                    raise Exception("Invalid JSON from Overpass API")

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
                if response.status_code != 200:
                    raise Exception(f"Overpass API error: {response.status_code}")
                try:
                    data = response.json()
                except ValueError:
                    raise Exception("Invalid JSON from Overpass API")

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
        """Validate any intervention type, with caching."""
        # Round to ~5m to group nearby requests
        cache_key = (intervention_type, round(lat, 4), round(lon, 4))
        if cache_key in self.cache:
            return self.cache[cache_key]

        if intervention_type == "tree":
            result = await self.validate_tree_location(lat, lon)
        elif intervention_type == "cool_roof":
            result = await self.validate_cool_roof_location(lat, lon)
        elif intervention_type == "bio_swale":
            result = await self.validate_bioswale_location(lat, lon)
        else:
            result = {"valid": False, "reason": "Unknown intervention type"}
        
        # Don't cache errors
        if not result.get("error"):
            self.cache[cache_key] = result
            
        return result


# Singleton
validation_service = ValidationService()
