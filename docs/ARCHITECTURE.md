# Architecture

Vyra Agents starts as a local TypeScript dashboard and documentation-first operating model.

## Current Layers

- Dashboard: Vite, React, TypeScript, and plain CSS.
- Mock data: Local TypeScript constants, no network calls.
- Agents: Markdown charters, permissions, and workflow contracts.
- Workflows: Documented trigger-to-completion process definitions.
- Memory: Supabase SQL stubs only, not applied to any project.

## Future Layers

- Read-only integrations for GitHub and Supabase.
- Agent memory tables for status, events, tasks, approvals, and logs.
- Workflow engine with durable run records and approval gates.
- Optional AI summaries after all actions are logged and permission controlled.

## Boundaries

The MVP must not modify production systems. All agents are read-only unless a future charter explicitly grants a permission and an approval path exists.

