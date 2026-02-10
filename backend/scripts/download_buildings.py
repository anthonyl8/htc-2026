#!/usr/bin/env python3
"""
Download building footprints for Vancouver using OpenStreetMap.

Prerequisites:
    pip install osmnx

Usage:
    python backend/scripts/download_buildings.py
"""

import osmnx as ox
import json
from pathlib import Path

def main():
    print("🏢 Downloading Vancouver building footprints from OpenStreetMap...")
    
    try:
        # Download buildings
        buildings = ox.features_from_place(
            "Vancouver, British Columbia, Canada",
            tags={'building': True}
        )
        
        print(f"   Found {len(buildings)} buildings")
        
        # Convert to GeoJSON
        buildings_geojson = json.loads(buildings.to_json())
        
        # Save
        output_path = Path(__file__).parent.parent / 'data' / 'vancouver_buildings.geojson'
        output_path.parent.mkdir(exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(buildings_geojson, f, indent=2)
        
        print(f"✅ Saved to: {output_path}")
        print(f"   Total buildings: {len(buildings)}")
        
        # Stats
        building_types = buildings['building'].value_counts()
        print(f"\n📊 Building Types:")
        for btype, count in building_types.head(5).items():
            print(f"   - {btype}: {count}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Install: pip install osmnx")
        print("   2. Check internet connection")
        print("   3. OSM might be down (retry later)")

if __name__ == "__main__":
    main()
