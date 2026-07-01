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
npm run comms:drafts
npm run comms:create-draft
npm run comms:review
npm run comms:archive
npm run comms:providers
npm run comms:provider-check
npm run comms:send-readiness
npm run comms:safety-check
npm run comms:manual-send
npm run comms:mark-copied
npm run comms:mark-sent
npm run comms:audit
npm run comms:audit-report
npm run comms:validate
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

## GitHub Read-Only Connector

Phase 36 adds the first read-only connector adapter:

```bash
npm run github:status
npm run github:repo
npm run github:branches
npm run github:commits
npm run github:issues
npm run github:prs
npm run github:safety-check
npm run github:validate
```

Use ignored local environment variables only: `VYRA_GITHUB_OWNER`, `VYRA_GITHUB_REPO`, and `VYRA_GITHUB_TOKEN`. The token value must never be printed, committed, or displayed in the dashboard.

The adapter performs GitHub REST `GET` requests only when config is present. Missing config returns a safe readiness state and performs no network call. No GitHub write endpoints are available.

## GitHub Planning

Phase 37 adds local GitHub planning commands:

```bash
npm run github:plans
npm run github:create-plan
npm run github:review-plan
npm run github:archive-plan
npm run github:plan-report
npm run github:planning-validate
```

Plans can link shared tasks, Engineering blockers, and Executive priorities. Plans may include issue/PR text, branch name suggestions, commit message suggestions, and release note suggestions. They remain local records only; no GitHub issue, pull request, branch, commit, workflow, comment, or label is created.

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

## Communication Drafts

Phase 31 adds local communication draft commands:

- `npm run comms:drafts` reports local draft state.
- `npm run comms:create-draft` creates a local email or SMS draft.
- `npm run comms:review` records local review state.
- `npm run comms:archive` moves local drafts to ignored archive storage.
- `npm run comms:validate` validates examples and local draft payloads.

Communication commands never send email or SMS and never connect to Gmail, Twilio, SendGrid, Resend, CRM, Stripe, Supabase production data, or production business systems.

## Provider Readiness

Phase 32 adds provider readiness commands:

- `npm run comms:providers` reports configured provider templates.
- `npm run comms:provider-check` checks for required environment variable names without printing values.
- `npm run comms:send-readiness` explains why sending remains blocked.
- `npm run comms:safety-check` validates provider-disabled and draft-only safety gates.

Provider readiness does not connect to Gmail, SMTP, SendGrid, Resend, Twilio, CRM, Stripe, or Supabase.

## Manual Send Workflow

Phase 33 adds local manual-send workflow commands:

- `npm run comms:manual-send` approves a local draft for human manual copy/send, or reports the queue when no id is provided.
- `npm run comms:mark-copied` records that an operator copied a draft.

## Connector Readiness

Phase 35 adds connector readiness commands:

```bash
npm run connectors:status
npm run connectors:readiness
npm run connectors:approval-map
npm run connectors:safety-check
npm run connectors:validate
```

These commands model future GitHub, Gmail, Google Calendar, Stripe, Supabase, Twilio/SMS, and Google Drive integrations. They do not connect to real services, authenticate providers, print secrets, or perform writes.

Every future write/send/create/export action remains a disabled placeholder behind explicit approval mapping.
- `npm run comms:mark-sent` records that a human marked the draft sent manually outside Vyra.
- `npm run comms:audit` prints the local communication audit trail.
- `npm run comms:audit-report` writes ignored manual-send queue and communication audit trail reports.

Manual sent status is local bookkeeping only. It never calls a provider and never proves that Vyra sent the message.

## Gmail Internal Email

Phase 40A adds Gmail commands for internal agent report email:

- `npm run email:status`
- `npm run email:drafts`
- `npm run email:create-draft`
- `npm run email:send`
- `npm run email:send-pending`
- `npm run email:audit`
- `npm run email:validate`
- `npm run email:safety-check`

Gmail sending is auto-enabled once configured with safe environment variable names and `VYRA_GMAIL_SEND_ENABLED` is not `false`. Allowed senders are `admin@vyraapp.fit` and `robert.sorenson@vyraapp.fit`. Robert defaults to `robert.sorenson@vyraapp.fit`; Matthew is skipped until `VYRA_EMAIL_MATTHEW` is configured. All sends, skips, and failures are audited.

## Daily Executive Email Briefing

Phase 46 adds Executive email briefing commands:

```bash
npm run executive:email-briefing
npm run executive:email-preview
npm run executive:email-send
npm run executive:email-status
npm run executive:email-validate
```

The preview command renders the Executive Operations daily briefing as an internal email report. Robert is enabled by default; Matthew is skipped until his email is configured. The send command delegates to Gmail safety checks and audit logging. No marketing, bulk, customer, CRM, Stripe, Supabase production, GitHub, deployment, or secret-output behavior is added.

## Executive Automation

Phase 41 adds Executive automation commands:

```bash
npm run executive:automation-status
npm run executive:automation-run
npm run executive:automation-rules
npm run executive:automation-report
npm run executive:automation-validate
npm run executive:automation-safety-check
```

The automation engine evaluates deterministic local signals and generates safe local tasks, GitHub plans, Gmail drafts, Executive review items, and reports. Configured internal email sends remain gated by the existing Gmail safety checks and audit logging. No GitHub, CRM, Stripe, Supabase production, external marketing, bulk send, or secret-output action is available.

## Release Ship Plans

Phase 44 adds local release approval and ship-plan commands:

```bash
npm run release:ship-plans
npm run release:create-ship-plan
npm run release:review-ship-plan
npm run release:approve-ship-plan
npm run release:reject-ship-plan
npm run release:ship-plan-report
npm run release:ship-plan-validate
```

Ship plans are created from release readiness data and remain local-only. `approved_to_prepare` is a preparation status, not a deployment approval. These commands do not deploy, tag releases, create GitHub releases, push commits, modify project files, write production data, or output secrets.

## Executive Operations

Phase 45 adds Executive Operations Center commands:

```bash
npm run executive:briefing
npm run executive:kpis
npm run executive:operations
npm run executive:health
npm run executive:report
npm run executive:validate
```

These commands generate the Executive daily briefing, KPI snapshot, Operations Center model, health summary, and reports from current local runtime data. They do not deploy, write GitHub records, write CRM records, create Stripe objects, write production data, or output secrets.
