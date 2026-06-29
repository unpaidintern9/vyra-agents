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

Exports are generated in the browser from the static metadata graph and local dashboard state.

## Agent Memory Integration

When a selected-node impact report is exported, the dashboard appends:

- a local Engineering Agent event
- a local audit log
- a local workflow result for `engineering-impact-analysis`

If Agent Memory sync is configured, those local records sync only through the approved Edge Function path into approved `agent_*` tables. If unavailable, they remain in localStorage.

## Safety

- Exports contain metadata only.
- No `.env.local` values are included.
- No service role keys are used in browser code.
- No production business tables are written.
