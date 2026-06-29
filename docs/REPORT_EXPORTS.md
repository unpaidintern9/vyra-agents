# Report Exports

The dashboard supports local JSON and Markdown exports for agent reports.

## Engineering Exports

Phase 10 adds:

- Full Engineering Graph JSON.
- Engineering Graph Markdown report.
- Selected node detail report.
- Selected node impact report.
- Full Engineering impact summary.
- Table impact report.
- Route/screen impact report.
- Migration history report.

Phase 11 adds:

- Ownership map JSON and Markdown.
- Repo health report Markdown.
- Risk queue report Markdown.
- Table-to-screen map JSON.
- Function-to-table map JSON.
- Missing docs report Markdown.
- Orphan candidates report Markdown.

Phase 12 adds:

- Engineering Backlog JSON.
- Engineering Backlog Markdown.
- Documentation Gap Report Markdown.
- Orphan Review Report Markdown.
- Broken Relationship Report Markdown.
- Repo Health Improvement Plan Markdown.

Exports are generated in the browser from the static metadata graph and local dashboard state.

## Agent Memory Integration

When an Engineering impact, ownership/health, or fix queue planning report is exported, the dashboard appends:

- a local Engineering Agent event
- a local audit log
- a local workflow result for `engineering-impact-analysis`, `engineering-ownership-health-scan`, or `engineering-fix-queue-planning`

If Agent Memory sync is configured, those local records sync only through the approved Edge Function path into approved `agent_*` tables. If unavailable, they remain in localStorage.

## Safety

- Exports contain metadata only.
- No `.env.local` values are included.
- No service role keys are used in browser code.
- No production business tables are written.
