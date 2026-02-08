"""
Realistic funding and cost estimation service.
Regional pricing, grant matching, carbon credits, property value impacts.
"""

from typing import Literal
from core.config import settings
from google import genai

# Regional cost multipliers (relative to baseline)
REGIONAL_COSTS = {
    "vancouver": {
        "tree": 450,  # CAD - higher due to labor costs
        "cool_roof_sqm": 85,  # CAD per square meter
        "bio_swale": 1200,  # CAD
        "labor_multiplier": 1.3,
    },
    "nyc": {
        "tree": 550,  # USD - very high urban costs
        "cool_roof_sqm": 95,
        "bio_swale": 1500,
        "labor_multiplier": 1.5,
    },
    "default": {
        "tree": 350,  # USD baseline
        "cool_roof_sqm": 75,
        "bio_swale": 1000,
        "labor_multiplier": 1.0,
    },
}

# Funding sources available
FUNDING_SOURCES = {
    "municipal_budget": {
        "name": "Municipal Climate Action Fund",
        "match_rate": 0.5,  # City matches 50% of costs
        "max_amount": 500000,
        "description": "City budget allocation for climate adaptation projects",
    },
    "federal_grant": {
        "name": "Federal Infrastructure Grant (Canada)",
        "match_rate": 0.4,  # Federal matches 40%
        "max_amount": 1000000,
        "description": "Investing in Canada Infrastructure Program (ICIP) - Green Infrastructure",
    },
    "carbon_credits": {
        "name": "Carbon Offset Credits",
        "price_per_tonne": 35,  # CAD per tonne CO2
        "description": "Revenue from selling carbon credits on voluntary markets",
    },
    "green_bonds": {
        "name": "Municipal Green Bonds",
        "interest_rate": 0.03,  # 3% annual
        "term_years": 10,
        "description": "Low-interest bonds for sustainability projects",
    },
    "stormwater_credits": {
        "name": "Stormwater Fee Reduction",
        "credit_per_sqm": 8,  # CAD per square meter of green infrastructure
        "description": "Reduced stormwater fees for properties with green infrastructure",
    },
}


