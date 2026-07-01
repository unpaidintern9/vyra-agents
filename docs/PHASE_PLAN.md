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

## Phase 24

Sales Agent Team and prospect research foundation.

Includes:

- Head Sales Agent plus specialized local sub-agents for prospect discovery, public research planning, data organization, ICP fit scoring, outreach prep, meeting prep, proposal building, migration planning, CRM design, follow-up, sales intelligence, and safety approval.
- Local Prospect Research Command Center on the Sales page.
- Seed local prospect slots for Louisville, Cincinnati, Los Angeles, and New York.
- First-target categories for MMA/BJJ gyms, CrossFit boxes, small gyms, boutique fitness, and sports performance gyms.
- Deterministic ICP fit scoring for prospect slots.
- Executive Dashboard signals for Sales Agent Team readiness, high-fit prospects, research backlog, and average prospect fit.
- Documentation for prospect research boundaries and future public-source automation.

Boundaries:

- No AI is implemented.
- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- No automated scraping jobs run.
- All prospect research records remain local/mock/read-only.

## Phase 25

Sales Prospect Intake and Research Dossiers.

Includes:

- Structured Prospect Intake form on the Sales page.
- Local fields for gym name, market, business type, website, social link, owner/contact, email/phone, current software, pain points, member and coach estimates, migration complexity, and notes.
- Deterministic Research Dossier generator.
- Dossier sections for business overview, ICP fit, likely pain points, recommended Vyra product, migration opportunity, outreach angle, proposal angle, missing info, risks, and next steps.
- Explainable fit score factors and missing-info checklist.
- Saved prospect list and dossier preview.
- Markdown and JSON dossier exports.
- Executive Dashboard signals for saved prospects, dossiers created, high-fit dossiers, missing-info prospects, and migration-opportunity prospects.

Boundaries:

- No external browsing.
- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- No automated scraping jobs run.
- All prospect intake and dossier records remain local/mock/read-only.

## Phase 26

Unified Sales Intelligence and Organization Graph.

Includes:

- Derived local Sales Intelligence Graph linking prospects, organizations, coaches, proposals, follow-ups, migration plans, research dossiers, and activities.
- Relationship types for owns, employs, manages, interested in, migration target, proposal for, follow-up for, referred by, and competitor of.
- Organization Timeline events for intake created, research completed, proposal drafted, follow-up scheduled, migration planned, and Executive review.
- Sales page intelligence dashboard with organization profile, relationship graph list/tree view, timeline, connected records, and migration readiness.
- Executive Dashboard signals for organizations tracked, active opportunities, average relationship depth, proposal coverage, migration readiness, and intelligence completeness score.
- Local exports for Organization Intelligence Report, Sales Intelligence Graph JSON, and Organization Timeline.

Boundaries:

- No external browsing.
- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- All intelligence graph records are derived from local/mock/read-only state.

## Phase 27

Cross-Agent Collaboration Foundation.

Includes:

- Shared local cross-agent entity model for organizations, prospects, coaches, gyms, proposals, migration plans, feature requests, engineering blockers, follow-ups, activities, and Executive priorities.
- Cross-agent relationship types for requested feature, blocked by, related to migration, sales opportunity for, Executive priority for, requires follow-up, needs approval, and ready for review.
- Local collaboration layer where Sales publishes opportunity signals, Migration publishes readiness signals, Engineering publishes blocker signals, and Executive reads combined priorities.
- Sales page Cross-Agent Collaboration section for linked Engineering blockers, Migration readiness, Executive priorities, requested features, and approval-needed items.
- Executive Dashboard signals for high-value opportunities blocked by Engineering, migrations tied to Sales opportunities, proposals needing approval, feature requests tied to prospects, and organizations needing Executive review.
- Local exports for Cross-Agent Collaboration Report Markdown, Cross-Agent Graph JSON, and Executive Priority Queue Markdown.

Boundaries:

- No external browsing.
- No emails are sent.
- No Stripe invoices are created.
- No CRM production records are written.
- No production business tables are written.
- All cross-agent graph records are derived from local/mock/read-only state.

## Phase 28

Shared AI Operator Interface.

Includes:

