import { NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/ai/generateRecommendations";
import { buildGoogleMapsUrl } from "@/lib/maps/buildGoogleMapsUrl";

export async function POST(request: Request) {
  const requestStartedAt = performance.now();

  try {
    const body = await request.json();

    let selectedPhrase = "";
    let reason = "";

    if (body?.discovery?.phrase) {
      selectedPhrase = String(body.discovery.phrase).trim();
      reason = String(body.discovery.explanation || "").trim();
    } else if (body?.discoveryPhrase) {
      selectedPhrase = String(body.discoveryPhrase).trim();
      reason = String(body?.explanation || "").trim();
    } else if (Array.isArray(body?.selectedFeatures) && body.selectedFeatures.length > 0) {
      selectedPhrase = String(body.selectedFeatures[0]?.label || "").trim();
      reason = String(body.selectedFeatures[0]?.reason || "").trim();
    } else if (Array.isArray(body?.selectedTags) && body.selectedTags.length > 0) {
      selectedPhrase = String(body.selectedTags[0]?.label || "").trim();
      reason = String(body.selectedTags[0]?.reason || "").trim();
    }

    if (!selectedPhrase) {
      return NextResponse.json({
        error: { code: "INVALID_INPUT", message: "視点が選択されていません。" },
      }, { status: 400 });
    }

    const currentCity = String(body?.currentCity ?? "Tokyo").trim() || "Tokyo";

    const output = await generateRecommendations({
      selectedDiscovery: {
        phrase: selectedPhrase,
        explanation: reason,
      },
      selectedFeatures: [
        {
          label: selectedPhrase,
          type: "style",
          reason: reason || selectedPhrase,
        },
      ],
      currentCity,
      outputLanguage: "ja",
      excludedPlaceNames: [],
    });

    const response = NextResponse.json({
      places: output.data.places.map((place) => ({
        name: place.name,
        area: place.area ?? null,
        type: "place",
        reason: place.reason,
        matchedFeatures: place.matchedFeatures.length > 0 ? place.matchedFeatures : [selectedPhrase],
        googlePlaceId: place.googlePlaceId ?? null,
        formattedAddress: place.formattedAddress ?? null,
        imageUrl: place.imageUrl ?? null,
        googleMapsUrl: buildGoogleMapsUrl(place.name, place.googleMapsQuery, place.area),
      })),
    });

    response.headers.set("Server-Timing", [
      `model;dur=${Number(output.metadata.model_duration_ms ?? 0)}`,
      `google_places;dur=${Number(output.metadata.google_places_duration_ms ?? 0)}`,
      `total;dur=${Math.round(performance.now() - requestStartedAt)}`,
    ].join(", "));

    return response;
  } catch (error: unknown) {
    console.error("Recommend route error:", error);
    return NextResponse.json({
      error: {
        code: "AI_RECOMMENDATION_FAILED",
        message: "おすすめ場所の生成に失敗しました。もう一度お試しください。",
      },
    }, { status: 500 });
  }
}

