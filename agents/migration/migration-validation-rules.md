# Migration Validation Rules

Validation must check for:

- Duplicate member records
- Duplicate email addresses
- Duplicate phone numbers
- Missing names
- Missing emails
- Invalid email addresses
- Invalid phone numbers
- Expired memberships
- Canceled memberships
- Frozen memberships
- Existing Vyra users
- Family accounts
- Child accounts
- Incomplete billing information
- Missing membership types
- Invalid dates
- Conflicting records

Any problems discovered during validation should be presented to the gym before migration is finalized.

## Phase 2 Validation Logic

The local dashboard service returns mock validation issues with severity, recommended action, and status. It is intended to shape the review workflow before production data is connected.

No production data is connected, no migration is applied, and no AI is implemented.
