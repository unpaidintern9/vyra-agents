# Migration Import Security

Phase 16C hardens the Migration Import Wizard while keeping it local-only.

## Package Decision

CSV is parsed natively in the dashboard and is the recommended format.

XLSX and XLS remain supported through the dynamically imported `xlsx` package. Alternatives reviewed during Phase 16C were not a clean replacement for both XLSX and legacy XLS support in this phase. Because `xlsx` still reports npm audit advisories with no available fix, Excel parsing is isolated behind local-only parsing, file limits, row and column limits, strict sanitization, visible warnings, and no production write path.

## Import Limits

The wizard blocks imports above:

- 5 MB file size
- 5,000 rows
- 75 columns
- 500 characters per cell

Files that exceed these limits are not parsed. The UI shows a readable parser error and keeps the import local.

## Sanitization

Every imported cell is sanitized before it is stored or validated:

- trim surrounding whitespace,
- normalize missing values to empty safe strings,
- remove unsupported control characters,
- cap each cell at 500 characters,
- treat formula-like values as plain text.

Raw uploaded file binaries are not stored in localStorage.

## Export Protection

CSV exports prefix spreadsheet-formula-like values beginning with `=`, `+`, `-`, or `@` with a safe apostrophe.

Markdown exports escape pipe characters and apply the same formula-like prefix protection where values appear in report content.

JSON exports are plain JSON generated from sanitized local state.

## Excel Warning

When XLS or XLSX files are parsed, the wizard shows:

> Excel files are parsed locally in your browser. For safest imports, use CSV when possible. No production data is changed during this preview.

## Safety Boundary

The import system does not:

- write to Supabase,
- modify production data,
- create pending profiles,
- create organization memberships,
- send invitations,
- call AI,
- store raw uploaded file binaries.
