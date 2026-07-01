# Executive KPI Model

Executive KPIs are derived from current local runtime data.

## Supported KPIs

- open tasks
- completed tasks
- blocked tasks
- projects on track
- release readiness percent
- Engineering health percent
- Sales pipeline health
- automation success
- email delivery status
- connector readiness

## Scoring

The Operations Center combines KPI-derived subsystem scores into an overall Executive score from 0 to 100.

- `ready`: 80 or higher
- `watch`: 60 to 79
- `attention`: below 60

The score is advisory. It is for local operating review and does not approve external action.

## Reports

`npm run executive:kpis` prints KPI JSON and writes an ignored Executive KPI Markdown report.

## Boundary

KPI generation reads local data and writes ignored reports only. It performs no deployments, GitHub writes, CRM writes, Stripe writes, production writes, or secret output.
