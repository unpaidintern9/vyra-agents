# Automation Safety

Executive automation is local-safe orchestration. It coordinates existing safe layers and keeps all risky writes disabled.

## Safety Gates

Required gates:

- no external marketing emails
- no bulk sending
- no CRM writes
- no Stripe writes
- no Supabase production writes
- no GitHub writes
- no secrets output
- all emails must use existing Gmail safety checks and audit logging
- automatic emails only to approved internal recipients

## Email Safety

Automation uses the existing Gmail Email Connector for email drafts and any configured internal send attempt.

Allowed senders remain:

- `admin@vyraapp.fit`
- `robert.sorenson@vyraapp.fit`

Approved internal recipients are Robert and Matthew. Matthew is skipped until configured. Every send, skip, or failure is recorded by the Gmail audit workflow.

## Write Boundaries

Automation may write ignored local planning artifacts:

- local shared task JSON
- local GitHub plan JSON
- local Gmail draft/audit JSON
- local report Markdown/JSON

Automation must not write GitHub issues, PRs, branches, commits, labels, comments, workflow dispatches, CRM records, Stripe objects, Supabase production tables, `.env` files, or secret-bearing output.

## Validation

Run:

```bash
npm run executive:automation-validate
npm run executive:automation-safety-check
npm run email:validate
npm run email:safety-check
```
