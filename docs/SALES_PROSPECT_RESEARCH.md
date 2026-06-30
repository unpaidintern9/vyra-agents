# Sales Prospect Research

The Sales Prospect Research foundation gives Vyra a local place to plan target lists before connecting real CRM, Google Workspace, email, or public research automation.

## Target Segments

Initial first-target segments:

- MMA / BJJ gyms.
- CrossFit boxes.
- Small independent gyms.
- Boutique fitness studios.
- Sports performance gyms.

Preferred targets have one to three locations, visible owner/operator context, class or membership complexity, and a likely need for scheduling, member communication, branded app, Gym OS, or migration/import help.

## Target Markets

The first local prospect slots cover:

- Louisville, KY.
- Cincinnati, OH.
- Los Angeles, CA.
- New York, NY.

These records are local planning slots. The dashboard labels records that still need public-source verification.

## Sales Agent Team

The Sales page includes:

- Head Sales Agent.
- Prospect Discovery Agent.
- Public Research Agent.
- Data Organization Agent.
- ICP Fit Scoring Agent.
- Outreach Prep Agent.
- Meeting Prep Agent.
- Proposal Builder Agent.
- Migration Planning Agent.
- CRM Design Agent.
- Follow-Up Agent.
- Sales Intelligence Agent.
- Safety / Approval Agent.

Each agent is modeled as a local dashboard module with responsibilities, output, handoffs, and blocked external actions.

## Fit Scoring

Prospect fit scoring is deterministic. It favors:

- MMA/BJJ and CrossFit segments.
- Small location counts.
- Member management, scheduling, app, communication, migration, or import fit.
- Clear confidence and public-source readiness.

Records with missing source verification remain marked as needing public research.

## Safety Boundaries

- No AI is implemented.
- No emails are sent.
- No Stripe invoices are created.
- No CRM writes occur.
- No production business data is written.
- No automated scraping jobs run.
- No login-gated, private, paywalled, or personal-data scraping is allowed.
- Future public research automation must use approved public sources, respect site rules, and remain reviewable before persistence.

## Current Storage

Prospect research records are saved only in browser localStorage under:

```text
vyra-agents:sales-prospect-research
```

They are not synced to CRM or production business tables.
