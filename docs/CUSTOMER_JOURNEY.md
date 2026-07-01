# Customer Journey

The Customer Success Agent tracks local customer lifecycle states:

```text
Lead -> Qualified -> Closed -> Onboarding -> Active -> Growing -> Expansion -> Renewal -> At Risk -> Churned -> Archived
```

Every transition records timestamp, previous state, new state, actor, reason, and audit history.

Journey records reuse local references to organizations, contacts, tasks, goals, assets, and reports where practical instead of duplicating records.

Journey transitions are local and advisory. They do not update external accounts, CRM records, billing systems, or customer communications.
