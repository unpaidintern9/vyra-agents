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
- Add `VITE_GITHUB_TOKEN_VYRA_PART_1` only when `Matthewalbin1/Vyra-Part-1` needs a separate Matthew-scoped token.
- Use `owner/repo` entries in `VITE_GITHUB_REPOS` for repositories owned outside `VITE_GITHUB_OWNER`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Supabase read-only status checks.

## Phase 7B Live Agent Sync Env

For local live agent-memory sync testing, create `dashboard/.env.local`:

```bash
VITE_VYRA_INTEGRATION_MODE=live
VITE_GITHUB_OWNER=unpaidintern9
VITE_GITHUB_REPOS=unpaidintern9/vyra-agents,Matthewalbin1/Vyra-Part-1,unpaidintern9/Vyra-Software,unpaidintern9/vyra-website
VITE_GITHUB_TOKEN=
VITE_GITHUB_TOKEN_VYRA_PART_1=
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

## Phase 14 GitHub Issue Creation Env

GitHub issue creation remains disabled and dry-run by default:

```bash
VITE_GITHUB_ISSUE_CREATION_ENABLED=false
VITE_GITHUB_ISSUE_CREATION_DRY_RUN=true
VITE_GITHUB_TOKEN=
VITE_GITHUB_TOKEN_VYRA_PART_1=
VITE_GITHUB_OWNER=unpaidintern9
```

For live local operator testing, Robert must explicitly set creation enabled, set dry-run false, and provide repo-appropriate GitHub tokens in ignored local env only. The dashboard still requires ready drafts, explicit clicks, and duplicate checks before any GitHub write.

## Phase 17 GitHub Token Resolution

`VITE_GITHUB_TOKEN` is the default token.

`VITE_GITHUB_TOKEN_VYRA_PART_1` is used only for `Matthewalbin1/Vyra-Part-1`. That repo can use a separate token because it is owned by Matthew's personal GitHub account, and personal owner boundaries can affect token access even when Robert is a collaborator.

If `VITE_GITHUB_TOKEN_VYRA_PART_1` is missing, the dashboard falls back to `VITE_GITHUB_TOKEN` for `Matthewalbin1/Vyra-Part-1`. If both tokens fail, the dashboard shows a warning for that repo only.

The Settings page shows only configured or missing status for the default GitHub token and the Vyra-Part-1 GitHub token. It must never show token values.

## Safety

The dashboard must never display full tokens, keys, or secrets.

Do not commit `.env.local`, `.env`, GitHub tokens, Supabase keys, Deno binaries, or raw import files. Commit `.env.example` only.

Use only anon or publishable keys in frontend code. Service role keys are forbidden in the browser because they bypass Row Level Security.

Phase 8 agent-memory sync uses an Edge Function for writes to approved `agent_*` tables. It must not write to Supabase business tables, billing, email, or production member systems.

Phase 14 and Phase 17 GitHub issue creation can write only to the configured GitHub repo issues endpoint after explicit approval and never writes to Supabase business tables.
