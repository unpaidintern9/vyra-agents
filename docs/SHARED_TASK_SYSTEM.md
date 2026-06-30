# Shared Task System

Phase 34 adds a unified local task system for coordinating work across Vyra agents.

The system is deterministic, local/mock/read-only, and intended for planning. It does not run background jobs, send messages, call providers, write CRM records, create Stripe objects, write Supabase production data, or modify production business records.

## Task Model

Each shared task includes:

- task id
- title and description
- source agent
- assigned agent
- organization
- priority
- status
- category
- created timestamp
- due date
- completion timestamp
- approval required
- linked entities
- notes
- related graph node ids

Generated task payloads live under `codex-agent-threads/shared/tasks/` and are ignored by Git. Templates and schemas remain committed under `codex-agent-threads/shared/examples/` and `codex-agent-threads/shared/schemas/`.

## Supported Agents

- Executive
- Engineering
- Sales
- Migration
- Support
- Operations
- Customer Success
- Research
- Future agents

## CLI

From the repo root:

```bash
npm run tasks:status
npm run tasks:list
npm run tasks:create -- --title "Review prospect" --sourceAgent Sales --assignedAgent Research --category Research
npm run tasks:assign -- --id task-id --agent Migration
npm run tasks:claim -- --id task-id --agent Sales
npm run tasks:complete -- --id task-id
npm run tasks:archive -- --id task-id
npm run tasks:report
npm run tasks:validate
```

`tasks:assign -- --id task-id --escalate true` escalates a task locally to Executive review.

## Reports

`npm run tasks:report` generates ignored local Markdown and JSON reports:

- Work Queue
- Executive Task Summary
- Agent Workload Report
- Blocked Work Report

Reports include only local queue state and safety metadata.

## Safety

Task actions only modify local ignored task files. They never perform the work described by a task.

External work remains blocked:

- no email
- no SMS
- no CRM writes
- no Stripe writes
- no Supabase production writes
- no production business writes
- no background execution
- no secret output
