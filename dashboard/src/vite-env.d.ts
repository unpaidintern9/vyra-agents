/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly EXPO_PUBLIC_SUPABASE_URL?: string;
  readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_AGENT_MEMORY_WRITE_ENABLED?: string;
  readonly VITE_AGENT_MEMORY_WRITE_FUNCTION?: string;
  readonly VITE_AGENT_MEMORY_WRITE_TOKEN?: string;
}
