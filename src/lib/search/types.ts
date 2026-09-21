export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  imageUrl?: string | null;
}

export interface SearchPlacesInput {
  query: string;
  maxResults: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}
