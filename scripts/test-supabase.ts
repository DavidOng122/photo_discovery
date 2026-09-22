import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runTests() {
  console.log('--- 1. Anonymous Auth Test ---');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) {
    console.error('FAIL: Anonymous Auth:', authError.message);
    return;
  }
  const userId = authData.user?.id;
  console.log('PASS: Anonymous Auth enabled. UID:', userId);

  console.log('\n--- 2. Verify Remote Schema & RPCs ---');
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  const tables = ['walks', 'walk_photos', 'discovery_tags', 'recommendation_sets', 'recommended_places', 'recommended_place_tags', 'saved_places'];
  
  for (const table of tables) {
    const { error } = await adminClient.from(table).select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error(`FAIL: Table ${table} error:`, error.message);
    } else {
      console.log(`PASS: Table ${table} exists.`);
    }
  }

  console.log('\n--- 3. Verify Storage ---');
  const { data: buckets, error: bucketsErr } = await adminClient.storage.listBuckets();
  if (bucketsErr) {
    console.error('FAIL: Storage:', bucketsErr.message);
  } else {
    const bucket = buckets.find(b => b.name === 'walk-photos');
    if (!bucket) {
      console.error('FAIL: Bucket walk-photos does not exist.');
    } else if (bucket.public) {
      console.error('FAIL: Bucket walk-photos is public. Must be private.');
    } else {
      console.log('PASS: Bucket walk-photos exists and is private.');
    }
  }

  console.log('\n--- 4. Verify RLS (User A vs User B) ---');
  const supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await supabaseB.auth.signInAnonymously();
  const userIdB = (await supabaseB.auth.getUser()).data.user?.id;
  
  const { data: walkInsert, error: walkErr } = await supabase.from('walks').insert({
    user_id: userId,
    status: 'DRAFT'
  }).select('id').single();
  
  if (walkErr) {
    console.error('FAIL: Could not create Walk for User A:', walkErr.message);
  } else {
    const walkId = walkInsert.id;
    console.log(`PASS: Created Walk A (${walkId})`);

    const { data: readA } = await supabase.from('walks').select('id').eq('id', walkId);
    const { data: readB } = await supabaseB.from('walks').select('id').eq('id', walkId);
    
    if (readA && readA.length > 0 && (!readB || readB.length === 0)) {
      console.log('PASS: RLS prevents User B from reading User A Walk.');
    } else {
      console.error('FAIL: RLS bypass detected on Walks!');
    }
    
    // Cleanup
    await adminClient.from('walks').delete().eq('id', walkId);
  }

  console.log('\n--- Tests Complete ---');
}

runTests().catch(err => console.error('Unhandled error:', err));
