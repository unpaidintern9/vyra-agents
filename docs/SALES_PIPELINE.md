# Sales Pipeline

The local CRM opportunity pipeline supports these stages:

- Prospect
- Researching
- Qualified
- Contact Ready
- Outreach Sent
- Waiting
- Follow Up
- Discovery Scheduled
- Proposal Preparation
- Proposal Sent
- Negotiation
- Won
- Lost
- Archived

Every stage transition records previous stage, new stage, timestamp, reason, and operator in the immutable opportunity timeline. Executive and Operator dashboards consume those local timeline signals read-only.

Phase 48 research enrichment can prepare local opportunity updates only when research has an approved source and reviewed intake item. Every enrichment records source, operator, previous value, new value, confidence, timestamp, and reason. Duplicate detection never merges opportunities automatically.

Phase 49 workflow handoffs connect pipeline opportunities to Operator tasks, Executive approvals, and Proposal Prep queues. Stage changes remain local; external action gates require manual workflow approval before any later phase can introduce external action.

Phase 50 adds opportunity intelligence scoring and pipeline analytics on top of the local CRM. Scores classify opportunities as Hot, Warm, Cold, or Not Ready and explain top reasons, risks, and next actions. Priority queues surface Hot Prospects, Warm Prospects, Needs Research, Proposal Ready, Executive Review, and Blocked records without changing CRM data automatically.

Duplicate and related opportunity candidates are surfaced from company, domain, email, title tokens, and source. They are review-only; no automatic merge occurs.

Phase 51 links each local opportunity to organization and contact intelligence. Pipeline rows can show decision maker coverage, buying committee completeness, relationship health, proposal relationship readiness, related contacts, related research intake, related reports, related workflows, and relationship risks.

These links are advisory and local. They do not change opportunity stage, send outreach, submit proposals, sync CRM records, or approve Executive gates automatically.
