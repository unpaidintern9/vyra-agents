/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly EXPO_PUBLIC_SUPABASE_URL?: string;
  readonly EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_AGENT_MEMORY_WRITE_ENABLED?: string;
  readonly VITE_AGENT_MEMORY_WRITE_FUNCTION?: string;
  readonly VITE_AGENT_MEMORY_WRITE_TOKEN?: string;
  readonly VITE_GITHUB_ISSUE_CREATION_ENABLED?: string;
  readonly VITE_GITHUB_ISSUE_CREATION_DRY_RUN?: string;
  readonly VITE_GITHUB_OWNER?: string;
  readonly VITE_GITHUB_TOKEN?: string;
  readonly VITE_GITHUB_TOKEN_VYRA_PART_1?: string;
  readonly VITE_GITHUB_REPOS?: string;
}
