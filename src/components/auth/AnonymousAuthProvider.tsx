'use client';

import { useEffect } from 'react';
import { ensureAnonymousUser } from '@/lib/auth/ensureAnonymousUser';

export function AnonymousAuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[Auth Debug] AnonymousAuthProvider mounted');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log(`[Auth Debug] Env check: URL exists? ${!!url}, KEY exists? ${!!key}`);
    
    if (url && key) {
      ensureAnonymousUser().catch(err => console.error('[Auth Debug] Unhandled error:', err));
    } else {
      console.warn('[Auth Debug] Supabase credentials missing. Anonymous auth skipped.');
    }
  }, []);
  
  return <>{children}</>;
}
