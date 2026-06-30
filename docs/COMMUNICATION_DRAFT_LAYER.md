# Communication Draft Layer

Phase 31 adds local communication draft preparation for Vyra agents.

The layer prepares draft content only. It does not send messages and does not connect to email, SMS, CRM, Stripe, Supabase, or production systems.

## Draft Types

Supported draft models:

- email draft
- SMS draft
- sales follow-up draft
- Executive summary draft
- customer research update draft

## Local Storage

Drafts live in ignored local folders:

```text
codex-agent-threads/shared/drafts/email/
codex-agent-threads/shared/drafts/sms/
codex-agent-threads/shared/drafts/archive/
```

Committed files include only `.gitkeep`, schemas, and examples. Generated draft payloads remain ignored.

## CLI

Run from the repo root:

```bash
npm run comms:drafts
npm run comms:create-draft
npm run comms:review
npm run comms:archive
npm run comms:validate
```

Example:

```bash
npm run comms:create-draft -- --type email_draft --channel email --title "Follow-up draft" --recipientName "Local Prospect" --subject "Vyra follow-up" --body "Draft only. Not sent."
npm run comms:review -- --id draft:email_draft:YYYYMMDDTHHMMSSZ --decision approved_local
npm run comms:archive
```

## Review States

Draft statuses:

- `pending_review`
- `approved_local`
- `requires_changes`
- `archived`

`approved_local` means the draft was reviewed locally. It does not mean the message was sent.

## Reports

`npm run comms:drafts` writes ignored local JSON and Markdown reports under:

```text
reports/agents/runtime/
```

Reports include draft counts, drafts by type, pending review counts, local approval counts, archived counts, and safety status.
