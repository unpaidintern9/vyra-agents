# Universal Task Engine

Phase 53 adds a local-only task engine for Sales, Operator, Executive, Proposal Prep, Contract Intelligence, Memory, and future agent workflows.

Universal task records live under `codex-agent-threads/shared/tasks/` and keep the older shared task fields compatible while adding task type, owning agent, assigned user, linked workflows, linked opportunities, linked organizations, linked contacts, linked reports, linked facts, linked proposals, dependencies, parent/child tasks, blocked reason, route history, and audit history.

Supported task types include research, verification, duplicate review, missing information, follow-up, proposal preparation, executive approval, contract review, compliance review, operator action, sales action, marketing action, finance action, engineering action, memory maintenance, source review, workflow review, and general.

Statuses are normalized into the universal state model: draft, queued, assigned, in_progress, waiting, blocked, review, approved, rejected, completed, and archived. Legacy statuses such as `New`, `In Progress`, and `Needs Review` remain accepted through the compatibility adapter.

Every transition records timestamp, previous status, new status, actor, reason, affected entities, affected workflows, and next action. Invalid transitions are rejected safely and no external work is performed.

Safety guarantees:

- Local storage only.
- No autonomous browsing.
- No autonomous email sending.
- No CRM synchronization.
- No proposal submission.
- No automatic Executive approval.

## Phase 54 Planning Links

Executive goals and initiatives can link universal tasks by ID. The planning engine detects blocked or overdue linked tasks and surfaces recommended next actions, but it never resolves blockers or completes tasks automatically.
- No automatic source approval.
