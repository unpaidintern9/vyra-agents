# Research Intake

Phase 48 adds a local Research Intake Pipeline for the Sales Agent.

Intake records are stored in `codex-agent-threads/shared/sales-opportunities/research-intelligence.json` alongside sources, verification records, duplicate candidates, enrichment history, and review history.

Each intake item records source, opportunity, company, research type, date, analyst, summary, raw notes, confidence, verification status, duplicate detection, suggested actions, evidence level, completeness, risk rating, review status, missing information, and whether human review is required.

## Verification

Every intake item receives confidence, evidence level, completeness, risk rating, review status, missing information, and human review requirement.

## Duplicate Detection

Duplicate candidates may be raised for companies, contacts, websites, phone numbers, emails, and opportunities.

The Sales Agent only suggests merge actions. It never merges duplicate research automatically.

## Enrichment

Approved and reviewed research can prepare local opportunity enrichment. Every enrichment record includes timestamp, source, operator, previous value, new value, confidence, and reason.

The enrichment command records an audit trail in local storage. It does not write to `vyraapp.fit`, external CRM, Supabase production, Stripe, or email systems.

## Commands

- `npm run sales:intake`
- `npm run sales:verify`
- `npm run sales:duplicates`
- `npm run sales:enrich`
- `npm run sales:research-report`

## Manual Research Mode

When live public-web research is unavailable, paste public/manual notes into the intake workflow. Do not paste private data, login-gated content, paywalled content, secrets, or sensitive personal data.
