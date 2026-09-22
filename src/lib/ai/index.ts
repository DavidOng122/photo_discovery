import { AIProvider } from "./provider";
import { OpenAIProvider } from "./providers/openai";
import { QwenProvider } from "./providers/qwen";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;
  
  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    case "qwen":
      return new QwenProvider();
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }
}
