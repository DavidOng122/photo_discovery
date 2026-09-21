import { SearchProvider } from "./provider";
import { TavilySearchProvider } from "./tavily";

export function getSearchProvider(): SearchProvider {
  const provider = process.env.SEARCH_PROVIDER;
  
  switch (provider) {
    case "tavily":
      return new TavilySearchProvider();
    default:
      throw new Error(`Unsupported SEARCH_PROVIDER: ${provider}`);
  }
}
