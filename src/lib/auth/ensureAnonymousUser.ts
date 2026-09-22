import { createClient } from '../supabase/browser';

/**
 * Ensures an anonymous user session exists.
 * This should be called client-side (e.g. from a layout or provider) 
 * to establish the session without requiring a login screen.
 */
export async function ensureAnonymousUser() {
  const supabase = createClient();
  
  console.log('[Auth Debug] Checking session...');
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('[Auth Debug] Error checking session:', sessionError.message);
  }
  
  if (session?.user) {
    console.log('[Auth Debug] Session already exists. User ID:', session.user.id);
    return session.user;
  }
  
  console.log('[Auth Debug] No session exists. Starting anonymous sign-in...');
  
  // No session exists, create an anonymous one
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('[Auth Debug] Anonymous sign-in failed with error:', error.message, error.status);
    return null;
  }
  
  console.log('[Auth Debug] Anonymous sign-in succeeded. New User ID:', data.user?.id);
  
  return data.user;
}
