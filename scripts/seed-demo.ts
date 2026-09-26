import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('Run this script using: npx tsx --env-file=.env.local scripts/seed-demo.ts <user_id>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDemo(userId: string) {
  console.log(`Seeding demo data for user: ${userId}`);

  // Walk 1: 横須賀
  const { data: walk1, error: err1 } = await supabase.from('walks').insert({
    user_id: userId,
    status: 'COMPLETED',
    title: '異国文化が残る港町を歩く',
    location: '横須賀',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5).toISOString(),
  }).select('id').single();
  if (err1) throw err1;

  // Walk 1 Tags
  const { data: tag1_1, error: terr1 } = await supabase.from('discovery_tags').insert({
    walk_id: walk1.id,
    label: '港町の日常',
    category: 'Local Life',
    reason: '港町の雰囲気が強く感じられる風景でした。',
    selected: true,
  }).select('id').single();
  if (terr1) throw terr1;

  const { data: tag1_2, error: terr2 } = await supabase.from('discovery_tags').insert({
    walk_id: walk1.id,
    label: '異文化が混ざる街',
    category: 'Culture',
    reason: '日本と海外の文化が混ざり合った独特な街並み。',
    selected: true,
  }).select('id').single();
  if (terr2) throw terr2;

  // Walk 1 Recommendation Set
  const { data: set1, error: serr1 } = await supabase.from('recommendation_sets').insert({
    walk_id: walk1.id,
    search_query: '東京 港町の日常 異文化が混ざる街 散歩 街歩き おすすめ場所 観光 名所',
    search_provider: 'none',
    ai_provider: 'openai',
  }).select('id').single();
  if (serr1) throw serr1;

  // Walk 1 Recommended Place
  const { data: place1, error: perr1 } = await supabase.from('recommended_places').insert({
    recommendation_set_id: set1.id,
    name: '福生ベースサイドストリート',
    area: '福生市',
    description: '横田基地に面した国道16号沿いのエリア。アメリカの雰囲気が漂うカフェや雑貨店が立ち並び、異国情緒あふれる街歩きが楽しめます。',
    google_maps_query: '福生ベースサイドストリート 福生市 東京',

  }).select('id').single();
  if (perr1) throw perr1;

  await supabase.from('recommended_place_tags').insert({
    recommended_place_id: place1.id,
    discovery_tag_id: tag1_2.id,
  });


  // Walk 2: 谷根千
  const { data: walk2, error: err2 } = await supabase.from('walks').insert({
    user_id: userId,
    status: 'COMPLETED',
    title: '下町の路地裏探索',
    location: '谷中',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5).toISOString(),
  }).select('id').single();
  if (err2) throw err2;

  // Walk 2 Tags
  const { data: tag2_1, error: terr2_1 } = await supabase.from('discovery_tags').insert({
    walk_id: walk2.id,
    label: '昭和レトロな街並み',
    category: 'Architecture',
    reason: '古い木造建築や細い路地が残っていました。',
    selected: true,
  }).select('id').single();
  if (terr2_1) throw terr2_1;

  // Walk 2 Recommendation Set
  const { data: set2, error: serr2 } = await supabase.from('recommendation_sets').insert({
    walk_id: walk2.id,
    search_query: '東京 昭和レトロな街並み 散歩 街歩き おすすめ場所 観光 名所',
    search_provider: 'none',
    ai_provider: 'openai',
  }).select('id').single();
  if (serr2) throw serr2;

  // Walk 2 Recommended Place
  const { data: place2, error: perr2 } = await supabase.from('recommended_places').insert({
    recommendation_set_id: set2.id,
    name: '柴又帝釈天周辺',
    area: '葛飾区',
    description: '昔ながらの参道や古い建物が残るエリア。映画の舞台にもなった情緒ある風景の中をのんびり歩くことができます。',
    google_maps_query: '柴又帝釈天 葛飾区 東京',
  }).select('id').single();
  if (perr2) throw perr2;

  await supabase.from('recommended_place_tags').insert({
    recommended_place_id: place2.id,
    discovery_tag_id: tag2_1.id,
  });

  // Walk 3: 季節の花
  const { data: walk3, error: err3 } = await supabase.from('walks').insert({
    user_id: userId,
    status: 'COMPLETED',
    title: '季節の花をテーマにした東京の散歩',
    location: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5).toISOString(),
  }).select('id').single();
  if (err3) throw err3;

  // Walk 3 Tags
  const { data: tag3_1, error: terr3_1 } = await supabase.from('discovery_tags').insert({
    walk_id: walk3.id,
    label: '都市の中の自然',
    category: 'Nature',
    reason: 'コンクリートの間に咲く花が印象的でした。',
    selected: true,
  }).select('id').single();
  if (terr3_1) throw terr3_1;

  // Walk 3 Recommendation Set
  const { data: set3, error: serr3 } = await supabase.from('recommendation_sets').insert({
    walk_id: walk3.id,
    search_query: '東京 都市の中の自然 散歩 街歩き おすすめ場所 観光 名所',
    search_provider: 'none',
    ai_provider: 'openai',
  }).select('id').single();
  if (serr3) throw serr3;

  // Walk 3 Recommended Place
  const { data: place3, error: perr3 } = await supabase.from('recommended_places').insert({
    recommendation_set_id: set3.id,
    name: '等々力渓谷',
    area: '世田谷区',
    description: '東京23区唯一の渓谷で、豊かな自然と四季折々の植物を楽しむことができる、都会のオアシスのような場所です。',
    google_maps_query: '等々力渓谷 世田谷区 東京',
  }).select('id').single();
  if (perr3) throw perr3;

  await supabase.from('recommended_place_tags').insert({
    recommended_place_id: place3.id,
    discovery_tag_id: tag3_1.id,
  });

  console.log('Demo data seeded successfully!');
}

const targetUserId = process.argv[2];

if (!targetUserId) {
  console.error('Usage: ts-node scripts/seed-demo.ts <user_id>');
  process.exit(1);
}

seedDemo(targetUserId).catch((err) => {
  console.error('Failed to seed demo data:', err);
  process.exit(1);
});
