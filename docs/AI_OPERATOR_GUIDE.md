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
