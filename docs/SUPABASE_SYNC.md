# Supabase Sync

Phase 7 allows the dashboard to persist operational memory into Supabase agent tables while remaining read-first for production business data.

## Environment

Vyra Agents can use the same local Supabase configuration as Vyra-Part-1. The dashboard supports:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_SUPABASE_PUBLISHABLE_KEY
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Local `.env*` files may be copied into `dashboard/` for development, but real env files must never be committed. The only committable env file is `.env.example`.

## Connection Status

The dashboard reports:

- connected
- offline
- sync pending
- last sync
- records waiting
- sync errors

## Retry Behavior

Failed writes are kept in the sync queue with a retry count and sanitized error. Users can retry failed records or clear the local queue from Settings or Sync Queue.

## RLS Behavior

If Supabase returns row-level security errors for anon inserts, the dashboard treats the sync as failed and keeps the local fallback available. This is expected when the agent tables do not yet have safe authenticated write policies.

Do not fix this by exposing public insert policies or placing a service role key in frontend code. Future writes should be authenticated admin-only or routed through a secure server-side path.

## Safety

Writes are limited to agent-memory tables only. The dashboard must not write to users, athletes, coaches, organizations, billing, workouts, nutrition, health, authentication, memberships, or other production business tables.
