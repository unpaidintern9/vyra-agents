# Scheduled Thread Runner

Phase 30 prepares local scheduled thread runs for named Codex/Vyra collaboration threads.

The runner is intentionally manual. It does not start a daemon, cron job, worker, browser automation, or background process.

## Schedule Location

Schedule templates live here:

```text
codex-agent-threads/shared/schedules/
```

Tracked files are examples/templates only. Generated run outputs are written to ignored local outbox/report files.

## Supported Scheduled Threads

The first schedule templates cover:

- Sales Tips
- Sales Company Research
- Customer Research Engine
- Executive Summary
- Cross-Agent Review

Each schedule declares source thread, cadence, timezone, next run timestamp, target agents, `runMode: "manual"`, and safety metadata.

## CLI

Run from the repo root:

```bash
npm run threads:schedules
npm run threads:run-due
```

`threads:schedules` validates and reports local schedule definitions.

`threads:run-due` checks due schedules and creates local outbox items only when manually triggered. It does not call external services or update production systems.

## Safety

Scheduled runs remain local/mock/read-only:

- no automatic background jobs
- no emails
- no SMS
- no CRM writes
- no Stripe invoices
- no Supabase production writes
- no production business writes
- no secrets in payloads or reports

Any future external action must be represented as an approval queue item first.
