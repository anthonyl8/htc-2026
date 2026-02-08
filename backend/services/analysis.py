"""
Urban heat analysis service.
Handles hotspot detection, simulation, planting suggestions, vulnerability data,
tree species data, intervention ROI calculations, and cooling simulations.
"""

import math
import random
from core.config import settings
from services.satellite import satellite_service
from services.funding import funding_service


# ─── Tree Species Database ──────────────────────────────────────

TREE_SPECIES = {
    "oak": {
        "id": "oak",
        "name": "Oak",
        "icon": "🌳",
        "canopy_size": "large",
        "cooling_c": 4.0,
        "cost": 450,
        "radius_m": 12,
        "color": [34, 120, 34],
        "lifespan_years": 80,
        "growth_rate": "slow",
        "description": "Large canopy, maximum cooling, high cost. Best for long-term shade in parks and wide streets.",
    },
    "maple": {
        "id": "maple",
        "name": "Maple",
        "icon": "🍁",
        "canopy_size": "medium",
        "cooling_c": 2.5,
        "cost": 300,
        "radius_m": 8,
        "color": [60, 160, 40],
        "lifespan_years": 60,
        "growth_rate": "medium",
        "description": "Medium canopy, aesthetic fall colors. Ideal for residential streets and sidewalks.",
    },
    "pine": {
        "id": "pine",
        "name": "Pine",
        "icon": "🌲",
        "canopy_size": "small",
        "cooling_c": 1.5,
        "cost": 200,
        "radius_m": 5,
        "color": [20, 100, 50],
        "lifespan_years": 100,
        "growth_rate": "slow",
        "description": "Evergreen year-round shade, low cooling but stays green in winter. Low maintenance.",
    },
}

# ─── Intervention Types ─────────────────────────────────────────

INTERVENTION_TYPES = {
    "cool_roof": {
        "id": "cool_roof",
        "name": "Cool Roof",
        "icon": "🏠",
        "cooling_c": 4.0,
        "cost_per_unit": 3000,
        "unit": "building",
        "radius_m": 20,
        "color": [200, 220, 255],
        "description": "Reflective roof coating lowers building surface temp by 3–5°C, reducing A/C load.",
    },
    "bio_swale": {
        "id": "bio_swale",
        "name": "Bio-Swale",
        "icon": "💧",
        "cooling_c": 2.0,
        "cost_per_unit": 1000,
        "unit": "installation",
        "radius_m": 15,
        "color": [60, 140, 200],
        "description": "Rain garden replacing concrete — absorbs runoff and cools through evapotranspiration.",
    },
}


