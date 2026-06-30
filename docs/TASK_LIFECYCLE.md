# Task Lifecycle

Shared tasks move through a local lifecycle. Every transition is deterministic and recorded in the task activity log.

## Statuses

- New
- Assigned
- In Progress
- Waiting
- Blocked
- Needs Review
- Approved
- Completed
- Archived

## Priorities

- Critical
- High
- Medium
- Low

## Categories

- Sales
- Engineering
- Migration
- Customer
- Operations
- Research
- Executive
- Documentation
- Compliance

## Actions

- Create task
- Assign task
- Claim task
- Reassign task
- Escalate task
- Complete task
- Archive task

All actions are local file changes only. Escalation sets the assigned agent to Executive, priority to Critical, status to Needs Review, and approval required to true.

## Approval Boundary

`approvalRequired: true` means the task needs human review before future work. Approval does not send emails, send SMS, write CRM records, create Stripe invoices, write Supabase production data, or modify production business data.
