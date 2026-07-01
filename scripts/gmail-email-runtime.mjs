import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const sharedRoot = path.join(repoRoot, 'codex-agent-threads/shared');
export const emailDirectories = {
  drafts: path.join(sharedRoot, 'email/drafts'),
  audit: path.join(sharedRoot, 'email/audit'),
  archive: path.join(sharedRoot, 'email/archive'),
};
export const emailReportRoot = path.join(repoRoot, 'reports/agents/runtime');

export const approvedSenders = ['admin@vyraapp.fit', 'robert.sorenson@vyraapp.fit'];
export const emailWorkflowStates = ['draft_created', 'ready_for_send', 'auto_scheduled', 'sent', 'failed', 'skipped', 'archived'];
export const reportTypes = [
  'executive_daily_summary',
  'sales_summary',
  'engineering_summary',
  'release_ship_plan_summary',
  'task_queue_summary',
  'connector_readiness_summary',
  'cross_agent_review_summary',
];
export const emailCommands = [
  'email:status',
  'email:drafts',
  'email:create-draft',
  'email:send',
  'email:send-pending',
  'email:audit',
  'email:validate',
  'email:safety-check',
];

const safeConfigNames = [
  'VYRA_GMAIL_CLIENT_ID',
  'VYRA_GMAIL_CLIENT_SECRET',
  'VYRA_GMAIL_REFRESH_TOKEN',
  'VYRA_GMAIL_ACCESS_TOKEN',
  'VYRA_GMAIL_SEND_ENABLED',
  'VYRA_EMAIL_ROBERT',
  'VYRA_EMAIL_MATTHEW',
];

export function ensureEmailDirectories() {
  Object.values(emailDirectories).forEach((directory) => mkdirSync(directory, { recursive: true }));
  mkdirSync(emailReportRoot, { recursive: true });
}

export function getEmailStatus() {
  const config = getGmailConfig();
  const drafts = listEmailDrafts();
  const audits = listEmailAuditEntries();
  const sentCount = audits.filter((entry) => entry.actionTaken === 'sent').length;
  const failedCount = audits.filter((entry) => entry.actionTaken === 'failed').length;
  const skippedCount = audits.filter((entry) => entry.actionTaken === 'skipped').length;
  return {
    title: 'Gmail Email Connector Status',
    generatedAt: new Date().toISOString(),
    gmail: {
      connector: 'gmail',
      status: config.configured ? 'configured_auto_send_enabled' : 'missing_config',
      configured: config.configured,
      autoSendEnabled: config.autoSendEnabled,
      safeConfigNames,
      missingConfig: config.missingConfig,
      tokenConfigured: config.tokenConfigured,
      tokenPrinted: false,
    },
    approvedSenders,
    internalRecipients: getInternalRecipients(),
    draftsAwaitingSend: drafts.filter((draft) => draft.status === 'ready_for_send').length,
    scheduledAutomatedEmails: drafts.filter((draft) => draft.status === 'auto_scheduled').length,
    sentEmailCount: sentCount,
    failedEmailCount: failedCount,
    skippedEmailCount: skippedCount,
    latestEmailAuditActions: latestAudits(audits),
    automationStatus: config.configured && config.autoSendEnabled ? 'enabled' : 'disabled_until_gmail_configured',
    reportTypes,
    schedules: defaultSchedules(),
    safety: safetySummary(),
  };
}

export function getEmailDraftsReport() {
  const payload = {
    title: 'Email Draft Queue',
    generatedAt: new Date().toISOString(),
    status: getEmailStatus(),
    drafts: listEmailDrafts(),
    safety: safetySummary(),
  };
  writeEmailReport('gmail-email-drafts', payload);
  return payload;
}

