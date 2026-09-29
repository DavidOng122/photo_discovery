import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { generateRecommendations } from "@/lib/ai/generateRecommendations";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Observation } from "@/lib/ai/schemas";

interface WalkAnalysisRow {
  observations: Observation[];
}

interface PlaceRow {
  id: string;
  name: string;
  area: string | null;
  description: string;
  google_maps_query: string;
  google_place_id: string | null;
  formatted_address: string | null;
  google_photo_reference: string | null;
}

interface SavedRow {
  id: string;
  source_recommended_place_id: string | null;
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
      .select("id, status, location, user_id, recommendation_started_at")
      .eq("id", walkId)
      .single();

    if (walkErr || !walk) {
      return NextResponse.json({ error: { code: "WALK_NOT_FOUND", message: "Walk not found" } }, { status: 404 });
    }
    if (walk.user_id !== user.id) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 403 });
    }

    // Cache hit: walk already completed — return saved recommendations without AI.
    if (walk.status === "COMPLETED") {
      const existingResult = await loadCompletedRecommendations(supabase, walkId, user.id);
      if (existingResult && existingResult.places.length === 3) {
        return NextResponse.json(existingResult);
      }
      return NextResponse.json({ error: { code: "PERSISTENCE_INCONSISTENT", message: "Walk is completed but places are missing." } }, { status: 500 });
    }

    if (walk.status === "TAG_SELECTION" || walk.status === "ANALYZING" || walk.status === "DRAFT") {
      return NextResponse.json({ error: { code: "INVALID_WALK_STATE", message: "Must confirm a discovery first" } }, { status: 400 });
    }

    // Atomically claim recommendation work: only succeeds if started_at is still null.
    // If recommendation_started_at is already set, return 202 so the client polls.
    const { data: claimed, error: claimErr } = await supabase
      .from("walks")
      .update({ recommendation_started_at: new Date().toISOString() })
      .eq("id", walkId)
      .eq("status", "RECOMMENDING")
      .is("recommendation_started_at", null)
      .select("id")
      .single();

    if (claimErr || !claimed) {
      // Another request already claimed it — tell client to poll.
      return NextResponse.json(
        { code: "RECOMMENDATION_IN_PROGRESS", status: "RECOMMENDING", walkId },
        { status: 202 }
      );
    }

    // Fetch observations from walk_analyses (table not in generated types; cast required)
    type AnalysisQuery = { observations: Observation[] } | null;
    const analysisQuery = (supabase as unknown as { from: (t: string) => unknown })
      .from('walk_analyses') as { select: (s: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: AnalysisQuery; error: unknown }> } } };
    const { data: analysisRaw, error: analysisErr } = await analysisQuery
      .select('observations')
      .eq('walk_id', walkId)
      .single();

    if (analysisErr || !analysisRaw) {
      await supabase.from("walks").update({ recommendation_started_at: null }).eq("id", walkId);
      return NextResponse.json({ error: { code: "INVALID_ANALYSIS", message: "Walk analysis not found" } }, { status: 400 });
    }

    const analysisData = analysisRaw as unknown as WalkAnalysisRow;

    // Fetch the confirmed selected discovery
    const { data: selectedTags, error: tagsErr } = await supabase
      .from("discovery_tags")
      .select("id, label, category, reason")
      .eq("walk_id", walkId)
      .eq("selected", true);

    if (tagsErr || !selectedTags || selectedTags.length !== 1) {
      await supabase.from("walks").update({ recommendation_started_at: null }).eq("id", walkId);
      return NextResponse.json({ error: { code: "INVALID_SELECTED_TAGS", message: "Exactly one discovery must be selected" } }, { status: 400 });
    }

    const selectedDiscoveryId = selectedTags[0].id;
    const observations: Observation[] = Array.isArray(analysisData.observations) ? analysisData.observations : [];


    // Build exclusion list from user's past recommendations and saved places
    const { data: userWalks } = await supabase.from("walks").select("id").eq("user_id", user.id);
    let previousPlaceNames: string[] = [];
    if (userWalks && userWalks.length > 0) {
      const walkIds = userWalks.map((w) => w.id);
      const { data: userSets } = await supabase.from("recommendation_sets").select("id").in("walk_id", walkIds);
      if (userSets && userSets.length > 0) {
        const setIds = userSets.map((s) => s.id);
        const { data: previousPlaces } = await supabase.from("recommended_places").select("name").in("recommendation_set_id", setIds);
        if (previousPlaces) previousPlaceNames = previousPlaces.map((p) => p.name);
      }
    }
    const { data: savedPlaces } = await supabase.from("saved_places").select("name").eq("user_id", user.id);
    const excludedNames: string[] = [
      ...previousPlaceNames,
      ...(savedPlaces?.map((p) => p.name) ?? []),
    ];

    // Generate recommendations (Text AI × 1 + Google Places verification)
    let recommendationOutput;
    try {
      recommendationOutput = await generateRecommendations({
        selectedDiscoveryId,
        observations,
        recommendationCity: "Tokyo",
        originalLocation: walk.location,
        excludedPlaceNames: excludedNames,
        outputLanguage: "ja",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error("Recommendation generation failed:", msg);
      await supabase.from("walks").update({ recommendation_started_at: null }).eq("id", walkId);

      // Distinguish Google verification failures from AI failures
      const isGoogleError = msg.includes("Google Places") || msg.includes("verification");
      const code = isGoogleError ? "GOOGLE_PLACE_VERIFICATION_FAILED" : "AI_RECOMMENDATION_FAILED";
      const message = isGoogleError
        ? "おすすめ場所を確認できませんでした。もう一度お試しください。"
        : "おすすめ場所を見つけられませんでした。もう一度お試しください。";
      return NextResponse.json({ error: { code, message } }, { status: 500 });
    }

    const enriched = recommendationOutput.data;
    const metadata = recommendationOutput.metadata;

    const placesPayload = (enriched.places || []).map((p) => ({
      name: p.name,
      area: p.area ?? null,
      description: p.reason,
      google_maps_query: p.googleMapsQuery,
      google_place_id: p.googlePlaceId,
      formatted_address: p.formattedAddress,
      google_photo_reference: p.googlePhotoReference,
    }));

    const { error: rpcErr } = await supabase.rpc("save_walk_recommendations_v2", {
      p_walk_id: walkId,
      p_selected_discovery_id: selectedDiscoveryId,
      p_places: placesPayload,
      p_metadata: JSON.parse(JSON.stringify(metadata)),
    });

    if (rpcErr) {
      console.error("save_walk_recommendations_v2 RPC error:", rpcErr.message);
      await supabase.from("walks").update({ recommendation_started_at: null }).eq("id", walkId);
      return NextResponse.json({ error: { code: "PERSISTENCE_FAILED", message: "おすすめ場所を保存できませんでした。" } }, { status: 500 });
    }

    const freshResult = await loadCompletedRecommendations(supabase, walkId, user.id);
    return NextResponse.json(freshResult ?? { walkId, status: "COMPLETED", places: [] });

  } catch (err: unknown) {
    console.error("Unhandled error in /recommend:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: { code: "RECOMMENDATION_FAILED", message: "おすすめ場所を見つけられませんでした。" } }, { status: 500 });
  }
}

async function loadCompletedRecommendations(
  supabase: SupabaseClient,
  walkId: string,
  userId: string
) {
  const { data: set } = await supabase
    .from("recommendation_sets")
    .select("id")
    .eq("walk_id", walkId)
    .single();

  if (!set) return null;

  const { data: places } = await supabase
    .from("recommended_places")
    .select("id, name, area, description, google_maps_query, google_place_id, formatted_address, google_photo_reference")
    .eq("recommendation_set_id", set.id)
    .order("sort_order", { ascending: true });

  if (!places) return null;

  const placeIds = (places as PlaceRow[]).map((p) => p.id);

  const { data: savedRows } = await supabase
    .from("saved_places")
    .select("id, source_recommended_place_id")
    .eq("user_id", userId)
    .in("source_recommended_place_id", placeIds);

  const savedMap = new Map<string, string>();
  for (const row of (savedRows ?? []) as SavedRow[]) {
    if (row.source_recommended_place_id) {
      savedMap.set(row.source_recommended_place_id, row.id);
    }
  }

  return {
    walkId,
    status: "COMPLETED",
    places: (places as PlaceRow[]).map((p) => ({
      id: p.id,
      name: p.name,
      area: p.area,
      description: p.description,
      imageUrl: p.google_photo_reference ? `/api/recommended-places/${p.id}/image` : null,
      googleMapsQuery: p.google_maps_query,
      googlePlaceId: p.google_place_id,
      formattedAddress: p.formatted_address,
      matchedTags: [], // Not used in V2; preserved for legacy compatibility
      isSaved: savedMap.has(p.id),
      savedPlaceId: savedMap.get(p.id) ?? null,
    })),
  };
}
