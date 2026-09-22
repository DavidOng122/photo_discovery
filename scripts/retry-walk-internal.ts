import { createClient } from '@supabase/supabase-js';
import { QwenProvider } from '../src/lib/ai/providers/qwen';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Find a walk in ANALYZING state
  const { data: walks } = await supabase.from('walks').select('id, user_id').eq('status', 'ANALYZING').limit(1);
  if (!walks || walks.length === 0) {
    console.log("No walk found in ANALYZING state.");
    return;
  }
  
  const walk = walks[0];
  console.log(`Found walk in ANALYZING state: ${walk.id}. Simulating AI analysis...`);
  
  const { data: photos } = await supabase.from('walk_photos').select('*').eq('walk_id', walk.id).order('sort_order');
  
  const aiProvider = new QwenProvider();
  
  // Create signed URLs
  const imageUrls = await Promise.all(
    (photos || []).map(async (p: any, idx: number) => {
      const { data } = await supabase.storage.from('walk-photos').createSignedUrl(p.storage_path, 60 * 60);
      return { url: data?.signedUrl || '', order: idx };
    })
  );
  
  try {
    const aiResult = await aiProvider.analyzeWalk({ images: imageUrls, outputLanguage: 'ja' });
    console.log("AI Result:", JSON.stringify(aiResult, null, 2));
    
    console.log("Calling save_discovery_analysis RPC...");
    const { data: rpcData, error: rpcError } = await supabase.rpc('save_discovery_analysis', {
      p_walk_id: walk.id,
      p_title: aiResult.title,
      p_tags: aiResult.tags,
    });
    
    if (rpcError) throw rpcError;
    console.log("RPC Success!");
    
    // Verify DB state
    const { data: walkData } = await supabase.from('walks').select('status, title').eq('id', walk.id).single();
    console.log("Walk Status after RPC:", walkData?.status);
    console.log("Walk Title after RPC:", walkData?.title);
    
    const { data: tags } = await supabase.from('discovery_tags').select('*').eq('walk_id', walk.id);
    console.log(`Found ${tags?.length} discovery tags for walk.`);
  } catch (err: any) {
    console.error("FAIL:", err.message);
  }
}

run().catch(console.error);
