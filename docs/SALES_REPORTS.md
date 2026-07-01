# Sales Reports

Phase 46A reports are generated from local dashboard state or local CLI seed data.

## Dashboard Exports

- Sales Pipeline Report
- Prospect Research Report
- Company Research Dossier
- Outreach Prep Report
- Follow-Up Plan
- ICP Fit Report
- Proposal Prep Report
- Executive Sales Summary
- Lead Scoring Report
- Follow-Up Queue Report
- Weighted Pipeline Report

Dashboard exports use Markdown or JSON. Sales Pipeline also supports CSV from the dashboard.

## CLI Exports

Run `npm run sales:reports` to write Markdown and JSON reports into `reports/agents/sales`. The CLI also writes `prospect-research.csv`.

Reports are local artifacts only. They do not create CRM records, send emails, create invoices, or write production data.
# Phase 50 Sales Intelligence Reports

Phase 50 adds deterministic local reports:

- Sales Intelligence Report
- Priority Queue Report
- Duplicate Candidates Report
- Pipeline Forecast Report

Commands:

- `npm run sales:intelligence-report`
- `npm run sales:priority-queue-report`
- `npm run sales:duplicate-candidates-report`
- `npm run sales:pipeline-forecast-report`

All reports remain local under `reports/agents/sales`. Duplicate candidates are review-only and never merged automatically.
