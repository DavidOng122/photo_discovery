export interface ThemeVisualData {
  label: string;
  category?: string;
}

const iconRules = [
  { pattern: /住宅|建築|家/, icon: '⌂' },
  { pattern: /英語|本|文学|歴史/, icon: '▣' },
  { pattern: /基地|異国/, icon: '✈' },
  { pattern: /港|船/, icon: '♜' },
  { pattern: /神社|寺|鳥居/, icon: '⛩' },
  { pattern: /街角|提灯|路地/, icon: '◇' },
  { pattern: /坂|山|丘/, icon: '△' },
  { pattern: /喫茶|カフェ|珈琲/, icon: '☕' },
  { pattern: /商店|市場|店/, icon: '▤' },
  { pattern: /海|水辺|浜/, icon: '≋' },
] as const;

export function getThemeIcon(theme: ThemeVisualData) {
  const searchableText = `${theme.label} ${theme.category ?? ''}`;
  return iconRules.find((rule) => rule.pattern.test(searchableText))?.icon ?? '✦';
}
