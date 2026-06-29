# Vyra Agents

Vyra Agents is the foundation for the Vyra Agent Command Center: an operations-first platform for coordinating the Vyra ecosystem.

This MVP does not call AI services, production databases, billing systems, app stores, or customer communication platforms. It establishes the local project structure, mock dashboard, agent model, workflow documentation, permissions model, and future Supabase memory schema stubs.

## Project Structure

```text
vyra-agents
├── dashboard/
├── agents/
├── workflows/
├── shared/
├── docs/
├── scripts/
├── supabase/
├── README.md
└── .gitignore
```

## Run The Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

## MVP Scope

- Dark command-center dashboard with mock ecosystem status.
- Agent folders for executive, engineering, migration, products, support, sales, marketing, finance, analytics, and operations.
- Migration Agent rules for staged imports, member matching, organization membership, gym review, invitations, and offline members.
- Workflow documentation for audit, repo health, migration review, validation, approvals, and integration status.
- Supabase SQL migration stubs for future agent memory tables.
- Browser localStorage persistence for local/mock runs, audits, approvals, workflow dry checks, and migration dry runs.
- Local JSON and Markdown report exports for agent memory, audit logs, workflow runs, migration dry runs, and approval history.
- Read-only-by-default permissions model.

## Core Principle

Vyra Agents is an operations platform first. AI can be added later as an optional, metered, logged, permission-controlled layer.
