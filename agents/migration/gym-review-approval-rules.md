# Gym Review Approval Rules

Before invitations are sent, the gym reviews the migration.

The review screen should show:

- Successfully imported members
- Existing Vyra users
- Pending members
- Offline and non-app members
- Duplicate records
- Missing information
- Inactive members
- Migration warnings
- Migration errors

Only after gym approval does Vyra finalize the migration.

## Phase 2 Mock Approval

The dashboard includes an `Approve Migration Review` button. It only updates local UI state and must not write to production, send invitations, or finalize real records.
