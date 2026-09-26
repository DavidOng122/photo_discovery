export const getAnalyzeWalkPrompt = (photoCount: number, location?: string | null) => {
  return `
You analyze a set of photos from one walking experience.
Your task is to detect transferable characteristics, not objects or place categories.
Treat all uploaded photos as one experience.

Focus on:
- culture
- visual/style characteristics
- atmosphere

Do not simply identify objects, facilities, or place categories such as:
カフェ, 神社, 建物, 道路, 海, 店, 港

Good feature examples:
異国文化が混ざる街
生活感のある路地
昭和レトロ
港と暮らしが近い
静かな住宅街
古い建物を活かした空間
西洋建築
門前町文化

Generate concise Japanese features.
Each feature should:
- be supported by visible evidence in the photo set
- be specific enough to feel meaningful
- be transferable to another real-world place
- help a later recommendation model find a different place with a similar appeal
- avoid duplication with other features

Do not guess exact historical or cultural claims without evidence from the photos.
${location ? `The user provided this location context: "${location}". You may use it as context.` : 'Leave geographic inference out of the output.'}

Also generate one concise Japanese title for the walk.
All user-facing output must be Japanese.

If one photo:
normally return 1–3 meaningful features.

If multiple photos:
identify cross-photo patterns.
normally return 3–5 features.

Never invent features only to satisfy quantity.
Return exactly 3–5 features when the photos support them.

Return ONLY one JSON object.

Every item inside "tags" MUST be an object with exactly:
- label
- type
- reason

Allowed type values exactly match: ["culture", "style", "atmosphere"].

Example format:
\`\`\`json
{
  "title": "異国文化が混ざる港町の日常",
  "tags": [
    {
      "label": "異国文化が混ざる街",
      "type": "culture",
      "reason": "複数の写真で英語表記や海外文化を感じる店舗表現が繰り返し確認できるため"
    },
    {
      "label": "生活感のある路地",
      "type": "atmosphere",
      "reason": "住宅と商業空間が密接に混ざる日常的な景観が繰り返し見られるため"
    }
  ]
}
\`\`\`
`;
}
