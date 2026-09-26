import { getAIProvider } from "./index";
import { GenerateRecommendationsInput } from "./provider";
import { RecommendationOutput, RecommendationOutputSchema } from "./schemas";
import { enrichPlaceResultsWithGooglePlaces } from "@/lib/maps/googlePlaces";

export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<RecommendationOutput> {
  const provider = getAIProvider("recommendation");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await provider.generateRecommendations(input);
      const result = RecommendationOutputSchema.parse(raw);

      const selectedLabels = new Set(
        ((input.selectedFeatures && input.selectedFeatures.length > 0)
          ? input.selectedFeatures
          : (input.selectedTags ?? [])
        ).map((feature) => feature.label)
      );

      const names = new Set<string>();
      for (const place of result.places) {
        if (names.has(place.name)) {
          throw new Error(`Duplicate place name: ${place.name}`);
        }
        names.add(place.name);

        if (!place.googleMapsQuery || place.googleMapsQuery.trim().length === 0) {
          throw new Error(`Missing googleMapsQuery for ${place.name}`);
        }

        for (const matchedFeature of place.matchedFeatures) {
          if (!selectedLabels.has(matchedFeature)) {
            throw new Error(`matchedFeature "${matchedFeature}" is not in the selected feature list`);
          }
        }
      }

      const enrichedResult = await enrichPlaceResultsWithGooglePlaces(result);
      return enrichedResult;
    } catch (err: any) {
      console.warn(`Recommendation attempt ${attempt + 1} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Recommendation generation failed after retries");
}
