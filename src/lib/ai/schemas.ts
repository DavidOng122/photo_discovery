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
