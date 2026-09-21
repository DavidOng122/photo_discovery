import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Note: This client uses the service role key and bypasses RLS.
// It should only be used in server environments (Server Components, Route Handlers, Server Actions)
// when elevated privileges are absolutely necessary.
// DO NOT use this for normal user operations.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
