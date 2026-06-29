# Operations Agent Hardening

- Treat logs, deployment notes, incident details, and approvals as sensitive operational records.
- Never execute deployments, restarts, migrations, or production jobs from this phase.
- Keep readiness and incident output as local review material only.
- Escalate failed checks, security concerns, and customer-impacting incidents to human operators.
- Do not store secrets, raw logs with credentials, or production tokens in agent notes.
