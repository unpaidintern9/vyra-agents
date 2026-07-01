# Task Dependencies

Universal tasks can link dependencies, parent tasks, and child tasks. The runtime derives readiness, blockers, dependency path, downstream impact, and unblock recommendations from local task records.

Dependency fields:

- `dependencies`: task IDs that must be reviewed or completed before the task is ready.
- `parentTask`: parent task ID for grouped work.
- `childTasks`: child task IDs that belong under the current task.
- `blockedReason`: human-readable blocker text.

Readiness states:

- `ready_for_work`: no blockers or open dependencies.
- `ready_for_review`: the task is in review and has no blockers.
- `blocked_or_waiting`: blockers, manual approval, or open dependencies exist.

Use `npm run tasks:dependencies -- --id <task-id>` to inspect a task, or `npm run tasks:dependencies` to print the dependency summary.