- Tool-agnostic operator command layer for Codex, Claude, and future supported assistants.
- Root npm scripts for `agents:status`, `agents:run`, `agents:executive-summary`, `agents:report`, `agents:safety-check`, `agents:graph`, and `agents:validate`.
- Operator identity metadata for operator name, operator tool, optional version, timestamp, git branch, git commit, integration mode, and safety mode.
- Shared ignored report directories under `reports/agents/` for Executive, Engineering, Sales, Migration, and Runtime reports.
- Timestamped Markdown and JSON report generation with operator metadata embedded in every report.
- Executive Run Summary with Executive priorities, Engineering blockers, Sales pipeline highlights, Migration readiness, follow-ups due, organizations requiring review, safety warnings, cross-agent health, and validation status.
- Operator Dashboard page showing active operator, last local run/report/validation metadata, safety mode, integration mode, command surface, blocked external actions, and agent runtime health.

Boundaries:

- No email or SMS sends.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No production business table writes.
- No secret output.

## Phase 34

Shared Cross-Agent Task and Work Queue.

Includes:

- Unified local Shared Task model with id, title, description, source agent, assigned agent, organization, priority, status, category, timestamps, approval flag, linked entities, notes, and related graph node ids.
- Supported agents: Executive, Engineering, Sales, Migration, Support, Operations, Customer Success, Research, and Future agents.
- Local task actions for create, assign, claim, reassign, escalate, complete, and archive.
- Root npm scripts for `tasks:status`, `tasks:list`, `tasks:create`, `tasks:assign`, `tasks:claim`, `tasks:complete`, `tasks:archive`, `tasks:report`, and `tasks:validate`.
- Shared task schema and example payload under `codex-agent-threads/shared/`.
- Operator Dashboard Shared Work Queue section with active work, newest assignments, recently completed work, blocked work, workload distribution, and queue health.
- Executive Dashboard task health signals for open, blocked, overdue, review-required tasks, queue health, task priority mix, and workload.
- Sales Dashboard linked task section for migration, engineering, follow-up, proposal, and customer onboarding work.
- Local task nodes and relationships published into the Vyra Knowledge Graph.
- Work Queue, Executive Task Summary, Agent Workload, and Blocked Work reports in ignored Markdown and JSON report files.

Boundaries:

- Local/mock/read-only only.
- No background execution.
- No email or SMS sends.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No production business writes.
- No secrets committed.

## Phase 35

Connector Readiness and Approval Mapping.

Includes:

- Local connector readiness models for GitHub, Gmail, Google Calendar, Stripe, Supabase, Twilio/SMS, and Google Drive.
- Connector fields for name, status, required config names, allowed reads, blocked writes, approval requirement, safety mode, and last check timestamp.
- Approval mapping from future task/action types to connector approval request types.
- Root npm scripts for `connectors:status`, `connectors:readiness`, `connectors:approval-map`, `connectors:safety-check`, and `connectors:validate`.
- Operator Dashboard Connector Readiness section.
- Executive Dashboard connector risk summary metrics and priority signal.
- Sales Dashboard disabled connector action placeholders.
- Connector Readiness and Approval Mapping reports in ignored Markdown and JSON report files.

Boundaries:

- No real connector calls.
- No GitHub, Gmail, Calendar, Stripe, Supabase, Twilio, or Google Drive writes.
- No production data writes.
- No secret output.
- All connector write actions remain disabled placeholders behind explicit approval gates.
- No `.env.local` modifications.
- Future external actions remain explicit placeholders behind approval gates.

## Phase 29

Codex Thread Automation and Vyra Agent Outbox Bridge.

Includes:

- Local bridge folders for `codex-agent-threads/shared/outbox/`, `shared/inbox/`, and `shared/archive/`.
- Schemas for thread output, agent handoff, task recommendation, sales research note, customer research note, and Executive summary item.
- Root npm scripts for `threads:status`, `threads:ingest`, `threads:summary`, `threads:archive`, and `threads:validate`.
- Local outbox ingestion that groups findings by named Codex agent source.
- Local Executive review item generation from valid thread outbox payloads.
- Operator Dashboard Thread Outbox Bridge section with pending outputs, latest ingest/archive metadata, named source list, recommended next actions, and archive status.
- Generated thread payloads ignored by Git, with committed examples and schemas.

