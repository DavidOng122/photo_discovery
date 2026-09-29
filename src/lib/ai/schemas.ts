import { z } from "zod";

export const DiscoveryCategorySchema = z.enum([
  "Culture",
  "Architecture",
  "Nature",
  "History",
  "Local Life",
]);

export const FeatureTypeSchema = z.enum(["culture", "style", "atmosphere"]);

export const DiscoveryTagOutputSchema = z.object({
  label: z.string().min(2).max(60),
  category: DiscoveryCategorySchema.optional(),
  type: FeatureTypeSchema.optional(),
  reason: z.string().min(5).max(300),
}).refine((value) => value.category !== undefined || value.type !== undefined, {
  message: "Either category or type is required",
  path: ["type"],
});

// V2 Observation: a grounded observation extracted from vision analysis
export const ObservationSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: z.string().optional(),
  matchedFeatures: z.array(z.string()).optional(),
});

export type Observation = z.infer<typeof ObservationSchema>;

// V2 Discovery Perspective
export const DiscoveryPerspectiveSchema = z.object({
  lens: z.string(),
  phrase: z.string(),
  explanation: z.string(),
  observationIds: z.array(z.string()),
});

export type DiscoveryPerspective = z.infer<typeof DiscoveryPerspectiveSchema>;

export const AnalyzeWalkOutputSchema = z.object({
  title: z.string().min(2).max(80),
  tags: z.array(DiscoveryTagOutputSchema).min(1).max(5),
  // V2 fields (optional for backward compat with v1 providers)
  observations: z.array(ObservationSchema).optional(),
  discoveries: z.array(DiscoveryPerspectiveSchema).optional(),
});

export type AnalyzeWalkOutput = z.infer<typeof AnalyzeWalkOutputSchema>;

export const RecommendedPlaceOutputSchema = z.object({
  name: z.string().min(1).max(100),
  area: z.string().max(100).nullable().optional(),
  type: z.enum(["area", "place"]).default("place"),
  reason: z.string().min(20).max(220),
  matchedFeatures: z.array(z.string().min(1)).min(1).max(3),
  googleMapsQuery: z.string().min(1).max(200),
  googlePlaceId: z.string().max(200).nullable().optional(),
  formattedAddress: z.string().max(200).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const RecommendationOutputSchema = z.object({
  places: z.array(RecommendedPlaceOutputSchema).min(3).max(5),
});

export type RecommendedPlaceOutput = z.infer<typeof RecommendedPlaceOutputSchema>;
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;
