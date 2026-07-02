# Engineering Analytics Report

Generated: 2026-07-02T14:01:08.109Z

```json
{
  "title": "Engineering Analytics Report",
  "generatedAt": "2026-07-02T14:01:08.109Z",
  "scorecard": {
    "department": "Engineering",
    "healthScore": 63,
    "trend": "down",
    "keyMetrics": [
      {
        "label": "Features",
        "value": "5"
      },
      {
        "label": "Blocked Releases",
        "value": "2"
      }
    ],
    "risks": [
      "QA blocker unresolved.",
      "Documentation gap before release notes.",
      "Feature is still in idea review.",
      "Member import QA remains the release blocker.",
      "Release approval is planning-only.",
      "Enterprise scope needs customer validation."
    ],
    "blockers": [
      "issue-gym-import-validation"
    ],
    "opportunities": [
      "Release readiness can improve launch confidence."
    ],
    "recommendations": [
      "Clear bug and release risks."
    ]
  },
  "insights": [
    {
      "insightId": "insight-engineering-bottleneck",
      "title": "Engineering bottlenecks",
      "category": "engineering bottlenecks",
      "severity": "high",
      "confidence": 80,
      "explanation": "2 release(s) are blocked or below readiness threshold.",
      "linkedEntities": [
        "rel-0.9.0-gym-beta",
        "rel-1.1.0-coach-qa",
        "rel-0.8.0-athlete-planning"
      ],
      "linkedTasks": [
        "tasks:validate",
        "engineering-task:documentation:coach-platform",
        "marketing:content",
        "executive:goals"
      ],
      "linkedWorkflows": [
        "engineering-releases"
      ],
      "recommendedNextAction": "Clear release blockers before launch work.",
      "ownerAgent": "Engineering",
      "status": "new"
    }
  ],
  "metrics": [
    {
      "analyticsId": "analytics-company-health",
      "category": "company health",
      "metric": "company health score",
      "value": 72,
      "previousValue": 66,
      "trend": "up",
      "confidence": 78,
      "sourceRecords": [
        "finance",
        "sales",
        "success",
        "marketing",
        "engineering",
        "tasks"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Composite local company health.",
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
    },
    {
      "analyticsId": "analytics-engineering-velocity",
      "category": "engineering velocity",
      "metric": "release readiness",
      "value": 62,
      "previousValue": 58,
      "trend": "up",
      "confidence": 78,
      "sourceRecords": [
        "engineering-releases"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Engineering release readiness.",
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
