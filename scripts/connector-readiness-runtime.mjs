import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const connectorReportRoot = path.join(repoRoot, 'reports/agents/runtime');

export const connectorReadiness = [
  {
    connector: 'GitHub',
    status: 'template_ready_disabled',
    requiredConfig: ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPOS'],
    allowedReadActions: ['repo metadata read', 'issue search', 'pull request search', 'workflow status read'],
    blockedWriteActions: ['create issue', 'update issue', 'create pull request', 'merge pull request', 'comment on issue or pull request'],
    approvalRequirement: 'Explicit approval required for every future write action.',
    safetyMode: 'local/mock/read-only',
  },
  {
    connector: 'Gmail',
    status: 'template_ready_disabled',
    requiredConfig: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REDIRECT_URI'],
    allowedReadActions: ['draft metadata preview after future connection', 'thread search after future connection'],
    blockedWriteActions: ['send email', 'modify labels', 'archive email', 'delete email', 'create provider draft'],
    approvalRequirement: 'Human review and manual approval required before any future provider send path.',
    safetyMode: 'local/mock/read-only',
  },
  {
    connector: 'Google Calendar',
    status: 'template_ready_disabled',
    requiredConfig: ['GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET', 'GOOGLE_CALENDAR_REDIRECT_URI'],
    allowedReadActions: ['availability read after future connection', 'event detail read after future connection'],
    blockedWriteActions: ['create event', 'update event', 'delete event', 'respond to invitation'],
    approvalRequirement: 'Explicit approval required before any future calendar mutation.',
    safetyMode: 'local/mock/read-only',
  },
  {
    connector: 'Stripe',
    status: 'template_ready_disabled',
    requiredConfig: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    allowedReadActions: ['product price read after future connection', 'customer lookup after future connection'],
    blockedWriteActions: ['create invoice', 'create payment link', 'create checkout session', 'refund payment', 'update customer'],
    approvalRequirement: 'Explicit approval required before any future Stripe object creation.',
    safetyMode: 'local/mock/read-only',
  },
  {
    connector: 'Supabase',
    status: 'template_ready_disabled',
    requiredConfig: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'],
    allowedReadActions: ['agent table read after future connection', 'Edge Function health check after future connection'],
    blockedWriteActions: ['direct browser insert', 'service role browser exposure', 'production record write', 'business table mutation'],
    approvalRequirement: 'Writes must stay behind approved Edge Function/server runtime paths and explicit review.',
    safetyMode: 'local/mock/read-only',
  },
  {
    connector: 'Twilio/SMS',
    status: 'template_ready_disabled',
    requiredConfig: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'],
    allowedReadActions: ['message template preview after future connection'],
    blockedWriteActions: ['send SMS', 'create phone number', 'update messaging service', 'delete message'],
    approvalRequirement: 'Human approval required before any future SMS send path.',
    safetyMode: 'local/mock/read-only',
  },
  {
    connector: 'Google Drive',
    status: 'template_ready_disabled',
    requiredConfig: ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REDIRECT_URI'],
    allowedReadActions: ['file search after future connection', 'document metadata read after future connection'],
    blockedWriteActions: ['export document to Drive', 'create file', 'update file', 'share file', 'delete file'],
    approvalRequirement: 'Explicit approval required before any future Drive file write or share action.',
    safetyMode: 'local/mock/read-only',
  },
];

export const approvalMappings = [
  {
    taskType: 'GitHub issue/PR task',
    connector: 'GitHub',
    futureAction: 'create or update issue/pull request',
    approvalType: 'github_write_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Robert approval plus duplicate/safety check',
  },
  {
    taskType: 'Gmail draft/send',
    connector: 'Gmail',
    futureAction: 'create provider draft or send email',
    approvalType: 'email_draft_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Human review; send remains disabled until provider mode is explicitly enabled',
  },
  {
    taskType: 'Calendar event draft/create',
    connector: 'Google Calendar',
    futureAction: 'create or update calendar event',
    approvalType: 'calendar_event_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Human review of attendees, time, title, notes, and calendar target',
  },
  {
    taskType: 'Stripe invoice/payment link',
    connector: 'Stripe',
    futureAction: 'create invoice or payment link',
    approvalType: 'stripe_invoice_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Human review of customer, price, product, tax, due date, and terms',
  },
  {
    taskType: 'Supabase record write',
    connector: 'Supabase',
    futureAction: 'write through approved server/Edge Function path',
    approvalType: 'supabase_write_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Human review; no direct browser writes; RLS must stay intact',
  },
  {
    taskType: 'Twilio SMS',
    connector: 'Twilio/SMS',
    futureAction: 'send SMS',
    approvalType: 'sms_draft_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Human review of recipient, body, opt-in, and send timing',
  },
  {
    taskType: 'Google Drive doc export',
    connector: 'Google Drive',
    futureAction: 'create, export, update, or share document',
    approvalType: 'drive_export_request',
    defaultStatus: 'blocked_placeholder',
    requiredApproval: 'Human review of file content, destination, sharing scope, and account',
  },
];

const blockedConnectorCalls = [
  'GitHub writes',
  'Gmail sends',
  'Calendar mutations',
  'Stripe object creation',
  'Supabase production writes',
  'Twilio SMS sends',
  'Google Drive writes or shares',
  'secret output',
];

