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

Engineering Agent GitHub Issue Draft Planner.

Status: In progress in this repo.

Includes:

- Local GitHub issue draft generation from Engineering Fix Queue items.
- Grouped issue templates by repo, category, owner, feature area, severity, and node type.
- Priority buckets P0 through P3 with sensitive-domain overrides.
- Issue Draft Planner dashboard section with summary, filters, table, and markdown preview.
- Local-only draft status actions: ready, draft, dismissed, exported.
- JSON and Markdown issue draft exports, including ready-for-GitHub and P0/P1 export sets.
- `engineering-github-issue-draft-planning` workflow records for local dashboard activity and approved Agent Memory sync.

Boundaries:

- No GitHub writes.
- No GitHub issues are created.
- GitHub creation requires a future approval-gated phase.
- No AI is implemented.
- No app, website, desktop, or backend code is changed.
- Draft statuses persist in browser localStorage.

## Phase 14

Approval-Gated GitHub Issue Creation.

Status: In progress in this repo.

Includes:

- GitHub issue creation client for Engineering Agent issue drafts.
- Dry-run default with no GitHub network write.
- Live creation gated by ready draft status, explicit user action, creation enabled, dry-run disabled, configured token, known owner/repo, and duplicate prevention.
- Hidden issue body markers for duplicate detection:
  - `<!-- vyra-agent-draft-id: DRAFT_ID -->`
  - `<!-- vyra-agent-source: engineering-agent -->`
- Local tracking under `vyra-agents:engineering-created-github-issues`.
- `engineering-github-issue-creation` workflow records for dry-run and live attempts.

Boundaries:

- No AI is implemented.
- No automatic GitHub issues are created.
- Default env keeps issue creation disabled and dry-run enabled.
- No live GitHub write is performed without explicit approval.
- No app, website, desktop, backend, database, or business data code is changed by this workflow.
- RLS and Supabase write boundaries are unchanged.

## Phase 15

Production-grade Migration Agent with real staged imports, validation rules, matching rules, pending profiles, offline member support, gym review, and invitation prep.

## Phase 16A

Migration Agent Operations refactor.

Includes:

- Migration page UI moved from `dashboard/src/App.tsx` into dedicated components under `dashboard/src/agents/migration/`.
- Dedicated components for migration queue, batch detail, member review, offline/non-app tracking, validation resolution, invitation preview, approval gate, and report actions.
- Shared migration UI helpers for local panels, tables, export buttons, summary cards, dry-run history, table readiness, and approval queue rendering.

Boundaries:

- Refactor only.
- Existing mock/local Migration Agent behavior preserved.
- No production writes.
- No business table writes.
- No invitation sending.
- No AI is implemented.

## Phase 16B

Migration Import Parser MVP.

Includes:

- Browser-local Import Wizard at the top of the Migration page.
- CSV, XLSX, and XLS parsing through the client-side `xlsx` parser, dynamically loaded when import parsing is used.
- File metadata display for filename, size, detected rows, detected columns, upload time, and parser mode.
- Automatic column detection for common gym export fields.
- Field mapping UI with mapped, unmapped, duplicate mapping, and missing required states.
- Local validation using existing Migration Agent validation rules.
- Review filters for all, errors, warnings, ready, and skipped rows.
- JSON, Markdown, and CSV validation report exports.
- Browser localStorage persistence for metadata, mappings, parsed rows, validation results, and wizard progress.

Boundaries:

- Local-only import review.
- No Supabase writes.
- No production data changes.
- No pending profiles are created.
- No organization memberships are created.
- No invitations are sent.
- No AI is implemented.

## Phase 16C

Migration Agent import parsing hardening.

Includes:

- Native browser-local CSV parsing kept first-class and recommended.
- Excel parsing retained through dynamically imported `xlsx` to preserve XLSX/XLS support.
- Parser boundary modules for limits, security checks, and sanitization.
- Import limits: 5 MB file size, 5,000 rows, 75 columns, and 500 characters per cell.
- Sanitized parsed rows persisted to localStorage instead of raw file binaries.
- Parser warnings/errors displayed separately from validation warnings.
- Excel local parsing warning shown in the wizard.
- CSV and Markdown export hardening for spreadsheet-formula-like values.
- Documentation for import security and package decision.

Boundaries:

- Local-only import review.
- No Supabase writes.
- No production data changes.
- No pending profiles are created.
- No organization memberships are created.
- No invitations are sent.
- No AI is implemented.

## Phase 16D

Migration Batch Builder preview.

Includes:

- Local Batch Builder after the Import Wizard on the Migration page.
- Conversion of validated Import Wizard rows into staged member previews.
- Pending profile, offline/non-app member, existing user match, and organization membership previews.
- Review checklist and approval packet generation.
- Browser localStorage persistence under `vyra-agents:migration-batch-preview`.
- JSON, Markdown, and CSV approval packet exports.
- Local Migration Agent event and audit log entries when previews are built or exported.

Boundaries:

- Preview-only batch planning.
- No Supabase writes.
- No production data changes.
- No pending profiles are created.
- No organization memberships are created.
- No invitations are sent.
- No raw uploaded file binaries are stored.
- No AI is implemented.

## Phase 16

Workflow engine and production action logging.

## Phase 17

Multi-token GitHub access and multi-agent foundations.

Includes:

- `VITE_GITHUB_TOKEN_VYRA_PART_1` support for `Matthewalbin1/Vyra-Part-1`.
- Repo-based GitHub token resolution for status checks, workflow status reads, duplicate checks, and approval-gated issue creation.
- Settings page status for default GitHub token and Vyra-Part-1 GitHub token without showing token values.
- Documentation of token resolution rules, token scoping, and secret-handling boundaries.
- Stronger foundations for Sales, Support, Product, Operations, Finance, and Marketing agents.
- `README.md`, `AGENT_CHARTER.md`, `PERMISSIONS.md`, `WORKFLOWS.md`, and `HARDENING.md` for those six agents.