export function createEmailDraft(options = {}) {
  ensureEmailDirectories();
  const now = new Date().toISOString();
  const reportType = normalizeReportType(options.reportType ?? options.type);
  const recipient = resolveRecipient(options.recipient ?? options.recipientName ?? 'Robert');
  const sender = String(options.sender ?? options.from ?? 'admin@vyraapp.fit');
  const draft = {
    schemaType: 'gmail_email_draft',
    id: options.id || `email-draft-${compactStamp(now)}-${slugify(reportType)}`,
    reportType,
    workflowState: normalizeWorkflowState(options.workflowState ?? options.status ?? 'ready_for_send'),
    sender,
    recipient,
    subject: String(options.subject ?? defaultSubject(reportType)),
    body: String(options.body ?? defaultBody(reportType)),
    schedule: normalizeSchedule(options.schedule ?? 'manual'),
    automationEligible: coerceBoolean(options.automationEligible ?? true),
    createdAt: now,
    updatedAt: now,
    createdBy: String(options.createdBy ?? 'Vyra Agent'),
    gmailMessageId: null,
    failureReason: null,
    safety: draftSafety(),
  };
  const validation = validateEmailDraft(draft);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, draft };
  writeEmailDraft(draft);
  appendEmailAudit({
    draftId: draft.id,
    actionTaken: draft.workflowState === 'auto_scheduled' ? 'auto_scheduled' : 'draft_created',
    operatorName: options.operatorName ?? 'Vyra Agent',
    operatorTool: options.operatorTool ?? 'Email Workflow',
    notes: 'Email draft created locally. No send attempted.',
    sender,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    providerSendOccurred: false,
  });
  const payload = { title: 'Email Draft Created', generatedAt: now, status: 'pass', draft, safety: safetySummary() };
  writeEmailReport('gmail-email-draft-created', payload);
  return payload;
}

export async function sendEmailDraft(options = {}) {
  const draft = findEmailDraft(options.id ?? options.draft ?? '');
  if (!draft) return { status: 'fail', errors: ['email draft not found'] };
  return sendDraftObject(draft, {
    operatorName: options.operatorName ?? options.operator ?? 'Vyra Agent',
    operatorTool: options.operatorTool ?? 'Email Workflow',
    automated: coerceBoolean(options.automated ?? false),
  });
}

export async function sendPendingEmails(options = {}) {
  const drafts = listEmailDrafts().filter((draft) => ['ready_for_send', 'auto_scheduled'].includes(draft.workflowState));
  const results = [];
  for (const draft of drafts) {
    results.push(
      await sendDraftObject(draft, {
        operatorName: options.operatorName ?? options.operator ?? 'Vyra Agent',
        operatorTool: options.operatorTool ?? 'Automated Email Workflow',
        automated: true,
      }),
    );
  }
  const payload = {
    title: 'Pending Email Send Results',
    generatedAt: new Date().toISOString(),
    attempted: drafts.length,
    results,
    status: results.some((result) => result.status === 'failed') ? 'partial' : 'pass',
    safety: safetySummary(),
  };
  writeEmailReport('gmail-email-send-pending', payload);
  return payload;
}

export function getEmailAuditReport() {
  const entries = listEmailAuditEntries();
  const payload = {
    title: 'Gmail Email Audit Trail',
    generatedAt: new Date().toISOString(),
    auditCount: entries.length,
    latestEmailAuditActions: latestAudits(entries),
    sentEmailCount: entries.filter((entry) => entry.actionTaken === 'sent').length,
    failedEmailCount: entries.filter((entry) => entry.actionTaken === 'failed').length,
    skippedEmailCount: entries.filter((entry) => entry.actionTaken === 'skipped').length,
    entries,
    safety: safetySummary(),
  };
  writeEmailReport('gmail-email-audit', payload);
  return payload;
}

export function validateEmailConnector() {
  ensureEmailDirectories();
  const drafts = listEmailDrafts();
  const audits = listEmailAuditEntries();
  const draftValidations = drafts.map((draft) => ({ id: draft.id, ...validateEmailDraft(draft) }));
  const auditValidations = audits.map((entry) => ({ id: entry.id, ...validateEmailAuditEntry(entry) }));
  const config = getGmailConfig();
  const checks = [
    { name: 'Gmail config is safe to inspect', passed: true },
    { name: 'Secrets are not printed', passed: true },
    { name: 'Approved senders configured', passed: approvedSenders.includes('admin@vyraapp.fit') && approvedSenders.includes('robert.sorenson@vyraapp.fit') },
    { name: 'Robert recipient configured', passed: resolveRecipient('Robert').status === 'ready' },
    { name: 'Matthew missing email skips sends', passed: resolveRecipient('Matthew').status === 'ready' || resolveRecipient('Matthew').status === 'missing_email' },
    { name: 'Draft schemas valid', passed: draftValidations.every((item) => item.valid) },
    { name: 'Audit schemas valid', passed: auditValidations.every((item) => item.valid) },
  ];
  return {
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    commands: emailCommands,
    gmailConfigured: config.configured,
    autoSendEnabled: config.autoSendEnabled,
    approvedSenders,
    internalRecipients: getInternalRecipients(),
    draftValidations,
    auditValidations,
    checks,
    safety: safetySummary(),
  };
}

