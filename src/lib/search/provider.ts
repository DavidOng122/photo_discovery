import { SearchPlacesInput, SearchResult } from "./types";

export interface SearchProvider {
  searchPlaces(input: SearchPlacesInput): Promise<SearchResult[]>;
}