Boundaries:

- No email or SMS sends.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No production business table writes.
- No secret output.

## Phase 32

Communication Provider Readiness.

Includes:

- Provider readiness templates for Gmail, Google Workspace SMTP, SendGrid, Resend, Twilio SMS, and manual copy/paste mode.
- Example environment variable names only, with no real keys or values committed.
- Root npm scripts for `comms:providers`, `comms:provider-check`, `comms:send-readiness`, and `comms:safety-check`.
- Operator Dashboard provider readiness section showing provider status, missing config names, sending disabled status, draft-only mode, provider-call blocking, approval requirement status, and production send unavailability.
- Documentation for email provider setup, SMS provider setup, communication provider readiness, and safety gates.

Boundaries:

- No email sends.
- No SMS sends.
- No provider calls.
- No provider clients.
- No CRM writes.
- No Stripe invoices.
- No Supabase production writes.
- No production business table writes.
- No secrets committed.
- No `.env.local` changes.

## Phase 33

Manual Send Workflow and Audit Trail.

Includes:

- Manual communication workflow states for draft created, ready for review, approved for manual send, copied by operator, marked sent manually, rejected, and archived.
- Local communication audit trail records with draft id, approval id, operator name/tool, action, timestamp, safety mode, notes, and human-marked external send method.
- Root npm scripts for `comms:manual-send`, `comms:mark-copied`, `comms:mark-sent`, `comms:audit`, and `comms:audit-report`.
- Operator Dashboard manual-send section showing drafts approved for manual send, copied drafts, manually marked sent drafts, rejected drafts, latest audit actions, and manual-only/no-provider-send status.
- Manual Send Queue and Communication Audit Trail reports in ignored Markdown and JSON report files.

Boundaries:

- No email sends.
- No SMS sends.
- No Gmail, SMTP, SendGrid, Resend, Twilio, or provider calls.
- Manual sent status is a local human-marked record only.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No production business table writes.
- No secrets committed.
- Generated inbox, outbox, archive, and report payloads remain ignored unless they are templates or examples.

## Phase 30

Scheduled Thread Runner and Approval Queue.

Includes:

- Local schedule templates for Sales Tips, Sales Company Research, Customer Research Engine, Executive Summary, and Cross-Agent Review.
- Root npm scripts for `threads:schedules`, `threads:run-due`, `threads:approval-queue`, `threads:approve`, and `threads:reject`.
- Manual due-run support that creates local outbox items only when explicitly triggered.
- Local approval queue model for email draft, SMS draft, CRM write, Stripe invoice, Supabase write, Executive review, and Sales follow-up requests.
- Local approval and rejection decisions that never perform the requested external action.
- Operator Dashboard schedule and approval queue signals.
- Scheduled Thread Run Report, Approval Queue Report, and Approval Queue JSON generation under ignored local reports.

Boundaries:

- No automatic background jobs.
- No email or SMS sends.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No production business table writes.
- No secret output.
- Approval only changes local approval state.

## Phase 31

Communication Draft Layer.

Includes:

- Local communication draft models for email, SMS, sales follow-up, Executive summary, and customer research update drafts.
- Ignored local draft storage under `codex-agent-threads/shared/drafts/email/`, `drafts/sms/`, and `drafts/archive/`.
- Root npm scripts for `comms:drafts`, `comms:create-draft`, `comms:review`, `comms:archive`, and `comms:validate`.
- Operator Dashboard communication draft section with draft count, drafts by type, pending review drafts, approved local drafts, archived drafts, and explicit not-sent status.
- Communication Draft Report Markdown and JSON generation under ignored local reports.

Boundaries:

- No email sends.
- No SMS sends.
- No Gmail, Twilio, SendGrid, Resend, or other provider connections.
- No CRM writes.
- No Stripe invoices.
- No Supabase production writes.
- No production business table writes.
- No secret output.

## Phase 36

GitHub Read-Only Connector MVP.

Includes:

