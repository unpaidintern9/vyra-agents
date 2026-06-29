# Migration Import Wizard

The Migration Import Wizard is a browser-local workflow for reviewing real gym migration files before any production migration work is approved.

## Supported Formats

- CSV
- XLSX
- XLS

Spreadsheet parsing uses the client-side `xlsx` package. The parser is dynamically loaded by the dashboard only when an import file or sample Excel import is processed.

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

The Import Wizard is local-only. It stores file metadata, parsed rows, field mappings, validation results, and wizard progress in browser localStorage.

It does not:

- upload files to Supabase,
- write production data,
- create pending profiles,
- create organization memberships,
- send invitations,
- call AI.
