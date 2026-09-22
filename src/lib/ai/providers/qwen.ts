import OpenAI from "openai";
import { AIProvider, AnalyzeWalkInput, GenerateRecommendationsInput } from "../provider";
import { AnalyzeWalkOutput, AnalyzeWalkOutputSchema, RecommendationOutput, RecommendationOutputSchema } from "../schemas";
import { getAnalyzeWalkPrompt } from "../prompts/analyzeWalkPrompt";
import { getRecommendPlacesPrompt } from "../prompts/recommendPlacesPrompt";
import { logger } from "@/lib/logging/logger";

export class QwenProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    });
  }

  async analyzeWalk(input: AnalyzeWalkInput, retryCount = 0): Promise<AnalyzeWalkOutput> {
    const basePrompt = getAnalyzeWalkPrompt(input.images.length, input.location);
    // Explicitly request JSON format for Qwen
    const prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;
    const model = process.env.AI_VISION_MODEL || "qwen-vl-plus";

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

  async generateRecommendations(input: GenerateRecommendationsInput): Promise<RecommendationOutput> {
    const basePrompt = getRecommendPlacesPrompt(input);
    const prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;
    const model = process.env.AI_TEXT_MODEL || "qwen-plus";

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
      return RecommendationOutputSchema.parse(parsedJson);
    } catch (error) {
      logger.error("Qwen generateRecommendations validation error", error);
      throw new Error("Failed to parse recommendation output");
    }
  }
}
