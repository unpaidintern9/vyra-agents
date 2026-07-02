# Marketing Analytics Report

Generated: 2026-07-02T14:01:08.109Z

```json
{
  "title": "Marketing Analytics Report",
  "generatedAt": "2026-07-02T14:01:08.109Z",
  "scorecard": {
    "department": "Marketing",
    "healthScore": 60,
    "trend": "flat",
    "keyMetrics": [
      {
        "label": "Campaigns",
        "value": "3"
      },
      {
        "label": "Drafts",
        "value": "0"
      }
    ],
    "risks": [
      "Launch dates are planning records only."
    ],
    "blockers": [],
    "opportunities": [
      "Use release readiness to time launch work."
    ],
    "recommendations": [
      "Close campaign readiness gaps."
    ]
  },
  "insights": [
    {
      "insightId": "insight-campaign-gaps",
      "title": "Campaign readiness gaps",
      "category": "campaign readiness gaps",
      "severity": "high",
      "confidence": 82,
      "explanation": "Campaign readiness is 66%.",
      "linkedEntities": [
        "camp-athlete-app-foundation",
        "camp-gym-growth-readiness",
        "camp-white-label-positioning"
      ],
      "linkedTasks": [],
      "linkedWorkflows": [
        "marketing-campaigns"
      ],
      "recommendedNextAction": "Close campaign readiness risks before launch messaging.",
      "ownerAgent": "Marketing",
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
      "analyticsId": "analytics-marketing-readiness",
      "category": "marketing readiness",
      "metric": "launch readiness",
      "value": 60,
      "previousValue": 56,
      "trend": "up",
      "confidence": 78,
      "sourceRecords": [
        "marketing-readiness"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Launch readiness from local marketing records.",
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
