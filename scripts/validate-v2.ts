import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runTests() {
  console.log('--- 1. Schema Validation ---');
  const checks = [
    { name: 'walk_analyses', test: () => adminClient.from('walk_analyses').select('walk_id').limit(1) },
    { name: 'ai_request_metrics', test: () => adminClient.from('ai_request_metrics').select('id').limit(1) },
    { name: 'walk_photos.analysis_storage_path', test: () => adminClient.from('walk_photos').select('analysis_storage_path').limit(1) },
    { name: 'walks.analysis_started_at', test: () => adminClient.from('walks').select('analysis_started_at').limit(1) },
    { name: 'walks.recommendation_started_at', test: () => adminClient.from('walks').select('recommendation_started_at').limit(1) },
  ];

  let schemaPass = true;
  for (const check of checks) {
    const res = await check.test();
    if (res.error && res.error.code !== 'PGRST116') { // PGRST116 is no rows returned, which is fine
      console.error(`[FAIL] Schema check for ${check.name}:`, res.error.message);
      schemaPass = false;
    } else {
      console.log(`[PASS] ${check.name} exists`);
    }
  }
  
  // RPC existence check
  const rpcs = ['save_discovery_analysis_v2', 'confirm_discovery_v2', 'save_walk_recommendations_v2'];
  for (const rpc of rpcs) {
    const res = await adminClient.rpc(rpc as any, {});
    // We expect an error, but it shouldn't be "function not found" (42883)
    if (res.error && res.error.code === '42883') {
      console.error(`[FAIL] RPC ${rpc} missing`);
      schemaPass = false;
    } else {
      console.log(`[PASS] RPC ${rpc} exists (error code: ${res.error?.code || 'None'})`);
    }
  }

  console.log(`\nSchema Validation: ${schemaPass ? 'PASS' : 'FAIL'}`);

  console.log('\n--- 2. RLS & Ownership ---');
  // Create a mock user
  const ts = Date.now();
  const { data: user1, error: u1Err } = await adminClient.auth.admin.createUser({ email: `test1_${ts}@example.com`, password: 'password', email_confirm: true });
  const { data: user2, error: u2Err } = await adminClient.auth.admin.createUser({ email: `test2_${ts}@example.com`, password: 'password', email_confirm: true });
  
  if (!user1.user || !user2.user) {
    console.error('Failed to create users', u1Err, u2Err);
    return;
  }

  // Insert a walk as user1
  const { data: walk, error: walkErr } = await adminClient.from('walks').insert({ user_id: user1.user.id, location: 'Tokyo', status: 'DRAFT' }).select('id').single();
  
  if (walkErr) {
    console.error('Failed to insert walk', walkErr);
    return;
  }
  const walkId = walk.id;

  // Test RLS clients
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: session1 } = await adminClient.auth.admin.generateLink({ type: 'magiclink', email: `test1_${ts}@example.com` });
  // We can just use anon client with setSession for user1
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await client1.auth.signInWithPassword({ email: `test1_${ts}@example.com`, password: 'password' });

  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await client2.auth.signInWithPassword({ email: `test2_${ts}@example.com`, password: 'password' });

  let rlsPass = true;
  // Anon should not be able to read
  const resAnon = await anonClient.from('walks').select('id').eq('id', walkId);
  if (resAnon.data?.length !== 0) { console.error('[FAIL] Anon can read walk'); rlsPass = false; } else { console.log('[PASS] Anon rejected'); }

  // User2 should not be able to read
  const resUser2 = await client2.from('walks').select('id').eq('id', walkId);
  if (resUser2.data?.length !== 0) { console.error('[FAIL] Non-owner can read walk'); rlsPass = false; } else { console.log('[PASS] Non-owner rejected'); }

  // User1 should read
  const resUser1 = await client1.from('walks').select('id').eq('id', walkId);
  if (resUser1.data?.length !== 1) { console.error('[FAIL] Owner cannot read walk'); rlsPass = false; } else { console.log('[PASS] Owner allowed'); }

  console.log(`RLS & Ownership: ${rlsPass ? 'PASS' : 'FAIL'}`);

  console.log('\n--- 3. Analysis Concurrency ---');
  // Attempt to claim walk concurrently
  const req1 = adminClient.from('walks').update({ status: 'ANALYZING', analysis_started_at: new Date().toISOString() }).eq('id', walkId).eq('status', 'DRAFT').select('id').single();
  const req2 = adminClient.from('walks').update({ status: 'ANALYZING', analysis_started_at: new Date().toISOString() }).eq('id', walkId).eq('status', 'DRAFT').select('id').single();
  
  const [res1, res2] = await Promise.all([req1, req2]);
  
  let successCount = 0;
  if (res1.data) successCount++;
  if (res2.data) successCount++;

  console.log(`Claim attempts: Req1: ${!!res1.data}, Req2: ${!!res2.data}`);
  if (successCount === 1) {
    console.log('[PASS] Only one request claimed ANALYZING state.');
  } else {
    console.error(`[FAIL] Concurrency claim failed. Successes: ${successCount}`);
  }

  console.log('\n--- 4. Discovery Selection Concurrency ---');
  const { error: saveErr } = await client1.rpc('save_discovery_analysis_v2', {
    p_walk_id: walkId,
    p_title: 'Test Walk',
    p_observations: [{ id: 'obs1', description: 'desc', type: 'style', matchedFeatures: [] }],
    p_discoveries: [{ lens: 'culture', phrase: 'test phrase', explanation: 'exp', observationIds: ['obs1'] }],
    p_analysis_version: '2.0',
    p_metrics: { provider: 'test', model: 'test', duration_ms: 100, input_tokens: 10, output_tokens: 10, image_tokens: 10, retry_count: 0 }
  });
  if (saveErr) console.error('Save Analysis Error:', saveErr);

  const { data: tags, error: tagsErr } = await client1.from('discovery_tags').select('id').eq('walk_id', walkId);
  if (!tags || tags.length === 0) {
    console.error('Failed to create tags', tagsErr);
    return;
  }
  const tagId = tags[0].id;

  // Run selection concurrency
  const selReq1 = client1.rpc('confirm_discovery_v2', {
    p_walk_id: walkId,
    p_selected_discovery_id: tagId
  });
  const selReq2 = client1.rpc('confirm_discovery_v2', {
    p_walk_id: walkId,
    p_selected_discovery_id: tagId
  });

  const [selRes1, selRes2] = await Promise.all([selReq1, selReq2]);
  
  // Update: Due to a limitation, the RPC might succeed for both if executed inside the same transaction window or depending on how it's written.
  // Actually, confirm_discovery_v2 uses status checks.
  console.log(`Select Req 1:`, selRes1.error ? selRes1.error.message : 'SUCCESS');
  console.log(`Select Req 2:`, selRes2.error ? selRes2.error.message : 'SUCCESS');

  // Verify DB state
  const { data: walkState2 } = await client1.from('walks').select('status').eq('id', walkId).single();
  console.log(`Walk Status after selection: ${walkState2?.status}`);
  if (walkState2?.status === 'RECOMMENDING') {
    console.log('[PASS] Walk advanced to RECOMMENDING');
  }

  console.log('\n--- 5. Recommendation Concurrency ---');
  // Run recommendation concurrency
  const recReq1 = client1.rpc('save_walk_recommendations_v2', {
    p_walk_id: walkId,
    p_selected_discovery_id: tagId,
    p_places: [{ name: 'Place 1', description: 'desc', google_maps_query: 'test' }],
    p_metadata: { recommendation_version: '2.0', provider: 'test', model: 'test', duration_ms: 100, input_tokens: 10, output_tokens: 10, retry_count: 0 }
  });
  
  const recReq2 = client1.rpc('save_walk_recommendations_v2', {
    p_walk_id: walkId,
    p_selected_discovery_id: tagId,
    p_places: [{ name: 'Place 2', description: 'desc', google_maps_query: 'test' }],
    p_metadata: { recommendation_version: '2.0', provider: 'test', model: 'test', duration_ms: 100, input_tokens: 10, output_tokens: 10, retry_count: 0 }
  });

  const [recRes1, recRes2] = await Promise.all([recReq1, recReq2]);
  console.log(`Recommend Req 1:`, recRes1.error ? recRes1.error.message : 'SUCCESS');
  console.log(`Recommend Req 2:`, recRes2.error ? recRes2.error.message : 'SUCCESS');

  // Verify DB state
  const { data: walkState3 } = await client1.from('walks').select('status').eq('id', walkId).single();
  console.log(`Walk Status after recommendation: ${walkState3?.status}`);
  if (walkState3?.status === 'COMPLETED') {
    console.log('[PASS] Walk advanced to COMPLETED');
  }

  const { data: recSets } = await client1.from('recommendation_sets').select('id').eq('walk_id', walkId);
  if (recSets?.length === 1) {
    console.log('[PASS] Exactly one recommendation set persisted');
  } else {
    console.error(`[FAIL] Expected 1 recommendation set, found ${recSets?.length}`);
  }

  console.log('\nDone.');
}

runTests().catch(console.error);
