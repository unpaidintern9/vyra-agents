# AI Operator Guide

Phase 28 adds a shared command interface for AI coding assistants that operate the Vyra Agents ecosystem.

The interface is tool-agnostic. Codex, Claude, and future supported assistants use the same commands and report formats. No command contains Codex-specific or Claude-specific workflow logic.

## Commands

Run from the repo root:

```bash
npm run agents:status
npm run agents:run
npm run agents:executive-summary
npm run agents:report
npm run agents:safety-check
npm run agents:graph
npm run agents:validate
npm run threads:status
npm run threads:ingest
npm run threads:summary
npm run threads:archive
npm run threads:schedules
npm run threads:run-due
npm run threads:approval-queue
npm run threads:approve
npm run threads:reject
npm run threads:validate
```

Optional operator metadata can be passed with flags:

```bash
npm run agents:run -- --operator-name Robert --operator-tool Codex
npm run agents:run -- --operator-name "Co-Founder" --operator-tool Claude
```

The same values can also come from environment variables:

```bash
VYRA_OPERATOR_NAME=Robert
VYRA_OPERATOR_TOOL=Codex
VYRA_OPERATOR_VERSION=local
VYRA_INTEGRATION_MODE=mock
```

## Operator Metadata

Each report includes:

- operator name
- operator tool
- optional operator version
- timestamp
- git branch
- git commit
- integration mode
- safety mode

## Reports

Reports are generated under:

```text
reports/agents/
  executive/
  engineering/
  sales/
  migration/
  runtime/
```

Each report is timestamped and written as Markdown and JSON. Generated report files are ignored by Git; the directory structure is committed with `.gitkeep` files.

## Safety Boundary

The operator interface does not send email, send SMS, write CRM records, create Stripe objects, write Supabase production data, write production business data, output secrets, or modify `.env.local`.

Future external actions must remain explicit placeholders behind approval gates.

## Thread Bridge

Phase 29 adds the `threads:*` commands for local named Codex thread outbox ingestion. These commands validate local payloads in `codex-agent-threads/shared/outbox/`, create ignored local summaries, and archive consumed files.

See `docs/CODEX_THREAD_BRIDGE.md` and `docs/THREAD_OUTBOX_WORKFLOW.md`.

## Scheduled Runs And Approvals

Phase 30 adds manual scheduled thread runs and a local approval queue:

- `npm run threads:schedules` reports configured local schedule templates.
- `npm run threads:run-due` manually creates local outbox items for due schedules.
- `npm run threads:approval-queue` reports pending local approval requests.
- `npm run threads:approve` and `npm run threads:reject` record local decisions only.

No command starts a background job or performs email, SMS, CRM, Stripe, Supabase, or production business writes.
