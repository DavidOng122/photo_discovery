import { SearchProvider } from "./provider";
import { SearchPlacesInput, SearchResult } from "./types";

export class TavilySearchProvider implements SearchProvider {
  async searchPlaces(input: SearchPlacesInput): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: input.query,
        search_depth: "basic",
        include_images: true,
        max_results: input.maxResults,
        include_domains: input.includeDomains,
        exclude_domains: input.excludeDomains,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    const results: SearchResult[] = data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
      imageUrl: null,
    }));

    if (data.images && Array.isArray(data.images)) {
      for (let i = 0; i < Math.min(results.length, data.images.length); i++) {
        results[i].imageUrl = data.images[i];
      }
    }

    return results;
  }
}
