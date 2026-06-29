# Read-Only Integration Foundation

Phase 3 prepares the dashboard to show integration health without making live API calls.

## Current Implementation

Dashboard modules:

- `dashboard/src/integrations/github/`
- `dashboard/src/integrations/supabase/`
- `dashboard/src/integrations/integrationRegistry.ts`

These modules use mock data only.

## Future Implementation

Later phases can replace mock providers with read-only API clients that:

- log every check,
- avoid production writes,
- surface permissions clearly,
- report stale data,
- require approval before any risky action.

AI is still not implemented. If AI summaries are added later, they must be optional, metered, logged, and permission-controlled.

