# Executive Operations Center

Phase 45 makes the Executive Agent the local operating command center for Vyra.

The Operations Center aggregates:

- Engineering
- Sales
- Projects
- Releases
- Ship plans
- Shared tasks
- Communications
- Executive automation
- Connector readiness
- Cross-agent operating signals

## Commands

```bash
npm run executive:briefing
npm run executive:kpis
npm run executive:operations
npm run executive:health
npm run executive:report
npm run executive:validate
npm run executive:email-briefing
npm run executive:email-preview
npm run executive:email-send
npm run executive:email-status
npm run executive:email-validate
```

## Model

The model tracks daily operating status, organization health, engineering health, sales health, project health, release health, communication health, task health, automation health, connector readiness, and the overall Executive score.

## Dashboard

The Executive Dashboard shows a dedicated Operations Center section with the daily briefing, KPIs, priorities, risks, release state, project state, Engineering state, Sales state, communications, automation, connectors, and recommended actions.

The Operator Dashboard shows latest briefing, next scheduled briefing, latest KPI snapshot, overall platform health, and operational alerts.

Phase 46 adds the Daily Executive Email Briefing panel. It shows preview subject/body, recipient readiness, last sent/skipped audit state, next scheduled briefing, and Gmail safety status.

## Reports

- Executive Daily Briefing Markdown
- Executive KPI Report Markdown
- Executive Operations Report Markdown
- Executive Operations JSON
- Daily Briefing Email Preview Markdown
- Daily Briefing Email JSON
- Daily Briefing Send Audit Markdown

## Safety

The Operations Center is local analysis and reporting only. It does not deploy, write GitHub records, write CRM records, create Stripe objects, write production data, or output secrets.

The daily email send command is the only Phase 46 command that may attempt an internal Gmail send. It uses the existing Gmail connector safety gates and audit trail, sends from `robert.sorenson@vyraapp.fit`, and routes to the shared inbox at `admin@vyraapp.fit`.
