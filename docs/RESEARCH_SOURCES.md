# Research Sources

Phase 48 adds a local Research Source Manager for the Sales Agent.

Sources are stored in `codex-agent-threads/shared/sales-opportunities/research-intelligence.json`.

Each source records ID, name, category, description, enabled state, manual/semi-automatic mode, local/external scope, authentication requirement, notes, created/updated/last-used timestamps, trust score, confidence score, status, and approval status.

Supported approval states are Draft, Pending Review, Approved, Rejected, Disabled, and Archived.

Only enabled sources with `Approved` approval status may be used by local enrichment workflows.

Supported categories include Manual Research, Public Website, Government, Business Directory, Chamber of Commerce, LinkedIn manual reference only, Industry Association, State Registry, Federal Registry, Local File, CSV Import, Internal Notes, Existing Reports, and User Generated.

## Commands

- `npm run sales:sources`
- `npm run sales:add-source`
- `npm run sales:update-source`
- `npm run sales:disable-source`
- `npm run sales:approve-source`
- `npm run sales:reject-source`
- `npm run sales:sources-report`

Source approval is never automatic.

No source command browses websites, creates accounts, bypasses access controls, writes to CRM, or synchronizes with cloud services.

Phase 49 adds risky source review workflows for sources that need Executive attention. A workflow can request review, but it cannot approve a source automatically.
