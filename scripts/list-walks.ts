import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await sb.from('walks').select('id, status, title, created_at').order('created_at', { ascending: false }).limit(5);
  console.log(JSON.stringify(data, null, 2));
}
main();
