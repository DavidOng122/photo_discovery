import { z } from "zod";

export const DiscoveryCategorySchema = z.enum([
  "Culture",
  "Architecture",
  "Nature",
  "History",
  "Local Life",
]);

export const DiscoveryTagOutputSchema = z.object({
  label: z.string().min(2).max(40),
  category: DiscoveryCategorySchema,
  reason: z.string().min(5).max(300),
});

export const AnalyzeWalkOutputSchema = z.object({
  title: z.string().min(2).max(60),
  tags: z.array(DiscoveryTagOutputSchema).min(1).max(7),
});

export type AnalyzeWalkOutput = z.infer<typeof AnalyzeWalkOutputSchema>;

export const RecommendedPlaceOutputSchema = z.object({
  name: z.string().min(1).max(100),
  area: z.string().max(100).nullable().optional(),
  description: z.string().min(20).max(220),
  matchedTags: z.array(z.string().min(1)).min(1).max(3),
  imageUrl: z.string().url().nullable().optional(),
  googleMapsQuery: z.string().min(1).max(200),
  sourceUrl: z.string().url(),
  sourceDomain: z.string().min(1),
});

export const RecommendationOutputSchema = z.object({
  places: z.array(RecommendedPlaceOutputSchema).min(3).max(5),
});

export type RecommendedPlaceOutput = z.infer<typeof RecommendedPlaceOutputSchema>;
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;
