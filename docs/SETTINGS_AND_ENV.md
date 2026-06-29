# Settings And Environment

Phase 5 adds a Settings page for configuration guidance.

## Setup

```bash
cd dashboard
cp .env.example .env
npm run dev
```

Optional live read-only checks:

- Add `VITE_GITHUB_TOKEN` if private repos or higher GitHub rate limits are needed.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Supabase read-only status checks.

## Phase 7B Live Agent Sync Env

For local live agent-memory sync testing, create `dashboard/.env.local`:

```bash
VITE_VYRA_INTEGRATION_MODE=live
VITE_GITHUB_OWNER=unpaidintern9
VITE_GITHUB_REPOS=vyra-agents,Vyra-Part-1,Vyra-Software,vyra-website
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
VITE_SUPABASE_PROJECT_NAME=Vyra Production
VITE_SUPABASE_ENVIRONMENT=production
```

Get the Supabase URL and anon/publishable key from the Supabase project settings. Never use the service role key in dashboard env files.

`.env.local` is ignored by git and must not be committed.

## Phase 8 Edge Function Write Env

Agent-memory Edge Function writes are disabled by default. To enable local testing:

```bash
VITE_AGENT_MEMORY_WRITE_ENABLED=true
VITE_AGENT_MEMORY_WRITE_FUNCTION=agent-memory-write
VITE_AGENT_MEMORY_WRITE_TOKEN=<temporary-local-operator-token>
```

The token must match the Edge Function secret `AGENT_MEMORY_WRITE_TOKEN`. Do not commit this value and do not display it in the dashboard.

## Safety

The dashboard must never display full tokens, keys, or secrets.

Use only anon or publishable keys in frontend code. Service role keys are forbidden in the browser because they bypass Row Level Security.

Phase 8 agent-memory sync uses an Edge Function for writes to approved `agent_*` tables. It must not write to Supabase business tables, GitHub, billing, email, or production member systems.
