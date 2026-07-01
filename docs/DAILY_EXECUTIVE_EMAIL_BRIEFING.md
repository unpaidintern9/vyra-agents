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

Robert is enabled by default through the internal Gmail recipient model.

Matthew is modeled as an internal recipient, but is skipped until `VYRA_EMAIL_MATTHEW` is configured with a valid email address.

No external or customer recipients are supported.

## Reports

- Daily Briefing Email Preview Markdown
- Daily Briefing Email JSON
- Daily Briefing Send Audit Markdown

Generated report files are written under `reports/agents/executive/` and ignored by Git.

## Safety

The preview and status commands do not send email.

The send command creates Gmail email drafts and delegates delivery attempts to the existing Gmail connector safety gates and audit trail. Gmail sends only proceed when sender, recipient, connector config, body, subject, and audit requirements pass.

No marketing emails, bulk sending, CRM writes, Stripe writes, Supabase production writes, GitHub writes, deployments, releases, or secrets output are supported.
