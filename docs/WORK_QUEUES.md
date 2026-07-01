# Work Queues

The universal task engine builds deterministic queues from local task records:

- Universal Work Queue
- My Work
- Executive Queue
- Operator Queue
- Sales Queue
- Proposal Queue
- Contract Queue
- Memory Queue
- Blocked Work
- Due Soon
- Overdue
- Completed Today
- Archived

Queues expose task owner, type, status, priority, priority score, urgency label, SLA risk, age bucket, blockers, linked entities, and recommended next action.

Dashboards show role-specific views:

- Sales: Sales Work Queue, Sales Follow-Up Tasks, Sales Proposal Tasks, Sales Blocked Work, and Sales Due Soon.
- Executive: Executive Work Queue, Approval Tasks, Strategic Tasks, Blocked Decisions, and Overdue Executive Items.
- Operator: Operator Work Queue, Verification Tasks, Missing Info Tasks, Memory Maintenance Tasks, Blocked Work, and Due Soon.
- Shared: Universal Work Queue, Cross-Agent Workload, Task Dependencies, Overdue Work, and Completed Today.

Queue output is read-only in the dashboard. CLI commands update local JSON records only.
