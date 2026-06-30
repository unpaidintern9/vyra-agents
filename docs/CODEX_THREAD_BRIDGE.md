# Codex Thread Bridge

Phase 29 adds a local bridge between named Codex automation threads and Vyra role agents.

The bridge uses local files only:

```text
codex-agent-threads/shared/outbox/
codex-agent-threads/shared/inbox/
codex-agent-threads/shared/archive/
```

Named Codex threads write completed outputs to `shared/outbox/`. Vyra agents read, validate, summarize, and turn those outputs into local Executive review items through the shared operator CLI.

## Named Thread Sources

Current named sources are tracked in `codex-agent-threads/threads-index.json`:

- Sales Tips
- Sales Company Research
- Customer Research Engine

Each source has a `memory.md` and `thread.json` file. These are local coordination records, not production runtime agents.

## Supported Payload Schemas

Schemas live in `codex-agent-threads/shared/schemas/`:

- `thread_output`
- `agent_handoff`
- `task_recommendation`
- `sales_research_note`
- `customer_research_note`
- `executive_summary_item`

Every payload must include safety metadata declaring:

- `externalActions: "none"`
- `productionWrites: false`
- `secretsIncluded: false`

## CLI Commands

Run from the repo root:

```bash
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

The commands are local-only. They read files, write ignored local reports, and move consumed outbox files into the local archive.

## Scheduled Runs

Phase 30 adds local schedule templates under:

```text
codex-agent-threads/shared/schedules/
```

Schedules are examples/templates only and use `runMode: "manual"`. `npm run threads:run-due` can be manually invoked to create local outbox items for due schedules, but no background job starts automatically.

## Approval Queue

Phase 30 also adds a local approval queue under:

```text
codex-agent-threads/shared/approval-queue/
```

Approval items can represent future email, SMS, CRM, Stripe, Supabase, executive review, or sales follow-up requests. Approving or rejecting an item only updates local approval state. It never performs the requested external action.

## Vyra Agent Behavior

Vyra agents can:

- read pending outbox items
- group outputs by named Codex agent
- summarize findings
- create local Executive review items
- recommend next local actions

They cannot send email, send SMS, write CRM records, create Stripe records, write Supabase production data, write production business data, or expose secrets.

## Generated Payloads

Generated inbox, outbox, archive, and approval queue payloads are ignored by Git. Only schemas, examples, `.gitkeep` files, schedule templates, and durable thread metadata should be committed.
