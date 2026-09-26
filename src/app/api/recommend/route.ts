import { NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/ai/generateRecommendations";
import { buildGoogleMapsUrl } from "@/lib/maps/buildGoogleMapsUrl";

function validateSelectedFeatures(selectedFeatures: unknown): Array<{ label: string; type: "culture" | "style" | "atmosphere"; reason: string }> {
  if (!Array.isArray(selectedFeatures) || selectedFeatures.length < 1 || selectedFeatures.length > 3) {
    throw new Error("Must select between 1 and 3 features.");
  }

  return selectedFeatures.map((feature: any) => {
    const label = String(feature?.label ?? "").trim();
    const type = feature?.type;
    const reason = String(feature?.reason ?? "").trim();

    if (!label) throw new Error("Each feature requires a label.");
    if (!["culture", "style", "atmosphere"].includes(type)) {
      throw new Error(`Invalid feature type: ${type}`);
    }
    if (!reason) throw new Error(`Feature ${label} requires a reason.`);

    return {
      label,
      type,
      reason,
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const selectedFeatures = validateSelectedFeatures(body?.selectedFeatures);
    const currentCity = String(body?.currentCity ?? "Tokyo").trim() || "Tokyo";
    const originalArea = String(body?.originalArea ?? body?.currentCity ?? "Tokyo").trim() || "Tokyo";

    const output = await generateRecommendations({
      selectedFeatures,
      currentCity,
      originalLocation: originalArea,
      outputLanguage: "ja",
      excludedPlaceNames: [],
    });

    return NextResponse.json({
      places: output.places.map((place) => ({
        name: place.name,
        area: place.area ?? null,
        type: place.type ?? "area",
        reason: place.reason,
        matchedFeatures: place.matchedFeatures,
        googlePlaceId: place.googlePlaceId ?? null,
        formattedAddress: place.formattedAddress ?? null,
        imageUrl: place.imageUrl ?? null,
        googleMapsUrl: buildGoogleMapsUrl(place.name, place.googleMapsQuery, place.area),
      })),
    });
  } catch (error: any) {
    console.error("Recommend route error:", error);
    return NextResponse.json({
      error: { code: "AI_RECOMMENDATION_FAILED", message: error?.message || "おすすめ場所の生成に失敗しました。" },
    }, { status: 500 });
  }
}
