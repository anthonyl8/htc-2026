"""
Gemini AI Vision service.
Uses google-genai SDK for image generation (before/after satellite views)
and text analysis of urban heat islands.
"""

import base64
import io
from typing import Optional

import httpx
from PIL import Image

from google import genai
from google.genai import types

from core.config import settings


# Models to try for image generation (in order of preference)
IMAGE_GEN_MODELS = [
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.0-flash-exp-image-generation",
    "gemini-2.0-flash-exp",
]
TEXT_MODEL = "gemini-2.0-flash"


class GeminiService:
    """Generates AI urban visions: satellite image editing + text analysis."""

    def __init__(self):
        self.client = None

    def _ensure_client(self):
        if self.client is None:
            if not settings.GEMINI_API_KEY:
                raise ValueError(
                    "GEMINI_API_KEY is not set. Please set it in your .env file."
                )
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate_vision(
        self,
        center_lat: float,
        center_lon: float,
        zoom: int,
        tree_count: int = 0,
        trees: Optional[list] = None,
    ) -> dict:
        """
        Main entry: fetch satellite image, generate AI-modified version + analysis.

        Returns dict with:
        - before_image: base64 satellite image from Google Static Maps
        - after_image: base64 AI-generated modified image (or None)
        - analysis: text analysis from Gemini
        """
        self._ensure_client()

        # 1. Fetch satellite image from Google Maps Static API
        before_bytes = self._fetch_static_map(center_lat, center_lon, zoom)
        before_b64 = base64.b64encode(before_bytes).decode()
        before_image = Image.open(io.BytesIO(before_bytes))

        # 2. Try image generation (before → after)
        after_b64 = None
        analysis_text = ""
        image_gen_error = None

        edit_prompt = self._image_edit_prompt(tree_count)

        for model_name in IMAGE_GEN_MODELS:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=[edit_prompt, before_image],
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE", "TEXT"],
                    ),
                )

                # Extract image and text from response
                for part in response.candidates[0].content.parts:
                    if part.inline_data is not None:
                        after_b64 = base64.b64encode(part.inline_data.data).decode()
                    if part.text is not None:
                        analysis_text += part.text

                if after_b64:
                    break  # Success — stop trying other models

            except Exception as e:
                image_gen_error = f"{model_name}: {str(e)}"
                continue

        # 3. If image gen failed, fall back to text-only analysis
        if not analysis_text:
            try:
                text_response = self.client.models.generate_content(
                    model=TEXT_MODEL,
                    contents=[self._text_analysis_prompt(tree_count), before_image],
                )
                analysis_text = text_response.text
            except Exception as e:
                analysis_text = f"Analysis unavailable: {str(e)}"

        return {
            "success": True,
            "before_image": before_b64,
            "after_image": after_b64,
            "analysis": analysis_text,
            "tree_count": tree_count,
            "image_gen_error": image_gen_error if not after_b64 else None,
        }

    def _fetch_static_map(
        self, lat: float, lon: float, zoom: int, size: str = "640x640"
    ) -> bytes:
        """Fetch a satellite image from Google Maps Static API."""
        if not settings.GOOGLE_MAPS_API_KEY:
            raise ValueError(
                "GOOGLE_MAPS_API_KEY is not set. Needed for satellite imagery."
            )

        url = (
            f"https://maps.googleapis.com/maps/api/staticmap"
            f"?center={lat},{lon}"
            f"&zoom={zoom}"
            f"&size={size}"
            f"&maptype=satellite"
            f"&key={settings.GOOGLE_MAPS_API_KEY}"
        )

        with httpx.Client(timeout=15) as client:
            r = client.get(url)
            r.raise_for_status()
            return r.content

    def _image_edit_prompt(self, tree_count: int) -> str:
        tree_note = ""
        if tree_count > 0:
            tree_note = (
                f" The urban planner has marked {tree_count} locations for new trees. "
                "Emphasize dense, mature tree canopy coverage throughout the image."
            )

        return (
            "You are an expert urban designer. This is a satellite image of a city. "
            "Transform this exact image into a greener, cooler version of the same area. "
            "Keep all building footprints, road geometry, and infrastructure exactly the same. "
            "Make these specific changes:\n"
            "- Replace dark asphalt parking lots with tree-covered green spaces\n"
            "- Add dense rows of mature trees along all streets and sidewalks\n"
            "- Add green roofs (lush vegetation) on flat-roofed buildings\n"
            "- Convert wide roads into pedestrian-friendly green corridors\n"
            "- Add small pocket parks in open spaces\n"
            f"{tree_note}\n"
            "The result must look photorealistic — like a real satellite photo of an eco-city. "
            "Maintain the same camera angle, lighting, and scale."
        )

    def _text_analysis_prompt(self, tree_count: int) -> str:
        tree_note = ""
        if tree_count > 0:
            tree_note = f" The user has planned {tree_count} new trees in this area."

        return (
            "You are an expert urban planner analyzing a satellite image for heat island mitigation. "
            f"{tree_note}\n\n"
            "Provide a concise analysis:\n"
            "1. **Heat Hotspots**: Identify the most heat-vulnerable areas visible "
            "(dark roofs, parking lots, bare asphalt, sparse vegetation).\n"
            "2. **Cooling Interventions**: Recommend specific, actionable changes — "
            "tree canopy placement, green roofs, cool pavements, shade structures.\n"
            "3. **Estimated Impact**: Estimate the temperature reduction (°C) if implemented.\n"
            "4. **Vision**: Describe what this area would look like after transformation.\n\n"
            "Be specific. Use bullet points. Under 250 words."
        )


# Singleton
gemini_service = GeminiService()