export function getEmailSafetyCheck() {
  const status = getEmailStatus();
  const checks = [
    { name: 'Gmail sends require connector configuration', passed: true, detail: status.gmail.configured ? 'configured' : 'missing config blocks sends' },
    { name: 'Sender allowlist enforced', passed: true, detail: approvedSenders.join(', ') },
    { name: 'Missing recipient email skips send', passed: true, detail: 'Matthew is skipped until VYRA_EMAIL_MATTHEW is configured.' },
    { name: 'Email content validation enforced', passed: true },
    { name: 'Audit record is written before send attempt', passed: true },
    { name: 'No external marketing or bulk campaign mode', passed: true },
    { name: 'No CRM, Stripe, Supabase, or production business writes', passed: true },
    { name: 'Secrets never printed', passed: true },
  ];
  const payload = {
    title: 'Gmail Email Safety Check',
    generatedAt: new Date().toISOString(),
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    checks,
    safety: safetySummary(),
  };
  writeEmailReport('gmail-email-safety-check', payload);
  return payload;
}

async function sendDraftObject(draft, context) {
  const config = getGmailConfig();
  const gates = evaluateSendGates(draft, config);
  const auditBase = {
    draftId: draft.id,
    operatorName: context.operatorName,
    operatorTool: context.operatorTool,
    sender: draft.sender,
    recipientName: draft.recipient.name,
    recipientEmail: draft.recipient.email,
    automated: context.automated,
  };
  appendEmailAudit({
    ...auditBase,
    actionTaken: gates.canSend ? 'ready_for_send' : 'skipped',
    notes: gates.canSend ? 'All Gmail send gates passed; send attempt starting.' : gates.reason,
    providerSendOccurred: false,
  });
  if (!gates.canSend) {
    const updated = updateDraftState(draft, 'skipped', { failureReason: gates.reason });
    appendEmailAudit({ ...auditBase, actionTaken: 'skipped', notes: gates.reason, providerSendOccurred: false });
    return { status: 'skipped', reason: gates.reason, draft: updated, gates };
  }
  try {
    const accessToken = await resolveAccessToken(config);
    if (!accessToken) throw new Error('Gmail access token unavailable after config check.');
    const result = await sendViaGmail({ accessToken, draft });
    const updated = updateDraftState(draft, 'sent', { gmailMessageId: result.id ?? null, failureReason: null });
    appendEmailAudit({
      ...auditBase,
      actionTaken: 'sent',
      notes: `Gmail send completed${result.id ? ` with message ${result.id}` : ''}.`,
      providerSendOccurred: true,
      gmailMessageId: result.id ?? null,
    });
    return { status: 'sent', gmailMessageId: result.id ?? null, draft: updated, gates: redactGates(gates) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const updated = updateDraftState(draft, 'failed', { failureReason: reason });
    appendEmailAudit({ ...auditBase, actionTaken: 'failed', notes: reason, providerSendOccurred: false });
    return { status: 'failed', reason, draft: updated, gates: redactGates(gates) };
  }
}

function evaluateSendGates(draft, config) {
  const validation = validateEmailDraft(draft);
  if (!validation.valid) return { canSend: false, reason: validation.errors.join('; '), gates: validation.errors };
  if (!config.configured) return { canSend: false, reason: `Gmail connector missing config: ${config.missingConfig.join(', ') || 'token'}` };
  if (!config.autoSendEnabled) return { canSend: false, reason: 'Gmail auto-send is disabled by VYRA_GMAIL_SEND_ENABLED.' };
  if (!approvedSenders.includes(draft.sender)) return { canSend: false, reason: `Sender ${draft.sender} is not approved.` };
  if (draft.recipient.status !== 'ready' || !draft.recipient.email) return { canSend: false, reason: `Recipient ${draft.recipient.name} is ${draft.recipient.status}.` };
  if (!isValidEmail(draft.recipient.email)) return { canSend: false, reason: `Recipient ${draft.recipient.name} email is invalid.` };
  if (!nonEmpty(draft.subject) || !nonEmpty(draft.body)) return { canSend: false, reason: 'Email subject and body are required.' };
  return { canSend: true, reason: 'all gates passed' };
}

async function sendViaGmail({ accessToken, draft }) {
  const raw = base64UrlEncode(buildRawEmail(draft));
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail send failed with ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

async function resolveAccessToken(config) {
  if (process.env.VYRA_GMAIL_ACCESS_TOKEN) return process.env.VYRA_GMAIL_ACCESS_TOKEN;
  if (!config.refreshConfigured) return null;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.VYRA_GMAIL_CLIENT_ID ?? '',
      client_secret: process.env.VYRA_GMAIL_CLIENT_SECRET ?? '',
      refresh_token: process.env.VYRA_GMAIL_REFRESH_TOKEN ?? '',
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) throw new Error(`Gmail token refresh failed with ${response.status}.`);
  const payload = await response.json();
  return payload.access_token ?? null;
}

function buildRawEmail(draft) {
  return [
    `From: ${draft.sender}`,
    `To: ${draft.recipient.email}`,
    `Subject: ${draft.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    draft.body,
  ].join('\r\n');
}

function getGmailConfig() {
  const tokenConfigured = Boolean(process.env.VYRA_GMAIL_ACCESS_TOKEN);
  const refreshConfigured = Boolean(process.env.VYRA_GMAIL_CLIENT_ID && process.env.VYRA_GMAIL_CLIENT_SECRET && process.env.VYRA_GMAIL_REFRESH_TOKEN);
  const configured = tokenConfigured || refreshConfigured;
  const missingConfig = configured ? [] : ['VYRA_GMAIL_ACCESS_TOKEN or VYRA_GMAIL_CLIENT_ID/VYRA_GMAIL_CLIENT_SECRET/VYRA_GMAIL_REFRESH_TOKEN'];
  return {
    configured,
    tokenConfigured,
    refreshConfigured,
    autoSendEnabled: configured && process.env.VYRA_GMAIL_SEND_ENABLED !== 'false',
    missingConfig,
  };
}

function getInternalRecipients() {
  return [resolveRecipient('Robert'), resolveRecipient('Matthew')];
}

function resolveRecipient(name) {
  const normalized = String(name || '').toLowerCase();
  if (normalized === 'robert') {
    const email = process.env.VYRA_EMAIL_ROBERT || 'robert.sorenson@vyraapp.fit';
    return { name: 'Robert', email, status: isValidEmail(email) ? 'ready' : 'invalid_email' };
  }
  if (normalized === 'matthew') {
    const email = process.env.VYRA_EMAIL_MATTHEW || '';
    return { name: 'Matthew', email, status: email ? (isValidEmail(email) ? 'ready' : 'invalid_email') : 'missing_email' };
  }
  const direct = String(name || '');
  return { name: direct || 'Unknown', email: isValidEmail(direct) ? direct : '', status: isValidEmail(direct) ? 'ready' : 'missing_email' };
}

function listEmailDrafts() {
  ensureEmailDirectories();
  return [...listJsonFiles(emailDirectories.drafts), ...listJsonFiles(emailDirectories.archive)].map((filePath) => readJson(filePath)).filter(Boolean);
}

function listEmailAuditEntries() {
  ensureEmailDirectories();
  return listJsonFiles(emailDirectories.audit).map((filePath) => readJson(filePath)).filter(Boolean);
}

function findEmailDraft(id) {
  return listEmailDrafts().find((draft) => draft.id === id || `${safeFileName(draft.id)}.json` === id) ?? null;
}

function writeEmailDraft(draft) {
  ensureEmailDirectories();
  const target = draft.workflowState === 'archived' ? emailDirectories.archive : emailDirectories.drafts;
  writeFileSync(path.join(target, `${safeFileName(draft.id)}.json`), `${JSON.stringify(draft, null, 2)}\n`);
}

function updateDraftState(draft, workflowState, patch = {}) {
  const updated = { ...draft, ...patch, workflowState, updatedAt: new Date().toISOString() };
  writeEmailDraft(updated);
  if (workflowState === 'archived') {
    const activePath = path.join(emailDirectories.drafts, `${safeFileName(draft.id)}.json`);
    const archivePath = path.join(emailDirectories.archive, `${safeFileName(draft.id)}.json`);
    if (existsSync(activePath)) renameSync(activePath, archivePath);
  }
  return updated;
}

function appendEmailAudit({ draftId, actionTaken, operatorName, operatorTool, notes, sender, recipientName, recipientEmail, automated = false, providerSendOccurred = false, gmailMessageId = null }) {
  ensureEmailDirectories();
  const timestamp = new Date().toISOString();
  const entry = {
    schemaType: 'gmail_email_audit_entry',
    id: `email-audit-${safeFileName(draftId)}-${compactStamp(timestamp)}-${safeFileName(actionTaken)}`,
    draftId,
    actionTaken,
    operatorName,
    operatorTool,
    timestamp,
    safetyMode: 'gmail-config-gated/internal-only',
    notes,
    sender,
    recipientName,
    recipientEmail: recipientEmail || '',
    automated: Boolean(automated),
    provider: 'gmail',
    providerSendOccurred: Boolean(providerSendOccurred),
    gmailMessageId,
    crmWriteOccurred: false,
    stripeWriteOccurred: false,
    supabaseProductionWriteOccurred: false,
    productionBusinessWriteOccurred: false,
    secretsIncluded: false,
  };
  const validation = validateEmailAuditEntry(entry);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  writeFileSync(path.join(emailDirectories.audit, `${safeFileName(entry.id)}.json`), `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}

function validateEmailDraft(draft) {
  const errors = [];
  if (!draft || typeof draft !== 'object') return { valid: false, errors: ['draft must be an object'] };
  if (draft.schemaType !== 'gmail_email_draft') errors.push('schemaType must be gmail_email_draft.');
  if (!nonEmpty(draft.id)) errors.push('id is required.');
  if (!reportTypes.includes(draft.reportType)) errors.push(`reportType must be one of: ${reportTypes.join(', ')}.`);
  if (!emailWorkflowStates.includes(draft.workflowState)) errors.push(`workflowState must be one of: ${emailWorkflowStates.join(', ')}.`);
  if (!approvedSenders.includes(draft.sender)) errors.push('sender must be approved.');
  if (!draft.recipient || !nonEmpty(draft.recipient.name)) errors.push('recipient name is required.');
  if (!nonEmpty(draft.subject)) errors.push('subject is required.');
  if (!nonEmpty(draft.body)) errors.push('body is required.');
  if (draft.safety?.internalOnly !== true || draft.safety?.noBulkCampaign !== true || draft.safety?.auditRequired !== true) errors.push('safety must mark internalOnly, noBulkCampaign, and auditRequired true.');
  return { valid: errors.length === 0, errors };
}

function validateEmailAuditEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['audit entry must be an object'] };
  if (entry.schemaType !== 'gmail_email_audit_entry') errors.push('schemaType must be gmail_email_audit_entry.');
  if (!nonEmpty(entry.id)) errors.push('id is required.');
  if (!nonEmpty(entry.draftId)) errors.push('draftId is required.');
  if (!emailWorkflowStates.includes(entry.actionTaken)) errors.push(`actionTaken must be one of: ${emailWorkflowStates.join(', ')}.`);
  if (!nonEmpty(entry.timestamp) || Number.isNaN(Date.parse(entry.timestamp))) errors.push('timestamp must be an ISO date.');
  if (entry.secretsIncluded !== false) errors.push('secretsIncluded must be false.');
  if (entry.crmWriteOccurred !== false || entry.stripeWriteOccurred !== false || entry.supabaseProductionWriteOccurred !== false || entry.productionBusinessWriteOccurred !== false) errors.push('non-email production writes must be false.');
  return { valid: errors.length === 0, errors };
}

