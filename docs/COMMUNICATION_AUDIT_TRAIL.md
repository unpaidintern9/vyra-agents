# Communication Audit Trail

Phase 33 adds a local communication audit trail for manual-send actions.

Audit entries are local JSON records under:

```text
codex-agent-threads/shared/drafts/audit/
```

Generated audit records are ignored by Git. The committed example lives in:

```text
codex-agent-threads/shared/examples/communication-audit-entry.example.json
```

## Audit Fields

Each audit entry records:

- draft id
- approval id
- operator name
- operator tool
- action taken
- timestamp
- safety mode
- notes
- external send method marked by human
- provider send occurred: always false
- production write occurred: always false
- secrets included: always false

## CLI

Run from the repo root:

```bash
npm run comms:audit
npm run comms:audit-report
```

`comms:audit` prints the local audit trail. `comms:audit-report` writes ignored Markdown and JSON reports for both the manual-send queue and communication audit trail.

## Boundary

The audit trail records local operator state only. It must not be treated as provider-send evidence, CRM evidence, Stripe evidence, or Supabase production evidence.