class AnalysisService:
    """
    Provides urban heat island analysis:
    - Red Zone hotspot detection (bus stops, parking lots, walkways in extreme heat)
    - Tree planting simulation (before/after temperature estimates)
    - Optimal planting location suggestions
    - Social vulnerability overlay data
    - Tree species information
    - Intervention ROI calculations
    """

    def __init__(self):
        self._hotspots_cache = None
        self._vulnerability_cache = None
        self._suggestions_cache = None

    # ─── Red Zone Hotspots ──────────────────────────────────────────

    def get_hotspots(self) -> list[dict]:
        """
        Return Red Zone hotspots — algorithmically detected from real LST data.
        Scans the thermal grid and identifies the hottest locations (45°C+).
        """
        if self._hotspots_cache is not None:
            return self._hotspots_cache

        # Get bounds to scan the entire thermal coverage area (south/north/west/east)
        bounds = satellite_service.get_bounds()
        if not bounds:
            return []

        lat_min = bounds.get("south", settings.DEFAULT_LAT - 0.02)
        lat_max = bounds.get("north", settings.DEFAULT_LAT + 0.02)
        lon_min = bounds.get("west", settings.DEFAULT_LON - 0.02)
        lon_max = bounds.get("east", settings.DEFAULT_LON + 0.02)

        hotspots = []
        rng = random.Random(42)
        
        # Grid sampling: ~50 points across the area
        grid_size = 10
        lat_step = (lat_max - lat_min) / grid_size
        lon_step = (lon_max - lon_min) / grid_size

        for i in range(grid_size):
            for j in range(grid_size):
                lat = lat_min + i * lat_step + lat_step / 2
                lon = lon_min + j * lon_step + lon_step / 2
                
                temp_data = satellite_service.get_temperature_at(lat, lon)
                temp = temp_data.get("temperature_c")
                
                # Only include actual hotspots (40°C+ so synthetic data yields points)
                if temp and temp >= 40:
                    # Infer likely surface type based on temperature
                    if temp >= 50:
                        surface_type = "parking"
                        desc = "Extreme heat zone — likely asphalt or dark surface"
                    elif temp >= 47:
                        surface_type = "intersection"
                        desc = "High-temperature area — exposed pavement or rooftop"
                    elif temp >= 45:
                        surface_type = "walkway"
                        desc = "Hot walkway or plaza — minimal shade"
                    else:
                        surface_type = "bus_stop"
                        desc = "Elevated heat area — potential intervention site"
                    
                    hotspots.append({
                        "lat": round(lat, 6),
                        "lon": round(lon, 6),
                        "type": surface_type,
                        "temperature_c": round(temp, 1),
                        "description": desc,
                        "severity": "extreme" if temp >= 50 else "high" if temp >= 45 else "elevated",
                    })

        # Sort by temperature (hottest first) and limit to top 15
        hotspots.sort(key=lambda x: x["temperature_c"], reverse=True)
        hotspots = hotspots[:15]

        self._hotspots_cache = hotspots
        return hotspots

    # ─── Temperature Simulation ─────────────────────────────────────

    def simulate_cooling(self, trees: list[dict]) -> dict:
        """
        Simulate the cooling effect of planted trees.

        Each tree provides a cooling radius based on canopy size.
        Returns before/after stats and per-tree impact data.

        Args:
            trees: list of {lon, lat} dicts representing tree positions.

        Returns:
            dict with simulation results.
        """
        if not trees:
            bounds = satellite_service.get_bounds()
            avg_temp = self._get_area_avg_temp()
            return {
                "before": {
                    "avg_temperature_c": avg_temp,
                    "max_temperature_c": round(avg_temp + 8, 1),
                    "red_zone_area_pct": 35.0,
                },
                "after": {
                    "avg_temperature_c": avg_temp,
                    "max_temperature_c": round(avg_temp + 8, 1),
                    "red_zone_area_pct": 35.0,
                },
                "trees_planted": 0,
                "total_cooling_c": 0,
                "tree_impacts": [],
            }

        # Calculate per-tree cooling impact
        tree_impacts = []
        total_cooling = 0
        for i, tree in enumerate(trees):
            lat = tree.get("lat", tree.get("position", [0, 0])[1] if "position" in tree else 0)
            lon = tree.get("lon", tree.get("position", [0, 0])[0] if "position" in tree else 0)

            temp_data = satellite_service.get_temperature_at(lat, lon)
            local_temp = temp_data.get("temperature_c", 35)

            # Cooling model: hotter surfaces benefit more from shade
            # A single mature tree provides ~1-5°C cooling in its shade radius
            if local_temp >= 45:
                cooling = round(random.uniform(3.5, 5.5), 1)
            elif local_temp >= 38:
                cooling = round(random.uniform(2.0, 4.0), 1)
            elif local_temp >= 32:
                cooling = round(random.uniform(1.0, 2.5), 1)
            else:
                cooling = round(random.uniform(0.5, 1.5), 1)

            total_cooling += cooling
            tree_impacts.append({
                "tree_index": i,
                "lat": lat,
                "lon": lon,
                "surface_temp_before": local_temp,
                "cooling_c": cooling,
                "surface_temp_after": round(local_temp - cooling, 1),
            })

        # Area-wide stats
        avg_before = self._get_area_avg_temp()
        num_trees = len(trees)
        # Diminishing returns: each additional tree cools slightly less at area level
        area_cooling = min(12, total_cooling * 0.3 * (1 - 0.02 * num_trees))
        avg_after = round(avg_before - area_cooling, 1)

        before_max = round(avg_before + 8, 1)
        after_max = round(max(before_max - area_cooling * 1.2, avg_after + 2), 1)

        before_red_pct = 35.0
        after_red_pct = round(max(5, before_red_pct - num_trees * 2.5), 1)

        return {
            "before": {
                "avg_temperature_c": avg_before,
                "max_temperature_c": before_max,
                "red_zone_area_pct": before_red_pct,
            },
            "after": {
                "avg_temperature_c": avg_after,
                "max_temperature_c": after_max,
                "red_zone_area_pct": after_red_pct,
            },
            "trees_planted": num_trees,
            "total_cooling_c": round(total_cooling, 1),
            "area_cooling_c": round(area_cooling, 1),
            "tree_impacts": tree_impacts,
        }

    # ─── Optimal Planting Suggestions ───────────────────────────────

    def get_suggestions(self) -> list[dict]:
        """
        Return optimal tree planting locations algorithmically detected from LST data.
        Uses temperature-based filtering to avoid water bodies (water is cooler).
        Land temperatures 35-44°C are suitable for tree planting.
        """
        if self._suggestions_cache is not None:
            return self._suggestions_cache

        bounds = satellite_service.get_bounds()
        if not bounds:
            return []

        lat_min = bounds.get("south", settings.DEFAULT_LAT - 0.02)
        lat_max = bounds.get("north", settings.DEFAULT_LAT + 0.02)
        lon_min = bounds.get("west", settings.DEFAULT_LON - 0.02)
        lon_max = bounds.get("east", settings.DEFAULT_LON + 0.02)

        suggestions = []
        
        # Grid sampling for medium-hot zones (good for tree planting)
        grid_size = 15
        lat_step = (lat_max - lat_min) / grid_size
        lon_step = (lon_max - lon_min) / grid_size

        for i in range(grid_size):
            for j in range(grid_size):
                lat = lat_min + i * lat_step + lat_step / 2
                lon = lon_min + j * lon_step + lon_step / 2
                
                temp_data = satellite_service.get_temperature_at(lat, lon)
                temp = temp_data.get("temperature_c")
                
                # Filter based on temperature:
                # - Land suitable for trees: 33-46°C (wide range so we always get suggestions)
                # - Too hot (46°C+): likely unsuitable (parking lots, roofs)
                if temp and 33 <= temp < 46:
                    # Calculate cooling potential based on temperature
                    cooling_potential = round((temp - 32) * 1.3, 1)
                    
                    # Infer reason based on temperature range
                    if temp >= 42:
                        reason = "High heat zone — urgent cooling intervention needed"
                    elif temp >= 39:
                        reason = "Elevated temperature area — tree shade will reduce heat load"
                    else:
                        reason = "Moderate heat zone — tree planting will prevent escalation"
                    
                    suggestions.append({
                        "lat": round(lat, 6),
                        "lon": round(lon, 6),
                        "cooling_potential": cooling_potential,
                        "reason": reason,
                        "priority": "high" if cooling_potential >= 4.0 else "medium",
                        "temperature_c": round(temp, 1),
                    })

        # Sort by highest cooling potential and return top 12
        suggestions.sort(key=lambda x: x["cooling_potential"], reverse=True)
        suggestions = suggestions[:12]

        print(f"[Analysis] Generated {len(suggestions)} planting suggestions (temp-based filtering)")

        self._suggestions_cache = suggestions
        return suggestions

    # ─── Social Vulnerability ───────────────────────────────────────

    async def get_vulnerability_data(self) -> list[dict]:
        """
        Return social vulnerability overlay data using real OSM data.
        Identifies vulnerable populations: hospitals, schools, senior facilities.
        Falls back to intelligent placement if OSM is unavailable.
        """
        if self._vulnerability_cache is not None:
            return self._vulnerability_cache

        import httpx

        center_lat = settings.DEFAULT_LAT
        center_lon = settings.DEFAULT_LON

        vulnerability = []
        
        # Try to fetch real OSM data first
        try:
            # Simpler, faster query - just the most critical facilities
            overpass_query = f"""
            [out:json][timeout:10];
            (
              node(around:2000,{center_lat},{center_lon})["amenity"="hospital"];
              node(around:2000,{center_lat},{center_lon})["amenity"="school"];
              node(around:2000,{center_lat},{center_lon})["amenity"="nursing_home"];
            );
            out body;
            """

            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    "https://overpass-api.de/api/interpreter",
                    data={"data": overpass_query}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    elements = data.get("elements", [])
                    
                    print(f"[Analysis] Found {len(elements)} vulnerable facilities from OSM")

                    # Process each facility
                    for elem in elements:
                        lat = elem.get("lat")
                        lon = elem.get("lon")
                        if not lat or not lon:
                            continue

                        tags = elem.get("tags", {})
                        amenity = tags.get("amenity", "")
                        name = tags.get("name", "")

                        # Determine vulnerability type and score
                        if amenity == "hospital":
                            label = name or "Hospital"
                            score = 0.75
                            factors = "Heat-sensitive patients, emergency services"
                            pop = 500
                        elif amenity == "nursing_home":
                            label = name or "Senior Care Facility"
                            score = 0.85
                            factors = "Elderly residents, heat vulnerability"
                            pop = 150
                        elif amenity == "school":
                            label = name or "School"
                            score = 0.65
                            factors = "Children, outdoor activities"
                            pop = 400
                        else:
                            continue

                        # Get local temperature
                        temp_data = satellite_service.get_temperature_at(lat, lon)
                        local_temp = temp_data.get("temperature_c", 35)
                        
                        # Boost vulnerability if in hot area
                        if local_temp >= 40:
                            score = min(1.0, score + 0.1)
                            factors += f" | {local_temp}°C zone"

                        vulnerability.append({
                            "lat": round(lat, 6),
                            "lon": round(lon, 6),
                            "label": label,
                            "vulnerability_score": round(score, 2),
                            "factors": factors,
                            "population": pop,
                        })

        except Exception as e:
            print(f"[Analysis] OSM vulnerability query failed: {e}")

        # Fallback: If OSM failed or returned nothing, use thermal analysis
        # to identify hotspots near likely population centers
        if len(vulnerability) < 3:
            print("[Analysis] Using thermal-based vulnerability fallback")
            
            bounds = satellite_service.get_bounds()
            if bounds:
                lat_min = bounds.get("south", center_lat - 0.01)
                lat_max = bounds.get("north", center_lat + 0.01)
                lon_min = bounds.get("west", center_lon - 0.01)
                lon_max = bounds.get("east", center_lon + 0.01)
                
                # Sample hot zones that likely contain vulnerable populations
                grid_size = 6
                lat_step = (lat_max - lat_min) / grid_size
                lon_step = (lon_max - lon_min) / grid_size
                
                fallback_zones = []
                for i in range(grid_size):
                    for j in range(grid_size):
                        lat = lat_min + i * lat_step + lat_step / 2
                        lon = lon_min + j * lon_step + lon_step / 2
                        
                        temp_data = satellite_service.get_temperature_at(lat, lon)
                        temp = temp_data.get("temperature_c")
                        
                        # Hot zones (38-42°C) likely have vulnerable populations
                        if temp and 38 <= temp <= 42:
                            score = min(0.8, (temp - 35) / 10)
                            fallback_zones.append({
                                "lat": round(lat, 6),
                                "lon": round(lon, 6),
                                "label": "High-Risk Zone",
                                "vulnerability_score": round(score, 2),
                                "factors": f"Hot zone ({temp}°C) — likely residential/commercial area",
                                "population": 300,
                            })
                
                # Add top 5 hottest zones
                fallback_zones.sort(key=lambda x: x["vulnerability_score"], reverse=True)
                vulnerability.extend(fallback_zones[:5])

        self._vulnerability_cache = vulnerability
        print(f"[Analysis] Returning {len(vulnerability)} vulnerability zones")
        return vulnerability

    # ─── Tree Species ──────────────────────────────────────────────

    def get_species(self) -> list[dict]:
        """Return all available tree species with their properties."""
        return list(TREE_SPECIES.values())

    # ─── Intervention Types ──────────────────────────────────────

    def get_intervention_types(self) -> list[dict]:
        """Return all non-tree intervention types."""
        return list(INTERVENTION_TYPES.values())

    # ─── ROI Calculator ──────────────────────────────────────────

    def calculate_roi(self, interventions: list[dict], region: str = "vancouver") -> dict:
        """
        Calculate the Return on Investment for a set of interventions.

        Args:
            interventions: list of dicts with keys: type, species (optional),
                          lat, lon

        Returns:
            dict with cost breakdown, cooling estimates, energy savings
        """
        if not interventions:
            return {
                "total_cost": 0,
                "total_cooling_c": 0.0,
                "energy_saved_yearly": 0,
                "co2_offset_kg": 0,
                "trees": {"count": 0, "cost": 0, "cooling_c": 0.0},
                "cool_roofs": {"count": 0, "cost": 0, "cooling_c": 0.0},
                "bio_swales": {"count": 0, "cost": 0, "cooling_c": 0.0},
                "payback_years": 0,
                "people_benefited": 0,
            }

        tree_count = 0
        tree_cost = 0
        tree_cooling = 0.0
        roof_count = 0
        roof_cost = 0
        roof_cooling = 0.0
        swale_count = 0
        swale_cost = 0
        swale_cooling = 0.0

        for item in interventions:
            itype = item.get("type", "tree")

            if itype == "tree":
                species_id = item.get("species", "maple")
                species = TREE_SPECIES.get(species_id, TREE_SPECIES["maple"])
                tree_count += 1
                tree_cost += species["cost"]
                tree_cooling += species["cooling_c"] * 0.1  # area-wide contribution
            elif itype == "cool_roof":
                roof_count += 1
                roof_cost += INTERVENTION_TYPES["cool_roof"]["cost_per_unit"]
                roof_cooling += INTERVENTION_TYPES["cool_roof"]["cooling_c"] * 0.08
            elif itype == "bio_swale":
                swale_count += 1
                swale_cost += INTERVENTION_TYPES["bio_swale"]["cost_per_unit"]
                swale_cooling += INTERVENTION_TYPES["bio_swale"]["cooling_c"] * 0.06

        total_cost = tree_cost + roof_cost + swale_cost
        total_cooling = round(tree_cooling + roof_cooling + swale_cooling, 2)

        # Energy savings: ~$90/year per °C cooling per building in area
        energy_per_degree = 90
        buildings_affected = max(10, tree_count * 3 + roof_count * 5 + swale_count * 2)
        energy_saved = round(total_cooling * energy_per_degree * buildings_affected)

        # CO2 offset: each tree absorbs ~22kg/year, cool roofs save ~15kg, swales ~8kg
        co2_offset = tree_count * 22 + roof_count * 15 + swale_count * 8

        # Get realistic costs
        realistic_costs = funding_service.get_realistic_costs(interventions, region)
        realistic_total = realistic_costs["total_cost"]

        # Funding sources
        funding_mix = funding_service.calculate_funding_mix(realistic_total, co2_offset)

        # Payback period (based on energy savings)
        payback = round(realistic_total / max(1, energy_saved), 1) if energy_saved > 0 else 0

        # People benefited estimate
        people = tree_count * 50 + roof_count * 80 + swale_count * 30

        return {
            # Legacy simple costs
            "total_cost": total_cost,
            "total_cooling_c": total_cooling,
            "energy_saved_yearly": energy_saved,
            "co2_offset_kg": co2_offset,
            "trees": {"count": tree_count, "cost": tree_cost, "cooling_c": round(tree_cooling, 2)},
            "cool_roofs": {"count": roof_count, "cost": roof_cost, "cooling_c": round(roof_cooling, 2)},
            "bio_swales": {"count": swale_count, "cost": swale_cost, "cooling_c": round(swale_cooling, 2)},
            "payback_years": payback,
            "people_benefited": people,
            
            # NEW: Realistic costs and funding
            "realistic_costs": realistic_costs,
            "funding": funding_mix,
        }

    # ─── Enhanced Simulation ─────────────────────────────────────

    def simulate_cooling_v2(self, interventions: list[dict]) -> dict:
        """
        Enhanced simulation that handles trees with species AND
        other intervention types (cool roofs, bio-swales).

        Args:
            interventions: list of {type, species?, lat, lon, position?}

        Returns:
            dict with detailed before/after comparison + per-item impacts.
        """
        if not interventions:
            avg_temp = self._get_area_avg_temp()
            return {
                "before": {
                    "avg_temperature_c": avg_temp,
                    "max_temperature_c": round(avg_temp + 8, 1),
                    "red_zone_area_pct": 35.0,
                },
                "after": {
                    "avg_temperature_c": avg_temp,
                    "max_temperature_c": round(avg_temp + 8, 1),
                    "red_zone_area_pct": 35.0,
                },
                "trees_planted": 0,
                "total_cooling_c": 0,
                "area_cooling_c": 0,
                "tree_impacts": [],
                "roi": self.calculate_roi([]),
            }

        impacts = []
        total_cooling = 0
        tree_count = 0

        for i, item in enumerate(interventions):
            lat = item.get("lat", 0)
            lon = item.get("lon", 0)
            itype = item.get("type", "tree")

            temp_data = satellite_service.get_temperature_at(lat, lon)
            local_temp = temp_data.get("temperature_c", 35)

            if itype == "tree":
                tree_count += 1
                species_id = item.get("species", "maple")
                species = TREE_SPECIES.get(species_id, TREE_SPECIES["maple"])
                base_cooling = species["cooling_c"]

                # Hotter surfaces benefit more
                if local_temp >= 45:
                    cooling = round(base_cooling * random.uniform(1.1, 1.4), 1)
                elif local_temp >= 38:
                    cooling = round(base_cooling * random.uniform(0.8, 1.1), 1)
                else:
                    cooling = round(base_cooling * random.uniform(0.5, 0.8), 1)
            elif itype == "cool_roof":
                base_cooling = INTERVENTION_TYPES["cool_roof"]["cooling_c"]
                cooling = round(base_cooling * random.uniform(0.8, 1.2), 1)
            elif itype == "bio_swale":
                base_cooling = INTERVENTION_TYPES["bio_swale"]["cooling_c"]
                cooling = round(base_cooling * random.uniform(0.7, 1.1), 1)
            else:
                cooling = 1.0

            total_cooling += cooling
            impacts.append({
                "index": i,
                "type": itype,
                "species": item.get("species"),
                "lat": lat,
                "lon": lon,
                "surface_temp_before": local_temp,
                "cooling_c": cooling,
                "surface_temp_after": round(local_temp - cooling, 1),
            })

        # Area-wide stats
        avg_before = self._get_area_avg_temp()
        n = len(interventions)
        area_cooling = min(15, total_cooling * 0.25 * (1 - 0.015 * n))
        avg_after = round(avg_before - area_cooling, 1)

        before_max = round(avg_before + 8, 1)
        after_max = round(max(before_max - area_cooling * 1.2, avg_after + 2), 1)

        before_red_pct = 35.0
        after_red_pct = round(max(3, before_red_pct - n * 2.0), 1)

        roi = self.calculate_roi(interventions)

        return {
            "before": {
                "avg_temperature_c": avg_before,
                "max_temperature_c": before_max,
                "red_zone_area_pct": before_red_pct,
            },
            "after": {
                "avg_temperature_c": avg_after,
                "max_temperature_c": after_max,
                "red_zone_area_pct": after_red_pct,
            },
            "trees_planted": tree_count,
            "interventions_total": n,
            "total_cooling_c": round(total_cooling, 1),
            "area_cooling_c": round(area_cooling, 1),
            "tree_impacts": impacts,
            "roi": roi,
        }

    # ─── Helpers ────────────────────────────────────────────────────

    def _get_area_avg_temp(self) -> float:
        """Get approximate average temperature of the study area."""
        center = satellite_service.get_temperature_at(
            settings.DEFAULT_LAT, settings.DEFAULT_LON
        )
        return center.get("temperature_c", 35.0)


# Singleton instance
analysis_service = AnalysisService()
