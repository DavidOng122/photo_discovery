import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: walks } = await supabase.from('walks').select('id').eq('status', 'TAG_SELECTION').order('created_at', { ascending: false }).limit(1);
  if (!walks || walks.length === 0) {
    console.log("No walk found in TAG_SELECTION state.");
    return;
  }
  
  console.log("WALK_ID:", walks[0].id);
}

run().catch(console.error);
