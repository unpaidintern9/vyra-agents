# Live Supabase Sync Test

Phase 7B configures the dashboard locally with frontend-safe Supabase values and tests agent-memory sync from the browser.

## Local Environment

Create `dashboard/.env.local` locally:

```bash
VITE_VYRA_INTEGRATION_MODE=live
VITE_GITHUB_OWNER=unpaidintern9
VITE_GITHUB_REPOS=unpaidintern9/vyra-agents,Matthewalbin1/Vyra-Part-1,unpaidintern9/Vyra-Software,unpaidintern9/vyra-website
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
VITE_SUPABASE_PROJECT_NAME=Vyra Production
VITE_SUPABASE_ENVIRONMENT=production
```

Do not commit `.env.local`. Do not place a service role key in browser env files.

## Test Result

The dashboard loaded in live mode and correctly detected configured Supabase URL and anon/publishable key without displaying secret values.

A Migration Agent dry run created local agent-memory records and queued sync attempts to approved `agent_*` tables only.

Supabase rejected anon inserts with `42501` row-level security errors, including on `agent_runs`, `agent_events`, `agent_tasks`, and `agent_logs`. This is a safe result: RLS is protecting the tables, and the dashboard retained local fallback state in localStorage.

Retry Failed re-attempted sync and remained safely blocked by RLS. Clear Queue cleared only the local browser sync queue and did not delete Supabase data.

## Future Safe Write Path

Do not add public anon insert policies for operational memory.

Future production sync should use one of these patterns:

- authenticated admin-only dashboard writes with restrictive RLS policies
- a secure server-side endpoint or Edge Function
- service role usage only on the server, never in frontend code
- immutable audit logging for production sync attempts

No production business tables should be writable from this dashboard phase.
