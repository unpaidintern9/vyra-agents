# Local CRM

The Local CRM is the Sales Agent's file-backed and browser-local opportunity system. It is independent of `vyraapp.fit` and is safe to keep if the old CRM is removed.

## Opportunity Records

Each opportunity stores company, contacts, industry, location, NAICS, website, phone, email, company size estimate, ICP score, lead score, priority, status, owner, source, created/updated dates, notes, timeline, attachments, generated reports, draft outreach, proposal readiness, executive visibility, tags, favorites, and pinned state.

## Supported Actions

Create, edit/update, archive, restore, duplicate-ready data model, merge, search/filter-ready dashboard views, tags, favorites, pinned opportunities, scoring, follow-up planning, proposal readiness, local reports, and timeline review.

No remote backend is used.

## Research Intelligence Storage

Phase 48 extends the local Sales storage with `research-intelligence.json`.

It contains research sources, intake queue, verification records, enrichment history, duplicate candidates, and review history.

This file stays under `codex-agent-threads/shared/sales-opportunities` and is not synchronized with `vyraapp.fit`, cloud CRM, Supabase production, or Stripe.

## Workflow Storage

Phase 49 adds `sales-workflows.json` under the same local Sales opportunity folder.

It contains workflow records, handoff records, approval decisions, proposal prep queue rows, workflow audit history, and workflow report outputs.

No external database is used.
# Phase 50 Opportunity Intelligence

Local CRM opportunities now feed deterministic Sales intelligence scoring and priority queues.

Stored opportunity data remains local. Phase 50 does not add external databases, CRM synchronization, automatic duplicate merging, automatic Executive approval, autonomous browsing, autonomous email sending, or proposal submission.
