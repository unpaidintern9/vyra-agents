# Vyra Agents Dashboard

Local command-center dashboard for the Vyra Agents MVP.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run build
npm run lint
```

The dashboard uses mock/local data for agent actions. Phase 6 stores local run history in browser localStorage and can export JSON or Markdown reports from the browser.

Local persisted records include:

- agent runs, events, tasks, and approvals
- audit logs
- workflow dry-check results
- migration dry-run summaries
- approval history

No AI calls, production write workflows, database mutations, service role keys, billing integrations, or GitHub write actions are implemented in the dashboard.
