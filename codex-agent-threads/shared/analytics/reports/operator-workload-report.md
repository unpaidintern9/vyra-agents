# Operator Workload Report

Generated: 2026-07-02T14:01:08.109Z

```json
{
  "title": "Operator Workload Report",
  "generatedAt": "2026-07-02T14:01:08.109Z",
  "scorecard": {
    "department": "Operator",
    "healthScore": 100,
    "trend": "flat",
    "keyMetrics": [
      {
        "label": "Open Tasks",
        "value": "31"
      },
      {
        "label": "Approval Backlog",
        "value": "20"
      }
    ],
    "risks": [],
    "blockers": [],
    "opportunities": [
      "Blocked work clearance creates leverage."
    ],
    "recommendations": [
      "Review workload analytics."
    ]
  },
  "insights": [
    {
      "insightId": "insight-blocked-clusters",
      "title": "Blocked task clusters",
      "category": "blocked task clusters",
      "severity": "low",
      "confidence": 86,
      "explanation": "0 shared task(s) are blocked and 0 are overdue.",
      "linkedEntities": [
        "shared-task-queue"
      ],
      "linkedTasks": [],
      "linkedWorkflows": [
        "universal-task-engine"
      ],
      "recommendedNextAction": "Review blocked and overdue queues with Operator.",
      "ownerAgent": "Operator",
      "status": "new"
    },
    {
      "insightId": "insight-workflow-aging",
      "title": "Workflow aging",
      "category": "workflow aging",
      "severity": "medium",
      "confidence": 72,
      "explanation": "13 dependency chain(s) are blocked or waiting.",
      "linkedEntities": [
        "workflow-dependencies"
      ],
      "linkedTasks": [],
      "linkedWorkflows": [
        "workflow-engine"
      ],
      "recommendedNextAction": "Clear dependency blockers before new work intake.",
      "ownerAgent": "Operator",
      "status": "new"
    },
    {
      "insightId": "insight-missing-data",
      "title": "Missing data and weak confidence",
      "category": "missing data",
      "severity": "medium",
      "confidence": 70,
      "explanation": "0 memory conflict(s) and 0 asset review item(s) can weaken analytics confidence.",
      "linkedEntities": [
        "shared-memory",
        "asset-library"
      ],
      "linkedTasks": [],
      "linkedWorkflows": [
        "analytics-review"
      ],
      "recommendedNextAction": "Review conflicts and under-review assets before strategic decisions.",
      "ownerAgent": "Operator",
      "status": "new"
    }
  ],
  "metrics": [],
  "safety": {
    "localOnly": true,
    "externalAnalyticsSync": false,
    "trackingScripts": false,
    "customerDataCollection": false,
    "autonomousEmails": false,
    "publishing": false,
    "billingActions": false,
    "deploymentActions": false,
    "autonomousExternalActions": false,
    "advisoryOnly": true
  }
}
```

Local-only analytics safety: no external analytics sync, tracking scripts, customer data collection, autonomous emails, publishing, billing actions, deployment actions, or autonomous external actions.
