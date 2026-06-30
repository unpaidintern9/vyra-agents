# Sales Follow-Up Engine

Phase 22 adds a local follow-up prioritization engine for the Sales Agent.

The queue builder is implemented in `dashboard/src/agents/sales/salesFollowUpEngine.ts`.

## Safety Model

- The queue is local/mock/read-only.
- No emails are sent.
- No CRM tasks are created.
- No Stripe invoices are created.
- No production business records are written.

## Queue Types

The engine creates reminders for:

- Today's follow-ups.
- Overdue follow-ups.
- Proposal-needed follow-ups.
- Stalled lead reminders.
- Missing-info reminders.

Closed won and closed lost leads are excluded from active follow-up queue generation.

## Prioritization

Queue items are ordered by:

1. Queue type urgency.
2. Lead priority label.
3. Lead score.
4. Due date.

This keeps overdue and high-value work visible while preserving deterministic behavior.

## Sales Page UI

The Sales page shows:

- Follow-up queue count.
- Queue type.
- Lead name.
- Score.
- Priority label.
- Reason.
- Local next action.

All queue actions remain local planning actions. External action buttons remain disabled.

## Executive Signals

The Executive Dashboard uses the queue and scoring summary to show:

- Hot lead count.
- Overdue follow-up count.
- Proposal-needed count.
- At-risk lead count.
- Estimated weighted pipeline value.

## Exports

Available export:

- Follow-Up Queue Markdown.

The export is browser-local and records that no email, Stripe, CRM, or production write occurred.