- GitHub read-only connector adapter for repository inspection.
- Safe local config names `VYRA_GITHUB_OWNER`, `VYRA_GITHUB_REPO`, and `VYRA_GITHUB_TOKEN`.
- Root npm scripts for `github:status`, `github:repo`, `github:branches`, `github:commits`, `github:issues`, `github:prs`, `github:safety-check`, and `github:validate`.
- GET-only reads for repository metadata, branches, commits, open issues, and open pull requests when config is present.
- Missing-config readiness state that performs no network call.
- Operator Dashboard GitHub read-only status.
- Executive Dashboard repo health summary metrics.
- GitHub Repo Status and GitHub Engineering Readiness reports under ignored local reports.

Boundaries:

- No GitHub issue creation.
- No pull request creation.
- No commits.
- No branch changes.
- No workflow dispatch.
- No repository writes.
- No token output.
- No production writes.
- No external non-GitHub calls.

## Phase 37

GitHub Planning Layer.

Includes:

- Local GitHub issue and PR planning models.
- Branch name, commit message, and release note suggestions.
- Links to shared tasks, Engineering blockers, and Executive priorities.
- Local approval statuses: draft, needs review, approved local, rejected local, and archived.
- Root npm scripts for `github:plans`, `github:create-plan`, `github:review-plan`, `github:archive-plan`, `github:plan-report`, and `github:planning-validate`.
- Operator Dashboard GitHub planning queue.
- Executive Dashboard GitHub plans needing review.
- GitHub Planning Queue and GitHub Plan Review reports under ignored local reports.

Boundaries:

- No GitHub issue creation.
- No pull request creation.
- No commits pushed.
- No branches created.
- No workflow dispatch.
- No GitHub write endpoints.
- Planning remains local only.
- No secrets committed.

## Phase 38

Repository Intelligence Engine.

Includes:

- Local Repository Intelligence model for repositories, modules, packages, applications, services, libraries, documentation, migrations, configuration, and scripts.
- Dependency graph summaries for imports, package dependencies, module relationships, runtime relationships, shared components, circular dependency detection, and orphaned modules.
- Ownership model linking repositories to owning agent, responsible team, documentation, tasks, GitHub plans, and Executive priorities.
- Health analysis for build/lint/validation signals, documentation coverage, dependency health, technical debt markers, and Engineering warnings.
- Root npm scripts for `repo:scan`, `repo:status`, `repo:graph`, `repo:health`, `repo:owners`, and `repo:validate`.
- Engineering Dashboard Repository Intelligence section.
- Executive Dashboard engineering health, repository risk, documentation completeness, dependency health, and validation trend signals.
- Operator Dashboard Repository Intelligence command/status section.
- Repository Intelligence, Repository Graph, Engineering Health, and Dependency reports under ignored local reports.

Boundaries:

- Local analysis only.
- No repository modifications.
- No GitHub writes.
- No external service writes.
- No secrets committed.

## Phase 39

Engineering Task Generator.

Includes:

- Local Engineering Task Generator model and runtime.
- Deterministic task categories for bug fixes, refactors, documentation, test coverage, dependency cleanup, migration support, sales blockers, release readiness, and security/safety review.
- Root npm scripts for `engineering:tasks`, `engineering:generate-tasks`, `engineering:task-report`, and `engineering:validate`.
- Candidate generation from Repository Intelligence, GitHub Plans, Executive priorities, and blocked Sales/Migration work.
- Engineering Dashboard generated candidate table with linked repo risk, GitHub plan, Executive priority, Sales/Migration blocker, recommended priority, and reason.
- Executive Dashboard engineering task health signals.
- Operator Dashboard Engineering Task Generator command/status section.
- Engineering Task Candidate and Executive Engineering Task Summary reports under ignored local reports.

Boundaries:

- Local candidate generation only.
- No code modifications.
- No Shared Task Queue records created automatically.
- No GitHub issues.
- No pull requests.
- No production data writes.
- No secrets committed.

## Phase 40A

Gmail Email Connector with Auto-Enabled Sending.

Includes:

