# Executive Planning

Phase 54 adds a local Executive Planning Engine that connects goals, KPIs, initiatives, decisions, blockers, tasks, workflows, shared memory, sales intelligence, and reports.

Storage lives under:

```text
codex-agent-threads/shared/executive-planning/
```

The engine is deterministic and advisory. It does not browse, send email, sync CRM data, submit proposals, approve sources, approve Executive gates, merge records, or complete goals automatically.

Core commands:

- `npm run executive:goals`
- `npm run executive:create-goal`
- `npm run executive:update-goal`
- `npm run executive:kpis`
- `npm run executive:create-kpi`
- `npm run executive:update-kpi`
- `npm run executive:initiatives`
- `npm run executive:create-initiative`
- `npm run executive:decision-log`
- `npm run executive:add-decision`
- `npm run executive:blockers`
- `npm run executive:goal-report`
- `npm run executive:kpi-report`
- `npm run executive:planning-report`
- `npm run executive:validate`

Reports include Executive Planning Summary, Goal Progress, KPI Scorecard, Initiative Tracker, Blocked Goal, Decision Log, Agent Contribution, and Strategic Risk reports.
