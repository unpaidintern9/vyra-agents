# Agent Memory

Agent memory will eventually store observed events, workflow runs, status records, approvals, and operational logs.

## Planned Tables

- agent_runs
- agent_events
- agent_tasks
- agent_status
- agent_memory
- agent_logs
- agent_approvals
- agent_workflows
- agent_integrations

## MVP Status

The MVP includes SQL migration stubs in `supabase/migrations/`. These files are documentation-ready placeholders and must not be applied to production until reviewed.

## Phase 2 Status

Phase 2 adds `20260629000100_agent_memory_foundation.sql` as a more complete foundation stub. It uses `gen_random_uuid()`, timestamps, statuses, metadata JSON, and source fields where useful.

This is still local/mock only:

- No production Supabase project is connected.
- No migrations are applied.
- No agent writes are performed.
- No AI-generated memory is stored.
- Production connection comes later after schema review, access control, and approval logging.

## Phase 3 Promotion

The agent memory foundation migration is promoted to the real Vyra-Part-1 Supabase migration folder as:

- `20260629000100_agent_memory_foundation.sql`

Supabase CLI migration commands should be run from Vyra-Part-1, not from Vyra Agents. Dashboard checks remain mock/readiness only until a future read-only integration phase.

## Future Requirements

- Every run must be traceable.
- Every integration read must be logged.
- Every high-risk action must require approval.
- AI-generated content, if added later, must be tagged, metered, and auditable.

## Phase 5 Local Memory

The Agent Memory dashboard page shows local/mock:

- Agent Runs
- Agent Events
- Agent Tasks
- Agent Approvals
- Agent Notes

## Phase 6 Local Persistence And Reports

Phase 6 persists local/mock agent runs, events, tasks, approvals, audit logs, workflow dry checks, and migration dry-run summaries in browser localStorage.

The Agent Memory page now includes:

- local persistence status
- JSON and Markdown export buttons
- clear local agent memory controls
- an agent run detail view with related events and audit-log counts
- explicit production writes status of `No`

Reports are generated locally in the browser and include a title, generated timestamp, local dashboard source, a safety note, summary fields, and detail rows.

These records do not write to Supabase yet.

Future connection should write to the Phase 3 `agent_*` tables only after permissions, RLS policies, production logging, and approval boundaries are reviewed.
