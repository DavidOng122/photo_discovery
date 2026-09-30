import { getAIProvider } from "./index";
import { GenerateRecommendationsInput } from "./provider";
import { RecommendationOutputSchema } from "./schemas";
import {
  EnrichedRecommendationOutput,
  enrichPlaceResultsWithGooglePlaces,
} from "@/lib/maps/googlePlaces";


export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<{ data: EnrichedRecommendationOutput; metadata: Record<string, unknown> }> {
  const provider = getAIProvider("recommendation");


  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptStartedAt = performance.now();
    let modelDurationMs = 0;
    let googlePlacesDurationMs = 0;
    let stage = "model";

    try {
      const modelStartedAt = performance.now();
      const raw = await provider.generateRecommendations(input);
      modelDurationMs = Math.round(performance.now() - modelStartedAt);

      stage = "validation";
      const result = RecommendationOutputSchema.parse(raw);

      const selectedLabels = new Set(
        (input.selectedDiscovery?.phrase ? [input.selectedDiscovery.phrase] : [])
        .concat(
          ((input.selectedFeatures && input.selectedFeatures.length > 0)
            ? input.selectedFeatures
            : (input.selectedTags ?? [])
          ).map((feature) => feature.label)
        )
      );

      const names = new Set<string>();
      for (const place of result.places) {
        if (names.has(place.name)) {
          throw new Error(`Duplicate place name: ${place.name}`);
        }
        names.add(place.name);

        if (!place.googleMapsQuery || place.googleMapsQuery.trim().length === 0) {
          place.googleMapsQuery = `${place.name} ${place.area ?? ''} ${input.currentCity ?? 'Tokyo'}`.trim();
        }

        if (selectedLabels.size > 0 && (!place.matchedFeatures || place.matchedFeatures.length === 0)) {
          place.matchedFeatures = [Array.from(selectedLabels)[0]];
        }
      }

      stage = "google_places";
      const googlePlacesStartedAt = performance.now();
      const enrichedResult = await enrichPlaceResultsWithGooglePlaces(result);
      googlePlacesDurationMs = Math.round(performance.now() - googlePlacesStartedAt);

      const durationMs = Math.round(performance.now() - attemptStartedAt);
      const metadata = {
        provider: provider.name,
        model: "recommendation",
        duration_ms: durationMs,
        model_duration_ms: modelDurationMs,
        google_places_duration_ms: googlePlacesDurationMs,
        retry_count: attempt,
        recommendation_version: "2.0",
      };

      console.info("[recommendation_timing]", JSON.stringify({
        provider: provider.name,
        model_ms: modelDurationMs,
        google_places_ms: googlePlacesDurationMs,
        total_ms: durationMs,
        retry_count: attempt,
      }));

      return { data: enrichedResult, metadata };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.warn(`Recommendation attempt ${attempt + 1} failed during ${stage}:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error("Recommendation generation failed after retries");
}
