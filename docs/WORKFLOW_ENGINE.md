# Workflow Engine

Phase 5 adds a local/mock workflow registry and safe dry-check UI. It does not run production jobs or external writes.

## Standard Flow

```text
Trigger
↓
Collect Data
↓
Rules Engine
↓
Action
↓
Log
↓
Approval if required
↓
Complete
```

## Initial Workflow Definitions

- daily-ecosystem-audit
- repo-health-check
- migration-import-review
- migration-validation
- approval-queue
- integration-status-check
- migration-member-matching
- approval-queue-review

## Approval Rule

High-risk actions must pause before execution. The future approval queue should record who requested the action, what system is affected, what data changes, and who approved it.

## Phase 5 Dry Checks

Safe workflows can run a local dry check from the dashboard. This only updates local React state and local/mock audit logs.

No Supabase writes, GitHub writes, deploys, customer messages, database migrations, or AI calls are performed.

## Phase 6 Local Dry-Check History

Workflow dry-check results are persisted in browser localStorage. The Workflows page now shows the last dry-check result per workflow, a local run detail summary, JSON and Markdown report exports, and a clear local workflow results control.

Workflow reports are generated locally in the browser and include the source as local dashboard state plus the safety note that no production writes were made.
