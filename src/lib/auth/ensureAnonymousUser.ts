import { createClient } from '../supabase/browser';

/**
 * Ensures an anonymous user session exists.
 * This should be called client-side (e.g. from a layout or provider) 
 * to establish the session without requiring a login screen.
 */
export async function ensureAnonymousUser() {
  const supabase = createClient();
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error checking session:', sessionError);
  }
  
  if (session?.user) {
    return session.user;
  }
  
  // No session exists, create an anonymous one
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('Failed to sign in anonymously:', error);
    return null;
  }
  
  return data.user;
}
