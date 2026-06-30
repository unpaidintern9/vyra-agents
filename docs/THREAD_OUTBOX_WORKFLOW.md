# Thread Outbox Workflow

The Thread Outbox workflow lets scheduled or named Codex agent threads hand local findings to Vyra agents without external side effects.

## 1. Write Output

A named thread writes a JSON payload to:

```text
codex-agent-threads/shared/outbox/
```

Use `codex-agent-threads/shared/examples/thread-output.example.json` as the simplest shape.

## 2. Validate

Run:

```bash
npm run threads:validate
```

Validation checks:

- required schema fields
- known schema type
- source thread metadata
- safety metadata
- no declared external actions
- no production writes
- no included secrets

## 3. Ingest

Run:

```bash
npm run threads:ingest
```

Ingest reads valid pending outbox items and writes an ignored local report under `reports/agents/runtime/`.

The ingest summary includes:

- grouped items by named Codex agent source
- local Executive review items
- recommended next actions
- safety summary

## 4. Summarize

Run:

```bash
npm run threads:summary
```

This creates a local summary report without moving files.

## 5. Archive

After review, run:

```bash
npm run threads:archive
```

The archive command moves pending outbox JSON files to:

```text
codex-agent-threads/shared/archive/
```

This is a local file move only. No Supabase, CRM, email, SMS, Stripe, or production business write occurs.

## Dashboard

The Operator Dashboard shows the Thread Outbox Bridge with:

- pending thread outputs
- latest ingested thread metadata
- named agent sources
- recommended next actions
- archive status

The dashboard controls record local metadata only. The CLI is the source of truth for filesystem ingest and archive.
