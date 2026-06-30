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
