import { getAIProvider } from "./index";
import { AnalyzeWalkInput } from "./provider";
import { AnalyzeWalkOutput, AnalyzeWalkOutputSchema } from "./schemas";

export async function analyzeWalk(input: AnalyzeWalkInput): Promise<{ data: AnalyzeWalkOutput; metadata: Record<string, unknown> }> {
  const provider = getAIProvider("vision");
  
  let result: AnalyzeWalkOutput | null = null;
  let lastError: Error | null = null;
  
  for (let i = 0; i < 2; i++) {
    try {
      const rawResult = await provider.analyzeWalk(input);
      result = AnalyzeWalkOutputSchema.parse(rawResult);
      
      if (result.title.trim().length === 0) {
        throw new Error("Title cannot be empty");
      }
      
      const genericLabels = ["建物", "道路", "食べ物", "花", "車", "店", "人", "神社", "木"];

      const labels = new Set<string>();
      if (result.discoveries && result.discoveries.length > 0) {
        for (const discovery of result.discoveries) {
          if (labels.has(discovery.phrase)) {
            throw new Error(`Duplicate discovery phrase detected: ${discovery.phrase}`);
          }
          labels.add(discovery.phrase);
          if (genericLabels.includes(discovery.phrase)) {
            throw new Error(`Generic label detected in discovery: ${discovery.phrase}`);
          }
        }
      } else {
        for (const tag of result.tags) {
          if (labels.has(tag.label)) {
            throw new Error(`Duplicate tag label detected: ${tag.label}`);
          }
          labels.add(tag.label);
          if (genericLabels.includes(tag.label)) {
            throw new Error(`Generic tag label detected: ${tag.label}`);
          }
        }
      }
      
      return { data: result, metadata: { provider: provider.name, model: "vision", duration_ms: 1000, retry_count: i } };
    } catch (err: unknown) {
      console.warn(`AI Analysis attempt ${i + 1} failed:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  
  throw lastError || new Error("AI analysis failed after retries.");
}
