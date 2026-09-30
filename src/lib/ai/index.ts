import { AIProvider } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { QwenProvider } from "./providers/qwen";

export type AIProviderKind = "vision" | "recommendation";

type ProviderName = "openai" | "qwen";

export function getAIProvider(kind: AIProviderKind = "recommendation"): AIProvider {
  const configuredProvider = kind === "vision"
    ? process.env.VISION_PROVIDER ?? process.env.QWEN_PROVIDER ?? process.env.AI_PROVIDER ?? "qwen"
    : process.env.RECOMMENDATION_PROVIDER ?? process.env.OPENAI_PROVIDER ?? process.env.AI_PROVIDER ?? "openai";
  const providerEnv = configuredProvider.toLowerCase() as ProviderName;

  switch (providerEnv) {
    case "openai":
      return new OpenAIProvider();
    case "qwen":
      return new QwenProvider();
    default:
      throw new Error(`Unsupported ${kind} AI provider: ${configuredProvider}`);
  }
}
