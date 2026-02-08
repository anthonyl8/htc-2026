"""
Urban heat analysis service.
Handles hotspot detection, simulation, planting suggestions, and vulnerability data.
"""

import math
import random
from core.config import settings
from services.satellite import satellite_service


class AnalysisService:
    """
    Provides urban heat island analysis:
    - Red Zone hotspot detection (bus stops, parking lots, walkways in extreme heat)
    - Tree planting simulation (before/after temperature estimates)
    - Optimal planting location suggestions
    - Social vulnerability overlay data
    """

    def __init__(self):
        self._hotspots_cache = None
        self._vulnerability_cache = None
        self._suggestions_cache = None

    # ─── Red Zone Hotspots ──────────────────────────────────────────

    def get_hotspots(self) -> list[dict]:
        """
        Return Red Zone hotspots — locations where infrastructure
        (bus stops, parking lots, walkways) sits in dangerously hot areas.
        Uses synthetic data anchored to the default city center.
        """
        if self._hotspots_cache is not None:
            return self._hotspots_cache

        center_lat = settings.DEFAULT_LAT
        center_lon = settings.DEFAULT_LON

        # Seed for reproducibility per city
        rng = random.Random(42)

        hotspot_templates = [
            # Bus stops along main roads
            {"type": "bus_stop", "dlat": 0.0012, "dlon": 0.0005, "desc": "Exposed bus stop — no shade canopy, south-facing asphalt"},
            {"type": "bus_stop", "dlat": -0.0008, "dlon": 0.0018, "desc": "Transit hub — high pedestrian wait times in direct sun"},
            {"type": "bus_stop", "dlat": 0.0025, "dlon": -0.0010, "desc": "Bus shelter with metal roof — radiates heat"},
            {"type": "bus_stop", "dlat": -0.0018, "dlon": -0.0022, "desc": "Bus stop near school — children exposed during pickup"},
            # Parking lots (large asphalt surfaces)
            {"type": "parking", "dlat": 0.0020, "dlon": 0.0022, "desc": "Open parking lot — 4000m² unshaded asphalt surface"},
            {"type": "parking", "dlat": -0.0025, "dlon": 0.0008, "desc": "Mall parking — dark asphalt, zero tree cover"},
            {"type": "parking", "dlat": 0.0005, "dlon": -0.0030, "desc": "Government building lot — radiates heat into adjacent residential"},
            # Intersections
            {"type": "intersection", "dlat": 0.0000, "dlon": 0.0002, "desc": "Major intersection — long pedestrian wait, high radiant heat"},
            {"type": "intersection", "dlat": 0.0015, "dlon": -0.0018, "desc": "4-way stop — concrete canyon effect amplifies temperature"},
            # Walking paths
            {"type": "walkway", "dlat": -0.0005, "dlon": 0.0012, "desc": "Waterfront walkway — fully exposed, popular with elderly"},
            {"type": "walkway", "dlat": 0.0008, "dlon": -0.0008, "desc": "School route — children walk this path daily in summer heat"},
            {"type": "walkway", "dlat": -0.0015, "dlon": -0.0012, "desc": "Park connector path — no shade for 400m stretch"},
        ]

        hotspots = []
        for h in hotspot_templates:
            lat = center_lat + h["dlat"] + rng.uniform(-0.0002, 0.0002)
            lon = center_lon + h["dlon"] + rng.uniform(-0.0002, 0.0002)
            temp_data = satellite_service.get_temperature_at(lat, lon)
            base_temp = temp_data.get("temperature_c", 38)

            # Hotspots are hotter due to surface type
            type_bonus = {
                "bus_stop": rng.uniform(3, 8),
                "parking": rng.uniform(8, 15),
                "intersection": rng.uniform(4, 9),
                "walkway": rng.uniform(2, 6),
            }.get(h["type"], 4)

            final_temp = round(base_temp + type_bonus, 1)

            hotspots.append({
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "type": h["type"],
                "temperature_c": final_temp,
                "description": h["desc"],
                "severity": "extreme" if final_temp >= 50 else "high" if final_temp >= 45 else "elevated",
            })

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
        Return optimal tree planting locations based on heat analysis.
        These are locations where trees would have the greatest cooling impact.
        """
        if self._suggestions_cache is not None:
            return self._suggestions_cache

        center_lat = settings.DEFAULT_LAT
        center_lon = settings.DEFAULT_LON
        rng = random.Random(99)

        suggestion_templates = [
            {"dlat": 0.0012, "dlon": 0.0005, "reason": "Adjacent to bus stop — shade for transit users", "potential": 4.2},
            {"dlat": 0.0020, "dlon": 0.0022, "reason": "Parking lot perimeter — break up heat island", "potential": 5.8},
            {"dlat": -0.0003, "dlon": 0.0015, "reason": "Pedestrian corridor — high foot traffic area", "potential": 3.5},
            {"dlat": -0.0025, "dlon": 0.0008, "reason": "Mall frontage — shade reduces AC load for building", "potential": 4.9},
            {"dlat": 0.0008, "dlon": -0.0008, "reason": "School walking route — protect children from heat", "potential": 3.8},
            {"dlat": 0.0000, "dlon": -0.0015, "reason": "Residential street — elderly neighborhood, low canopy", "potential": 4.1},
            {"dlat": -0.0012, "dlon": -0.0005, "reason": "South-facing building edge — afternoon heat trap", "potential": 3.2},
            {"dlat": 0.0018, "dlon": -0.0020, "reason": "Park entrance — connects green corridor", "potential": 2.8},
            {"dlat": -0.0008, "dlon": 0.0025, "reason": "Waterfront access path — no existing canopy", "potential": 3.6},
            {"dlat": 0.0030, "dlon": 0.0010, "reason": "Highway buffer zone — reduce heat radiation to homes", "potential": 5.1},
        ]

        suggestions = []
        for s in suggestion_templates:
            lat = center_lat + s["dlat"] + rng.uniform(-0.0001, 0.0001)
            lon = center_lon + s["dlon"] + rng.uniform(-0.0001, 0.0001)
            suggestions.append({
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "cooling_potential": s["potential"],
                "reason": s["reason"],
                "priority": "high" if s["potential"] >= 4.0 else "medium",
            })

        # Sort by highest cooling potential
        suggestions.sort(key=lambda x: x["cooling_potential"], reverse=True)

        self._suggestions_cache = suggestions
        return suggestions

    # ─── Social Vulnerability ───────────────────────────────────────

    def get_vulnerability_data(self) -> list[dict]:
        """
        Return social vulnerability overlay data.
        Identifies neighborhoods with high-risk populations
        (elderly, low-income, lack of AC, medical facilities).
        """
        if self._vulnerability_cache is not None:
            return self._vulnerability_cache

        center_lat = settings.DEFAULT_LAT
        center_lon = settings.DEFAULT_LON

        zones = [
            {
                "dlat": 0.005, "dlon": -0.008,
                "label": "Senior Living Complex",
                "score": 0.85,
                "factors": "65% residents over 65, limited AC access, low tree canopy",
                "population": 1200,
            },
            {
                "dlat": -0.008, "dlon": 0.004,
                "label": "Low-Income Housing",
                "score": 0.78,
                "factors": "Below median income, older buildings, poor insulation",
                "population": 3400,
            },
            {
                "dlat": 0.012, "dlon": 0.010,
                "label": "Children's Hospital Area",
                "score": 0.72,
                "factors": "Pediatric facility, outdoor waiting areas, heat-sensitive patients",
                "population": 800,
            },
            {
                "dlat": -0.003, "dlon": -0.012,
                "label": "Public School District",
                "score": 0.65,
                "factors": "3 schools, outdoor recess, minimal shade structures",
                "population": 2100,
            },
            {
                "dlat": 0.015, "dlon": -0.003,
                "label": "Transit-Dependent Area",
                "score": 0.60,
                "factors": "Low car ownership, relies on bus stops, long outdoor wait times",
                "population": 4500,
            },
            {
                "dlat": -0.010, "dlon": -0.005,
                "label": "Recent Immigrant Community",
                "score": 0.55,
                "factors": "Language barriers for heat warnings, shared housing, limited green space",
                "population": 2800,
            },
            {
                "dlat": 0.002, "dlon": 0.015,
                "label": "Mixed Commercial Zone",
                "score": 0.35,
                "factors": "Outdoor workers, food vendors, delivery routes",
                "population": 1500,
            },
            {
                "dlat": -0.015, "dlon": 0.012,
                "label": "Suburban Residential",
                "score": 0.20,
                "factors": "Higher income, good AC access, moderate canopy",
                "population": 5000,
            },
        ]

        vulnerability = []
        for z in zones:
            vulnerability.append({
                "lat": round(center_lat + z["dlat"], 6),
                "lon": round(center_lon + z["dlon"], 6),
                "label": z["label"],
                "vulnerability_score": z["score"],
                "factors": z["factors"],
                "population": z["population"],
            })

        self._vulnerability_cache = vulnerability
        return vulnerability

    # ─── Helpers ────────────────────────────────────────────────────

    def _get_area_avg_temp(self) -> float:
        """Get approximate average temperature of the study area."""
        center = satellite_service.get_temperature_at(
            settings.DEFAULT_LAT, settings.DEFAULT_LON
        )
        return center.get("temperature_c", 35.0)


# Singleton instance
analysis_service = AnalysisService()
