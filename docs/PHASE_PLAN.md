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

Production-grade Migration Agent with real staged imports, validation rules, matching rules, pending profiles, offline member support, gym review, and invitation prep.

## Phase 7

Workflow engine and production action logging.

## Phase 8

Approval queue for risky actions.

## Phase 9

Optional AI summaries and reasoning tools.

## Phase 10

Additional department agents.
