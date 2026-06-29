# Permissions

## Permission Types

- read
- write
- approve
- deploy
- delete
- admin

## Initial Rule

All agents are read-only by default unless clearly documented otherwise.

## High-Risk Actions

The following actions require approval before implementation in a future phase:

- Production deploys
- Database migrations
- Deleting records
- Billing changes
- Sending customer emails
- Changing roles or permissions
- Modifying production data

