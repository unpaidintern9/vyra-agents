export interface ConnectorReadinessItem {
  allowedReadActions: string[];
  approvalRequirement: string;
  blockedWriteActions: string[];
  connector: string;
  lastCheckTimestamp: string;
  requiredConfig: string[];
  safetyMode: string;
  status: string;
  writeActionsEnabled: boolean;
}

export interface ConnectorApprovalMapping {
  approvalType: string;
  connector: string;
  defaultStatus: string;
  futureAction: string;
  requiredApproval: string;
  taskType: string;
}

export interface ConnectorReadinessSummary {
  approvalMappedActionCount: number;
  approvalMappings: ConnectorApprovalMapping[];
  blockedWriteActionCount: number;
  connectorCount: number;
  connectors: ConnectorReadinessItem[];
  externalCallsEnabled: boolean;
  productionWritesEnabled: boolean;
  readyTemplates: number;
  riskSummary: {
    approvalRequired: number;
    disabledConnectors: number;
    executiveRiskLevel: string;
    highestRisk: string;
  };
  safetyMode: string;
  writeActionsEnabled: boolean;
}

const connectorTemplates = [
  {
    connector: 'GitHub',
    requiredConfig: ['GitHub access token', 'default repository owner', 'repository allowlist'],
    allowedReadActions: ['repo metadata read', 'issue search', 'pull request search'],
    blockedWriteActions: ['create issue', 'update issue', 'create pull request', 'merge pull request'],
    approvalRequirement: 'Explicit approval required for every future GitHub write.',
  },
  {
    connector: 'Gmail',
    requiredConfig: ['Google OAuth client', 'Google OAuth secret', 'OAuth redirect URI'],
    allowedReadActions: ['thread search after future connection', 'draft preview after future connection'],
    blockedWriteActions: ['send email', 'modify labels', 'archive email', 'delete email'],
    approvalRequirement: 'Human review required before any future send path.',
  },
  {
    connector: 'Google Calendar',
    requiredConfig: ['Calendar OAuth client', 'Calendar OAuth secret', 'OAuth redirect URI'],
    allowedReadActions: ['availability read after future connection', 'event detail read after future connection'],
    blockedWriteActions: ['create event', 'update event', 'delete event', 'respond to invitation'],
    approvalRequirement: 'Explicit approval required before any future calendar mutation.',
  },
  {
    connector: 'Stripe',
    requiredConfig: ['Stripe restricted key', 'Stripe webhook signing secret'],
    allowedReadActions: ['product price read after future connection', 'customer lookup after future connection'],
    blockedWriteActions: ['create invoice', 'create payment link', 'create checkout session', 'refund payment'],
    approvalRequirement: 'Explicit approval required before creating future Stripe objects.',
  },
  {
    connector: 'Supabase',
    requiredConfig: ['Supabase project URL', 'server-only Supabase secret', 'browser-safe anon key'],
    allowedReadActions: ['agent table read after future connection', 'Edge Function health check after future connection'],
    blockedWriteActions: ['direct browser insert', 'service role browser exposure', 'production record write', 'business table mutation'],
    approvalRequirement: 'Future writes must use approved server or Edge Function paths only.',
  },
  {
    connector: 'Twilio/SMS',
    requiredConfig: ['Twilio account identifier', 'Twilio auth secret', 'approved sender number'],
    allowedReadActions: ['message template preview after future connection'],
    blockedWriteActions: ['send SMS', 'create phone number', 'update messaging service'],
    approvalRequirement: 'Human approval required before any future SMS send path.',
  },
  {
    connector: 'Google Drive',
    requiredConfig: ['Drive OAuth client', 'Drive OAuth secret', 'OAuth redirect URI'],
    allowedReadActions: ['file search after future connection', 'document metadata read after future connection'],
    blockedWriteActions: ['export document to Drive', 'create file', 'update file', 'share file', 'delete file'],
    approvalRequirement: 'Explicit approval required before future Drive writes or shares.',
  },
];

const approvalMappings: ConnectorApprovalMapping[] = [
  {
    approvalType: 'github_write_request',
    connector: 'GitHub',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'create or update issue/pull request',
    requiredApproval: 'Robert approval plus duplicate/safety check',
    taskType: 'GitHub issue/PR task',
  },
  {
    approvalType: 'email_draft_request',
    connector: 'Gmail',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'create provider draft or send email',
    requiredApproval: 'Human review before any future provider action',
    taskType: 'Gmail draft/send',
  },
  {
    approvalType: 'calendar_event_request',
    connector: 'Google Calendar',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'create or update calendar event',
    requiredApproval: 'Human review of attendees, time, title, notes, and calendar',
    taskType: 'Calendar event draft/create',
  },
  {
    approvalType: 'stripe_invoice_request',
    connector: 'Stripe',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'create invoice or payment link',
    requiredApproval: 'Human review of customer, price, terms, and due date',
    taskType: 'Stripe invoice/payment link',
  },
  {
    approvalType: 'supabase_write_request',
    connector: 'Supabase',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'write through approved server/Edge Function path',
    requiredApproval: 'Human review; no direct browser writes; RLS remains intact',
    taskType: 'Supabase record write',
  },
  {
    approvalType: 'sms_draft_request',
    connector: 'Twilio/SMS',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'send SMS',
    requiredApproval: 'Human review of recipient, body, opt-in, and timing',
    taskType: 'Twilio SMS',
  },
  {
    approvalType: 'drive_export_request',
    connector: 'Google Drive',
    defaultStatus: 'blocked_placeholder',
    futureAction: 'create, export, update, or share document',
    requiredApproval: 'Human review of file content, destination, and sharing scope',
    taskType: 'Google Drive doc export',
  },
];

export function buildDashboardConnectorReadiness(): ConnectorReadinessSummary {
  const lastCheckTimestamp = new Date().toISOString();
  const connectors = connectorTemplates.map((connector) => ({
    ...connector,
    lastCheckTimestamp,
    safetyMode: 'local/mock/read-only',
    status: 'template_ready_disabled',
    writeActionsEnabled: false,
  }));
  const blockedWriteActionCount = connectors.reduce((sum, connector) => sum + connector.blockedWriteActions.length, 0);
  return {
    approvalMappedActionCount: approvalMappings.length,
    approvalMappings,
    blockedWriteActionCount,
    connectorCount: connectors.length,
    connectors,
    externalCallsEnabled: false,
    productionWritesEnabled: false,
    readyTemplates: connectors.length,
    riskSummary: {
      approvalRequired: approvalMappings.length,
      disabledConnectors: connectors.length,
      executiveRiskLevel: 'Watch',
      highestRisk: 'Write actions remain disabled placeholders.',
    },
    safetyMode: 'local/mock/read-only',
    writeActionsEnabled: false,
  };
}
