import { GenerateRecommendationsInput } from "../provider";

export function getRecommendPlacesPrompt(input: GenerateRecommendationsInput): string {
  const selectedFeatures =
    input.selectedFeatures && input.selectedFeatures.length > 0
      ? input.selectedFeatures
      : (input.selectedTags ?? []).map((tag) => ({
          label: tag.label,
          type: (tag.category === "Culture" || tag.category === "Architecture" || tag.category === "History" || tag.category === "Nature" || tag.category === "Local Life")
            ? (tag.category === "Culture" ? "culture" : tag.category === "Architecture" ? "style" : tag.category === "History" ? "culture" : tag.category === "Nature" ? "atmosphere" : "atmosphere")
            : "style",
          reason: tag.reason,
        }));

  const featureSummary = selectedFeatures
    .map((feature) => `- ${feature.label}（${feature.type}）: ${feature.reason}`)
    .join("\n");

  const excludedList =
    (input.excludedPlaceNames ?? []).length > 0
      ? `以下の場所は除外してください（すでに推薦済みまたは保存済み）:\n${(input.excludedPlaceNames ?? []).map((n) => `- ${n}`).join("\n")}`
      : "";

  const currentCity = input.currentCity ?? "Tokyo";
  const originalArea = input.originalLocation ?? "unknown";
  const selectedFeatureLabels = selectedFeatures.map((feature) => `- ${feature.label}`).join("\n");

  return `あなたは街歩きの特徴から新しい場所を探すアシスタントです。

今回のユーザーが選んだ特徴:
${featureSummary}

現在の都市: ${currentCity}
元の場所/エリア: ${originalArea}

【重要なルール】
- 推薦は必ず ${currentCity} の中から行ってください。
- 元の場所 ${originalArea} またはその明らかな近隣エリアは避けてください。
- 似た外見だけでなく、選ばれた特徴が共有される場所を推薦してください。
- 実在する場所のみ推薦してください。
- 3つだけ返してください。
- neighborhood / area / shopping street / district / shrine / museum / cafe / park / historic district のような実在の場所を含めてください。
- その場所が「なぜこの特徴に合うか」を日本語でわかりやすく説明してください。
- 説明文は 1〜2 文で簡潔にしてください。
- googleMapsQuery は 「場所名 エリア名 ${currentCity}」 の形式にしてください。
- matchedFeatures には選択した特徴名をそのまま使用してください。
- imageUrl は Google Places の画像があれば設定し、なければ null にしてください。
- sourceUrl / sourceDomain は使わないでください。
- 元のエリアと重なる候補より、違うエリアで同じ感覚を持つ場所を優先してください。

選択済み特徴ラベル:
${selectedFeatureLabels}

${excludedList}

以下のJSON形式で出力してください（placesキーを持つオブジェクトのみ返してください）:
{
  "places": [
    {
      "name": "福生",
      "area": "東京都福生市",
      "type": "area",
      "reason": "基地周辺に異国文化が混ざる街並みが残り、選択した特徴とつながる場所です。",
      "matchedFeatures": ["異国文化が混ざる街", "昭和レトロ"],
      "googleMapsQuery": "福生 東京都",
      "googlePlaceId": null,
      "formattedAddress": null,
      "imageUrl": null
    }
  ]
}`;
}
