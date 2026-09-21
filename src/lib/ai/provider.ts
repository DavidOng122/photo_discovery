import { SearchResult } from "../search/types";
import { AnalyzeWalkOutput, RecommendationOutput } from "./schemas";

export type DiscoveryCategory = "Culture" | "Architecture" | "Nature" | "History" | "Local Life";

export interface AnalyzeWalkInput {
  images: Array<{
    url: string;
    order: number;
  }>;
  location?: string | null;
  outputLanguage: "ja";
}

export interface GenerateRecommendationsInput {
  selectedTags: Array<{
    label: string;
    category: DiscoveryCategory;
    reason: string;
  }>;
  originalLocation?: string | null;
  searchResults: SearchResult[];
  excludedPlaceNames: string[];
  outputLanguage: "ja";
}

export interface AIProvider {
  analyzeWalk(input: AnalyzeWalkInput): Promise<AnalyzeWalkOutput>;
  generateRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationOutput>;
}
