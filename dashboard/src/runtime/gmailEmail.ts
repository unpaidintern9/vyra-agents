export interface GmailEmailRecipient {
  email: string;
  name: 'Shared Inbox';
  status: 'ready' | 'missing_email' | 'invalid_email';
}

export interface GmailEmailAuditAction {
  actionTaken: string;
  draftId: string;
  operatorName: string;
  operatorTool: string;
  providerSendOccurred: boolean;
  recipientName: string;
  timestamp: string;
}

export interface GmailEmailDashboardSummary {
  approvedSenders: string[];
  automationHealthStatus: string;
  automationStatus: 'enabled' | 'disabled';
  commands: string[];
  draftsAwaitingSend: number;
  failedEmailCount: number;
  gmailConnectorStatus: string;
  internalRecipients: GmailEmailRecipient[];
  latestEmailAuditActions: GmailEmailAuditAction[];
  reportTypes: string[];
  scheduledReports: number;
  sentEmailCount: number;
  skippedEmailCount: number;
}

export function buildDashboardGmailEmailSummary(): GmailEmailDashboardSummary {
  const sharedInboxEmail = import.meta.env.VITE_INTERNAL_RECIPIENT_SHARED_INBOX_EMAIL ?? 'admin@vyraapp.fit';
  const configured = import.meta.env.VITE_VYRA_GMAIL_CONFIGURED === 'true';
  const automationEnabled = configured && import.meta.env.VITE_VYRA_GMAIL_SEND_ENABLED !== 'false';
  return {
    approvedSenders: ['robert.sorenson@vyraapp.fit'],
    automationHealthStatus: automationEnabled ? 'Ready when safety gates pass' : 'Disabled until Gmail connector is configured',
    automationStatus: automationEnabled ? 'enabled' : 'disabled',
    commands: emailCommands,
    draftsAwaitingSend: 1,
    failedEmailCount: 0,
    gmailConnectorStatus: configured ? 'configured_auto_send_enabled' : 'missing_config',
    internalRecipients: [
      { email: sharedInboxEmail, name: 'Shared Inbox', status: sharedInboxEmail === 'admin@vyraapp.fit' ? 'ready' : 'invalid_email' },
    ],
    latestEmailAuditActions: [
      {
        actionTaken: 'draft_created',
        draftId: 'dashboard-email-draft-executive-daily-summary',
        operatorName: 'Vyra Agent',
        operatorTool: 'Dashboard Email Workflow',
        providerSendOccurred: false,
        recipientName: 'Shared Inbox',
        timestamp: new Date().toISOString(),
      },
    ],
    reportTypes: [
      'Executive daily summary',
      'Sales summary',
      'Engineering summary',
      'Release ship plan summary',
      'Task queue summary',
      'Connector readiness summary',
      'Cross-agent review summary',
    ],
    scheduledReports: 4,
    sentEmailCount: 0,
    skippedEmailCount: 0,
  };
}

export const emailCommands = [
  'npm run email:status',
  'npm run email:drafts',
  'npm run email:create-draft',
  'npm run email:send',
  'npm run email:send-pending',
  'npm run email:audit',
  'npm run email:validate',
  'npm run email:safety-check',
];
