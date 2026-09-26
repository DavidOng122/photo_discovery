import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { generateRecommendations } from "@/lib/ai/generateRecommendations";

function toFeatureType(category?: string): "culture" | "style" | "atmosphere" {
  switch (category) {
    case "Culture":
      return "culture";
    case "Architecture":
      return "style";
    case "History":
      return "culture";
    case "Nature":
      return "atmosphere";
    case "Local Life":
      return "atmosphere";
    default:
      return "style";
  }
}

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

    const existingResult = await loadCompletedRecommendations(supabase, walkId, user.id);

    if (walk.status === "COMPLETED") {
      if (existingResult && existingResult.places.length >= 3 && existingResult.places.length <= 5) {
        return NextResponse.json(existingResult);
      }
      return NextResponse.json({ error: { code: "PERSISTENCE_INCONSISTENT", message: "Walk is completed but places are missing or incomplete." } }, { status: 500 });
    }

    if (walk.status !== "RECOMMENDING") {
      return NextResponse.json({ error: { code: "INVALID_WALK_STATE", message: "Walk is not in RECOMMENDING state" } }, { status: 400 });
    }

    if (existingResult) {
      return NextResponse.json({ error: { code: "PERSISTENCE_FAILED", message: "Orphaned recommendation set found for RECOMMENDING walk." } }, { status: 500 });
    }

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

    const { data: userWalks } = await supabase
      .from("walks")
      .select("id")
      .eq("user_id", user.id);

    let previousPlaceNames: string[] = [];
    if (userWalks && userWalks.length > 0) {
      const walkIds = userWalks.map((w: any) => w.id);
      const { data: userSets } = await supabase
        .from("recommendation_sets")
        .select("id")
        .in("walk_id", walkIds);

      if (userSets && userSets.length > 0) {
        const setIds = userSets.map((s: any) => s.id);
        const { data: previousPlaces } = await supabase
          .from("recommended_places")
          .select("name")
          .in("recommendation_set_id", setIds);

        if (previousPlaces) {
          previousPlaceNames = previousPlaces.map((p: any) => p.name);
        }
      }
    }

    const { data: savedPlaces } = await supabase
      .from("saved_places")
      .select("name")
      .eq("user_id", user.id);

    const excludedNames: string[] = [
      ...previousPlaceNames,
      ...(savedPlaces?.map((p: any) => p.name) ?? []),
    ];

    const selectedFeatures = selectedTags.map((tag: any) => ({
      label: tag.label,
      type: toFeatureType(tag.category),
      reason: tag.reason ?? "選択した特徴に基づくおすすめです。",
    }));

    let recommendationOutput;
    try {
      recommendationOutput = await generateRecommendations({
        selectedFeatures,
        selectedTags: selectedTags.map((tag: any) => ({
          label: tag.label,
          category: tag.category,
          reason: tag.reason,
        })),
        currentCity: walk.location ?? "Tokyo",
        originalLocation: walk.location,
        excludedPlaceNames: excludedNames,
        outputLanguage: "ja",
      });
    } catch (err: any) {
      console.error("AI recommendation failed:", err);
      return NextResponse.json({ error: { code: "AI_RECOMMENDATION_FAILED", message: "おすすめ場所を見つけられませんでした。" } }, { status: 500 });
    }

    const placesPayload = recommendationOutput.places.map((p) => ({
      name: p.name,
      area: p.area ?? null,
      description: p.reason,
      imageUrl: p.imageUrl ?? null,
      googleMapsQuery: p.googleMapsQuery,
      matchedTags: p.matchedFeatures,
    }));

    const { error: rpcErr } = await supabase.rpc("save_walk_recommendations", {
      p_walk_id: walkId,
      p_search_query: `feature:${selectedFeatures.map((f) => f.label).join(",")}`,
      p_search_provider: "none",
      p_ai_provider: process.env.RECOMMENDATION_PROVIDER || process.env.AI_PROVIDER || "qwen",
      p_places: placesPayload,
    });

    if (rpcErr) {
      console.error("save_walk_recommendations RPC error:", rpcErr);
      return NextResponse.json({ error: { code: "PERSISTENCE_FAILED", message: "おすすめ場所を保存できませんでした。" } }, { status: 500 });
    }

    const freshResult = await loadCompletedRecommendations(supabase, walkId, user.id);
    return NextResponse.json(freshResult ?? { walkId, status: "COMPLETED", places: [] });
  } catch (err: any) {
    console.error("Unhandled error in /recommend:", err);
    return NextResponse.json({ error: { code: "RECOMMENDATION_FAILED", message: "おすすめ場所を見つけられませんでした。" } }, { status: 500 });
  }
}

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
