# Executive Reports

Executive reports are browser-local exports generated from the current Agent Runtime snapshot.

## Available Reports

- Executive Summary JSON.
- Executive Summary Markdown.
- Daily Operations Report.
- Approval Report.
- Runtime Report.
- Engineering Summary.
- Migration Summary.

## Contents

Reports may include:

- Overview health.
- Registered agent counts.
- Warning and critical agent counts.
- Pending approvals.
- Sync queue status.
- Executive priorities.
- Department health rows.
- Runtime timeline entries.
- Approval queue rows.

## Export Behavior

Reports use the existing local report exporter and download as JSON or Markdown.

Exports are local-only:

- No Supabase writes.
- No GitHub writes.
- No production data changes.
- No invitations.
- No AI-generated content.
