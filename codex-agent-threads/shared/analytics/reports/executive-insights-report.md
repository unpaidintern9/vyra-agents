# Executive Insights Report

Generated: 2026-07-02T14:01:08.109Z

```json
{
  "title": "Executive Insights Report",
  "generatedAt": "2026-07-02T14:01:08.109Z",
  "scorecard": {
    "department": "Executive",
    "healthScore": 56,
    "trend": "down",
    "keyMetrics": [
      {
        "label": "Goals",
        "value": "3"
      },
      {
        "label": "Attention Needed",
        "value": "2"
      }
    ],
    "risks": [
      "Planning blockers are affecting goals.",
      "Shared memory conflicts may reduce planning confidence."
    ],
    "blockers": [
      "20 task(s) require Executive review.",
      "49 shared memory conflict(s) remain unresolved.",
      "24 risky fact(s) need verification before decisions.",
      "Maintain local operating control: Manual review queues need daily attention.",
      "Improve proposal readiness gates: Missing decision maker confirmation on warm prospects.",
      "Grow Louisville KY sales pipeline: 49 unresolved shared memory conflict(s).",
      "Resolve planning-critical memory conflicts: Memory conflict review queue is non-empty.",
      "Use Sales priority queues for daily planning: 49 unresolved shared memory conflict(s)."
    ],
    "opportunities": [
      "Clearer cross-agent priority review."
    ],
    "recommendations": [
      "Review Executive Insights."
    ]
  },
  "insights": [
    {
      "insightId": "insight-growth-risk",
      "title": "Growth risk from goal slippage",
      "category": "growth risks",
      "severity": "high",
      "confidence": 78,
      "explanation": "2 Executive goal(s) are at risk.",
      "linkedEntities": [
        "goal-operating-control",
        "goal-proposal-readiness",
        "goal-revenue-louisville-sales"
      ],
      "linkedTasks": [
        "task-20260630-executive-automation-connector-readiness-failures",
        "task-20260630-executive-automation-cross-agent-review-needs",
        "task-20260630-executive-automation-email-send-failures-skips",
        "task-20260630-executive-automation-failed-validations",
        "task-20260701T135455Z-apex-martial-arts-academy:-high-fit-prospect-executive-review",
        "task-20260701T135455Z-area-502-mma:-high-fit-prospect-executive-review"
      ],
      "linkedWorkflows": [
        "executive-planning"
      ],
      "recommendedNextAction": "Review at-risk goals and supporting tasks.",
      "ownerAgent": "Executive",
      "status": "new"
    },
    {
      "insightId": "insight-overdue-decisions",
      "title": "Overdue executive decisions",
      "category": "overdue executive decisions",
      "severity": "high",
      "confidence": 78,
      "explanation": "2 Executive attention item(s) are open.",
      "linkedEntities": [
        "decision-keep-local-only"
      ],
      "linkedTasks": [
        "task-20260630-executive-automation-connector-readiness-failures",
        "task-20260630-executive-automation-cross-agent-review-needs",
        "task-20260630-executive-automation-email-send-failures-skips",
        "task-20260630-executive-automation-engineering-health-warnings",
        "task-20260630-executive-automation-failed-validations",
        "task-20260630-executive-automation-github-repo-changes",
        "task-20260630-executive-automation-high-value-sales-opportunities",
        "task-20260701T135455Z-apex-martial-arts-academy:-high-fit-prospect-executive-review",
        "task-20260701T135455Z-area-502-mma:-high-fit-prospect-executive-review"
      ],
      "linkedWorkflows": [
        "executive-queue"
      ],
      "recommendedNextAction": "Review Executive queue decisions.",
      "ownerAgent": "Executive",
      "status": "new"
    }
  ],
  "metrics": [
    {
      "analyticsId": "analytics-goal-progress",
      "category": "goal progress",
      "metric": "average goal progress",
      "value": 56,
      "previousValue": 52,
      "trend": "up",
      "confidence": 78,
      "sourceRecords": [
        "executive-planning"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Average Executive goal progress.",
      "risks": [],
      "recommendations": [
        "Review source records before taking action."
      ],
      "auditHistory": [
        {
          "timestamp": "2026-07-02T14:01:08.109Z",
          "event": "analytics.metric.generated"
        }
      ]
    }
  ],
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
