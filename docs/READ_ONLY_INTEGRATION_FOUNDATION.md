# Read-Only Integration Foundation

Phase 3 prepared mock integration shapes. Phase 4 adds optional live read-only checks with mock fallback.

## Current Implementation

Dashboard modules:

- `dashboard/src/integrations/github/`
- `dashboard/src/integrations/supabase/`
- `dashboard/src/integrations/integrationRegistry.ts`

These modules default to mock data. With `VITE_VYRA_INTEGRATION_MODE=live`, they attempt read-only GitHub and Supabase checks.

## Future Implementation

Later phases can replace mock providers with read-only API clients that:

- log every check,
- avoid production writes,
- surface permissions clearly,
- report stale data,
- require approval before any risky action.

AI is still not implemented. If AI summaries are added later, they must be optional, metered, logged, and permission-controlled.

## Phase 4 Safety

- GitHub calls are GET-only.
- Supabase calls use anon-key select probes only.
- Protected tables are displayed as protected, not treated as fatal.
- Missing credentials trigger warnings and fallback behavior.
- No service role keys are allowed in the dashboard.
