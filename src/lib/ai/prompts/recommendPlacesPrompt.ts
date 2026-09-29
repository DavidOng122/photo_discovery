import { GenerateRecommendationsInput } from "../provider";

export function getRecommendPlacesPrompt(input: GenerateRecommendationsInput): string {
  let selectedPerspective = "";
  if (input.selectedDiscovery?.phrase) {
    selectedPerspective = input.selectedDiscovery.phrase;
    if (input.selectedDiscovery.explanation) {
      selectedPerspective += `（${input.selectedDiscovery.explanation}）`;
    }
  } else if (input.selectedFeatures && input.selectedFeatures.length > 0) {
    selectedPerspective = input.selectedFeatures.map((f) => f.label).join(" / ");
  } else if (input.selectedTags && input.selectedTags.length > 0) {
    selectedPerspective = input.selectedTags.map((t) => t.label).join(" / ");
  } else {
    selectedPerspective = "東京の独自の魅力・視点";
  }

  const currentCity = input.currentCity ?? "Tokyo";
  const excludedList =
    (input.excludedPlaceNames ?? []).length > 0
      ? `以下の場所は除外してください:\n${(input.excludedPlaceNames ?? []).map((n) => `- ${n}`).join("\n")}`
      : "";

  return `あなたは写真から見つかった「視点・魅力」に基づいて、東京でその視点をさらに体験できる実在の場所を推薦する専門キュレーターです。

ユーザーが写真から発見・選択した視点:
「${selectedPerspective}」

推薦対象エリア: ${currentCity}

【重要な推薦ルール】
1. 視点の体験（最重要）:
   - 写真と「見た目が似ている場所」を推薦しないでください。
   - 選ばれた視点（例: 「伝統的な日本建築と庭園の調和」）を、東京の街歩きの中で実際に体験・味わえる場所を推薦してください。
2. 実在する場所:
   - 必ず東京に実在し、Google Maps で訪れることができる具体的なスポット（神社、庭園、通り、美術館、歴史ある街区、建築など）を選んでください。
3. 推薦件数:
   - 厳選した3箇所を推薦してください。
4. 説明文 (reason):
   - 写真で発見した視点をなぜその場所で体験できるのかを、簡潔で魅力的な日本語（1〜2文）で説明してください。
   - 例: 「歴史ある建築と自然が調和した空間で、写真で発見した視点をさらに体験できます。」
5. googleMapsQuery:
   - 「場所名 エリア名 Tokyo」の形式にしてください（例: "根津神社 文京区 Tokyo"）。
6. type:
   - 必ず "place" にしてください。
7. matchedFeatures:
   - 選択された視点のフレーズを含めてください。

${excludedList}

必ず以下のJSON形式のみを出力してください（placesキーを持つJSONオブジェクトのみ）:
\`\`\`json
{
  "places": [
    {
      "name": "根津神社",
      "area": "文京区",
      "type": "place",
      "reason": "歴史ある建築と自然が調和した空間で、写真で発見した視点をさらに体験できます。",
      "matchedFeatures": ["${input.selectedDiscovery?.phrase || (input.selectedFeatures?.[0]?.label ?? '選択した視点')}"],
      "googleMapsQuery": "根津神社 文京区 Tokyo",
      "googlePlaceId": null,
      "formattedAddress": null,
      "imageUrl": null
    }
  ]
}
\`\`\``;
}

