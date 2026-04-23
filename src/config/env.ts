const env = import.meta.env;

export const SUPABASE_URL = env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
