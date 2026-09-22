/**
 * Validates required server-side environment variables.
 * Call this inside server-only API routes or server actions.
 * Never expose server secrets to the browser.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function validateAIConfig() {
  const missing: string[] = [];
  if (!process.env.AI_PROVIDER) missing.push('AI_PROVIDER');
  if (!process.env.AI_BASE_URL) missing.push('AI_BASE_URL');
  if (!process.env.AI_API_KEY) missing.push('AI_API_KEY');
  if (!process.env.AI_VISION_MODEL) missing.push('AI_VISION_MODEL');
  if (!process.env.AI_TEXT_MODEL) missing.push('AI_TEXT_MODEL');
  if (missing.length > 0) {
    throw new Error(`Missing AI configuration: ${missing.join(', ')}`);
  }
}

export function validateSearchConfig() {
  const missing: string[] = [];
  if (!process.env.SEARCH_PROVIDER) missing.push('SEARCH_PROVIDER');
  if (!process.env.TAVILY_API_KEY) missing.push('TAVILY_API_KEY');
  if (missing.length > 0) {
    throw new Error(`Missing search configuration: ${missing.join(', ')}`);
  }
}

export function validateSupabaseConfig() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (missing.length > 0) {
    throw new Error(`Missing Supabase configuration: ${missing.join(', ')}`);
  }
}
