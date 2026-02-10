# ReLeaf: The Digital Twin for Urban Heat Resilience

**[Live Demo](https://releaf-city.vercel.app)** | **[Backend API](https://releaf-backend.onrender.com/docs)**

A 3D interactive platform that lets city planners visualize heat islands and use GenAI to simulate cooling interventions in real-time.

## What is ReLeaf?

ReLeaf is a smart urban planning tool designed to help cities and communities combat the Urban Heat Island (UHI) effect. It combines photorealistic 3D city visualization, real satellite thermal data, and Google's Gemini AI to provide actionable insights for greener, cooler cities.

## Features

- Photorealistic 3D map powered by Google Map Tiles API
- Real land surface temperature data from Sentinel-2 satellite imagery
- Can click to place trees and visualize other cooling interventions
- Click any planted tree or other intervention to fetch the actual Google Street View panorama of that coordinate. Uses Google Gemini to place the intervention into the scene with photorealistic lighting and perspective.
- Can generate a FEMA-compliant grant narrative ready for submission to funding bodies like the BRIC program.
- Click anywhere to see the surface temperature at that point

## Tech Stack

* **Frontend**: React + Vite + Deck.gl 
* **Backend**: Python (FastAPI)
* **Map Base**: Google Map Tiles API (3D)
* **Heat Data**: Sentinel-2 (GeoTIFF / LST)
* **AI Vision**: Google Gemini
* **Other Libraries**: rasterio, numpy, html2canvas

## Basic Usage Flow

Visit [releaf-city.vercel.app](URL).
1. Open the app to see the Heatmap. Hover over "Red Zones" to see surface temperatures >42°C.
2. Select "Plant Tree" from the toolbar. Click on a hotspot.
*Note*: The app will validate your click. You cannot plant on roads, water, or buildings.
3. Open the Simulation Panel to see the immediate temperature drop and ROI.
4. Click your planted tree -> "Real Life View". Wait ~5s for Gemini to hallucinate the tree into the real street view.
5. Click "Generate Grant Proposal" to get a fully written funding application based on your data.
