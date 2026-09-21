import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSearchProvider } from "@/lib/search";
import { buildSearchQuery } from "@/lib/search/buildSearchQuery";
import { generateRecommendations } from "@/lib/ai/generateRecommendations";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ walkId: string }> }
) {
  try {
    const { walkId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const supabase = await createClient();

    // Load walk
    const { data: walk, error: walkErr } = await supabase
      .from("walks")
      .select("id, status, location, user_id")
      .eq("id", walkId)
      .single();

    if (walkErr || !walk) {
      return NextResponse.json({ error: { code: "WALK_NOT_FOUND", message: "Walk not found" } }, { status: 404 });
    }
    if (walk.user_id !== user.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 403 });
    }
    if (walk.status !== "RECOMMENDING") {
      return NextResponse.json({ error: { code: "INVALID_WALK_STATE", message: "Walk is not in RECOMMENDING state" } }, { status: 400 });
    }

    // Load selected tags
    const { data: selectedTags, error: tagsErr } = await supabase
      .from("discovery_tags")
      .select("id, label, category, reason")
      .eq("walk_id", walkId)
      .eq("selected", true);

    if (tagsErr || !selectedTags || selectedTags.length === 0) {
      return NextResponse.json({ error: { code: "INVALID_SELECTED_TAGS", message: "No selected tags found" } }, { status: 400 });
    }
    if (selectedTags.length > 3) {
      return NextResponse.json({ error: { code: "INVALID_SELECTED_TAGS", message: "Too many selected tags" } }, { status: 400 });
    }

    // Load excluded place names from this user's history
    const { data: previousPlaces } = await supabase
      .from("recommended_places")
      .select("name, recommendation_sets!inner(walk_id, walks!inner(user_id))")
      .eq("recommendation_sets.walks.user_id", user.id);

    const { data: savedPlaces } = await supabase
      .from("saved_places")
      .select("name")
      .eq("user_id", user.id);

    const excludedNames: string[] = [
      ...(previousPlaces?.map((p: any) => p.name) ?? []),
      ...(savedPlaces?.map((p: any) => p.name) ?? []),
    ];

    // Build search query and search
    const tagLabels = selectedTags.map((t: any) => t.label);
    const searchQuery = buildSearchQuery(tagLabels, walk.location);
    const searchProvider = getSearchProvider();

    let searchResults;
    try {
      searchResults = await searchProvider.searchPlaces({ query: searchQuery, maxResults: 10 });
    } catch (err) {
      console.error("Tavily search failed:", err);
      return NextResponse.json({ error: { code: "SEARCH_FAILED", message: "おすすめ場所を見つけられませんでした。" } }, { status: 502 });
    }

    // Retry with broader query if insufficient results
    if (searchResults.length < 3) {
      try {
        const broaderQuery = `東京 散歩 街歩き 発見 おすすめ 観光スポット 名所 文化 歴史 自然`;
        searchResults = await searchProvider.searchPlaces({ query: broaderQuery, maxResults: 10 });
      } catch (err) {
        console.error("Broader Tavily search failed:", err);
      }
    }

    if (searchResults.length === 0) {
      return NextResponse.json({ error: { code: "INSUFFICIENT_SEARCH_RESULTS", message: "おすすめ場所を見つけられませんでした。" } }, { status: 502 });
    }

    // Generate recommendations via AI
    let recommendationOutput;
    try {
      recommendationOutput = await generateRecommendations({
        selectedTags: selectedTags.map((t: any) => ({
          label: t.label,
          category: t.category,
          reason: t.reason,
        })),
        originalLocation: walk.location,
        searchResults,
        excludedPlaceNames: excludedNames,
        outputLanguage: "ja",
      });
    } catch (err: any) {
      console.error("AI recommendation failed:", err);
      return NextResponse.json({ error: { code: "AI_RECOMMENDATION_FAILED", message: "おすすめ場所を見つけられませんでした。" } }, { status: 500 });
    }

    // Persist atomically via RPC
    const placesPayload = recommendationOutput.places.map((p) => ({
      name: p.name,
      area: p.area ?? null,
      description: p.description,
      imageUrl: p.imageUrl ?? null,
      googleMapsQuery: p.googleMapsQuery,
      sourceUrl: p.sourceUrl,
      sourceDomain: p.sourceDomain,
      matchedTags: p.matchedTags,
    }));

    const { error: rpcErr } = await supabase.rpc("save_walk_recommendations", {
      p_walk_id: walkId,
      p_search_query: searchQuery,
      p_search_provider: process.env.SEARCH_PROVIDER || "tavily",
      p_ai_provider: process.env.AI_PROVIDER || "openai",
      p_places: placesPayload,
    });

    if (rpcErr) {
      console.error("save_walk_recommendations RPC error:", rpcErr);
      if (rpcErr.message?.includes("already exists")) {
        const existingResult = await loadCompletedRecommendations(supabase, walkId, user.id);
        if (existingResult) return NextResponse.json(existingResult);
      }
      return NextResponse.json({ error: { code: "PERSISTENCE_FAILED", message: "おすすめ場所を保存できませんでした。" } }, { status: 500 });
    }

    // Load the freshly persisted places (to get DB-assigned IDs + save state)
    const freshResult = await loadCompletedRecommendations(supabase, walkId, user.id);
    return NextResponse.json(freshResult ?? { walkId, status: "COMPLETED", places: [] });
  } catch (err: any) {
    console.error("Unhandled error in /recommend:", err);
    return NextResponse.json({ error: { code: "RECOMMENDATION_FAILED", message: "おすすめ場所を見つけられませんでした。" } }, { status: 500 });
  }
}

// Helper: load existing recommendations with save state
async function loadCompletedRecommendations(supabase: any, walkId: string, userId: string) {
  const { data: set } = await supabase
    .from("recommendation_sets")
    .select("id")
    .eq("walk_id", walkId)
    .single();

  if (!set) return null;

  const { data: places } = await supabase
    .from("recommended_places")
    .select("id, name, area, description, image_url, google_maps_query, recommended_place_tags(discovery_tags(label))")
    .eq("recommendation_set_id", set.id);

  if (!places) return null;

  const placeIds = places.map((p: any) => p.id);

  // Load saved state for this user in one query
  const { data: savedRows } = await supabase
    .from("saved_places")
    .select("id, source_recommended_place_id")
    .eq("user_id", userId)
    .in("source_recommended_place_id", placeIds);

  const savedMap = new Map<string, string>();
  for (const row of savedRows ?? []) {
    savedMap.set(row.source_recommended_place_id, row.id);
  }

  return {
    walkId,
    status: "COMPLETED",
    places: places.map((p: any) => ({
      id: p.id,
      name: p.name,
      area: p.area,
      description: p.description,
      imageUrl: p.image_url,
      googleMapsQuery: p.google_maps_query,
      matchedTags: (p.recommended_place_tags ?? []).map((rpt: any) => rpt.discovery_tags?.label).filter(Boolean),
      isSaved: savedMap.has(p.id),
      savedPlaceId: savedMap.get(p.id) ?? null,
    })),
  };
}
