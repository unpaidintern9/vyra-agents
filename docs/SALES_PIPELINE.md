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
