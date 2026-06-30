# GitHub Approval Workflow

GitHub plans are not GitHub records.

Phase 37 creates a local planning and review layer before any future GitHub write workflow can exist. A plan may be reviewed locally, approved locally, rejected locally, or archived locally.

## Approval Statuses

- `draft`
- `needs_review`
- `approved_local`
- `rejected_local`
- `archived`

`approved_local` means the plan has passed local review. It does not create an issue, create a pull request, push a branch, push a commit, comment, label, merge, or dispatch a workflow.

## Required Future Boundary

Any future GitHub write workflow must be a separate explicit phase with:

- human approval
- duplicate checks
- target owner/repo confirmation
- token scope review
- dry-run default
- readback verification
- secret redaction

Phase 37 does not add any of those write paths.
