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
  phrase: z.string().min(2).max(100),
  explanation: z.string().min(2).max(300),
  lens: z.string().optional(),
  observationIds: z.array(z.string()).optional(),
});

export type DiscoveryPerspective = z.infer<typeof DiscoveryPerspectiveSchema>;

export const AnalyzeWalkOutputSchema = z.object({
  title: z.string().min(1).max(80).optional().default("散歩の発見"),
  tags: z.array(DiscoveryTagOutputSchema).optional().default([]),
  discoveries: z.array(DiscoveryPerspectiveSchema).min(1).max(5).optional().default([]),
  observations: z.array(ObservationSchema).optional(),
});

export type AnalyzeWalkOutput = z.infer<typeof AnalyzeWalkOutputSchema>;

export const RecommendedPlaceOutputSchema = z.object({
  name: z.string().min(1).max(100),
  area: z.string().max(100).nullable().optional(),
  type: z.string().optional().default("place").transform(() => "place" as const),
  reason: z.string().min(5).max(300),
  matchedFeatures: z.array(z.string().min(1)).optional().default([]),
  googleMapsQuery: z.string().min(1).max(200),
  googlePlaceId: z.string().max(200).nullable().optional(),
  formattedAddress: z.string().max(200).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const RecommendationOutputSchema = z.object({
  places: z.array(RecommendedPlaceOutputSchema).min(1).max(5),
});

export type RecommendedPlaceOutput = z.infer<typeof RecommendedPlaceOutputSchema>;
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;

