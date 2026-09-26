import { AnalyzeWalkOutput, RecommendationOutput } from "./schemas";

export type DiscoveryCategory = "Culture" | "Architecture" | "Nature" | "History" | "Local Life";
export type FeatureType = "culture" | "style" | "atmosphere";

export interface DiscoveryFeature {
  label: string;
  type: FeatureType;
  reason: string;
}

export interface AnalyzeWalkInput {
  images: Array<{
    url: string;
    order: number;
  }>;
  location?: string | null;
  outputLanguage: "ja";
}

export interface GenerateRecommendationsInput {
  selectedTags?: Array<{
    label: string;
    category?: DiscoveryCategory | string;
    reason: string;
  }>;
  selectedFeatures?: DiscoveryFeature[];
  currentCity?: string | null;
  originalLocation?: string | null;
  excludedPlaceNames?: string[];
  outputLanguage: "ja";
}

export interface AIProvider {
  analyzeWalk(input: AnalyzeWalkInput, retryCount?: number): Promise<AnalyzeWalkOutput>;
  generateRecommendations(input: GenerateRecommendationsInput, retryCount?: number): Promise<RecommendationOutput>;
}