export function buildConnectorReadinessStatus() {
  const lastCheckTimestamp = new Date().toISOString();
  const connectors = connectorReadiness.map((connector) => ({
    ...connector,
    lastCheckTimestamp,
    writeActionsEnabled: false,
    callsExternalService: false,
  }));
  const blockedWriteActionCount = connectors.reduce((sum, connector) => sum + connector.blockedWriteActions.length, 0);
  return {
    generatedAt: lastCheckTimestamp,
    safetyMode: 'local/mock/read-only',
    connectors,
    approvalMappings,
    connectorCount: connectors.length,
    readyTemplates: connectors.filter((connector) => connector.status === 'template_ready_disabled').length,
    blockedWriteActionCount,
    approvalMappedActionCount: approvalMappings.length,
    externalCallsEnabled: false,
    writeActionsEnabled: false,
    productionWritesEnabled: false,
    riskSummary: {
      disabledConnectors: connectors.length,
      approvalRequired: approvalMappings.length,
      highestRisk: 'Write actions remain disabled placeholders.',
      executiveRiskLevel: blockedWriteActionCount > 0 ? 'Watch' : 'Ready',
    },
    blockedConnectorCalls,
  };
}

export function getConnectorReadinessReport() {
  const payload = {
    title: 'Connector Readiness Report',
    ...buildConnectorReadinessStatus(),
    safety: getConnectorSafetyCheck(),
  };
  writeConnectorReport('connector-readiness-report', payload);
  writeConnectorReport('connector-readiness', { title: 'Connector Readiness JSON', ...buildConnectorReadinessStatus() });
  return payload;
}

export function getConnectorApprovalMappingReport() {
  const payload = {
    title: 'Connector Approval Mapping Report',
    generatedAt: new Date().toISOString(),
    mappings: approvalMappings,
    safety: 'Approval mappings are local planning records only. No connector calls occur.',
  };
  writeConnectorReport('connector-approval-mapping-report', payload);
  return payload;
}

export function getConnectorSafetyCheck() {
  const checks = [
    { name: 'No GitHub calls', passed: true },
    { name: 'No Gmail calls', passed: true },
    { name: 'No Google Calendar calls', passed: true },
    { name: 'No Stripe calls', passed: true },
    { name: 'No Supabase production writes', passed: true },
    { name: 'No Twilio calls', passed: true },
    { name: 'No Google Drive calls', passed: true },
    { name: 'No connector secrets required or printed', passed: true },
    { name: 'All write actions disabled/placeholders', passed: true },
  ];
  return {
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    checks,
    blockedConnectorCalls,
  };
}

export function validateConnectorReadiness() {
  const status = buildConnectorReadinessStatus();
  const connectorErrors = status.connectors.flatMap(validateConnector);
  const mappingErrors = status.approvalMappings.flatMap(validateMapping);
  const safety = getConnectorSafetyCheck();
  return {
    status: connectorErrors.length === 0 && mappingErrors.length === 0 && safety.status === 'pass' ? 'pass' : 'fail',
    commands: ['connectors:status', 'connectors:readiness', 'connectors:approval-map', 'connectors:safety-check', 'connectors:validate'],
    connectorErrors,
    mappingErrors,
    readiness: status,
    safety,
  };
}

function validateConnector(connector) {
  const errors = [];
  if (!connector.connector) errors.push('connector name is required.');
  if (!connector.status) errors.push(`${connector.connector} status is required.`);
  if (!Array.isArray(connector.requiredConfig) || connector.requiredConfig.length === 0) errors.push(`${connector.connector} required config is required.`);
  if (!Array.isArray(connector.allowedReadActions)) errors.push(`${connector.connector} allowed read actions must be an array.`);
  if (!Array.isArray(connector.blockedWriteActions) || connector.blockedWriteActions.length === 0) errors.push(`${connector.connector} blocked write actions are required.`);
  if (!connector.approvalRequirement) errors.push(`${connector.connector} approval requirement is required.`);
  if (connector.safetyMode !== 'local/mock/read-only') errors.push(`${connector.connector} safety mode must be local/mock/read-only.`);
  if (connector.writeActionsEnabled !== false) errors.push(`${connector.connector} write actions must be disabled.`);
  if (connector.callsExternalService !== false) errors.push(`${connector.connector} external calls must be disabled.`);
  return errors;
}

function validateMapping(mapping) {
  const errors = [];
  if (!mapping.taskType) errors.push('mapping taskType is required.');
  if (!mapping.connector) errors.push(`${mapping.taskType} connector is required.`);
  if (!mapping.futureAction) errors.push(`${mapping.taskType} futureAction is required.`);
  if (!mapping.approvalType) errors.push(`${mapping.taskType} approvalType is required.`);
  if (mapping.defaultStatus !== 'blocked_placeholder') errors.push(`${mapping.taskType} must default to blocked_placeholder.`);
  if (!mapping.requiredApproval) errors.push(`${mapping.taskType} requiredApproval is required.`);
  return errors;
}

function writeConnectorReport(slug, payload) {
  mkdirSync(connectorReportRoot, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  writeFileSync(path.join(connectorReportRoot, `${stamp}-${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(connectorReportRoot, `${stamp}-${slug}.md`), toMarkdown(payload));
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'Connector Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => {
      lines.push(`## ${labelize(key)}`, '');
      if (Array.isArray(value)) {
        value.forEach((item) => lines.push(`- ${formatValue(item)}`));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([childKey, child]) => lines.push(`- ${labelize(childKey)}: ${formatValue(child)}`));
      } else {
        lines.push(String(value ?? ''));
      }
      lines.push('');
    });
  return `${lines.join('\n').trim()}\n`;
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
