# Manual Send Workflow

Phase 33 adds a local manual-send workflow for communication drafts.

The workflow records what a human operator did outside the system. It does not send email or SMS, and it does not call Gmail, SMTP, SendGrid, Resend, Twilio, or any provider.

## States

Supported local states:

- `draft_created`
- `ready_for_review`
- `approved_for_manual_send`
- `copied_by_operator`
- `marked_sent_manually`
- `rejected`
- `archived`

`marked_sent_manually` means a human marked the draft as sent outside Vyra. It is not proof that Vyra sent anything, because Vyra still has no provider-send path.

## CLI

Run from the repo root:

```bash
npm run comms:manual-send -- --id draft:id --operatorName Robert --operatorTool Codex
npm run comms:mark-copied -- --id draft:id --operatorName Robert --operatorTool Codex
npm run comms:mark-sent -- --id draft:id --method manual_copy_paste --operatorName Robert --operatorTool Codex
```

Running `npm run comms:manual-send` without an id reports the local manual send queue.

## Reports

Manual send reports are generated under ignored local reports:

```bash
npm run comms:audit-report
```

This produces:

- Manual Send Queue Markdown
- Manual Send Queue JSON
- Communication Audit Trail Markdown
- Communication Audit Trail JSON

## Safety

- no email sends
- no SMS sends
- no provider calls
- no CRM writes
- no Stripe writes
- no Supabase production writes
- no production business writes
- no secrets
