import { createClient } from '@supabase/supabase-js';

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
  console.log(`Found walk in ANALYZING state: ${walk.id}. Simulating retry API call...`);
  
  const res = await fetch(`http://localhost:3000/api/walks/${walk.id}/analyze`, {
    method: 'POST'
  });
  
  const data = await res.json();
  console.log("Analyze API Response:", data);
  
  // Verify DB state
  const { data: walkData } = await supabase.from('walks').select('status, title').eq('id', walk.id).single();
  console.log("Walk Status:", walkData?.status);
  console.log("Walk Title:", walkData?.title);
  
  const { data: tags } = await supabase.from('discovery_tags').select('*').eq('walk_id', walk.id);
  console.log(`Found ${tags?.length} discovery tags for walk.`);
  if (tags && tags.length > 0) {
    console.log("First tag:", tags[0]);
  }
}

run().catch(console.error);
