# Gmail Email Connector

Phase 40A adds Gmail as the first real email connector for internal Vyra agent updates.

## Shared Accounts

Approved senders:

- `admin@vyraapp.fit`
- `robert.sorenson@vyraapp.fit`

Internal recipients:

- Robert: defaults to `robert.sorenson@vyraapp.fit`
- Matthew: requires `VYRA_EMAIL_MATTHEW`; if missing, sends are skipped and audited

## Safe Config Names

Do not commit values. Configure them only in a local or secret environment:

```bash
VYRA_GMAIL_ACCESS_TOKEN=
VYRA_GMAIL_CLIENT_ID=
VYRA_GMAIL_CLIENT_SECRET=
VYRA_GMAIL_REFRESH_TOKEN=
VYRA_GMAIL_SEND_ENABLED=true
VYRA_EMAIL_ROBERT=robert.sorenson@vyraapp.fit
VYRA_EMAIL_MATTHEW=
```

The connector is considered configured when either `VYRA_GMAIL_ACCESS_TOKEN` exists or the OAuth refresh-token trio exists.

## Commands

```bash
npm run email:status
npm run email:drafts
npm run email:create-draft
npm run email:send
npm run email:send-pending
npm run email:audit
npm run email:validate
npm run email:safety-check
```

## Safety Gates

Sending is allowed only when:

- Gmail connector config exists.
- `VYRA_GMAIL_SEND_ENABLED` is not `false`.
- Sender is allowlisted.
- Recipient email exists and is valid.
- Subject and body are valid.
- Audit records are created.

No external marketing emails, bulk campaigns, CRM writes, Stripe writes, Supabase production writes, or production business writes are supported.
