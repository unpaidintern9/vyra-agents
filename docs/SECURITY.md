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

Use only `VITE_SUPABASE_ANON_KEY` in the dashboard. Service role keys bypass RLS and are forbidden in frontend code.

## Secret Handling

Do not display tokens, anon keys, URLs with secrets, or full error payloads that may contain credentials. Dashboard warnings should explain the issue without leaking secrets.

## Approvals

High-risk actions such as production migrations, workflow deploys, billing changes, customer emails, and role changes require future human approval and production audit logging before they can be enabled.
