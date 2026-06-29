# Approval Queue

Phase 5 adds an Approval Queue UI foundation.

Mock approval items include:

- Approve Migration Review
- Send Member Invitations
- Apply Production Migration
- Deploy Workflow
- Send Customer Email

Buttons only update local UI state.

## Phase 6 Approval History

Mock approval decisions now persist to browser localStorage with local approval history. The Approval Queue panel includes:

- approval history entries
- JSON and Markdown history export
- clear local approval history control

Approval history reports are generated locally in the browser and include requester, approver, risk level, decision result, timestamp, and the safety note that no production writes were made.

## Future Production Approval Rules

The following actions require approval before any production implementation:

- production deploys
- database migrations
- deleting records
- billing changes
- sending customer emails
- sending member invitations
- changing roles or permissions
- modifying production data

Future approval records should include requester, required approver, reason, risk level, decision, timestamp, and linked audit log.
