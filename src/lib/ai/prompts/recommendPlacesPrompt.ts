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

  const currentCity = input.recommendationCity ?? input.currentCity ?? "Tokyo";
  const excludedList =
    (input.excludedPlaceNames ?? []).length > 0
      ? `以下の場所は除外してください:\n${(input.excludedPlaceNames ?? []).map((n) => `- ${n}`).join("\n")}`
      : "";

    return `${currentCity}で、選択した視点を実際に体験できる場所を3つ推薦してください。

  視点: 「${selectedPerspective}」

  見た目が似ているだけの場所ではなく、視点の意味や関係性を体験できる、実在する具体的な場所を選んでください。場所名は重複させず、確信のない場所は含めないでください。
  ${excludedList}

  各 reason は、選んだ視点とその場所のつながりを説明する簡潔な日本語1文にしてください。長い説明や推論過程は不要です。
  googleMapsQuery は「場所名 エリア名 Tokyo」の形式にしてください。

  次の JSON だけを返してください。余分な項目、Markdown、前置きは不要です。
  {"places":[{"name":"場所名","area":"エリア名","reason":"視点とのつながりを説明する一文","googleMapsQuery":"場所名 エリア名 Tokyo"}]}`;
}

