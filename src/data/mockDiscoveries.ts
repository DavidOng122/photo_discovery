import type { Discovery } from '@/types/discovery';

// This has the same shape expected from analyzed, AI-categorized discoveries.
export const mockDiscoveries: Discovery[] = [
  {
    id: 'western-house',
    image: '/figma/home/western-house.png',
    title: 'ヤシの木のある洋館',
    location: '目黒',
    category: '建築',
  },
  {
    id: 'forest-shrine',
    image: '/figma/home/forest-shrine.png',
    title: '緑に包まれた神社',
    location: '代々木',
    category: '神社',
  },
  {
    id: 'quiet-cafe',
    image: '/figma/home/cafe.png',
    title: '静かなカフェでひと休み',
    location: '嘉前',
    category: '食',
  },
  {
    id: 'small-alley-discovery',
    image: '/figma/home/alley.png',
    title: '路地裏の小さな発見',
    location: '下北沢',
    category: '街の文化',
  },
  {
    id: 'historic-architecture',
    image: '/figma/home/architecture.png',
    title: '時を感じる建築',
    location: '表参道',
    category: '建築',
  },
  {
    id: 'tokyo-tower',
    image: '/figma/home/tokyo-tower.png',
    title: '夕暮れの東京タワー',
    location: '港区',
    category: '街の文化',
  },
  {
    id: 'lantern-path',
    image: '/figma/home/lantern-path.png',
    title: '提灯の灯る参道',
    location: '浅草',
    category: '神社',
  },
  {
    id: 'showa-alley',
    image: '/figma/home/showa-alley.png',
    title: '昭和の面影を残す路地',
    location: '谷中',
    category: '街の文化',
  },
];
