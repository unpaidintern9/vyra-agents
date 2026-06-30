# Executive Agent

The Executive Agent is Robert's cross-platform operations view for the Vyra Agents dashboard.

It does not add AI, autonomous execution, production writes, invitations, deployments, or direct database writes. It reads the shared Agent Runtime and presents a deterministic command-center view across departments.

## Scope

The Executive Dashboard replaces the previous Overview page as the first screen.

It shows:

- Overall platform health.
- Registered, healthy, warning, and critical agent counts.
- Pending approvals.
- Workflow activity.
- Sync queue state.
- Engineering and Migration operating signals.
- Recent runtime events.
- Deterministic executive priorities.
- Cross-agent timeline.
- Department health table.
- Aggregated approval queue.
- Runtime summary.
- Local report exports.

## Runtime Source

The Executive Agent consumes the Phase 18 runtime from `dashboard/src/runtime/`.

It uses:

- Agent Registry.
- Agent Runtime.
- Workflow Registry.
- Runtime Health.
- Agent Memory.
- Audit activity.
- Sync Queue state.
- Approval Queue state.

The Executive Agent does not duplicate Engineering or Migration logic. Those agents remain the source for their own workflows and pages.

## Navigation

Department health rows and priority actions deep-link into existing dashboard pages:

- Engineering -> Engineering.
- Migration -> Migration.
- Product -> Products.
- Operations, Sales, Support, Finance, and Marketing -> Runtime until dedicated department pages exist.

## Safety Boundaries

- No production writes.
- No production business data changes.
- No Supabase service role key in the browser.
- No direct browser inserts.
- No invitations sent.
- No GitHub writes from Executive Dashboard exports.
- No AI or LLM calls.
