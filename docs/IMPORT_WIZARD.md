# Migration Import Wizard

The Migration Import Wizard is a browser-local workflow for reviewing real gym migration files before any production migration work is approved.

## Supported Formats

- CSV (recommended)
- XLSX
- XLS

CSV is parsed natively by the browser dashboard. Excel parsing uses the client-side `xlsx` package behind a dynamic import boundary only when XLSX/XLS parsing is requested.

`xlsx` is retained for now because practical safer replacements reviewed in Phase 16C did not cover both XLSX and legacy XLS without reducing the wizard's promised format support. The parser is hardened with file limits, row and column limits, sanitization, visible Excel warnings, and local-only boundaries.

## Wizard Flow

1. Select File
2. Detect Columns
3. Map Fields
4. Validate Data
5. Review Results
6. Ready For Migration Review

## Field Mapping

The wizard automatically maps common columns such as first name, last name, email, phone, DOB, membership status, membership type, membership level, membership start, renewal date, billing status, coach, notes, emergency contact, and external member ID.

Unknown columns stay mapped to `Ignore` until staff review them. The mapping table shows mapped, unmapped, duplicate mapping, and missing required states.

## Limits

Local imports are blocked when they exceed:

- 5 MB file size
- 5,000 rows
- 75 columns
- 500 characters per cell

If a file exceeds these limits, the wizard shows a readable error and does not parse the file.

## Sanitization

Imported cells are sanitized before they are stored in browser localStorage:

- whitespace is trimmed,
- unsupported control characters are removed,
- cells are capped at 500 characters,
- formula-like values are treated as plain text for review.

Formula-like values beginning with `=`, `+`, `-`, or `@` are escaped in CSV and Markdown exports to reduce spreadsheet formula injection risk.

## Validation

Validation reuses the existing Migration Agent validation rules locally. It checks duplicate emails, duplicate phones, missing names, missing email, invalid email, invalid phone, invalid dates, missing membership type, frozen memberships, canceled memberships, expired memberships, conflicting records, and empty skipped rows.

## Review And Export

The review screen shows imported, warnings, errors, ready, and skipped totals. The member review table includes validation result, mock existing match, mock pending profile, and mock offline member columns.

Validation reports can be exported as:

- JSON
- Markdown
- CSV

Reports include import summary, field mapping, warnings, errors, ready members, skipped members, and review rows.

## Safety Boundary

The Import Wizard is local-only. It stores file metadata, sanitized parsed rows, field mappings, validation results, parser warnings/errors, and wizard progress in browser localStorage.

It does not:

- upload files to Supabase,
- write production data,
- create pending profiles,
- create organization memberships,
- send invitations,
- call AI,
- store raw uploaded file binaries.
