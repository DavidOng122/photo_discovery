# Photo Discovery

Photo Discovery is a lightweight AI-powered app that turns user photos into place recommendations based on shared atmosphere, style, and cultural feel.

The current version is a stateless MVP: users upload photos, the app extracts visual features, they select the most relevant ones, and the app recommends matching places in the current city.

## Overview

This project follows a simple flow:

1. User selects one or more photos
2. The app analyzes the images with Qwen Vision
3. The model extracts transferable features such as culture, style, and atmosphere
4. The user chooses 1–3 features
5. The app calls the recommendation API to generate matching places
6. Results are enriched with Google Places data when available
7. The user sees the recommended places with map links

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Qwen-compatible vision model
- OpenAI for recommendation generation
- Google Places API for enrichment

## Project Structure

```bash
src/
  app/
    api/
      analyze/route.ts
      recommend/route.ts
  components/
    home/
    discovery/
    recommendation/
    upload/
  lib/
    ai/
    maps/
  public/
```

## Local Development

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Example:

```env
QWEN_API_KEY=your_qwen_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-plus

OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=
OPENAI_RECOMMENDATION_MODEL=gpt-4o-mini

GOOGLE_PLACES_API_KEY=your_google_places_key
```

This project does not require Supabase runtime variables for the current MVP flow.

## API Flow

### Analyze photos

```http
POST /api/analyze
```

Request:
- multipart form data
- field: `photos`

Response:

```json
{
  "features": [
    {
      "label": "Historic streets blending with modern life",
      "type": "culture",
      "reason": "The image combines heritage and contemporary urban atmosphere."
    }
  ]
}
```

### Generate recommendations

```http
POST /api/recommend
```

Request body:

```json
{
  "selectedFeatures": [
    {
      "label": "Historic streets blending with modern life",
      "type": "culture",
      "reason": "The image combines heritage and contemporary urban atmosphere."
    }
  ],
  "currentCity": "Tokyo",
  "originalArea": "Yokosuka"
}
```

Response:

```json
{
  "places": [
    {
      "name": "Tokyo Station",
      "area": "Marunouchi",
      "reason": "Matches the historic-meets-modern vibe.",
      "matchedFeatures": ["Historic streets blending with modern life"],
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Tokyo+Station"
    }
  ]
}
```

## Build

```bash
npm run build
```

## Notes

- The app currently runs as a stateless MVP.
- It does not depend on Supabase for the main product flow.
- The recommendation pipeline is intentionally simple and focused on image-to-feature-to-place matching.

## License

This project is for internal or experimental use unless otherwise specified.
