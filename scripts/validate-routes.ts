import { createClient } from '@supabase/supabase-js';

process.env.MOCK_GOOGLE_PLACES = 'true';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = 'http://localhost:3002';

const adminSb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let passCount = 0;
let failCount = 0;

function pass(msg: string) { passCount++; console.log(`  [PASS] ${msg}`); }
function fail(msg: string) { failCount++; console.error(`  [FAIL] ${msg}`); }
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
  console.log('\n=== Setting up test users ===');
  const ts = Date.now();
  const ownerEmail = `owner_${ts}@example.com`;
  const otherEmail = `other_${ts}@example.com`;

  const { data: ownerAdmin } = await adminSb.auth.admin.createUser({ email: ownerEmail, password: 'test-password-123', email_confirm: true });
  const { data: otherAdmin } = await adminSb.auth.admin.createUser({ email: otherEmail, password: 'test-password-123', email_confirm: true });

  if (!ownerAdmin.user || !otherAdmin.user) throw new Error('Failed to create test users');

  const ownerId = ownerAdmin.user.id;

  // Sign in to get real JWT tokens
  const ownerAnonSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const otherAnonSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: ownerAuth, error: ownerAuthErr } = await ownerAnonSb.auth.signInWithPassword({ email: ownerEmail, password: 'test-password-123' });
  const { data: otherAuth, error: otherAuthErr } = await otherAnonSb.auth.signInWithPassword({ email: otherEmail, password: 'test-password-123' });

  if (!ownerAuth.session || !otherAuth.session) {
    throw new Error(`Failed to sign in: ${ownerAuthErr?.message} / ${otherAuthErr?.message}`);
  }

  const ownerToken = ownerAuth.session.access_token;
  const otherToken = otherAuth.session.access_token;

  console.log(`Owner: ${ownerId.substring(0, 8)}...`);

  // Helper to build headers with real JWT token
  const ownerHeaders = (extra: Record<string, string> = {}) => ({
    'Authorization': `Bearer ${ownerToken}`,
    ...extra,
  });
  const otherHeaders = (extra: Record<string, string> = {}) => ({
    'Authorization': `Bearer ${otherToken}`,
    ...extra,
  });

  // ─── Setup Walk ───────────────────────────────────────────────────────
  const { data: walk, error: walkErr } = await adminSb.from('walks')
    .insert({ user_id: ownerId, location: 'Tokyo', status: 'DRAFT' })
    .select('id').single();
  if (walkErr || !walk) throw new Error('Failed to create walk: ' + walkErr?.message);
  const walkId = walk.id;
  console.log(`Walk: ${walkId}`);

  // Insert photos using correct schema (no location column in walk_photos)
  const { error: photoErr } = await adminSb.from('walk_photos').insert([
    { walk_id: walkId, storage_path: 'test/p1.jpg', sort_order: 1 },
    { walk_id: walkId, storage_path: 'test/p2.jpg', sort_order: 2 },
    { walk_id: walkId, storage_path: 'test/p3.jpg', sort_order: 3 },
  ]);
  if (photoErr) throw new Error('Failed to insert photos: ' + photoErr.message);

  // ─── TEST 1: Concurrent /analyze ─────────────────────────────────────
  console.log('\n=== TEST 1: Concurrent /analyze (idempotency) ===');
  await adminSb.from('walks').update({ status: 'DRAFT', analysis_started_at: null }).eq('id', walkId);

  const [a1, a2] = await Promise.all([
    fetch(`${APP_URL}/api/walks/${walkId}/analyze`, { method: 'POST', headers: ownerHeaders() }),
    fetch(`${APP_URL}/api/walks/${walkId}/analyze`, { method: 'POST', headers: ownerHeaders() }),
  ]);

  console.log(`  Analyze Res 1: ${a1.status}, Analyze Res 2: ${a2.status}`);
  const aStatuses = [a1.status, a2.status].sort();

  // One should win (200 → 200 with TAG_SELECTION result), other gets 202 (in-progress)
  if ((aStatuses.includes(202) && aStatuses.includes(200)) || aStatuses.every(s => s === 200)) {
    pass('Concurrent analyze: race resolved correctly (202 or both 200)');
  } else {
    const ab1 = await a1.json().catch(() => ({}));
    const ab2 = await a2.json().catch(() => ({}));
    fail(`Unexpected concurrent analyze responses: ${aStatuses.join(', ')} — ${JSON.stringify(ab1)}, ${JSON.stringify(ab2)}`);
  }

  // Wait for async analysis to complete
  await sleep(5000);
  const { data: metrics1 } = await adminSb.from('ai_request_metrics').select('id, stage').eq('walk_id', walkId).eq('stage', 'vision');
  console.log(`  Vision AI invocations recorded: ${metrics1?.length ?? 0}`);
  if ((metrics1?.length ?? 0) === 1) {
    pass('Vision AI called exactly once (concurrency protected by ANALYZING status lock)');
  } else {
    fail(`Vision AI invocations: ${metrics1?.length ?? 'null'} (expected 1)`);
  }

  // ─── TEST 2: Non-owner rejection ──────────────────────────────────────
  console.log('\n=== TEST 2: Non-owner route access rejection ===');
  await adminSb.from('walks').update({ status: 'DRAFT', analysis_started_at: null }).eq('id', walkId);
  await adminSb.from('ai_request_metrics').delete().eq('walk_id', walkId);
  await adminSb.from('discovery_tags').delete().eq('walk_id', walkId);

  const nonOwnerAnalyze = await fetch(`${APP_URL}/api/walks/${walkId}/analyze`, {
    method: 'POST',
    headers: otherHeaders(),
  });
  console.log(`  Non-owner /analyze: ${nonOwnerAnalyze.status}`);
  if (nonOwnerAnalyze.status === 403 || nonOwnerAnalyze.status === 404) {
    pass('Non-owner rejected from /analyze (403 or 404)');
  } else {
    // Get the body to understand what happened
    const body = await nonOwnerAnalyze.json().catch(() => ({}));
    fail(`Non-owner /analyze returned ${nonOwnerAnalyze.status}: ${JSON.stringify(body)}`);
  }

  // ─── TEST 3: /select-discovery concurrency ────────────────────────────
  console.log('\n=== TEST 3: Concurrent /select-discovery ===');
  // Advance walk to TAG_SELECTION
  await adminSb.from('walks').update({ status: 'TAG_SELECTION' }).eq('id', walkId);
  // Add discovery tags
  const { data: tagData } = await adminSb.from('discovery_tags')
    .insert([
      { walk_id: walkId, label: 'コーヒー文化', category: 'Culture', reason: 'Coffee culture' },
      { walk_id: walkId, label: '路地裏の美学', category: 'Architecture', reason: 'Alley aesthetics' },
    ])
    .select('id');
  const discoveryId = tagData?.[0]?.id;

  if (!discoveryId) {
    fail('Could not create discovery tags for test');
  } else {
    const [s1, s2] = await Promise.all([
      fetch(`${APP_URL}/api/walks/${walkId}/select-discovery`, {
        method: 'POST',
        headers: ownerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ discoveryId }),
      }),
      fetch(`${APP_URL}/api/walks/${walkId}/select-discovery`, {
        method: 'POST',
        headers: ownerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ discoveryId }),
      }),
    ]);
    console.log(`  Select Res 1: ${s1.status}, Select Res 2: ${s2.status}`);
    const sStatuses = [s1.status, s2.status];
    // One or both should succeed (200), or idempotent (200+200), or concurrent lock (200+409)
    if (sStatuses.every(s => s === 200) || (sStatuses.includes(200) && sStatuses.includes(409))) {
      pass(`select-discovery concurrency handled: ${sStatuses.join(', ')}`);
    } else {
      const b1 = await s1.json().catch(() => ({}));
      const b2 = await s2.json().catch(() => ({}));
      fail(`select-discovery unexpected: ${sStatuses.join(', ')} — ${JSON.stringify(b1)}, ${JSON.stringify(b2)}`);
    }
  }

  // ─── TEST 4: /recommend concurrency ──────────────────────────────────
  console.log('\n=== TEST 4: Concurrent /recommend ===');
  // Ensure walk is in RECOMMENDING with recommendation_started_at = null
  await adminSb.from('walks').update({ status: 'RECOMMENDING', recommendation_started_at: null }).eq('id', walkId);

  const [r1, r2] = await Promise.all([
    fetch(`${APP_URL}/api/walks/${walkId}/recommend`, { method: 'POST', headers: ownerHeaders() }),
    fetch(`${APP_URL}/api/walks/${walkId}/recommend`, { method: 'POST', headers: ownerHeaders() }),
  ]);
  console.log(`  Recommend Res 1: ${r1.status}, Recommend Res 2: ${r2.status}`);
  const rStatuses = [r1.status, r2.status].sort();
  // One should claim (200), one should get 202 (in-progress), or both 200 if they race and both succeed
  if ((rStatuses.includes(200) && rStatuses.includes(202)) || rStatuses.every(s => s === 200)) {
    pass(`Concurrent /recommend handled: ${rStatuses.join(', ')}`);
  } else {
    const rb1 = await r1.json().catch(() => ({}));
    const rb2 = await r2.json().catch(() => ({}));
    fail(`Concurrent /recommend unexpected: ${rStatuses.join(', ')} — ${JSON.stringify(rb1)}, ${JSON.stringify(rb2)}`);
  }

  await sleep(5000);
  const { data: metrics2 } = await adminSb.from('ai_request_metrics').select('id, stage').eq('walk_id', walkId).eq('stage', 'recommendation');
  console.log(`  Recommendation AI invocations: ${metrics2?.length ?? 0}`);
  if ((metrics2?.length ?? 0) === 1) {
    pass('Recommendation AI called exactly once');
  } else {
    fail(`Recommendation AI invocations: ${metrics2?.length ?? 'null'} (expected 1)`);
  }

  // ─── TEST 5: Anon access rejection ──────────────────────────────────
  console.log('\n=== TEST 5: Anonymous access rejection ===');
  const anonRes = await fetch(`${APP_URL}/api/walks/${walkId}/analyze`, { method: 'POST' });
  console.log(`  Anon /analyze: ${anonRes.status}`);
  if (anonRes.status === 401) {
    pass('Anonymous request rejected with 401');
  } else {
    fail(`Anonymous request returned ${anonRes.status} (expected 401)`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
  if (failCount === 0) {
    console.log('✓ ALL ROUTE TESTS PASSED');
  } else {
    console.log('✗ SOME TESTS FAILED — see [FAIL] lines above');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
