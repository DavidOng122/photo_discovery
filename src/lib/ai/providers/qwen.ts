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
    let prompt = `${basePrompt}\n\nIMPORTANT: You must return the result as a valid JSON object.`;
    
    if (retryCount > 0) {
      prompt += `\n\nYour previous JSON did not match the required schema.
Critical error: "tags" must be an array of objects, not an array of strings.
Each tag MUST have:
{
  "label": string,
  "category": one of ["Culture", "Architecture", "Nature", "History", "Local Life"],
  "reason": string
}
Return the entire corrected JSON object only.`;
    }
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
      
      logger.info('Qwen analyze response parsed');
      logger.info(`title type: ${typeof parsedJson.title}`);
      logger.info(`tags type: ${Array.isArray(parsedJson.tags) ? 'array' : typeof parsedJson.tags}`);
      if (Array.isArray(parsedJson.tags) && parsedJson.tags.length > 0) {
        logger.info(`first tag type: ${typeof parsedJson.tags[0]}`);
      }
      
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
      prompt += `\n\nYour previous JSON did not match the required schema.
Return the entire corrected JSON object.

The root object MUST contain:

{
  "places": [
    {
      "name": "根津神社",
      "area": "文京区",
      "description": "...",
      "matchedTags": [
        "季節の花",
        "歴史ある街並み"
      ],
      "imageUrl": null,
      "googleMapsQuery": "根津神社 文京区 東京",
      "sourceUrl": "https://example.com/...",
      "sourceDomain": "example.com"
    }
  ]
}`;
    }
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
      if (retryCount < 1) {
        logger.info("Retrying Qwen generateRecommendations...");
        return this.generateRecommendations(input, retryCount + 1);
      }
      throw new Error("Failed to parse recommendation output");
    }
  }
}
