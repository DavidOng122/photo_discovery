import { GenerateRecommendationsInput } from "../provider";

export function getRecommendPlacesPrompt(input: GenerateRecommendationsInput): string {
  const tagSummary = input.selectedTags
    .map((t) => `- ${t.label}（${t.category}）: ${t.reason}`)
    .join("\n");

  const searchSummary = input.searchResults
    .slice(0, 10)
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 400)}`)
    .join("\n\n");

  const excludedList =
    input.excludedPlaceNames.length > 0
      ? `以下の場所は除外してください（すでに推薦済みまたは保存済み）:\n${input.excludedPlaceNames.map((n) => `- ${n}`).join("\n")}`
      : "";

  const locationNote =
    input.originalLocation
      ? `元の散歩場所（${input.originalLocation}）そのものを推薦しないでください。`
      : "";

  return `あなたは東京の街歩き・散歩を楽しむユーザーのために、次の発見につながる実在の場所を推薦するアシスタントです。

今回のユーザーが選んだ発見タグ（街歩きで見つけた特徴）:
${tagSummary}

${locationNote}

以下のウェブ検索結果を事実の根拠として使用して、3〜5か所の東京の実在する場所を推薦してください。

【重要なルール】
- 推薦先は必ず東京都内に限定してください。
- 検索結果に登場しない場所を創作・捏造しないでください。
- 有名な観光地を機械的に並べるのではなく、発見タグに関連した「新しい気づき」が期待できる場所を選んでください。
- 5か所の信頼できる場所が見つからない場合は、3か所でも構いません。
- 推薦する場所はできるだけ多様にしてください（同じエリア・同じ種類に集中しない）。
- 説明文（description）は日本語で60〜100文字程度にしてください。
- matchedTagsには、実際に関連する選択済みタグのラベルだけを含めてください（1〜3個）。
- googleMapsQueryは「場所名 エリア名 東京」の形式の検索用文字列にしてください。
- sourceUrlには、その場所の存在を裏付ける検索結果のURLを設定してください。
- sourceDomainにはURLのドメイン名のみを設定してください（例: wikipedia.org）。
- imageUrlは検索結果から取得できた場合のみ設定してください。取得できない場合はnullにしてください。

${excludedList}

【使用する検索結果】
${searchSummary}

上記の制約に従い、JSON形式で出力してください。`;
}
