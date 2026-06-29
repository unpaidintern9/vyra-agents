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

Secure Server-Side Agent Memory Writes.

Status: In progress in this repo.

Includes:

- Dashboard support for the `agent-memory-write` Supabase Edge Function.
- Direct browser table inserts disabled by default.
- Local-only queue behavior when function writes are disabled.
- Retryable Edge Function sync attempts when enabled and configured.
- Settings visibility for disabled, configured, missing token, and missing Supabase env states.

Boundaries:

- No service role keys in the browser.
- No public anon insert policies.
- No production business data writes.
- No AI or autonomous agents.

## Phase 9

Engineering Agent Knowledge Graph MVP.

Status: In progress in this repo.

Includes:

- Local read-only scanner script for the Vyra ecosystem repositories.
- Static `dashboard/public/engineering-graph.json` output.
- Engineering dashboard page with graph summary, repository explorer, knowledge graph filters, Supabase map, dependency map, and exports.
- Local Deno tooling under `.tools/deno` for Supabase Edge Function tests.
- Documentation for Engineering Agent boundaries, graph schema, local tooling, and Deno setup.

Boundaries:

- No AI is implemented.
- No autonomous code-writing agents are implemented.
- No production app tables are written.
- No production business data is modified.
- Graph stores metadata only, not file contents.
- Env variable names may be recorded; values are never recorded.

## Phase 10

Engineering Graph Drill-Down + Impact Analysis.

Status: In progress in this repo.

Includes:

- Lazy-loaded Engineering page.
- Search across graph nodes.
- Selected-node detail panel.
- Inbound/outbound relationship explorer.
- Impact analysis utility with direct and second-order dependencies/dependents.
- Table impact, route/screen impact, and migration history views.
- JSON and Markdown exports for node detail and impact reports.

## Phase 11

Engineering Agent Ownership + Health Mapping.

Status: In progress in this repo.

Includes:

- Ownership group and feature area metadata on graph nodes.
- Repo health scores with risk level, high-risk node count, missing docs, orphan candidates, and relationship warnings.
- Route-to-component, table-to-screen, function-to-table, table read/write, and migration-to-table relationship maps where detected.
- Dashboard sections for Ownership Overview, Product Area Map, Repo Health Score, Table-to-Screen Map, Function-to-Table Map, and Risk & Warning Queue.
- Exports for ownership maps, repo health, risk queue, table-to-screen, function-to-table, missing docs, and orphan candidates.
- `engineering-ownership-health-scan` workflow records for local dashboard activity and approved Agent Memory sync.

Boundaries:

- No AI is implemented.
- No autonomous code-writing agents are implemented.
- No production business data is modified.
- No production app tables are written.
- Orphan, missing-doc, risk, and broken-relationship findings are advisory candidates only.
- Graph stores metadata only, not file contents.

## Phase 12

Engineering Fix Queue + Documentation Gap Planner.

Status: In progress in this repo.

Includes:

- Local Engineering Fix Queue generated from graph warnings, missing docs, orphan candidates, high-risk nodes, and repo health scores.
- Documentation Gap Planner grouped by repo, owner, and feature area.
- Orphan Review Queue with review-only wording.
- Broken Relationship Queue with recommended investigations.
- Repo Health Improvement Plan with estimated effort and expected impact.
- Local-only task status actions: reviewed, dismissed, planned, done, reset.
- Backlog JSON/Markdown exports and planning reports.
- `engineering-fix-queue-planning` workflow records for local dashboard activity and approved Agent Memory sync.

Boundaries:

- No AI is implemented.
- No autonomous code-writing agents are implemented.
- No production business data is modified.
- No production app tables are written.
- No app, website, desktop, or backend code is changed by this planning queue.
- No GitHub issues are created.
- Backlog items are advisory planning tasks only.
- Local status persistence uses browser localStorage.

## Phase 13

Production-grade Migration Agent with real staged imports, validation rules, matching rules, pending profiles, offline member support, gym review, and invitation prep.

## Phase 14

Workflow engine and production action logging.

## Phase 15

Approval queue for risky actions.

## Phase 16

Optional AI summaries and reasoning tools.

## Phase 17

Additional department agents.
