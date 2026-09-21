import { AIProvider } from "./provider";
import { OpenAIProvider } from "./providers/openai";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER;
  
  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }
}