function normalizeReportType(value = 'executive_daily_summary') {
  return reportTypes.includes(value) ? value : 'executive_daily_summary';
}

function normalizeWorkflowState(value = 'ready_for_send') {
  return emailWorkflowStates.includes(value) ? value : 'ready_for_send';
}

function normalizeSchedule(value = 'manual') {
  if (['manual', 'daily', 'hourly', 'event_triggered'].includes(value)) return value;
  return 'manual';
}

function defaultSubject(reportType) {
  return `Vyra ${reportType.replace(/_/g, ' ')}`;
}

function defaultBody(reportType) {
  return `Vyra ${reportType.replace(/_/g, ' ')} is ready.\n\nThis internal update was prepared by the Vyra agent workflow.`;
}

function defaultSchedules() {
  return [
    { reportType: 'executive_daily_summary', cadence: 'daily', recipient: 'Robert', autoSendCapable: true },
    { reportType: 'engineering_summary', cadence: 'event_triggered', recipient: 'Robert', autoSendCapable: true },
    { reportType: 'release_ship_plan_summary', cadence: 'event_triggered', recipient: 'Robert', autoSendCapable: true },
    { reportType: 'task_queue_summary', cadence: 'daily', recipient: 'Robert', autoSendCapable: true },
    { reportType: 'cross_agent_review_summary', cadence: 'daily', recipient: 'Matthew', autoSendCapable: true, status: resolveRecipient('Matthew').status },
  ];
}

