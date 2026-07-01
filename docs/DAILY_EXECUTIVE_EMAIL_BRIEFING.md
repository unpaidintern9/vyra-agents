# Daily Executive Email Briefing

Phase 46 connects the Executive Operations Center to the Gmail internal email workflow.

## Model

Each daily briefing email tracks:

- recipient and recipient readiness
- sender
- subject
- briefing date
- Executive score
- top priorities
- blocked work
- Engineering health
- Sales health
- release readiness
- pending approvals
- recommended actions
- Gmail audit id
- send status

## Commands

```bash
npm run executive:email-briefing
npm run executive:email-preview
npm run executive:email-send
npm run executive:email-status
npm run executive:email-validate
```

## Recipients

Executive email briefings originate from `robert.sorenson@vyraapp.fit`.

The shared inbox `admin@vyraapp.fit` is the only default recipient.

No external or customer recipients are supported.

## Reports

- Daily Briefing Email Preview Markdown
- Daily Briefing Email JSON
- Daily Briefing Send Audit Markdown

Generated report files are written under `reports/agents/executive/` and ignored by Git.

## Safety

The preview and status commands do not send email.

The send command creates Gmail email drafts and delegates delivery attempts to the existing Gmail connector safety gates and audit trail. Gmail sends only proceed when the sender is `robert.sorenson@vyraapp.fit`, the recipient is `admin@vyraapp.fit`, connector config exists, body and subject are valid, and audit requirements pass.

No marketing emails, bulk sending, CRM writes, Stripe writes, Supabase production writes, GitHub writes, deployments, releases, or secrets output are supported.
