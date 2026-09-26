import { SearchProvider } from "./provider";

/**
 * Search is intentionally disabled in the Photo → Feature → Place flow.
 * Recommendation generation is handled directly by the model and then verified
 * through Google Places when needed.
 */
export function getSearchProvider(): SearchProvider | null {
  return null;
}
