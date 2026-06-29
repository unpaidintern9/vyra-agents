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

## Future Requirements

- Every run must be traceable.
- Every integration read must be logged.
- Every high-risk action must require approval.
- AI-generated content, if added later, must be tagged, metered, and auditable.

