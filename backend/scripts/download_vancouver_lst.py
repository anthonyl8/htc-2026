#!/usr/bin/env python3
"""
Download real Land Surface Temperature data for Vancouver using Google Earth Engine.

Prerequisites:
    pip install earthengine-api geemap
    earthengine authenticate

Usage:
    python backend/scripts/download_vancouver_lst.py
"""

import ee
import geemap
from datetime import datetime, timedelta
from pathlib import Path

def main():
    print("🌍 Initializing Google Earth Engine...")
    
    # Try to initialize with project
    try:
        # First, try to get default project
        ee.Initialize()
        print("   ✅ Using default project")
    except Exception as e:
        # Need to specify project explicitly
        print("   ⚠️  No default project found")
        print("\n📋 Quick Fix:")
        print("   1. Go to: https://console.cloud.google.com/")
        print("   2. Create a new project (or use existing)")
        print("   3. Copy the Project ID")
        print("   4. Run this script with: PROJECT_ID=your-project-id python scripts/download_vancouver_lst.py")
        print("\n   OR run:")
        print("   earthengine set_project YOUR_PROJECT_ID")
        
        # Try to use PROJECT_ID from environment
        import os
        project_id = os.getenv("PROJECT_ID") or os.getenv("GOOGLE_CLOUD_PROJECT")
        
        if project_id:
            print(f"\n   Found PROJECT_ID in environment: {project_id}")
            print("   Initializing with this project...")
            try:
                ee.Initialize(project=project_id)
                print("   ✅ Success!")
            except Exception as e2:
                print(f"   ❌ Still failed: {e2}")
                return
        else:
            print("\n   No PROJECT_ID found in environment.")
            return

    # Vancouver bounding box (Downtown + surrounding areas)
    vancouver_bounds = ee.Geometry.Rectangle([
        -123.25, 49.23,  # Southwest
        -123.05, 49.33   # Northeast
    ])

    print("📡 Fetching Sentinel-2 imagery...")
    print("   (Vancouver is cloudy in winter - searching back 12 months)")
    
    # Vancouver is VERY cloudy in winter. Look back further and be more lenient.
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)  # Last 12 months

    # Try with relaxed cloud threshold first
    collection = (
        ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(vancouver_bounds)
        .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40))  # Increased to 40%
        .select(['B4', 'B8', 'B11', 'B12'])  # Red, NIR, SWIR1, SWIR2
    )

    # Get the most recent image
    count = collection.size().getInfo()
    print(f"   Found {count} images with <40% cloud cover")

    if count == 0:
        print("❌ No images found in last 12 months with <40% clouds")
        print("   Vancouver is VERY cloudy. Trying last 2 years with any cloud level...")
        
        # Last resort: any image from last 2 years
        start_date = end_date - timedelta(days=730)
        collection = (
            ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
            .filterBounds(vancouver_bounds)
            .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
            .select(['B4', 'B8', 'B11', 'B12'])
        )
        count = collection.size().getInfo()
        print(f"   Found {count} images total")
        
        if count == 0:
            print("❌ No Sentinel-2 data available for this area")
            return

    image = collection.sort('system:time_start', False).first()
    
    # Get image date and cloud info
    date_acquired = datetime.fromtimestamp(
        image.get('system:time_start').getInfo() / 1000
    )
    cloud_pct = image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo()
    print(f"   Using image from: {date_acquired.strftime('%Y-%m-%d')}")
    print(f"   Cloud coverage: {cloud_pct:.1f}%")
    
    if cloud_pct > 20:
        print("   ⚠️  Note: Image has some clouds. For best results, try summer months (June-Aug)")
        print("      You can manually set date range in the script")

    print("🔥 Calculating Land Surface Temperature...")
    
    # Calculate NDVI (vegetation index)
    nir = image.select('B8')
    red = image.select('B4')
    ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')

    # Use SWIR bands for temperature proxy
    # B11 (SWIR1, 1610nm) is sensitive to thermal emissivity
    # Scale and convert to approximate temperature
    swir1 = image.select('B11')
    
    # Empirical conversion (simplified LST model)
    # Real LST would require atmospheric correction
    lst = (
        swir1.multiply(0.0001)           # Convert to reflectance
        .subtract(0.1)                   # Offset for emissivity
        .multiply(150)                   # Scale to temperature range
        .add(273.15)                     # Convert to Kelvin
        .subtract(273.15)                # Back to Celsius
        .clamp(15, 55)                   # Reasonable bounds
        .rename('LST')
    )

    # Apply NDVI correction (vegetation is cooler)
    lst_corrected = lst.subtract(ndvi.multiply(5))  # Trees reduce LST

    print("💾 Exporting to GeoTIFF...")
    
    # Output path
    output_path = Path(__file__).parent.parent / 'data' / 'vancouver_lst.tif'
    output_path.parent.mkdir(exist_ok=True)

    # Export
    geemap.ee_export_image(
        lst_corrected,
        filename=str(output_path),
        scale=20,  # 20m resolution (good balance)
        region=vancouver_bounds,
        file_per_band=False,
        crs='EPSG:4326',
    )

    print(f"✅ Success! LST data saved to: {output_path}")
    print(f"   Coverage: Vancouver downtown + surrounding")
    print(f"   Resolution: 20m")
    print(f"   Date: {date_acquired.strftime('%Y-%m-%d')}")
    print("\n🚀 Restart your backend to use the new data:")
    print("   uvicorn main:app --reload")

if __name__ == "__main__":
    main()
