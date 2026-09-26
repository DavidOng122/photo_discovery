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
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.QWEN_API_KEY ?? process.env.AI_API_KEY,
      baseURL: process.env.QWEN_BASE_URL ?? process.env.AI_BASE_URL,
    });
  }

  async analyzeWalk(input: AnalyzeWalkInput, retryCount = 0): Promise<AnalyzeWalkOutput> {
    const basePrompt = getAnalyzeWalkPrompt(input.images.length, input.location);
    let prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;

    if (retryCount > 0) {
      prompt += `\n\nYour previous JSON did not match the required schema.\nEach item in tags MUST have:\n{\n  "label": string,\n  "type": "culture" | "style" | "atmosphere",\n  "reason": string\n}\nReturn the entire corrected JSON object only.`;
    }
    const model = process.env.QWEN_VISION_MODEL || process.env.AI_VISION_MODEL || "qwen-vl-plus";

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

    try {
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

      const parsedJson = JSON.parse(messageContent);
      const rawTags = Array.isArray(parsedJson.tags) ? parsedJson.tags : Array.isArray(parsedJson.features) ? parsedJson.features : [];
      parsedJson.tags = rawTags.map((tag: any) => ({
        label: tag.label,
        type: normalizeFeatureType(tag.type ?? tag.category),
        reason: tag.reason,
      }));

      logger.info('Qwen analyze response parsed');
      return AnalyzeWalkOutputSchema.parse(parsedJson);
    } catch (error) {
      logger.error("Qwen analyzeWalk error", error);
      if (retryCount < 1) {
        logger.info("Retrying Qwen analyzeWalk...");
        return this.analyzeWalk(input, retryCount + 1);
      }
      throw new Error("Failed to parse AI output after retries");
    }
  }

  async generateRecommendations(input: GenerateRecommendationsInput, retryCount = 0): Promise<RecommendationOutput> {
    const basePrompt = getRecommendPlacesPrompt(input);
    let prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;

    if (retryCount > 0) {
      prompt += `\n\nYour previous JSON did not match the required schema.\nReturn the entire corrected JSON object only.`;
    }
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
      const normalizedPlaces = (parsedJson.places ?? []).map((place: any) => ({
        ...place,
        matchedFeatures: Array.isArray(place.matchedFeatures) ? place.matchedFeatures : Array.isArray(place.matchedTags) ? place.matchedTags : [],
        type: place.type ?? "place",
        reason: place.reason ?? place.description ?? "",
      }));
      return RecommendationOutputSchema.parse({ ...parsedJson, places: normalizedPlaces });
    } catch (error) {
      logger.error("Qwen generateRecommendations validation error", error);
      if (retryCount < 1) {
        logger.info("Retrying Qwen generateRecommendations...");
        return this.generateRecommendations(input, retryCount + 1);
      }
      throw new Error("Failed to parse recommendation output");
    }
  }
}
