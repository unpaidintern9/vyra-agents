# Multi-Operator Workflow

Phase 28 lets multiple AI assistants work through the same Vyra operator interface.

## Supported Operator Examples

- Robert / Codex
- Co-Founder / Claude
- Future supported assistant / approved tool

The workflow does not branch on tool name. Tool identity is metadata for auditability and reports.

## Standard Run

1. Confirm the repo is on the intended branch.
2. Run:

```bash
npm run agents:status -- --operator-name Robert --operator-tool Codex
npm run agents:safety-check -- --operator-name Robert --operator-tool Codex
npm run agents:run -- --operator-name Robert --operator-tool Codex
```

3. Review generated reports under `reports/agents/`.
4. Run validation:

```bash
npm run agents:validate -- --operator-name Robert --operator-tool Codex
```

5. Commit only source, docs, and directory structure changes. Do not commit generated report files.

## Handoff Run

If another assistant continues the work, it uses the same commands with its own metadata:

```bash
npm run agents:status -- --operator-name "Co-Founder" --operator-tool Claude
npm run agents:run -- --operator-name "Co-Founder" --operator-tool Claude
```

Reports identify the operator, branch, commit, mode, and safety boundary so humans can compare outputs without needing assistant-specific logic.

## Approval Boundary

Operators can produce local reports and recommendations. They cannot send messages, create invoices, write CRM records, write Supabase production data, or modify production business records.

Any future external action must be implemented as a separate approval-gated workflow.
