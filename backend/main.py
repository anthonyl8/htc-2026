"""
ReLeaf Backend — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from controllers.heatmap import router as heatmap_router
from controllers.vision import router as vision_router
from controllers.analysis import router as analysis_router
from services.satellite import satellite_service

app = FastAPI(
    title="ReLeaf API",
    description="Backend for the ReLeaf urban heat resilience platform.",
    version="1.0.0",
)

# CORS middleware for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route controllers
app.include_router(heatmap_router, prefix="/api")
app.include_router(vision_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")


@app.on_event("startup")
async def startup():
    """Pre-load satellite data on startup."""
    satellite_service.load()


@app.get("/")
async def root():
    return {
        "project": "ReLeaf",
        "tagline": "The Digital Twin for Urban Heat Resilience",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
