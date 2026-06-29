# Security

## Phase 4 Boundary

Phase 4 is read-only.

Forbidden:

- inserts
- updates
- deletes
- deploys
- database migrations
- GitHub writes
- service role keys in the browser
- AI calls

## Environment Files

Never commit `.env`. Commit `.env.example` only.

## Supabase Keys

Use only `VITE_SUPABASE_ANON_KEY` in the dashboard. Service role keys bypass RLS and are forbidden in frontend code.

## Secret Handling

Do not display tokens, anon keys, URLs with secrets, or full error payloads that may contain credentials. Dashboard warnings should explain the issue without leaking secrets.
