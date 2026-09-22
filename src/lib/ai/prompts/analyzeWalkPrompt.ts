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

Return ONLY one JSON object.

Never return tags as strings.

Every item inside "tags" MUST be an object with exactly:
- label
- category
- reason

Example format:
\`\`\`json
{
  "title": "異国文化が混ざる港町の日常",
  "tags": [
    {
      "label": "異国文化が混ざる街",
      "category": "Culture",
      "reason": "複数の写真で英語表記や海外文化を感じる店舗表現が繰り返し確認できるため"
    },
    {
      "label": "港と生活が近い街",
      "category": "Local Life",
      "reason": "港湾景観と住宅・商業空間が近接している様子が複数の写真から読み取れるため"
    }
  ]
}
\`\`\`
The allowed categories must exactly match: ["Culture", "Architecture", "Nature", "History", "Local Life"]. Do not invent alternate category strings.
`;
}
