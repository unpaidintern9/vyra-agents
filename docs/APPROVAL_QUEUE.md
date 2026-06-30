# Approval Queue

Phase 5 adds an Approval Queue UI foundation.

Mock approval items include:

- Approve Migration Review
- Send Member Invitations
- Apply Production Migration
- Deploy Workflow
- Send Customer Email

Buttons only update local UI state.

## Phase 6 Approval History

Mock approval decisions now persist to browser localStorage with local approval history. The Approval Queue panel includes:

- approval history entries
- JSON and Markdown history export
- clear local approval history control

Approval history reports are generated locally in the browser and include requester, approver, risk level, decision result, timestamp, and the safety note that no production writes were made.

## Future Production Approval Rules

The following actions require approval before any production implementation:

- production deploys
- database migrations
- deleting records
- billing changes
- sending customer emails
- sending member invitations
- changing roles or permissions
- modifying production data

Future approval records should include requester, required approver, reason, risk level, decision, timestamp, and linked audit log.

## Phase 30 Thread Approval Queue

Phase 30 adds a local approval queue model for future human-gated thread actions.

Approvals are state changes only. Approving an item does not perform the requested external action.

Supported approval request types:

- email draft request
- SMS draft request
- CRM write request
- Stripe invoice request
- Supabase write request
- executive review request
- sales follow-up request

Generated approval items live under:

```text
codex-agent-threads/shared/approval-queue/
```

Generated queue files are ignored by Git. The committed example lives in:

```text
codex-agent-threads/shared/examples/approval-queue.example.json
```

Run from the repo root:

```bash
npm run threads:approval-queue
npm run threads:approve -- --id approval:item-id --operator Robert --reason "Reviewed locally"
npm run threads:reject -- --id approval:item-id --operator Robert --reason "Not ready"
```

Approve and reject commands update the local queue item with a decision object. They do not send email, send SMS, write CRM records, create Stripe invoices, write Supabase production data, or write production business data.

The queue is a review system, not an execution system.
