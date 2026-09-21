export function buildSearchQuery(selectedTags: string[], locationContext?: string | null): string {
  const tagsText = selectedTags.join(" ");
  const query = `東京 ${locationContext ? locationContext : ""} ${tagsText} 散歩 街歩き おすすめ場所 観光 名所`;
  return query.replace(/\s+/g, ' ').trim();
}
