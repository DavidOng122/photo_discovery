import { AnalyzeWalkOutput } from "./schemas";

export interface AnalyzeWalkInput {
  images: Array<{
    url: string;
    order: number;
  }>;
  location?: string | null;
  outputLanguage: "ja";
}

export interface AIProvider {
  analyzeWalk(input: AnalyzeWalkInput): Promise<AnalyzeWalkOutput>;
}
