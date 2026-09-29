import { AIProvider } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { QwenProvider } from "./providers/qwen";
import { MockProvider } from "./providers/mock";

export type AIProviderKind = "vision" | "recommendation";

type ProviderName = "openai" | "qwen" | "mock";

export function getAIProvider(kind: AIProviderKind = "recommendation"): AIProvider {
  void kind; // kind reserved for future per-context provider selection
  const providerEnv = (process.env.AI_PROVIDER ?? "mock").toLowerCase() as ProviderName;

  switch (providerEnv) {
    case "openai":
      return new OpenAIProvider();
    case "qwen":
      return new QwenProvider();
    case "mock":
      return new MockProvider();
    default: {
      // Fallback to mock for unknown providers (type-safe exhaustive check)
      const _exhaustive: never = providerEnv;
      void _exhaustive;
      return new MockProvider();
    }
  }
}
