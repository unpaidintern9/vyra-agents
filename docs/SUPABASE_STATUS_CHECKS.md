# Supabase Status Checks

Supabase live checks use the browser-safe anon key only.

## Why Anon Key Only

The dashboard is a frontend app. Service role keys bypass Row Level Security and must never be exposed in browser code, Vite env variables, screenshots, logs, or committed files.

## Table States

- `prepared`: mock/foundation status before live checks run.
- `reachable`: anon read probe completed.
- `protected`: table appears protected by RLS or API permissions.
- `missing`: table appears missing or not exposed through the Data API.
- `unknown`: the check failed in a way that cannot be safely classified.

Protected does not mean broken. Newly created public tables may be intentionally inaccessible to anon users.

## Expected Tables

The dashboard checks the agent memory tables and gym migration tables created during Phase 3. The checks are read/select probes only.

## Troubleshooting

- Missing credentials: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Protected tables: review RLS and Data API exposure in Supabase before deciding whether read access is appropriate.
- Missing tables: confirm migrations were pushed from Vyra-Part-1.

