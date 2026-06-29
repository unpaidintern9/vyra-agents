# Agent Runtime

Phase 18 introduces a shared Agent Runtime for Vyra Agents.

The runtime is the common operating layer for every dashboard agent. New agents should register through `registerAgent` / `createAgent` instead of rebuilding permissions, health, memory, workflows, approvals, audit, or sync behavior inside each page.

## Runtime Responsibilities

- agent registration
- shared lifecycle
- shared permissions
- shared health snapshots
- shared workflow registry
- shared activity feed
- shared audit view
- shared runtime memory summary
- shared approval model
- shared sync summary

## Boundaries

- No AI is implemented.
- No production business data is modified.
- No production writes are enabled.
- Browser code never receives service-role credentials.
- Existing Engineering and Migration functionality remains intact.
