# Release Approval Model

Release approval records are local planning artifacts.

## Approval Meaning

`approved_to_prepare` means Executive and Engineering can continue local preparation work. It does not mean the release has shipped, and it does not authorize an external deployment command.

## Required Approvals

Ship plans can require:

- Executive approval
- Engineering approval
- QA approval
- Security/safety approval

Security/safety approval is required when release readiness reports critical risk or critical blockers.

## Deterministic Decisions

- `no_ship`: high or critical blockers exist, or readiness score is below 75.
- `prepare_only_needs_review`: blockers exist or readiness score is below 90.
- `approved_to_prepare_candidate`: readiness score is at least 90 and no blockers are detected.

## Safety

Approvals are local JSON records only. The workflow blocks deploys, tags, GitHub releases, pushes, project file modifications, CRM writes, Stripe writes, Supabase production writes, and secret output.
