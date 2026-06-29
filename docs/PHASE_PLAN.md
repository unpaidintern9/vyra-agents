# Phase Plan

## Phase 0

Local repo setup, GitHub connection, folder structure, docs.

## Phase 1

Dashboard shell with mock data, sidebar, overview cards, ecosystem map, agent status, integration status, workflow feed.

## Phase 2

Agent Memory Foundation + Migration Agent MVP.

Status: In progress in this repo as a local/mock foundation.

Includes:

- Agent memory SQL foundation stubs.
- Gym migration SQL foundation stubs.
- Local TypeScript Migration Agent validation and matching logic.
- Mock Derby City Martial Arts import batch.
- Dashboard Migration page with summary cards, validation issues, member matching, offline member support, gym review checklist, and mock approval state.

Boundaries:

- No production data is connected.
- No migrations are applied.
- No AI is implemented.
- SQL files are foundation stubs for future review.
- Production connection comes later.

## Phase 3

Read-only integration foundation and Supabase migration promotion.

Status: In progress in this repo.

Includes:

- Mock GitHub repository health provider.
- Mock Supabase project health provider.
- Integration registry used by Overview and Integrations dashboard pages.
- Promotion of SQL foundation migrations into the real Vyra-Part-1 Supabase migration folder.
- Supabase CLI push run from Vyra-Part-1 only.

Boundaries:

- Dashboard GitHub integration is mock/readiness only.
- Dashboard Supabase integration is mock/readiness only.
- No production dashboard writes are implemented.
- No AI is implemented.
- Future phase will add real read-only API checks.

## Phase 4

Live read-only status checks for GitHub and Supabase.

Status: In progress in this repo.

Includes:

- Dashboard `.env.example`.
- Mock/live integration mode switch.
- GitHub GET-only repository status checks.
- Supabase anon-key read-only table checks.
- Migration table readiness states: prepared, reachable, protected, missing, unknown.
- Refresh Status action.
- Warning panel for missing credentials, inaccessible repos, protected tables, and fallback use.

Boundaries:

- No production writes.
- No inserts, updates, deletes, deploys, or migrations.
- No service role keys in frontend code or env examples.
- No AI is implemented.

## Phase 5

Integration Settings + Local Agent Run Logs.

Status: In progress in this repo.

Includes:

- Settings page with env checklist and safety guidance.
- Agent Memory page with local/mock runs, events, tasks, approvals, and notes.
- Audit Logs page with local/mock action history.
- Workflows page with safe dry-check actions.
- Migration Agent local dry-run button.
- Approval Queue UI foundation.

Boundaries:

- Local/mock state only.
- No production writes.
- No Supabase writes from the dashboard.
- No GitHub writes.
- No AI is implemented.
- Mock approve/run buttons only update local UI state.

## Phase 6

Local Persistence + Exportable Agent Reports.

Status: In progress in this repo.

Includes:

- Browser localStorage persistence for local/mock agent runs, audit logs, approvals, workflow dry-check results, and migration dry-run summaries.
- Reset/clear controls for local browser state.
- JSON and Markdown report exports for agent memory, audit logs, workflow runs, migration dry runs, and approval history.
- Migration dry-run history and report exports.
- Agent run detail view.
- Approval history.
- Workflow last dry-check summaries.

Boundaries:

- Browser localStorage only.
- No production writes.
- No Supabase writes.
- No GitHub writes from dashboard workflows.
- No database migrations are applied.
- No AI is implemented.

## Phase 7

Safe Supabase Agent Memory.

Status: In progress in this repo.

Includes:

- Dashboard support for Supabase agent-memory synchronization.
- Browser localStorage remains the automatic offline cache.
- Sync queue for pending, synced, and failed agent-memory records.
- Connection status monitoring and retry controls.
- Environment compatibility with dashboard `VITE_` keys and copied Vyra-Part-1 `EXPO_PUBLIC_` Supabase keys.

Boundaries:

- Writable tables are limited to `agent_runs`, `agent_events`, `agent_tasks`, `agent_status`, `agent_memory`, `agent_logs`, `agent_approvals`, `agent_workflows`, and `agent_integrations`.
- No production business tables are modified.
- No service role keys are used in browser code.
- No AI or autonomous agents are implemented.

## Phase 7B

Local Supabase Env Setup + Live Agent Table Sync Test.

Status: Tested in this repo.

Result:

- Local `.env.local` can configure live mode with Supabase URL and anon/publishable key.
- Dashboard detects configured Supabase values without displaying secrets.
- Migration dry run queues agent-memory sync attempts.
- Supabase RLS blocks anon inserts with `42501`, which preserves the safe boundary.
- LocalStorage fallback, retry, and local clear queue behavior remain functional.

## Phase 8

Production-grade Migration Agent with real staged imports, validation rules, matching rules, pending profiles, offline member support, gym review, and invitation prep.

## Phase 9

Workflow engine and production action logging.

## Phase 10

Approval queue for risky actions.

## Phase 11

Optional AI summaries and reasoning tools.

## Phase 12

Additional department agents.
