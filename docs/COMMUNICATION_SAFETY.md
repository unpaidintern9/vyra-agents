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
