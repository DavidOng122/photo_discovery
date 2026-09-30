# Photo Discovery

Photo Discovery is a mobile-first AI experience that turns a user's photos into new places to explore.

Instead of returning generic object labels, the app analyzes a group of photos as one visual experience, extracts two or three meaningful **discovery phrases**, lets the user choose one, and recommends real places in Tokyo where a similar atmosphere, cultural relationship, or spatial quality can be experienced.

**Live demo:** [photo-discovery-jade.vercel.app](https://photo-discovery-jade.vercel.app/)

## Product Flow

```text
Choose or take 1–10 photos
        ↓
Vision AI analyzes the photos together
        ↓
2–3 discovery phrases are generated
        ↓
The user selects one phrase
        ↓
Text AI recommends three real places in Tokyo
        ↓
Google Places verifies and enriches the results
        ↓
The user explores the result cards and opens Google Maps
```

A discovery phrase describes a transferable experience rather than a visible object. For example:

- `Traditional architecture in harmony with a garden`
- `Everyday scenes where different cultures coexist`
- `Quiet walking spaces shaped by nature`

The interface and generated content are currently Japanese.

## Current Scope

The application is intentionally stateless and focused on one complete discovery session.

Included:

- Camera capture and photo-library selection
- Up to 10 photos per analysis
- Multi-image vision analysis
- AI-generated discovery phrases
- Single-phrase selection
- Calm analysis and recommendation loading animations
- Three place recommendations in Tokyo
- Google Places verification, addresses, and photos when available
- Horizontal, touch-friendly recommendation cards
- Direct Google Maps links
- Responsive mobile layout for approximately 320–430 px viewports

Not included:

- User accounts or authentication
- A database or persistent storage
- Saved places
- Walk history
- Cross-device synchronization
- A desktop-specific layout

Photos, selections, and recommendations are held only for the current browser session. Refreshing the page resets the flow.

## Tech Stack

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/)
- TypeScript
- CSS Modules
- [OpenAI Node SDK](https://github.com/openai/openai-node) for OpenAI-compatible APIs
- Qwen / Alibaba Cloud DashScope for vision and optional text generation
- OpenAI as an optional recommendation provider
- Zod for model-output validation
- Google Places API (New) for place verification and photo enrichment
- Vercel for deployment

No database SDK, authentication SDK, or persistence service is required.

## Architecture

```text
Browser
  └─ MinimalHome state machine
       ├─ upload
       ├─ analyzing
       ├─ perspective-selection
       ├─ recommending
       └─ results
            │
            ├─ POST /api/analyze
            │    └─ Vision provider (Qwen or OpenAI)
            │
            └─ POST /api/recommend
                 ├─ Text provider (Qwen or OpenAI)
                 └─ Google Places enrichment
                      └─ GET /api/places/photo
```

The browser owns the UI state. The API routes are server-side boundaries that keep provider credentials out of the client bundle.

## Repository Structure

```text
src/
  app/
    api/
      analyze/route.ts          # Multi-image vision analysis
      recommend/route.ts        # Place recommendation and enrichment
      places/photo/route.ts     # Server-side Google photo proxy
    globals.css
    layout.tsx
    page.tsx
  components/
    common/                     # Mobile application shell
    discovery/                  # Analysis and phrase-selection screens
    home/                       # Stateless flow controller and home screen
    recommendation/             # Loading, carousel, cards, and Maps CTA
    upload/                     # iOS-style photo action sheet
  lib/
    ai/
      prompts/                  # Analysis and recommendation prompts
      providers/                # Qwen and OpenAI implementations
      schemas.ts                # Zod output contracts
    maps/                       # Google Places and Maps helpers
public/
  figma/                        # UI assets exported from Figma
scripts/
  test-google-places.ts
  test-qwen-vision.ts
  validate-google.ts
```

## Getting Started

### Requirements

- Node.js 20 or newer
- npm
- A Qwen API key and/or an OpenAI API key
- A Google Places API key for verified places and place photos

### Installation

```bash
git clone https://github.com/DavidOng122/photo_discovery.git
cd photo_discovery
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Recommended: Qwen for both stages

```env
VISION_PROVIDER=qwen
RECOMMENDATION_PROVIDER=qwen

QWEN_API_KEY=your_qwen_api_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen-vl-plus
QWEN_TEXT_MODEL=qwen-plus

GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### Optional: OpenAI for recommendations

```env
VISION_PROVIDER=qwen
RECOMMENDATION_PROVIDER=openai

QWEN_API_KEY=your_qwen_api_key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VISION_MODEL=qwen-vl-plus

OPENAI_API_KEY=your_openai_api_key
OPENAI_RECOMMENDATION_MODEL=gpt-4o-mini

GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### Provider behavior

- `VISION_PROVIDER` supports `qwen` or `openai` and defaults to `qwen`.
- `RECOMMENDATION_PROVIDER` supports `qwen` or `openai` and defaults to `openai`.
- `QWEN_RECOMMENDATION_ENABLE_THINKING=true` can enable Qwen thinking when supported by the selected model.
- `GOOGLE_API_KEY` is accepted as a compatibility alias for `GOOGLE_PLACES_API_KEY`.
- `AI_API_KEY`, `AI_BASE_URL`, `AI_VISION_MODEL`, and `AI_TEXT_MODEL` are accepted as compatibility aliases for older local environments.

Never commit `.env.local` or expose provider credentials in browser code.

## API Reference

### Analyze photos

```http
POST /api/analyze
Content-Type: multipart/form-data
```

Form field:

| Field | Type | Description |
| --- | --- | --- |
| `photos` | `File[]` | One or more image files, appended under the same field name |

Example response:

```json
{
  "discoveries": [
    {
      "phrase": "伝統的な日本建築と庭園の調和",
      "explanation": "建築と自然が一体となった静かな空間"
    }
  ],
  "features": [
    {
      "label": "伝統的な日本建築と庭園の調和",
      "type": "style",
      "reason": "建築と自然が一体となった静かな空間"
    }
  ]
}
```

`features` is retained as a compatibility representation. The current UI uses `discoveries`.

### Generate recommendations

```http
POST /api/recommend
Content-Type: application/json
```

Request:

```json
{
  "discovery": {
    "phrase": "伝統的な日本建築と庭園の調和",
    "explanation": "建築と自然が一体となった静かな空間"
  },
  "currentCity": "Tokyo"
}
```

Response:

```json
{
  "places": [
    {
      "name": "小石川後楽園",
      "area": "文京区",
      "type": "place",
      "reason": "池を挟んで築庭の茶室や回遊式庭園が配置され、建築と自然の調和を体験できます。",
      "matchedFeatures": ["伝統的な日本建築と庭園の調和"],
      "googlePlaceId": "google-place-id",
      "formattedAddress": "東京都文京区後楽1丁目6-6",
      "imageUrl": "/api/places/photo?name=places%2F...%2Fphotos%2F...",
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=..."
    }
  ]
}
```

The response includes a `Server-Timing` header for model, Google Places, and total request duration.

### Google place photo proxy

```http
GET /api/places/photo?name={encodedGooglePhotoResourceName}
```

This route keeps the Google API key on the server and redirects the browser to the resolved Google-hosted image.

## AI Output Validation

Model responses are parsed and validated with Zod before they reach the UI.

The analysis stage asks for:

- Exactly two or three focused discovery phrases
- No generic object labels such as “tree,” “building,” or “road”
- One short Japanese explanation per phrase
- Phrases that can be experienced again in another place

The recommendation stage asks for:

- Three real, distinct places in Tokyo
- A short Japanese reason connecting each place to the selected phrase
- A Google Maps search query for every place

The application retries malformed model output once before returning an error.

## Google Places Behavior

When `GOOGLE_PLACES_API_KEY` is configured, the server attempts to:

1. Verify each AI-generated place with Google Places Text Search.
2. Attach a Google Place ID and formatted address.
3. Use the first available place photo through the server-side photo proxy.

If the key is missing or an individual lookup fails, the app keeps the AI recommendation and still creates a Google Maps search link. The card may appear without a place photo.

For production, enable **Places API (New)** and billing in the Google Cloud project, and restrict the key appropriately for the server environment.

## Available Commands

```bash
npm run dev       # Start the local development server
npm run lint      # Run ESLint
npm run build     # Create a production build and run TypeScript checks
npm run start     # Start the production server after building
npx tsc --noEmit  # Run TypeScript validation only
```

## Deployment on Vercel

The project is deployed at [https://photo-discovery-jade.vercel.app/](https://photo-discovery-jade.vercel.app/).

To deploy another environment:

1. Import `DavidOng122/photo_discovery` into Vercel.
2. Keep the framework preset as **Next.js**.
3. Add the required AI and Google environment variables to the Vercel project.
4. Deploy the `main` branch.

No database provisioning, authentication setup, or migration command is required.

## Privacy and Data Lifecycle

- The repository does not persist uploaded photos or generated results.
- Selected files are previewed in the browser and sent to the analysis API for the active request.
- The server converts the files to data URLs in memory before sending them to the configured vision provider.
- The app does not create user profiles, history, or saved-place records.
- AI and Google providers may process request data according to their own service terms and retention policies.

Do not use sensitive or private photos unless the configured third-party provider policies are appropriate for the intended use.

## Known Limitations

- The recommendation city is currently fixed to Tokyo by the product flow.
- Session state is lost after refresh or navigation away from the app.
- There is no upload-progress indicator or persistent recovery.
- The UI is optimized for mobile and intentionally remains a centered mobile canvas on larger screens.
- Place photos depend on Google Places coverage and API availability.

## License

This repository is currently intended for internal, prototype, and demonstration use. Add an explicit license file before distributing or reusing the project publicly.
