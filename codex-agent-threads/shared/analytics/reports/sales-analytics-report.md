# Sales Analytics Report

Generated: 2026-07-02T14:01:08.109Z

```json
{
  "title": "Sales Analytics Report",
  "generatedAt": "2026-07-02T14:01:08.109Z",
  "scorecard": {
    "department": "Sales",
    "healthScore": 86,
    "trend": "up",
    "keyMetrics": [
      {
        "label": "Active Opportunities",
        "value": "8"
      },
      {
        "label": "Proposal Ready",
        "value": "0"
      }
    ],
    "risks": [
      "Awaiting follow-up queue exists."
    ],
    "blockers": [],
    "opportunities": [
      "Prioritize high-confidence pipeline."
    ],
    "recommendations": [
      "Review Sales Analytics."
    ]
  },
  "insights": [
    {
      "insightId": "insight-stalled-sales",
      "title": "Stalled sales opportunities",
      "category": "stalled sales opportunities",
      "severity": "high",
      "confidence": 74,
      "explanation": "2 opportunity item(s) await follow-up.",
      "linkedEntities": [
        "sales-opportunities"
      ],
      "linkedTasks": [
        "task-20260630-executive-automation-high-value-sales-opportunities",
        "task-20260701T135455Z-apex-martial-arts-academy:-needs-contact-info",
        "task-20260701T135455Z-apex-martial-arts-academy:-needs-outreach-draft"
      ],
      "linkedWorkflows": [
        "sales-workflows"
      ],
      "recommendedNextAction": "Prioritize awaiting follow-up opportunities.",
      "ownerAgent": "Sales",
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
      "analyticsId": "analytics-sales-performance",
      "category": "sales performance",
      "metric": "active opportunities",
      "value": 8,
      "previousValue": 7,
      "trend": "up",
      "confidence": 78,
      "sourceRecords": [
        "sales-opportunities"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Active local sales opportunities.",
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
      "analyticsId": "analytics-opportunity-signals",
      "category": "opportunity signals",
      "metric": "expansion opportunities",
      "value": 3,
      "previousValue": 4,
      "trend": "down",
      "confidence": 78,
      "sourceRecords": [
        "sales",
        "customer-success"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Sales proposal-ready plus Customer Success expansion opportunities.",
      "risks": [
        "Metric moved down versus previous local snapshot."
      ],
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