Boundaries:

- No AI is implemented.
- No autonomous write agents.
- No production business data changes.
- No changes to `Vyra-Part-1`.
- No tokens, `.env.local`, Deno binaries, or raw import files committed.
- GitHub issue creation remains approval-gated.

## Phase 18

Shared Agent Runtime.

Includes:

- `dashboard/src/runtime/` shared runtime modules.
- One factory/registry path for all agents.
- Runtime lifecycle shared by Engineering, Migration, Sales, Support, Finance, Operations, Marketing, Product, and Executive agents.
- Shared permission defaults with production writes and external sends disabled.
- Shared health, workflow, activity, approval, memory, and sync snapshots.
- Engineering and Migration represented in the runtime while preserving existing pages.
- Placeholder runtime registrations and workflows for future department agents.
- Runtime inspector dashboard page.
- Overview agent and workflow summaries driven by runtime data.

Boundaries:

- No AI is implemented.
- No production business data is modified.
- No production writes are enabled.
- No changes to `Vyra-Part-1`.
- Existing Engineering and Migration functionality is preserved.

## Phase 18B

Stale sync queue cleanup.

Includes:

- Detection of legacy `42501` RLS failures from old direct browser insert attempts.
- Sync status separates legacy RLS failures from active Edge Function failures.
- Sync Queue cleanup panel for clearing stale local RLS failures.
- Optional requeue through the current Edge Function path when configured.
- Local audit log and agent event records for cleanup/requeue actions.

Boundaries:

- No RLS changes.
- No direct browser inserts.
- No production business data changes.
- Cleanup only removes local queue records.
- Edge Function remains the approved write path.

## Phase 19

Executive Agent operations dashboard.

Includes:

- Overview page promoted to the Executive Dashboard.
- Executive Agent modules under `dashboard/src/agents/executive/`.
- Deterministic executive priority rules in `dashboard/src/runtime/executiveRules.ts`.
- Cross-agent overview cards, timeline, health aggregation, approvals, runtime summary, and local report exports.
- Department drill-down from Executive Health and priority actions into existing dashboard pages.
- Reports for executive summary, daily operations, approvals, runtime, Engineering, and Migration.

Boundaries:

- No AI is implemented.
- No production writes are enabled.
- No production business data is modified.
- No changes to `Vyra-Part-1`.
- Existing Engineering and Migration behavior is preserved.
- Executive Agent summarizes the shared runtime instead of duplicating agent logic.

## Phase 20

Sales Agent MVP.

Includes:

- Local Sales Agent page in the dashboard.
- Local lead queue with type, stage, priority, and source filters.
- Gym and coach prospect trackers.
- Quote and proposal prep panel without Stripe or invoice creation.
- Follow-up planner with local-only actions.
- Sales activity timeline.
- Sales pipeline, follow-up, and proposal report exports.
- Browser localStorage persistence for sales leads, sales activities, and proposal prep.
- Sales workflows registered through the shared runtime.
- Executive Dashboard Sales signals for hot leads, follow-ups due, proposal needs, and pipeline value.

Boundaries:

- No AI is implemented.
- No emails are sent.
- No Stripe invoices are created.
- No CRM production data is modified.
- No production business tables are written.
- No changes to `Vyra-Part-1`.

## Phase 21

Sales Agent CRM integration readiness.

Includes:

- Sales integration adapter with local mock and live read-only modes.
- Typed readiness summary for CRM status, read-only state, and blocked external actions.
- JSON import validation for local sales leads.
- Pipeline CSV export in addition to JSON and Markdown reports.
- Clear Sales page safety labels for local/mock and live read-only modes.
- Disabled future placeholders for email send, Stripe invoice creation, and CRM write actions.
- Executive Dashboard Sales readiness and safety status.

Boundaries:

- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- No AI is implemented.
- Live mode is read-only only.

## Phase 22

Sales Agent lead scoring and follow-up engine.

Includes:

- Deterministic local scoring rules for gym prospects, independent coaches, gym-affiliated coaches, white-label prospects, and migration prospects.
- Transparent score factors for prospect type, estimated monthly value, urgency, due dates, proposal needs, stalled stages, missing contact info, last activity age, and Vyra product fit.
- Priority labels for Hot, Warm, Nurture, Needs Info, and At Risk.
- Local follow-up queue for today, overdue, proposal-needed, stalled, and missing-info reminders.
- Sales page score column, priority filter, follow-up queue, and score rationale panel.
- Executive Dashboard signals for hot leads, overdue follow-ups, proposal needs, at-risk leads, and weighted pipeline value.
- Lead scoring Markdown, follow-up queue Markdown, and weighted pipeline JSON exports.

Boundaries:

- No AI is implemented.
- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- All actions remain local/mock/read-only.

## Phase 23

Sales Agent Proposal Builder MVP.

Includes:

- Local deterministic proposal templates for Independent Coach, Gym OS, App for Gyms, White Label, and Migration / Data Import prospects.
- Proposal draft generation from local lead and proposal prep data.
- Sales page Proposal Builder with lead selection, proposal type selection, preview, local regenerate/save, Markdown export, and JSON export.
- Safety labels for Draft only, Not sent, Not invoiced, and Local only.
- Executive Dashboard signals for proposal drafts created, proposals missing pricing, proposals ready for review, and proposal risk count.
- Proposal risk priority rule for Executive review.

Boundaries:

- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- All proposal drafts remain local/mock/read-only.
