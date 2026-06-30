# Executive Automation Rules

Automation rules are deterministic local models. They trigger from local runtime data, not from AI-generated judgment.

## Trigger Types

- manual
- scheduled
- event-detected
- threshold-crossed
- validation-failed
- report-ready

## Action Types

- run agent workflow
- create shared task
- create GitHub plan
- create email draft
- send configured internal email
- create Executive review item
- archive low-priority item
- generate report

## Rule Categories

The Phase 41 rule catalog covers:

- engineering health warnings
- failed validations
- GitHub repo changes
- blocked tasks
- overdue tasks
- high-value Sales opportunities
- migration blockers
- connector readiness failures
- email send failures/skips
- cross-agent review needs

## Rule Effects

Rules may produce local shared tasks, local GitHub plans, local email drafts, report files, or Executive review items. A rule never creates a GitHub issue, sends a marketing email, updates CRM, creates Stripe objects, or writes Supabase production data.

## Reviewing Rules

Use:

```bash
npm run executive:automation-rules
npm run executive:automation-status
```

The first command prints the configured rule model. The second command evaluates the current local data and shows which rules are triggered.
