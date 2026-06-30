# Communication Safety

Vyra communication drafts are local artifacts only.

Every draft must clearly declare:

- Draft only
- Not sent
- Local only
- Requires human review
- External sending disabled

## Blocked Integrations

Phase 31 does not connect to:

- Gmail
- Google Workspace email
- Twilio
- SendGrid
- Resend
- any other email or SMS provider

It also does not write CRM records, create Stripe invoices, write Supabase production data, or modify production business data.

## Required Safety Metadata

Draft payloads must include:

```json
{
  "safety": {
    "draftOnly": true,
    "notSent": true,
    "localOnly": true,
    "humanReviewRequired": true,
    "externalSending": "disabled",
    "providerConnected": false,
    "productionWrites": false,
    "secretsIncluded": false
  }
}
```

## Approval Relationship

Approval queue records can request a future communication draft. The Communication Draft Layer can prepare a local draft from an approved or review-ready local task.

Approving a draft does not send it. Future sending must be implemented as a separate explicit workflow with provider configuration, audit logging, and human approval gates.

## Phase 32 Provider Readiness

Phase 32 adds provider readiness templates for Gmail, Google Workspace SMTP, SendGrid, Resend, Twilio SMS, and manual copy/paste mode.

Provider readiness is still local-only:

- no provider clients are created
- no provider API calls happen
- no SMTP connection is opened
- no email or SMS is sent
- no provider secrets are stored in the repo
- `.env.local` is not modified

Safety gates enforced by readiness reports:

- sending disabled by default
- provider calls blocked
- missing approval blocks send
- missing provider config blocks send
- production send mode unavailable

Readiness checks may show environment variable names as missing or configured, but they must never print environment variable values.

## Phase 33 Manual Send Safety

Phase 33 adds manual-send workflow states and a local communication audit trail.

Manual send remains outside provider automation:

- `copied_by_operator` means a human copied the draft text.
- `marked_sent_manually` means a human marked it as sent outside Vyra.
- Neither state sends email or SMS through Vyra.
- Audit entries must record `providerSendOccurred: false`.
- Audit entries must record `productionWriteOccurred: false`.
- Audit entries must record `secretsIncluded: false`.

The manual-send workflow is local bookkeeping for human actions. It does not connect to Gmail, SMTP, SendGrid, Resend, Twilio, CRM, Stripe, Supabase production data, or production business systems.

## Phase 40A Gmail Boundary

Phase 40A adds a separate Gmail email connector for internal agent reports. Legacy communication drafts still do not send. Gmail sends use `email:send` or `email:send-pending`, require Gmail configuration, enforce approved senders and internal recipients, skip missing recipient emails, and write Gmail email audit entries for sent, failed, and skipped attempts.

No external marketing emails, bulk outbound campaigns, CRM writes, Stripe writes, Supabase production writes, production business writes, or secret output are supported.
