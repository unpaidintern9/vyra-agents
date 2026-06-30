# Sales Intelligence Graph

The Sales Intelligence Graph is a local, read-only intelligence layer over Sales Agent data.

## Scope

The graph links local records for:

- Prospects.
- Organizations.
- Coaches.
- Proposals.
- Follow-ups.
- Migration plans.
- Research dossiers.
- Activities.

## Relationships

Supported relationship types:

- `owns`
- `employs`
- `manages`
- `interested_in`
- `migration_target`
- `proposal_for`
- `follow_up_for`
- `referred_by`
- `competitor_of`

Relationships are deterministic and explainable. They are inferred only from local intake records, local leads, local proposals, local follow-up queues, local dossiers, and local activity history.

## Exports

The full graph can be exported as JSON from the Sales page.

## Safety Boundaries

- No external browsing.
- No CRM writes.
- No email sends.
- No Stripe invoices.
- No production business writes.
- The graph is derived from local dashboard state only.
