# Codex Agent Threads

This folder stores durable local memory for named Codex automation threads that should coordinate with the Vyra Agents workspace.

It is intentionally separate from `agents/` because these are Codex thread-level assistants, not first-class Vyra runtime agents yet.

## Connected Codex Threads

| Codex thread | Thread ID | Primary Vyra agent bridge | Status |
| --- | --- | --- | --- |
| Sales Tips | `019f18ba-c18c-7762-8aec-f4c6e9851030` | Sales Agent, Executive Agent | active/idle |
| Sales Company Research | `019f18ba-be79-7f93-bdd2-135c0b09af74` | Sales Agent, Operations Agent | active/idle |
| Customer Research Engine | `019f18ba-c506-7ec3-a352-94302564a3d5` | Sales Agent, Support Agent | active/idle |

## Folder Contract

- `memory.md` stores durable context for each named Codex agent thread.
- `thread.json` stores thread metadata that future tools can read.
- `shared/inbox/` is for new requests from Vyra agents to Codex agents.
- `shared/outbox/` is for completed Codex-agent outputs that Vyra agents can consume.
- No production writes, outreach, CRM changes, Stripe actions, or customer communications should happen from this folder without explicit approval gates.

## How Codex Agents Should Use This

1. Read this folder before running scheduled or delegated work.
2. Read the relevant Vyra role agent charter in `../agents/<agent>/AGENT_CHARTER.md`.
3. Write local-only findings or summaries back into the relevant `memory.md` or `shared/outbox/`.
4. Keep source links, timestamps, confidence, and assumptions attached to research outputs.
5. Treat this as memory and coordination, not as authorization to perform external side effects.
