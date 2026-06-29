# Supabase Migration Promotion

Phase 3 promotes the Phase 2 SQL foundation stubs into the real Vyra-Part-1 Supabase migration folder.

## Source Files

From Vyra Agents:

- `supabase/migrations/20260629000100_agent_memory_foundation.sql`
- `supabase/migrations/20260629000200_gym_migration_foundation.sql`

## Destination

Vyra-Part-1:

- `/Users/vyra/Documents/Vyra-Part-1/supabase/migrations/`

## Rules

- Do not delete the Vyra Agents copies; they remain documentation/foundation references.
- Do not overwrite existing migrations.
- Confirm filenames do not conflict.
- Confirm new timestamps sort after existing migrations.
- Apply migrations only from Vyra-Part-1 using Supabase CLI.
- Do not run Supabase CLI pushes from the Vyra Agents repo.

## Production Boundary

The Supabase CLI push applies approved schema foundations. The dashboard still does not write to production, query production directly, or implement AI.

