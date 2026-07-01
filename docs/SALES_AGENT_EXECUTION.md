# Sales Agent Execution

Phase 46A upgrades the Sales Agent from a passive local dashboard into a local execution assistant. It can search local prospects, generate deterministic research dossiers, export reports, prepare local shared tasks, and create draft-only email records.

## What it does

- Runs Louisville-area ICP prospect searches from local data.
- Generates company/prospect dossiers from available public/manual fields.
- Produces Sales Pipeline, Prospect Research, Company Dossier, Outreach Prep, Follow-Up, ICP Fit, Proposal Prep, and Executive Sales Summary reports.
- Creates local shared tasks for missing contact info, company research, outreach drafts, proposals, follow-ups, executive review, and high-fit prospects.
- Creates local email drafts for prospect outreach, internal prospect summary, follow-up reminders, and proposal-ready notifications.

## Commands

- `npm run sales:status`
- `npm run sales:research`
- `npm run sales:reports`
- `npm run sales:outreach`
- `npm run sales:tasks`
- `npm run sales:validate`

## Safety

All Phase 46A execution is local/mock/read-only. It does not send external customer emails, write CRM records, create Stripe objects, write Supabase production data, bypass website rules, or scrape private/restricted data.
