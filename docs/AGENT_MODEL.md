# Agent Model

Agents are operational roles with a defined purpose, scope, permissions, and workflow surface.

## Shared Runtime

As of Phase 18, agents inherit from the shared Agent Runtime in `dashboard/src/runtime/`.

New agents should be added through the runtime registry instead of creating separate implementations for permissions, health, memory, workflows, approvals, audit, activity, or sync.

The shared runtime model is:

```text
Agent Runtime
  -> Agent Registry
  -> Agent Lifecycle
  -> Permissions
  -> Health
  -> Workflows
  -> Activity
  -> Audit
  -> Memory
  -> Approvals
  -> Sync
```

## Immediate Agents

- Executive Agent: Aggregates ecosystem status and gives Robert a command-center view.
- Engineering Agent: Tracks technical health across Vyra repositories.
- Migration Agent: Owns gym onboarding and member migration workflows.
- Products Agent: Tracks product areas across mobile, desktop, website, and gym software.
- Operations Agent: Tracks workflows, approvals, integrations, and system operations.

## Planned Agents

- Support Agent
- Sales Agent
- Marketing Agent
- Finance Agent
- Analytics Agent

## Default Behavior

Agents begin as read-only observers. They may report status, flag risks, create draft tasks, and prepare recommendations. They must not deploy, delete, bill, email customers, change permissions, or alter production data without a future approval system.

Phase 18 does not add AI and does not enable production writes. Production writes and external sends remain disabled by default in the shared permission model.
