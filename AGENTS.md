# Vyra Agents Codex Workspace

This folder is the working root for Vyra Agents:

```text
/Volumes/Install macOS Sequoia/Vyra Agents
```

When a Codex agent is working here, treat this directory as the source of truth for the local Vyra agent platform.

## Local Agent Connection

- Agent charters live in `agents/<agent>/AGENT_CHARTER.md`.
- Agent permissions live in `agents/<agent>/PERMISSIONS.md`.
- Agent workflows live in `agents/<agent>/WORKFLOWS.md`.
- Named Codex automation-thread memory lives in `codex-agent-threads/`.
- Shared runtime documentation lives in `docs/AGENT_RUNTIME.md`, `docs/AGENT_REGISTRY.md`, and `docs/RUNTIME_ARCHITECTURE.md`.
- Operator reports are written under `reports/agents/<agent>/`.

## Useful Commands

Run these from the workspace root:

```bash
npm run agents:status
npm run agents:validate
npm run agents:run
npm run agents:executive-summary
npm run agents:graph
```

Dashboard commands:

```bash
cd dashboard
npm install
npm run dev
npm run build
npm run lint
```

## Operating Boundaries

- Keep agent operations local/mock/read-only unless the user explicitly asks for live integration work.
- Before running a named Codex automation thread, check `codex-agent-threads/threads-index.json` and that thread's `memory.md`.
- Do not send email, SMS, CRM updates, Stripe writes, Supabase production writes, or other production business writes without explicit approval gates.
- Do not modify `.env.local` or print secrets.
- Prefer extending the existing runtime, registry, permissions, approval, audit, and sync helpers instead of creating parallel systems.
