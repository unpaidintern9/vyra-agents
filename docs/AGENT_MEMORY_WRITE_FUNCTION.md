# Agent Memory Write Function

Phase 8 adds support for the `agent-memory-write` Supabase Edge Function as the approved server-side write path for Vyra Agents operational memory.

## Environment

Add these local-only values to `dashboard/.env.local` when testing function writes:

```bash
VITE_AGENT_MEMORY_WRITE_ENABLED=true
VITE_AGENT_MEMORY_WRITE_FUNCTION=agent-memory-write
VITE_AGENT_MEMORY_WRITE_TOKEN=<temporary-local-operator-token>
```

The token must match the Supabase Edge Function secret `AGENT_MEMORY_WRITE_TOKEN`.

Do not commit `.env.local`. Do not put a Supabase service role key in the dashboard.

## Behavior

- Disabled by default: records stay in the local queue.
- Enabled and configured: pending queue records are sent to the Edge Function.
- Missing token or function failure: records remain retryable in localStorage.
- Clear Queue clears only the browser queue.

The dashboard never performs direct browser inserts into agent tables by default.

## Safety

The Edge Function validates the target table and accepts only approved `agent_*` tables. It rejects business tables, migration tables, and secret-looking payload fields.

No AI or autonomous agents are enabled in this phase.
