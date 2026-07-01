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

## Organization & Contact Intelligence Storage

Phase 51 adds `organization-contact-intelligence.json` under `codex-agent-threads/shared/sales-opportunities`.

It contains organization records, contact records, buying committee records, relationship graph edges, organization timelines, contact timelines, deterministic relationship health evaluations, decision maker coverage, buying committee completeness, proposal relationship readiness, and duplicate organization/contact candidates.

The file is local-only. It is not synchronized with `vyraapp.fit`, Supabase production, Stripe, Gmail, or any external CRM. Duplicate candidates are review packets only; no organization, contact, email, phone, domain, or opportunity is merged automatically.