- Gmail as the first real internal email connector.
- Safe config names for Gmail OAuth/access-token configuration.
- Approved senders: `admin@vyraapp.fit` and `robert.sorenson@vyraapp.fit`.
- Internal recipient model for Robert and Matthew, with Matthew skipped as `missing_email` until configured.
- Email workflow states: draft created, ready for send, auto scheduled, sent, failed, skipped, and archived.
- Root npm scripts for `email:status`, `email:drafts`, `email:create-draft`, `email:send`, `email:send-pending`, `email:audit`, `email:validate`, and `email:safety-check`.
- Operator Dashboard Gmail connector section.
- Executive Dashboard email automation and communication activity signals.
- Email-ready internal report types for Executive daily summary, Sales summary, Engineering summary, Task queue summary, Connector readiness summary, and Cross-agent review summary.

Boundaries:

- Gmail sends only when connector configuration and all safety gates pass.
- All sends, failures, and skips are audited.
- No external marketing emails.
- No bulk outbound campaigns.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No secrets committed.

## Phase 41

Executive Automation Engine.

Includes:

- Executive automation rules for engineering warnings, failed validations, GitHub repo changes, blocked/overdue tasks, high-value Sales opportunities, migration blockers, connector readiness failures, email failures/skips, and cross-agent review needs.
- Trigger types for manual, scheduled, event-detected, threshold-crossed, validation-failed, and report-ready signals.
- Action types for local agent workflow runs, shared tasks, GitHub plans, email drafts, configured internal email sends, Executive review items, low-priority archiving, and reports.
- Root npm scripts for `executive:automation-status`, `executive:automation-run`, `executive:automation-rules`, `executive:automation-report`, `executive:automation-validate`, and `executive:automation-safety-check`.
- Operator Dashboard Executive Automation Engine section.
- Executive Dashboard Automation Engine section.
- Executive Automation Report, Executive Automation JSON, Triggered Rules Report, and Skipped/Blocked Actions Report.

Boundaries:

- No external marketing emails.
- No bulk sending.
- No CRM writes.
- No Stripe writes.
- No Supabase production writes.
- No GitHub writes.
- No secrets output.
- Gmail sends must use existing safety checks and audit logging.
- Automatic emails only target approved internal recipients.

## Phase 42

Real Repo Multi-Project Registry.

Includes:

- Project registry model for project id, name, local path, repo owner/name, branch, project type, owning agent, status, validation commands, and notes.
- Local config template directory at `codex-agent-threads/shared/projects/` with real local paths ignored.
- Root npm scripts for `projects:status`, `projects:list`, `projects:scan`, `projects:health`, `projects:report`, and `projects:validate`.
- Multi-project Repository Intelligence targets for Vyra Agents, mobile/backend, desktop software, Vyra website, Valor Solutions website, and future projects.
- Project links into Shared Task Queue, GitHub planning, Executive automation, Engineering task generation, and dashboard runtime summaries.
- Operator Dashboard Project Registry section.
- Executive Dashboard project risk and release readiness section.
- Engineering Dashboard Project Registry and project-specific task candidate sections.
- Project Registry Report, Project Registry JSON, Multi-Project Health Report, and Release Readiness Report.

Boundaries:

- Local scans only.
- No project file modifications.
- No destructive commands.
- No project-local generated data committed.
- No GitHub writes.
- No production writes.
- No secrets committed.

## Phase 43

Release Readiness Command Center.

Includes:

- Release readiness model for project id/name, branch, latest commit, build, lint, validation, tests, docs, secrets, blockers, risk, score, recommended action, and last checked timestamp.
- Root npm scripts for `release:status`, `release:scan`, `release:readiness`, `release:blockers`, `release:report`, and `release:validate`.
- Integration with Project Registry, Repository Intelligence, Engineering Task Generator, Shared Task Queue, Executive Automation, and GitHub Planning Queue.
- Executive Dashboard Release Command Center section for ready projects, blocked releases, critical risks, trend, and Executive action.
- Engineering Dashboard release checklist, blockers by project, generated blocker tasks, and release-linked GitHub plan visibility.
- Operator Dashboard release scan status, latest report, safety state, and blocked/ready project counts.
- Release Readiness, Release Blockers, and Executive Release Summary reports.

Boundaries:

- Local analysis only.
- No deploys.
- No release tags.
- No GitHub releases.
- No pushed commits.
- No project file modifications.
- No production writes.
- No secrets committed.
