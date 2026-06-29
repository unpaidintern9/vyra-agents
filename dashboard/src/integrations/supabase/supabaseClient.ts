import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseEnvStatus(): { url: 'Found' | 'Missing'; key: 'Found' | 'Missing' } {
  return {
    url: supabaseUrl() ? 'Found' : 'Missing',
    key: supabaseAnonOrPublishableKey() ? 'Found' : 'Missing',
  };
}

export function getSupabaseClientConfig(): { url: string; key: string } | null {
  const url = supabaseUrl();
  const key = supabaseAnonOrPublishableKey();
  return url && key ? { url, key } : null;
}

export function createReadOnlySupabaseClient(): SupabaseClient | null {
  return createBrowserSupabaseClient();
}

export function createAgentMemorySupabaseClient(): SupabaseClient | null {
  return createBrowserSupabaseClient();
}

function createBrowserSupabaseClient(): SupabaseClient | null {
  const url = supabaseUrl();
  const anonKey = supabaseAnonOrPublishableKey();

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function supabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || import.meta.env.EXPO_PUBLIC_SUPABASE_URL || '';
}

function supabaseAnonOrPublishableKey(): string {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  );
}
