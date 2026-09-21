'use client';

import { useEffect } from 'react';
import { ensureAnonymousUser } from '@/lib/auth/ensureAnonymousUser';

export function AnonymousAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if environment variables are available before attempting to connect
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      ensureAnonymousUser().catch(console.error);
    } else {
      console.warn('Supabase credentials missing. Anonymous auth skipped.');
    }
  }, []);
  
  return <>{children}</>;
}
