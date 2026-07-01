# Contact Intelligence

Phase 51 adds local contact intelligence for Sales organizations.

## Contact Model

Each contact stores:

- Contact ID
- Organization ID
- Name
- Title
- Role
- Email
- Phone
- LinkedIn reference note
- Seniority
- Influence level
- Relationship strength
- Decision maker status
- Buying committee roles
- Confidence
- Source IDs
- Intake IDs
- Opportunity IDs
- Last interaction
- Next action
- Missing information
- Timeline

Contacts are unlimited per organization. Contact records are local planning records and are not synchronized with an external CRM.

## Duplicate Review

Duplicate contact candidates are detected from email, phone, normalized name, and organization. Candidates are surfaced as review packets only.

No contact is merged automatically.

## Safety

No sensitive personal data collection is added. The system uses local/mock/manual fields only and does not browse, scrape, message, enrich from private sources, or write to external systems.

## Shared Memory

Phase 52 maps contacts into the shared memory graph as contact entities connected to organizations. Email, phone, decision authority, relationship strength, and missing verification become reviewable facts. Contact conflicts remain review-only and are never auto-merged.
