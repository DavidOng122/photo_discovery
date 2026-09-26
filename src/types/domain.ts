export type WalkStatus =
  | "DRAFT"
  | "ANALYZING"
  | "TAG_SELECTION"
  | "RECOMMENDING"
  | "COMPLETED";

export type DiscoveryCategory =
  | "Culture"
  | "Architecture"
  | "Nature"
  | "History"
  | "Local Life";

export interface DiscoveryTag {
  id: string;
  walkId: string;
  label: string;
  category: DiscoveryCategory;
  reason: string;
  selected: boolean;
}

export interface RecommendedPlace {
  id: string;
  name: string;
  area?: string | null;
  description: string;
  imageUrl?: string | null;
  googleMapsQuery: string;
  matchedTags: string[];
}

export interface SavedPlace {
  id: string;
  name: string;
  area?: string | null;
  description: string;
  imageUrl?: string | null;
  googleMapsQuery: string;
  matchedTags: string[];
  createdAt: string;
}
