# Sales Intelligence Scoring

Phase 50 adds local-only opportunity intelligence for prioritization and dashboard scanning.

## Scoring Inputs

Each opportunity score is deterministic and explainable. It considers:

- Company fit
- Industry fit
- Organization size
- Geographic fit
- Buying signals
- Existing relationship
- Estimated revenue potential
- Research confidence
- Workflow urgency
- Proposal readiness

The output includes total score, Hot/Warm/Cold/Not Ready label, confidence level, top reasons, risks, and recommended next action.

## Priority Queues

The Sales dashboard shows:

- Hot Prospects
- Warm Prospects
- Needs Research
- Proposal Ready
- Executive Review
- Blocked

Queue entries explain why they appear there. Queues do not send messages, approve work, browse, sync CRM records, or submit proposals.

## Duplicate Review

Duplicate and related opportunity candidates are detected from company name, domain, contact email, opportunity title tokens, and source. Candidates are surfaced for manual review only.

No merge happens automatically. The `sales:merge` command now returns a review packet and does not write merged records.

## Analytics

Pipeline analytics include total opportunities, Hot/Warm/Cold/Not Ready counts, estimated pipeline value, proposal-ready count, blocked count, Executive-review count, average confidence, and next-action breakdown.

## CLI Reports

Phase 50 adds:

- `npm run sales:intelligence-report`
- `npm run sales:priority-queue-report`
- `npm run sales:duplicate-candidates-report`
- `npm run sales:pipeline-forecast-report`

Reports are written locally under `reports/agents/sales`.

## Safety

Scoring is advisory. It never performs browsing, customer email sending, CRM synchronization, proposal submission, automatic Executive approval, automatic source approval, or automatic duplicate merging.

## Phase 51 Relationship Intelligence

Organization and contact intelligence add deterministic evaluations for:

- Organization Health
- Relationship Health
- Decision Maker Coverage
- Buying Committee Completeness
- Proposal Readiness
- Sales Readiness

Each evaluation returns a score, label, confidence, reasons, risks, recommended next action, and missing information. These scores help queue work and explain risk, but they do not modify CRM data or approve any external action.