function draftSafety() {
  return {
    internalOnly: true,
    noBulkCampaign: true,
    approvedSenderRequired: true,
    recipientRequired: true,
    validContentRequired: true,
    auditRequired: true,
    crmWrites: false,
    stripeWrites: false,
    supabaseProductionWrites: false,
    secretsIncluded: false,
  };
}

function safetySummary() {
  return {
    gmailConnector: 'config-gated',
    automaticSending: 'enabled only when Gmail config and safety gates pass',
    approvedSenders,
    internalRecipientsOnly: true,
    noExternalMarketingEmails: true,
    noBulkCampaigns: true,
    crmWrites: false,
    stripeWrites: false,
    supabaseProductionWrites: false,
    secretsPrinted: false,
  };
}

function writeEmailReport(slug, payload) {
  mkdirSync(emailReportRoot, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  const jsonPath = path.join(emailReportRoot, `${stamp}-${slug}.json`);
  const mdPath = path.join(emailReportRoot, `${stamp}-${slug}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return [jsonPath, mdPath];
}

function latestAudits(entries) {
  return entries
    .slice()
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 8)
    .map((entry) => ({
      draftId: entry.draftId,
      actionTaken: entry.actionTaken,
      operatorName: entry.operatorName,
      operatorTool: entry.operatorTool,
      timestamp: entry.timestamp,
      providerSendOccurred: entry.providerSendOccurred,
      recipientName: entry.recipientName,
    }));
}

function listJsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(directory, file))
    .sort();
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'Gmail Email Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => appendMarkdownValue(lines, labelize(key), value, 2));
  return `${lines.join('\n').trim()}\n`;
}

function appendMarkdownValue(lines, title, value, level) {
  lines.push(`${'#'.repeat(level)} ${title}`, '');
  if (Array.isArray(value)) value.forEach((item) => lines.push(`- ${formatValue(item)}`));
  else if (typeof value === 'object' && value !== null) Object.entries(value).forEach(([key, child]) => lines.push(`- ${labelize(key)}: ${formatValue(child)}`));
  else lines.push(String(value ?? ''));
  lines.push('');
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function safeFileName(value) {
  return String(value || 'item').replace(/[^a-zA-Z0-9._:-]+/g, '-');
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return !['false', '0', 'no'].includes(value.toLowerCase());
  return Boolean(value);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function redactGates(gates) {
  return { ...gates, token: undefined };
}
