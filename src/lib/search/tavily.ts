import { SearchProvider } from "./provider";
import { SearchPlacesInput, SearchResult } from "./types";
import { logger } from "@/lib/logging/logger";

function extractImageUrl(item: unknown): string | null {
  if (typeof item === 'string' && item.startsWith('http')) return item;
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    // Handle shapes like { url: '...' } or { src: '...' }
    if (typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
    if (typeof obj.src === 'string' && obj.src.startsWith('http')) return obj.src;
  }
  return null;
}

export class TavilySearchProvider implements SearchProvider {
  async searchPlaces(input: SearchPlacesInput): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not set");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.results)) {
      logger.warn('Tavily response missing results array', typeof data.results);
      return [];
    }

    const results: SearchResult[] = data.results.map((r: any) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
      score: r.score,
      imageUrl: null,
    }));

    // Harden: images may be string[] or object[] with varying shapes
    if (Array.isArray(data.images)) {
      data.images.forEach((item: unknown, i: number) => {
        if (i >= results.length) return;
        try {
          results[i].imageUrl = extractImageUrl(item);
        } catch {
          // Image parsing failure must never fail search results
          results[i].imageUrl = null;
        }
      });
    }

    return results;
  }
}
