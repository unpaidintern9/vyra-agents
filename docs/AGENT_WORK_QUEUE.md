# Agent Work Queue

The Agent Work Queue is the shared coordination surface for Executive, Engineering, Sales, Migration, Support, Operations, Customer Success, Research, and future agents.

## Queue Health

The queue summarizes:

- open tasks
- blocked tasks
- overdue tasks
- tasks requiring Executive review
- tasks by assigned agent
- tasks by priority
- workload by agent
- completion trend

The Executive Dashboard reads these metrics as local planning signals. The Operator Dashboard shows active work, newest assignments, recently completed work, blocked work, and workload distribution.

## Agent Usage

Sales can create follow-up, proposal, migration, onboarding, and engineering-blocker tasks.

Migration can claim migration-readiness tasks and link them to local migration plans.

Engineering can publish blocker tasks and complete local review tasks.

Executive can review blocked, overdue, or approval-required work.

Support, Operations, Customer Success, Research, and Future agents can be assigned tasks before they have full dedicated dashboard pages.

## Knowledge Graph Links

Tasks publish local graph nodes of type `shared_task`. The graph links tasks to:

- assigned agents
- source agents
- organizations
- linked entities such as proposals, migrations, follow-ups, blockers, and research dossiers
- related graph node ids

These links are for local review only. They are not database writes and they do not create production records.
