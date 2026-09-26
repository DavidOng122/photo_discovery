# Photo Discovery

Photo Discovery is an AI-powered web application that turns photo walks into new place discoveries. Users upload photos, AI extracts transferable characteristics, and the app recommends nearby places that share the same atmosphere or cultural appeal.

## Tech Stack
- Next.js 16.3 (App Router)
- React 19
- Supabase (PostgreSQL, Auth, Storage)
- Qwen Vision for feature detection
- OpenAI for recommendation generation
- Google Maps links for final navigation
- Vanilla CSS

## Setup & Configuration

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   Required keys:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `VISION_PROVIDER=qwen`, `RECOMMENDATION_PROVIDER=openai`
   - `AI_BASE_URL`, `AI_VISION_MODEL`, `AI_TEXT_MODEL`, `AI_API_KEY`

3. **Supabase Database**
   Link and apply migrations (if using local/remote Supabase):
   ```bash
   npx supabase link --project-ref <your-project-id>
   npx supabase db push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Demo Mode / Seed Data
To populate the database with realistic demo walks (Yokosuka, Yanaka, Nature in the City), you can run the seed script for a specific user ID.

**Run:**
```bash
npx tsx --env-file=.env.local scripts/seed-demo.ts <your_user_id>
```
*Note: Your `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local` to run this script.*

## Architecture & Current Scope
- **Anonymous Authentication:** Users are assigned an anonymous session on arrival. No sign-up required.
- **Feature Detection:** Uploaded photos are analyzed as one walking experience to extract transferable characteristics such as culture, style, and atmosphere.
- **Recommendation Flow:** Selected features are sent to the recommendation model, which finds real places in the user's current city that share the same appeal.
- **Place Verification:** Recommendation results are enriched with Google Maps queries and saved as real recommendation candidates.
- **Immutability:** A completed walk's core tags and recommendations are locked to preserve the original discovery context. Saved places can be toggled independently.
- **V1 Scope:** Current scope does not include ratings, route planning, or social features. Focus is purely on discovery.
