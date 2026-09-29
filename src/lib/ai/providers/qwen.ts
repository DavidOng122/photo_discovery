import OpenAI from "openai";
import { AIProvider, AnalyzeWalkInput, GenerateRecommendationsInput } from "../provider";
import { AnalyzeWalkOutput, AnalyzeWalkOutputSchema, RecommendationOutput, RecommendationOutputSchema } from "../schemas";
import { getAnalyzeWalkPrompt } from "../prompts/analyzeWalkPrompt";
import { getRecommendPlacesPrompt } from "../prompts/recommendPlacesPrompt";
import { logger } from "@/lib/logging/logger";

function normalizeFeatureType(value: string | undefined): "culture" | "style" | "atmosphere" {
  if (value === "Culture") return "culture";
  if (value === "Architecture") return "style";
  if (value === "History") return "culture";
  if (value === "Nature") return "atmosphere";
  if (value === "Local Life") return "atmosphere";
  if (value === "culture" || value === "style" || value === "atmosphere") return value;
  return "style";
}

export class QwenProvider implements AIProvider {
  readonly name = "qwen";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.QWEN_API_KEY ?? process.env.AI_API_KEY,
      baseURL: process.env.QWEN_BASE_URL ?? process.env.AI_BASE_URL,
    });
  }

  async analyzeWalk(input: AnalyzeWalkInput): Promise<AnalyzeWalkOutput> {
    const basePrompt = getAnalyzeWalkPrompt(input.images.length, input.location);
    const prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;
    const model = process.env.QWEN_VISION_MODEL || process.env.AI_VISION_MODEL || "qwen-vl-plus";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [
      { type: "text", text: prompt }
    ];

    const sortedImages = [...input.images].sort((a, b) => a.order - b.order);

    for (const image of sortedImages) {
      content.push({
        type: "image_url",
        image_url: {
          url: image.url,
        }
      });
    }

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content,
        }
      ],
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Failed to get content from AI output");
    }

    try {
      const parsedJson = JSON.parse(messageContent);
      let rawDiscoveries: Array<Record<string, unknown>> = Array.isArray(parsedJson.discoveries)
        ? parsedJson.discoveries
        : [];
      let rawTags: Array<Record<string, unknown>> = Array.isArray(parsedJson.tags)
        ? parsedJson.tags
        : Array.isArray(parsedJson.features)
          ? parsedJson.features
          : [];

      if (rawDiscoveries.length === 0 && rawTags.length > 0) {
        rawDiscoveries = rawTags.map((t) => ({
          phrase: String(t.label ?? ""),
          explanation: String(t.reason ?? ""),
        }));
      }

      if (rawTags.length === 0 && rawDiscoveries.length > 0) {
        rawTags = rawDiscoveries.map((d) => ({
          label: String(d.phrase ?? ""),
          type: "style",
          reason: String(d.explanation ?? ""),
        }));
      }

      parsedJson.discoveries = rawDiscoveries.map((d) => ({
        phrase: String(d.phrase ?? d.label ?? "").trim(),
        explanation: String(d.explanation ?? d.reason ?? "").trim(),
      }));

      parsedJson.tags = rawTags.map((tag) => ({
        label: String(tag.label ?? ""),
        type: normalizeFeatureType(typeof tag.type === "string" ? tag.type : typeof tag.category === "string" ? tag.category : undefined),
        reason: String(tag.reason ?? ""),
      }));

      if (!parsedJson.title) {
        parsedJson.title = parsedJson.discoveries[0]?.phrase || "街歩きの発見";
      }

      logger.info('Qwen analyze response parsed');
      return AnalyzeWalkOutputSchema.parse(parsedJson);
    } catch (error) {
      logger.error("Qwen analyzeWalk error", error);
      throw error;
    }
  }

  async generateRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationOutput> {
    const basePrompt = getRecommendPlacesPrompt(input);
    const prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;
    const model = process.env.QWEN_TEXT_MODEL || process.env.AI_TEXT_MODEL || "qwen-plus";

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Failed to get content from recommendation output");
    }

    try {
      const parsedJson = JSON.parse(messageContent);
      const selectedLabels = (
        (input.selectedDiscovery?.phrase ? [input.selectedDiscovery.phrase] : [])
        .concat(input.selectedFeatures?.map((feature) => feature.label) ?? [])
        .concat(input.selectedTags?.map((tag) => tag.label) ?? [])
      );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedPlaces = (parsedJson.places ?? []).map((place: any) => {
        return {
          ...place,
          matchedFeatures: selectedLabels.length > 0 ? selectedLabels.slice(0, 3) : [place.name],
          type: "place",
          reason: place.reason ?? place.description ?? "",
        };
      });
      return RecommendationOutputSchema.parse({ ...parsedJson, places: normalizedPlaces });
    } catch (error) {
      logger.error("Qwen generateRecommendations validation error", error);
      throw error;
    }
  }
}
