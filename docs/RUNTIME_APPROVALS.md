# Runtime Approvals

Runtime approvals normalize existing approval items into a shared model:

- approval id
- agent
- workflow
- risk
- required by
- status
- created
- completed

Approvals remain local/mock unless a future approved phase explicitly enables external actions. High-risk actions such as production writes, customer messaging, and live deployments remain blocked or approval-gated.

The runtime provides a common approval surface so future agents do not duplicate approval logic.
