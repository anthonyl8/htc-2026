"""
Satellite data processing service.
Handles reading GeoTIFF files and extracting temperature values at coordinates.
"""

import os
import numpy as np

try:
    import rasterio
    from rasterio.transform import rowcol
    from pyproj import Transformer
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False

from core.config import settings


class SatelliteService:
    """Processes Sentinel-2 satellite imagery for heat map data."""

    def __init__(self):
        self.dataset = None
        self.data = None
        self.transformer = None
        self._loaded = False
        self._fallback_mode = False

    def load(self):
        """Load the GeoTIFF file into memory."""
        tiff_path = settings.HEATMAP_TIFF_PATH

        if not RASTERIO_AVAILABLE:
            print("[SatelliteService] rasterio not available, using synthetic data fallback")
            self._fallback_mode = True
            self._loaded = True
            return

        if not os.path.exists(tiff_path):
            print(f"[SatelliteService] WARNING: {tiff_path} not found, using synthetic data fallback")
            self._fallback_mode = True
            self._loaded = True
            return

        try:
            self.dataset = rasterio.open(tiff_path)
            self.data = self.dataset.read(1)  # Read first band

            # Create transformer from WGS84 (lat/lon) to the CRS of the raster
            src_crs = self.dataset.crs
            self.transformer = Transformer.from_crs("EPSG:4326", src_crs, always_xy=True)
            self._loaded = True
            print(f"[SatelliteService] Loaded {tiff_path} ({self.data.shape}), CRS: {src_crs}")
        except Exception as e:
            print(f"[SatelliteService] Error loading TIFF: {e}, using synthetic data fallback")
            self._fallback_mode = True
            self._loaded = True

    def get_temperature_at(self, lat: float, lon: float) -> dict:
        """
        Get the Land Surface Temperature value at a given coordinate.
        Returns a dict with temperature info.
        """
        if not self._loaded:
            self.load()

        if self._fallback_mode:
            return self._synthetic_temperature(lat, lon)

        try:
            # Transform lat/lon to raster CRS
            x, y = self.transformer.transform(lon, lat)

            # Get the pixel row/col from the coordinate
            row, col = rowcol(self.dataset.transform, x, y)

            # Bounds check
            if 0 <= row < self.data.shape[0] and 0 <= col < self.data.shape[1]:
                raw_value = float(self.data[row, col])

                # Convert raw value to Celsius if needed (depends on data source)
                # Sentinel-2 thermal data is often in Kelvin * 100 or direct Celsius
                temperature_c = self._convert_to_celsius(raw_value)

                return {
                    "lat": lat,
                    "lon": lon,
                    "temperature_c": round(temperature_c, 1),
                    "raw_value": raw_value,
                    "source": "sentinel-2",
                }
            else:
                return {
                    "lat": lat,
                    "lon": lon,
                    "temperature_c": None,
                    "error": "Coordinate outside raster bounds",
                    "source": "sentinel-2",
                }
        except Exception as e:
            return {
                "lat": lat,
                "lon": lon,
                "temperature_c": None,
                "error": str(e),
                "source": "sentinel-2",
            }

    def get_bounds(self) -> dict | None:
        """Return the geographic bounds of the loaded raster."""
        if not self._loaded:
            self.load()

        if self._fallback_mode:
            # Return bounds around the default location
            lat, lon = settings.DEFAULT_LAT, settings.DEFAULT_LON
            return {
                "north": lat + 0.05,
                "south": lat - 0.05,
                "east": lon + 0.05,
                "west": lon - 0.05,
            }

        if self.dataset is None:
            return None

        bounds = self.dataset.bounds
        # Transform raster bounds back to WGS84
        inv_transformer = Transformer.from_crs(self.dataset.crs, "EPSG:4326", always_xy=True)
        west, south = inv_transformer.transform(bounds.left, bounds.bottom)
        east, north = inv_transformer.transform(bounds.right, bounds.top)
        return {"north": north, "south": south, "east": east, "west": west}

    def get_heatmap_grid(self, resolution: int = 50) -> list[dict]:
        """
        Generate a grid of temperature values for the heatmap overlay.
        Returns a list of {lat, lon, temperature_c, intensity} dicts.
        """
        if not self._loaded:
            self.load()

        bounds = self.get_bounds()
        if bounds is None:
            return []

        grid = []
        lat_step = (bounds["north"] - bounds["south"]) / resolution
        lon_step = (bounds["east"] - bounds["west"]) / resolution

        for i in range(resolution):
            for j in range(resolution):
                lat = bounds["south"] + i * lat_step
                lon = bounds["west"] + j * lon_step
                result = self.get_temperature_at(lat, lon)
                if result.get("temperature_c") is not None:
                    temp = result["temperature_c"]
                    # Normalize intensity to 0-1 range (25C = 0, 50C = 1)
                    intensity = max(0, min(1, (temp - 25) / 25))
                    grid.append({
                        "lat": lat,
                        "lon": lon,
                        "temperature_c": temp,
                        "intensity": round(intensity, 3),
                    })

        return grid

    def _convert_to_celsius(self, raw_value: float) -> float:
        """
        Convert raw raster value to Celsius.
        Adjust this based on your specific data source.
        """
        # If data is already in Celsius (common for processed LST products)
        if -50 < raw_value < 80:
            return raw_value
        # If data is in Kelvin
        if 200 < raw_value < 400:
            return raw_value - 273.15
        # If data is in Kelvin * 100
        if 20000 < raw_value < 40000:
            return (raw_value / 100) - 273.15
        # Fallback
        return raw_value

    def _synthetic_temperature(self, lat: float, lon: float) -> dict:
        """
        Generate synthetic (fake) temperature data for demo purposes.
        Creates a realistic-looking heat island pattern centered on the default location.
        """
        center_lat = settings.DEFAULT_LAT
        center_lon = settings.DEFAULT_LON

        # Distance from city center (normalized)
        dist = np.sqrt((lat - center_lat) ** 2 + (lon - center_lon) ** 2)

        # Base temperature + heat island effect (hotter near center)
        base_temp = 28.0
        heat_island_effect = max(0, 12 * (1 - dist / 0.05))

        # Add some spatial variation using simple hash
        variation = np.sin(lat * 1000) * np.cos(lon * 1000) * 3

        temperature = base_temp + heat_island_effect + variation

        return {
            "lat": lat,
            "lon": lon,
            "temperature_c": round(float(temperature), 1),
            "raw_value": float(temperature),
            "source": "synthetic",
        }


# Singleton instance
satellite_service = SatelliteService()