class FundingService:
    """Calculate realistic costs and identify funding sources."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    def get_realistic_costs(
        self, interventions: list[dict], region: str = "vancouver"
    ) -> dict:
        """
        Calculate realistic costs based on region and intervention details.
        
        Args:
            interventions: list of {type, species?, lat, lon}
            region: "vancouver" | "nyc" | etc.
        
        Returns:
            dict with itemized costs, labor, materials, permits
        """
        costs = REGIONAL_COSTS.get(region, REGIONAL_COSTS["default"])
        
        tree_cost = 0
        tree_count = 0
        roof_cost = 0
        roof_count = 0
        swale_cost = 0
        swale_count = 0
        
        for item in interventions:
            itype = item.get("type", "tree")
            
            if itype == "tree":
                species = item.get("species", "maple")
                # Species-specific pricing
                base = costs["tree"]
                if species == "oak":
                    tree_cost += base * 1.3  # Larger, more expensive
                elif species == "pine":
                    tree_cost += base * 0.7  # Smaller, cheaper
                else:
                    tree_cost += base
                tree_count += 1
                
            elif itype == "cool_roof":
                # Assume average roof size 200 sqm
                roof_size = 200
                roof_cost += costs["cool_roof_sqm"] * roof_size
                roof_count += 1
                
            elif itype == "bio_swale":
                swale_cost += costs["bio_swale"]
                swale_count += 1
        
        # Add overhead costs
        materials_total = tree_cost + roof_cost + swale_cost
        labor = materials_total * (costs["labor_multiplier"] - 1)
        permits = len(interventions) * 150  # Permit fees per intervention
        design = materials_total * 0.15  # 15% for design/engineering
        contingency = materials_total * 0.1  # 10% contingency
        
        total = materials_total + labor + permits + design + contingency
        
        return {
            "region": region,
            "itemized": {
                "materials": round(materials_total, 2),
                "labor": round(labor, 2),
                "permits": round(permits, 2),
                "design_engineering": round(design, 2),
                "contingency": round(contingency, 2),
            },
            "by_type": {
                "trees": {"count": tree_count, "cost": round(tree_cost, 2)},
                "cool_roofs": {"count": roof_count, "cost": round(roof_cost, 2)},
                "bio_swales": {"count": swale_count, "cost": round(swale_cost, 2)},
            },
            "total_cost": round(total, 2),
        }

    def calculate_funding_mix(self, total_cost: float, co2_offset_kg: float) -> dict:
        """
        Calculate optimal funding mix from available sources.
        
        Returns:
            dict with funding sources, amounts, and net cost to city
        """
        funding_breakdown = []
        remaining = total_cost
        
        # 1. Carbon credits (immediate revenue)
        co2_tonnes = co2_offset_kg / 1000
        carbon_revenue = co2_tonnes * FUNDING_SOURCES["carbon_credits"]["price_per_tonne"]
        funding_breakdown.append({
            "source": "Carbon Offset Credits",
            "type": "revenue",
            "amount": round(carbon_revenue, 2),
            "description": f"{co2_tonnes:.1f} tonnes @ ${FUNDING_SOURCES['carbon_credits']['price_per_tonne']}/tonne",
        })
        remaining -= carbon_revenue
        
        # 2. Federal grant (apply for 40% match, up to max)
        federal_max = FUNDING_SOURCES["federal_grant"]["max_amount"]
        federal_match = min(
            total_cost * FUNDING_SOURCES["federal_grant"]["match_rate"],
            federal_max,
        )
        funding_breakdown.append({
            "source": "Federal Infrastructure Grant",
            "type": "grant",
            "amount": round(federal_match, 2),
            "description": "40% cost-share from ICIP Green Infrastructure",
        })
        remaining -= federal_match
        
        # 3. Municipal match (required for federal grant)
        municipal_max = FUNDING_SOURCES["municipal_budget"]["max_amount"]
        municipal_contribution = min(
            total_cost * FUNDING_SOURCES["municipal_budget"]["match_rate"],
            municipal_max,
            remaining,
        )
        funding_breakdown.append({
            "source": "Municipal Climate Action Fund",
            "type": "budget",
            "amount": round(municipal_contribution, 2),
            "description": "City budget allocation (required co-funding)",
        })
        remaining -= municipal_contribution
        
        # 4. Green bonds for remainder (low-interest loan)
        if remaining > 0:
            bond_amount = remaining
            annual_payment = self._calculate_bond_payment(
                bond_amount,
                FUNDING_SOURCES["green_bonds"]["interest_rate"],
                FUNDING_SOURCES["green_bonds"]["term_years"],
            )
            funding_breakdown.append({
                "source": "Municipal Green Bonds",
                "type": "debt",
                "amount": round(bond_amount, 2),
                "description": f"10-year bond @ 3% = ${round(annual_payment, 2)}/year",
            })
            remaining = 0
        
        return {
            "total_cost": round(total_cost, 2),
            "funding_sources": funding_breakdown,
            "net_city_cost": round(municipal_contribution + (remaining if remaining > 0 else 0), 2),
            "debt_service_annual": round(annual_payment if remaining == 0 else 0, 2),
            "funding_ratio": round((total_cost - remaining) / total_cost, 3) if total_cost > 0 else 0,
        }

    def _calculate_bond_payment(self, principal: float, rate: float, years: int) -> float:
        """Calculate annual payment for bond (amortization)."""
        if rate == 0:
            return principal / years
        return principal * (rate * (1 + rate) ** years) / ((1 + rate) ** years - 1)

    def generate_grant_proposal(self, simulation_data: dict) -> str:
        """
        Generate a professional grant proposal based on simulation metrics.
        Uses Gemini if available, otherwise falls back to a template.
        """
        # Extract metrics
        trees = simulation_data.get("trees_planted", 0)
        temp_reduction = simulation_data.get("area_cooling_c", 0)
        roi_data = simulation_data.get("roi", {})
        cost = roi_data.get("total_cost", 0)
        co2 = roi_data.get("co2_offset_kg", 0)
        energy = roi_data.get("energy_saved_yearly", 0)
        
        # Funding details
        funding = roi_data.get("funding", {})
        grant_amount = 0
        for source in funding.get("funding_sources", []):
            if source["type"] == "grant":
                grant_amount = source["amount"]
                break
        
        # If Gemini is available, use it for a high-quality proposal
        if self.client:
            try:
                prompt = f"""Write a professional 250-word grant application for the 'FEMA Building Resilient Infrastructure and Communities (BRIC)' fund.
                
                PROJECT METRICS:
                - Intervention: Planted {trees} trees and installed green infrastructure in high-heat urban zones.
                - Impact: Reduced neighborhood ambient temperature by {temp_reduction}°C.
                - Environmental: Sequesters {co2} kg of CO2 annually.
                - Economic: Saves residents ${energy}/year in cooling costs.
                - Total Project Cost: ${cost:,.2f}
                - Grant Request: ${grant_amount:,.2f} (matching funds secured from municipal budget).
                
                STRUCTURE:
                1. Executive Summary: Urgent need to address urban heat island effect.
                2. Project Description: Strategic placement of {trees} trees to maximize cooling.
                3. Impact & Benefits: Quantified cooling and economic savings.
                4. Budget & Funding: Request for matching funds to scale the pilot.
                
                Tone: Persuasive, data-driven, bureaucratic but urgent."""
                
                response = self.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                return response.text
            except Exception as e:
                print(f"[FundingService] Gemini grant generation failed: {e}")
                # Fall through to template
        
        # Fallback Template
        return f"""
GRANT APPLICATION: URBAN HEAT RESILIENCE PILOT
To: FEMA Building Resilient Infrastructure and Communities (BRIC)
From: City Planning Department / ReLeaf Pilot Team

1. EXECUTIVE SUMMARY
We request funding to support a critical urban cooling initiative. Our city faces increasing risks from extreme heat events, which disproportionately affect vulnerable populations. This pilot project leverages data-driven "Digital Twin" modeling to target interventions where they are needed most.

2. PROJECT DESCRIPTION
Based on our ReLeaf simulation, we propose the immediate deployment of {trees} climate-resilient trees and associated green infrastructure. Sites have been selected using satellite thermal analysis to maximize cooling potential in identified "Red Zones" (surface temps > 45°C).

3. ANTICIPATED IMPACT
Our modeling predicts significant measurable benefits:
- Temperature Reduction: An estimated drop of {temp_reduction}°C in the target area.
- Carbon Sequestration: Removal of {co2} kg of CO2 annually.
- Economic Relief: Projected energy savings of ${energy}/year for residents due to reduced air conditioning load.

4. BUDGET & FUNDING
Total Project Cost: ${cost:,.2f}
Grant Request: ${grant_amount:,.2f}

The municipality has committed matching funds to cover the remaining balance. This investment will not only lower immediate risks but also provide a scalable framework for city-wide adaptation.

Submitted by ReLeaf Automator.
"""


# Singleton
funding_service = FundingService()
