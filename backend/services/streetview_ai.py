"""
Street View AI Transformation Service.
Fetches a Street View image and uses Gemini to add greenery.
"""

import base64
import httpx
from io import BytesIO
from PIL import Image
from google import genai
from google.genai import types
from core.config import settings


class StreetViewAIService:
    """Service for transforming Street View images with AI-generated greenery."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    async def visualize_item(
        self, 
        item_lat: float, 
        item_lng: float, 
        item_type: str,
        species: str = None
    ) -> dict:
        """
        Create a real-life visualization of a specific planted item.
        Fetches Street View near the item and composites it at exact position.

        Args:
            item_lat: Latitude of the planted item
            item_lng: Longitude of the planted item
            item_type: Type of item (tree, cool_roof, bio_swale)
            species: Tree species if item_type is tree

        Returns:
            dict with 'before_image' and 'after_image' as base64 strings
        """
        if not self.client:
            raise ValueError("Gemini API key not configured")

        if not settings.GOOGLE_MAPS_API_KEY:
            raise ValueError("Google Maps API key not configured")

        # Calculate best viewing angle for the item
        # Use a slight offset to get better perspective
        offset_distance = 15  # meters
        offset_lat = item_lat + (offset_distance / 111111)  # ~15m north
        
        # Calculate heading to look at the item
        heading = self._calculate_bearing(offset_lat, item_lng, item_lat, item_lng)

        # Fetch Street View Static image near the item
        try:
            street_view_url = (
                f"https://maps.googleapis.com/maps/api/streetview"
                f"?size=800x600"
                f"&location={offset_lat},{item_lng}"
                f"&heading={heading}"
                f"&pitch=-5"
                f"&fov=90"
                f"&key={settings.GOOGLE_MAPS_API_KEY}"
            )

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(street_view_url)
                
                if response.status_code == 403:
                    raise ValueError(
                        "Street View Static API not enabled. "
                        "Please enable it in Google Cloud Console: "
                        "https://console.cloud.google.com/apis/library/street-view-image-backend.googleapis.com"
                    )
                
                response.raise_for_status()
                before_image_bytes = response.content

            # Convert to PIL Image
            before_image = Image.open(BytesIO(before_image_bytes))
            before_b64 = self._image_to_base64(before_image)

            # Transform with Gemini to add the specific item
            after_b64 = await self._composite_item(before_image, item_type, species)

            return {
                "before_image": before_b64,
                "after_image": after_b64,
                "item_type": item_type,
                "species": species,
            }

        except Exception as e:
            print(f"[StreetViewAI] Error: {e}")
            raise

    async def _composite_item(self, image: Image.Image, item_type: str, species: str = None) -> str:
        """Composite a single planted item at the center of the street view image."""
        
        # Convert PIL Image to bytes
        img_buffer = BytesIO()
        image.save(img_buffer, format="JPEG", quality=95)
        img_bytes = img_buffer.getvalue()

        # Build precise prompt for the specific item
        if item_type == "tree":
            species_name = (species or "maple").title()
            item_description = f"a mature {species_name} tree"
            if species == "oak":
                details = "Large canopy, thick trunk, about 60 feet tall. Full, rounded crown."
            elif species == "pine":
                details = "Tall evergreen, conical shape, about 80 feet tall. Dense needles."
            else:  # maple
                details = "Medium-sized deciduous tree, about 50 feet tall. Full, leafy canopy."
        elif item_type == "cool_roof":
            item_description = "a cool roof coating (reflective white/light gray surface)"
            details = "Visible on the building rooftop - bright, reflective coating."
        elif item_type == "bio_swale":
            item_description = "a bio-swale rain garden"
            details = "Planted depression with native grasses and shrubs, natural drainage area."
        else:
            item_description = "vegetation"
            details = "Natural greenery."
        
        prompt = f"""Add ONLY {item_description} to this street view image at the CENTER of the frame.

ITEM SPECIFICATION:
- Type: {item_type}
- Description: {details}
- Position: Center of the image, at street level (if tree/swale) or on visible rooftop (if cool roof)

CRITICAL INSTRUCTIONS:
1. Add ONLY this ONE {item_type} - absolutely nothing else
2. Place it in the CENTER/FOREGROUND of the frame where it would naturally exist
3. Keep ALL other elements COMPLETELY UNCHANGED (buildings, roads, cars, people, sky, signs)
4. Match existing lighting, shadows, and perspective perfectly
5. Make it look photorealistic and naturally integrated
6. The item should look like it's actually there in real life
7. Do NOT add any other trees, plants, modifications, or embellishments
8. Keep the exact same colors, weather, and atmosphere

This is a precise visualization of ONE {item_type} at this exact location - not a general transformation."""

        try:
            # Use Gemini 2.5 Flash Image for generation with reference image
            # Convert reference image to proper format
            reference_image = types.Part.from_bytes(
                data=img_bytes,
                mime_type="image/jpeg"
            )
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=[reference_image, prompt],
            )

            # Extract generated image from response
            for part in response.parts:
                if part.inline_data is not None:
                    # Get the image data
                    image_data = part.inline_data.data
                    return base64.b64encode(image_data).decode("utf-8")
            
            # If no image found in response, raise error
            raise ValueError("No image generated by Gemini")

        except Exception as e:
            print(f"[StreetViewAI] Gemini transformation failed: {e}")
            raise

    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string."""
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=95)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    def _calculate_bearing(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate bearing from point 1 to point 2."""
        import math
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        lng_diff = math.radians(lng2 - lng1)
        
        x = math.sin(lng_diff) * math.cos(lat2_rad)
        y = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(lng_diff)
        
        bearing = math.degrees(math.atan2(x, y))
        return (bearing + 360) % 360


# Singleton instance
streetview_ai_service = StreetViewAIService()
