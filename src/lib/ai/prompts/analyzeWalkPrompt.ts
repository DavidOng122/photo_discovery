export const getAnalyzeWalkPrompt = (photoCount: number, location?: string | null) => {
  return `
You analyze a set of photos from one walking experience.
Your job is not to identify isolated objects.
Treat all uploaded photos as one experience.

Find meaningful patterns in what the user repeatedly noticed,
what feels unusual, culturally specific, historically suggestive,
architecturally distinctive, seasonal, or capable of inspiring
a future walk.

Avoid generic labels such as:
building, street, food, flower, car, shop, person

Generate concise Japanese Discovery Tags.
Each tag should:
- represent an observation supported by the photo set
- be specific enough to feel discovered
- be broad enough to inspire future exploration
- avoid duplicating another tag

Do not guess the exact geographic location from the photos.
${location ? `The user provided this location context: "${location}". You may use it as context.` : 'Leave geographic inference out of the output.'}

Also generate one concise Japanese title for the walk.
All user-facing output must be Japanese.

If one photo:
normally return 1–4 meaningful tags.

If multiple photos:
identify cross-photo patterns.
normally return 3–7 meaningful tags.

Never invent tags only to satisfy quantity.
`;
}
