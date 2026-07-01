# Organization Intelligence

Phase 51 adds a local Organization Intelligence engine for Sales.

## Purpose

Organization records give Sales a single local view of each company across opportunities, research intake, workflows, proposal prep, Executive reviews, contacts, relationship graph edges, and timelines.

## Organization Model

Each organization stores:

- Organization ID
- Name
- Domain
- Website
- Industry
- Business type
- Geography
- Estimated size
- Estimated revenue potential
- Services
- Technology profile
- Government relevance
- Proposal opportunities
- Buying indicators
- Competitive notes
- Related contacts
- Related opportunities
- Related research intake
- Related workflows
- Relationship health
- Decision maker coverage
- Buying committee completeness
- Proposal readiness
- Sales readiness
- Timeline

## Explainable Evaluations

Organization Health, Relationship Health, Decision Maker Coverage, Buying Committee Completeness, Proposal Readiness, and Sales Readiness are deterministic. Each evaluation includes score, label, confidence, reasons, risks, recommended next action, and missing information.

## Safety

The engine is local-only. It does not browse, sync to `vyraapp.fit`, write to any CRM, send email, submit proposals, approve Executive actions, or merge duplicates automatically.
