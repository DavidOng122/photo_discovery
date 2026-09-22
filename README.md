# Photo Discovery

Photo Discovery is an AI-powered web application that turns your photo walks into new destination discoveries. Upload photos from a walk, and the AI will analyze the experience, generate semantic tags, and recommend personalized places for your next adventure.

## Tech Stack
- Next.js 16.3 (App Router, Server Actions, Turbopack)
- React 19
- Supabase (PostgreSQL, Auth, Storage)
- OpenAI (Vision + Text Models)
- Tavily (Semantic Search)
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
   - `AI_PROVIDER`, `AI_VISION_MODEL`, `AI_TEXT_MODEL`, `AI_API_KEY`
   - `SEARCH_PROVIDER=tavily`, `TAVILY_API_KEY`

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
- **Multimodal AI Analysis:** The app groups uploaded photos and sends them to OpenAI Vision as a single prompt to extract themes.
- **Semantic Search:** Selected themes are compiled into a Tavily search query, producing real destinations.
- **Immutability:** A completed Walk's core tags and recommendations are locked to preserve the original discovery context. Saved places can be toggled independently.
- **V1 Scope:** Current scope does not include ratings, travel time, Google Maps API keys (uses external search URLs instead), or social features. Focus is purely on discovery.
