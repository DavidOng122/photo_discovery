import { getAIProvider } from "./index";
import { AnalyzeWalkInput } from "./provider";
import { AnalyzeWalkOutput, AnalyzeWalkOutputSchema } from "./schemas";

export async function analyzeWalk(input: AnalyzeWalkInput): Promise<AnalyzeWalkOutput> {
  const provider = getAIProvider();
  
  let result: AnalyzeWalkOutput | null = null;
  let lastError: Error | null = null;
  
  for (let i = 0; i < 2; i++) {
    try {
      const rawResult = await provider.analyzeWalk(input);
      result = AnalyzeWalkOutputSchema.parse(rawResult);
      
      if (result.title.trim().length === 0) {
        throw new Error("Title cannot be empty");
      }
      
      const labels = new Set<string>();
      for (const tag of result.tags) {
        if (labels.has(tag.label)) {
          throw new Error(`Duplicate tag label detected: ${tag.label}`);
        }
        labels.add(tag.label);
      }
      
      // Basic generic label guard
      const genericLabels = ["建物", "道路", "食べ物", "花", "車", "店", "人"];
      for (const tag of result.tags) {
        if (genericLabels.includes(tag.label)) {
          throw new Error(`Generic tag label detected: ${tag.label}`);
        }
      }
      
      return result;
    } catch (err: any) {
      console.warn(`AI Analysis attempt ${i + 1} failed:`, err);
      lastError = err;
    }
  }
  
  throw lastError || new Error("AI analysis failed after retries.");
}
