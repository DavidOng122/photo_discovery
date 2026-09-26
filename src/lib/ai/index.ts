import { AIProvider } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { QwenProvider } from "./providers/qwen";

export type AIProviderKind = "vision" | "recommendation";

export function getAIProvider(kind: AIProviderKind = "recommendation"): AIProvider {
  const provider =
    kind === "vision"
      ? (process.env.VISION_PROVIDER ?? process.env.QWEN_PROVIDER ?? process.env.AI_PROVIDER ?? "qwen")
      : (process.env.RECOMMENDATION_PROVIDER ?? process.env.OPENAI_PROVIDER ?? process.env.AI_PROVIDER ?? "openai");

  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    case "qwen":
      return new QwenProvider();
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
