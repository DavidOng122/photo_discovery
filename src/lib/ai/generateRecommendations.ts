import { getAIProvider } from "./index";
import { GenerateRecommendationsInput } from "./provider";
import { RecommendationOutput, RecommendationOutputSchema } from "./schemas";

const VALID_SOURCE_DOMAINS = new Set([
  "wikipedia.org", "wikimedia.org", "jnto.go.jp", "gotokyo.org",
  "city.tokyo.lg.jp", "metro.tokyo.lg.jp", "timeout.com", "tripadvisor.com",
  "lonelyplanet.com", "japantravel.com", "japan-guide.com", "nhk.or.jp",
]);

export async function generateRecommendations(
  input: GenerateRecommendationsInput
): Promise<RecommendationOutput> {
  const provider = getAIProvider();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await provider.generateRecommendations(input);
      const result = RecommendationOutputSchema.parse(raw);

      // Semantic validation
      const names = new Set<string>();
      for (const place of result.places) {
        if (names.has(place.name)) {
          throw new Error(`Duplicate place name: ${place.name}`);
        }
        names.add(place.name);

        // Verify matchedTags are from selected tags
        const selectedTagLabels = new Set(input.selectedTags.map((t) => t.label));
        for (const tag of place.matchedTags) {
          if (!selectedTagLabels.has(tag)) {
            throw new Error(`matchedTag "${tag}" is not a selected Discovery Tag`);
          }
        }

        // Basic Tokyo relevance: googleMapsQuery should reference Tokyo or a known area
        if (!place.googleMapsQuery.includes("東京") &&
            !place.googleMapsQuery.match(/区|市|町|駅/)) {
          console.warn(`Place "${place.name}" may not be Tokyo-specific`);
        }
      }

      return result;
    } catch (err: any) {
      console.warn(`Recommendation attempt ${attempt + 1} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Recommendation generation failed after retries");
}
