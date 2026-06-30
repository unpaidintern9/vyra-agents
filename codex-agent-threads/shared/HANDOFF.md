# Codex To Vyra Agent Handoff

This file defines how named Codex automation threads should coordinate with the Vyra role agents in `../agents/`.

## Bridge Map

- Sales Tips -> Sales Agent for next-step suggestions and Executive Agent for summary rollups.
- Sales Company Research -> Sales Agent for prospect research and Operations Agent for repeatable batch workflow setup.
- Customer Research Engine -> Sales Agent for prospect/customer research and Support Agent for customer issue signals if support context appears later.

## Handoff Format

Use this shape for local outputs in `shared/outbox/`:

```markdown
# <Output Title>

- Source Codex thread:
- Target Vyra agent:
- Created:
- Status:
- Confidence:
- External side effects: none

## Summary

## Source Links

## Recommended Local Follow-Up

## Approval Needed Before
```

## Safety Rules

- Public web research is allowed when requested and lawful.
- Private accounts, paywalls, login-only data, and access-control bypassing are not allowed.
- Outreach, CRM writes, invoices, production database writes, and customer communications require explicit approval gates.
- Store research notes locally first; let Vyra agents decide whether the information is ready for dashboard/report use.
