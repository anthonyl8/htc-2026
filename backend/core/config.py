"""
Application configuration loaded from environment variables.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from the backend/ directory (where main.py lives)
_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"
load_dotenv(_env_path, override=True)

# Debug: print loaded keys (first 10 chars only) so you can verify
_gm = os.getenv("GOOGLE_MAPS_API_KEY", "")
_gai = os.getenv("GEMINI_API_KEY", "")
print(f"[Config] .env path: {_env_path} (exists: {_env_path.exists()})")
print(f"[Config] GOOGLE_MAPS_API_KEY: {'SET (' + _gm[:10] + '...)' if _gm else 'NOT SET'}")
print(f"[Config] GEMINI_API_KEY: {'SET (' + _gai[:10] + '...)' if _gai else 'NOT SET'}")


class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    HEATMAP_TIFF_PATH: str = os.getenv("HEATMAP_TIFF_PATH", "data/heat_map.tif")
    DEFAULT_LAT: float = float(os.getenv("DEFAULT_LAT", "49.2827"))
    DEFAULT_LON: float = float(os.getenv("DEFAULT_LON", "-123.1207"))

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
