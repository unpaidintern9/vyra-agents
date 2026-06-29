# Security

## Phase 4 Boundary

Phase 4 is read-only.

## Phase 5 Boundary

Phase 5 adds local/mock action buttons only. They update local UI state and do not write to production systems.

Forbidden:

- inserts
- updates
- deletes
- deploys
- database migrations
- GitHub writes
- service role keys in the browser
- AI calls
- customer emails
- member invitations
- real organization memberships

## Environment Files

Never commit `.env`. Commit `.env.example` only.

## Supabase Keys

Use only anon or publishable Supabase keys in the dashboard. Supported local variable names are `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Service role keys bypass RLS and are forbidden in frontend code.

## Phase 7 Agent Memory Sync

The dashboard may write operational memory only to the approved `agent_*` tables. It must not modify production users, organizations, memberships, billing, workouts, nutrition, health, authentication, or other business data.

Local environment files are copied into `dashboard/` only for local development and are ignored by git. Only `.env.example` may be committed.

When Supabase is unavailable or permissions block writes, the dashboard keeps operating from localStorage and records pending sync queue items for retry.

## RLS Blocks

If anon writes to agent tables fail with row-level security errors, treat that as a safe protection boundary. Do not add public insert policies. Do not use a service role key in the frontend.

Future write enablement should use authenticated admin-only RLS or a server-side path such as an Edge Function where privileged credentials never reach the browser.

## Phase 8 Edge Function Writes

The approved write path is the `agent-memory-write` Supabase Edge Function. It uses a temporary shared-secret header for local/operator use until proper authenticated admin auth exists.

The dashboard may store only `VITE_AGENT_MEMORY_WRITE_TOKEN` locally in ignored env files. The Edge Function stores `AGENT_MEMORY_WRITE_TOKEN` as a Supabase function secret. Service role keys stay server-side only.

Direct browser inserts into Supabase tables are disabled by default and should not be re-enabled for production.

## Secret Handling

Do not display tokens, anon keys, URLs with secrets, or full error payloads that may contain credentials. Dashboard warnings should explain the issue without leaking secrets.

## Approvals

High-risk actions such as production migrations, workflow deploys, billing changes, customer emails, and role changes require future human approval and production audit logging before they can be enabled.
