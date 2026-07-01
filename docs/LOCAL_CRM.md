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
