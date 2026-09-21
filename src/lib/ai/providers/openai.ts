import OpenAI from "openai";
import { AIProvider, AnalyzeWalkInput } from "../provider";
import { AnalyzeWalkOutput, AnalyzeWalkOutputSchema } from "../schemas";
import { getAnalyzeWalkPrompt } from "../prompts/analyzeWalkPrompt";
import { zodResponseFormat } from "openai/helpers/zod";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
    });
  }

  async analyzeWalk(input: AnalyzeWalkInput): Promise<AnalyzeWalkOutput> {
    const prompt = getAnalyzeWalkPrompt(input.images.length, input.location);
    const model = process.env.AI_VISION_MODEL || "gpt-4o";

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

    const response = await this.client.chat.completions.parse({
      model,
      messages: [
        {
          role: "user",
          content,
        }
      ],
      response_format: zodResponseFormat(AnalyzeWalkOutputSchema, "analyze_walk_output"),
    });

    const parsed = response.choices[0].message.parsed;
    if (!parsed) {
      throw new Error("Failed to parse AI output");
    }

    return parsed;
  }
}
