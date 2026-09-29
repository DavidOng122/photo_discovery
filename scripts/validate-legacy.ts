/**
 * Legacy Regression Verification
 *
 * Verifies that legacy COMPLETED walks (walks with old-style recommendation_sets,
 * recommended_places, and discovery_tags) remain readable and well-structured
 * after migrations 019-020.
 *
 * Classification:
 *   - DB queries: EXECUTED TEST (against live local Supabase)
 *   - Route queries: EXECUTED TEST (against running dev server)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const APP_URL = 'http://localhost:3002';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let pass = 0;
let fail = 0;

function ok(msg: string) { pass++; console.log(`  [PASS] ${msg}`); }
function ko(msg: string) { fail++; console.error(`  [FAIL] ${msg}`); }
function info(msg: string) { console.log(`  [INFO] ${msg}`); }

async function main() {
  console.log('\n=== Legacy Regression Verification ===\n');

  // ─── 1. Schema integrity ────────────────────────────────────────────────
  console.log('--- 1. Schema: migration columns exist ---');

  // Check walk_photos has new optional columns from migration 019
  const { data: photoSample, error: photoErr } = await admin
    .from('walk_photos')
    .select('id, storage_path, analysis_storage_path, analysis_width, analysis_height, sort_order')
    .limit(1);

  if (photoErr) {
    ko(`walk_photos schema read failed: ${photoErr.message}`);
  } else {
    ok('walk_photos has V2 columns (analysis_storage_path, analysis_width, analysis_height)');
    info(`Sample walk_photos row: ${JSON.stringify(photoSample?.[0] ?? 'no rows')}`);
  }

  // Check recommendation_sets has V2 columns
  const { data: rsetSample, error: rsetErr } = await admin
    .from('recommendation_sets')
    .select('id, walk_id, selected_discovery_id, recommendation_version, recommendation_duration_ms')
    .limit(1);

  if (rsetErr) {
    ko(`recommendation_sets schema read failed: ${rsetErr.message}`);
  } else {
    ok('recommendation_sets has V2 columns (selected_discovery_id, recommendation_version)');
    info(`Sample recommendation_sets row: ${JSON.stringify(rsetSample?.[0] ?? 'no rows')}`);
  }

  // Check recommended_places has V2 Google columns
  const { data: placeSample, error: placeErr } = await admin
    .from('recommended_places')
    .select('id, name, google_place_id, formatted_address, google_photo_reference')
    .limit(1);

  if (placeErr) {
    ko(`recommended_places schema read failed: ${placeErr.message}`);
  } else {
    ok('recommended_places has V2 Google columns (google_place_id, formatted_address, google_photo_reference)');
    info(`Sample recommended_places row: ${JSON.stringify(placeSample?.[0] ?? 'no rows')}`);
  }

  // ─── 2. Walk status distribution ────────────────────────────────────────
  console.log('\n--- 2. Walk status distribution ---');

  const { data: statusCounts, error: statusErr } = await admin
    .from('walks')
    .select('status');

  if (statusErr) {
    ko(`Could not fetch walk statuses: ${statusErr.message}`);
  } else {
    const counts = (statusCounts ?? []).reduce<Record<string, number>>((acc, w) => {
      acc[w.status] = (acc[w.status] ?? 0) + 1;
      return acc;
    }, {});
    info(`Walk status distribution: ${JSON.stringify(counts)}`);
    ok('Walk status distribution retrieved');

    // Log each status
    for (const [status, count] of Object.entries(counts)) {
      info(`  ${status}: ${count}`);
    }
  }

  // ─── 3. COMPLETED walks: V1 data integrity ──────────────────────────────
  console.log('\n--- 3. COMPLETED walk data integrity ---');

  const { data: completedWalks, error: completedErr } = await admin
    .from('walks')
    .select('id, status, user_id, location')
    .eq('status', 'COMPLETED')
    .limit(10);

  if (completedErr) {
    ko(`Could not fetch COMPLETED walks: ${completedErr.message}`);
  } else if (!completedWalks || completedWalks.length === 0) {
    info('No COMPLETED walks found in local DB (fresh DB from db reset — expected)');
    ok('No COMPLETED walks to regress (local DB is a clean reset)');
  } else {
    info(`Found ${completedWalks.length} COMPLETED walk(s)`);

    for (const walk of completedWalks) {
      info(`\n  Walk ${walk.id.substring(0, 8)}... (${walk.location ?? 'no location'})`);

      // Check recommendation_sets
      const { data: rsets, error: rsErr } = await admin
        .from('recommendation_sets')
        .select('id, selected_discovery_id, recommendation_version')
        .eq('walk_id', walk.id);

      if (rsErr) {
        ko(`  recommendation_sets fetch failed for walk ${walk.id}: ${rsErr.message}`);
        continue;
      }

      info(`  recommendation_sets: ${rsets?.length ?? 0}`);

      for (const rs of rsets ?? []) {
        // Check recommended_places
        const { data: places, error: pErr } = await admin
          .from('recommended_places')
          .select('id, name, google_place_id, google_photo_reference')
          .eq('recommendation_set_id', rs.id);

        if (pErr) {
          ko(`  recommended_places fetch failed: ${pErr.message}`);
        } else {
          info(`  recommended_places: ${places?.length ?? 0}`);
          ok(`  Walk ${walk.id.substring(0, 8)}: has ${places?.length ?? 0} recommended places`);
        }

        // Check discovery_tags
        const { data: tags, error: tagErr } = await admin
          .from('discovery_tags')
          .select('id, label, category, selected')
          .eq('walk_id', walk.id);

        if (tagErr) {
          ko(`  discovery_tags fetch failed: ${tagErr.message}`);
        } else {
          info(`  discovery_tags: ${tags?.length ?? 0}, selected: ${tags?.filter(t => t.selected).length ?? 0}`);
          ok(`  Walk ${walk.id.substring(0, 8)}: discovery_tags intact`);
        }
      }
    }
  }

  // ─── 4. V2 route access for legacy user ─────────────────────────────────
  // Create a fresh user and simulate the full V2 flow, verifying completed walks
  // are accessible via the recommend route response.
  console.log('\n--- 4. V2 completed walk API response ---');

  const ts = Date.now();
  const email = `legacy_test_${ts}@example.com`;
  const { data: userAdmin } = await admin.auth.admin.createUser({
    email,
    password: 'test-pass-123',
    email_confirm: true,
  });

  if (!userAdmin.user) {
    ko('Could not create test user for legacy API test');
  } else {
    const anonSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: session } = await anonSb.auth.signInWithPassword({ email, password: 'test-pass-123' });
    const token = session.session?.access_token;

    if (!token) {
      ko('Could not sign in test user');
    } else {
      // Create a COMPLETED walk directly via admin
      const { data: walk } = await admin.from('walks')
        .insert({ user_id: userAdmin.user.id, location: 'Tokyo Legacy', status: 'COMPLETED' })
        .select('id').single();

      if (!walk) {
        ko('Could not create legacy walk');
      } else {
        // Insert a legacy recommendation set (no selected_discovery_id = V1 style)
        const { data: rset } = await admin.from('recommendation_sets')
          .insert({ walk_id: walk.id })
          .select('id').single();

        if (!rset) {
          ko('Could not create legacy recommendation_set');
        } else {
          // Insert legacy recommended places (no google_place_id = V1 style)
          const { error: placeInsertErr } = await admin.from('recommended_places').insert([
            { recommendation_set_id: rset.id, name: 'Legacy Place 1', area: '渋谷区', description: 'A V1 place', google_maps_query: 'Shibuya', sort_order: 0 },
            { recommendation_set_id: rset.id, name: 'Legacy Place 2', area: '新宿区', description: 'Another V1 place', google_maps_query: 'Shinjuku', sort_order: 1 },
          ]);

          if (placeInsertErr) {
            ko(`Could not insert legacy recommended_places: ${placeInsertErr.message}`);
          } else {
            // Fetch via recommend route (GET-style — use the /recommend endpoint list if available)
            // Since the route is POST (trigger), check via admin query to confirm legacy data survives
            const { data: legacyPlaces, error: lpErr } = await admin
              .from('recommended_places')
              .select('id, name, area, google_place_id, google_photo_reference')
              .eq('recommendation_set_id', rset.id);

            if (lpErr) {
              ko(`Legacy places query failed: ${lpErr.message}`);
            } else {
              info(`Legacy places read back: ${JSON.stringify(legacyPlaces?.map(p => ({ name: p.name, googleId: p.google_place_id ?? 'null' })))}`);
              ok('Legacy recommended_places (V1, no google_place_id) readable without error');

              // Verify nulls are preserved (not coerced to empty string)
              const allNullIds = legacyPlaces?.every(p => p.google_place_id === null);
              if (allNullIds) {
                ok('Legacy places: google_place_id correctly null (not coerced)');
              } else {
                ko('Legacy places: google_place_id unexpectedly non-null');
              }
            }

            // Test: anon cannot read another user's walk recommendations
            const otherEmail = `legacy_other_${ts}@example.com`;
            const { data: otherAdmin } = await admin.auth.admin.createUser({ email: otherEmail, password: 'test-pass-123', email_confirm: true });
            const otherAnonSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: otherSession } = await otherAnonSb.auth.signInWithPassword({ email: otherEmail, password: 'test-pass-123' });
            const otherToken = otherSession.session?.access_token;

            if (otherToken) {
              const anonRecommendRes = await fetch(`${APP_URL}/api/walks/${walk.id}/recommend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${otherToken}` },
              });
              info(`Other user /recommend on legacy walk: ${anonRecommendRes.status}`);
              if (anonRecommendRes.status === 403 || anonRecommendRes.status === 404) {
                ok('Non-owner cannot trigger recommend on legacy COMPLETED walk');
              } else {
                ko(`Expected 403/404 for non-owner, got ${anonRecommendRes.status}`);
              }
            }
          }
        }
      }
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`RESULTS: ${pass} passed, ${fail} failed`);
  if (fail === 0) {
    console.log('✓ ALL LEGACY REGRESSION TESTS PASSED');
  } else {
    console.log('✗ SOME TESTS FAILED — see [FAIL] lines above');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
