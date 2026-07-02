# Customer Success Analytics Report

Generated: 2026-07-02T14:01:08.109Z

```json
{
  "title": "Customer Success Analytics Report",
  "generatedAt": "2026-07-02T14:01:08.109Z",
  "scorecard": {
    "department": "Customer Success",
    "healthScore": 61,
    "trend": "down",
    "keyMetrics": [
      {
        "label": "Customers",
        "value": "4"
      },
      {
        "label": "Adoption",
        "value": "54%"
      }
    ],
    "risks": [
      "Onboarding or adoption requires review.",
      "Onboarding or adoption requires review."
    ],
    "blockers": [],
    "opportunities": [
      "Expansion signals from healthy accounts."
    ],
    "recommendations": [
      "Review adoption analytics."
    ]
  },
  "insights": [
    {
      "insightId": "insight-churn-exposure",
      "title": "Customer churn exposure",
      "category": "customer churn exposure",
      "severity": "high",
      "confidence": 76,
      "explanation": "2 customer(s) have churn-risk signals.",
      "linkedEntities": [
        "cust-louisville-combat-academy",
        "cust-kentucky-youth-sports"
      ],
      "linkedTasks": [],
      "linkedWorkflows": [
        "customer-health"
      ],
      "recommendedNextAction": "Review adoption and onboarding risks.",
      "ownerAgent": "Customer Success",
      "status": "new"
    }
  ],
  "metrics": [
    {
      "analyticsId": "analytics-customer-adoption",
      "category": "customer success adoption",
      "metric": "average adoption",
      "value": 54,
      "previousValue": 50,
      "trend": "up",
      "confidence": 78,
      "sourceRecords": [
        "customer-success-health"
      ],
      "dateRange": "local-current-state",
      "generatedDate": "2026-07-02T14:01:08.109Z",
      "explanation": "Average customer adoption.",
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
