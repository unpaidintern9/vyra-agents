import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExecutiveOperationsCenter, executiveOperationsReportRoot } from './executive-operations-runtime.mjs';
import { createEmailDraft, defaultEmailSender, emailDirectories, getEmailStatus, sendEmailDraft, sharedInboxEmail } from './gmail-email-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');

export const executiveEmailBriefingCommands = [
  'executive:email-briefing',
  'executive:email-preview',
  'executive:email-send',
  'executive:email-status',
  'executive:email-validate',
];

export function buildExecutiveEmailBriefing(options = {}) {
  const generatedAt = new Date().toISOString();
  const operations = buildExecutiveOperationsCenter(options);
  const emailStatus = getEmailStatus();
  const recipients = buildRecipients(emailStatus);
  const briefingDate = options.date ?? operations.briefing.date;
  const subject = options.subject ?? `Vyra Executive Briefing - ${briefingDate}`;
  const sender = options.sender ?? defaultEmailSender;
  const body = renderEmailBody({ operations, briefingDate });
  const attempts = recipients.map((recipient) => {
    const sendStatus = recipient.enabled && recipient.status === 'ready' ? 'ready_for_send' : 'skipped';
    const skipReason = recipient.enabled
      ? recipient.status === 'ready'
        ? null
        : `${recipient.name} recipient is ${recipient.status}.`
      : `${recipient.name} is disabled for this schedule.`;
    return {
      schemaType: 'executive_daily_briefing_email',
      recipient: recipient.email || recipient.name,
      recipientName: recipient.name,
      recipientStatus: recipient.status,
      sender,
      subject,
      briefingDate,
      executiveScore: operations.overallExecutiveScore,
      topPriorities: operations.briefing.todaysPriorities.slice(0, 8),
      blockedWork: operations.briefing.blockedWork,
      engineeringHealth: operations.engineeringHealth,
      salesHealth: operations.salesHealth,
      releaseReadiness: operations.briefing.releaseReadinessSummary,
      pendingApprovals: operations.briefing.pendingApprovals,
      recommendedActions: operations.briefing.recommendedNextActions,
      auditId: latestAuditIdForRecipient(recipient.name),
      sendStatus,
      skipReason,
      draftId: null,
      gmailMessageId: null,
      body,
      safety: executiveEmailSafety(),
    };
  });

  return {
    title: 'Daily Executive Email Briefing',
    generatedAt,
    briefingDate,
    sender,
    subject,
    schedule: dailyBriefingSchedule(),
    recipients,
    attempts,
    preview: {
      subject,
      body,
    },
    status: summarizeAttempts(attempts),
    commands: executiveEmailBriefingCommands,
    gmail: {
      automationStatus: emailStatus.automationStatus,
      connectorStatus: emailStatus.gmail.status,
      sentEmailCount: emailStatus.sentEmailCount,
      skippedEmailCount: emailStatus.skippedEmailCount,
      failedEmailCount: emailStatus.failedEmailCount,
    },
    safety: executiveEmailSafety(),
  };
}

export function getExecutiveEmailPreview(options = {}) {
  const briefing = buildExecutiveEmailBriefing(options);
  return {
    ...briefing,
    reports: writeExecutiveEmailReports('daily-briefing-email-preview', briefing, { json: true, markdown: true }),
  };
}

export function getExecutiveEmailStatus(options = {}) {
  const briefing = buildExecutiveEmailBriefing(options);
  const audits = latestEmailAudits();
  return {
    title: 'Daily Executive Email Briefing Status',
    generatedAt: new Date().toISOString(),
    briefingDate: briefing.briefingDate,
    automationStatus: briefing.gmail.automationStatus,
    nextScheduledBriefing: briefing.schedule.nextRunLabel,
    recipients: briefing.recipients,
    lastBriefingSentOrSkipped: audits[0]?.timestamp ?? 'none',
    latestAuditActions: audits.slice(0, 8),
    failedOrSkippedAttempts: audits.filter((entry) => ['failed', 'skipped'].includes(entry.actionTaken)).slice(0, 8),
    commands: executiveEmailBriefingCommands,
    safety: executiveEmailSafety(),
  };
}

export async function sendExecutiveEmailBriefing(options = {}) {
  const briefing = buildExecutiveEmailBriefing(options);
  const results = [];
  for (const attempt of briefing.attempts) {
    const draftResult = createEmailDraft({
      id: `executive-daily-briefing-${attempt.briefingDate}-${slugify(attempt.recipientName)}`,
      reportType: 'executive_daily_summary',
      workflowState: 'auto_scheduled',
      sender: attempt.sender,
      recipient: attempt.recipientName,
      subject: attempt.subject,
      body: attempt.body,
      schedule: 'daily',
      automationEligible: true,
      createdBy: 'Executive Agent',
      operatorName: 'Executive Agent',
      operatorTool: 'Daily Executive Email Briefing',
    });
    if (draftResult.status === 'fail') {
      results.push({
        ...attempt,
        sendStatus: 'failed',
        failureReason: draftResult.errors.join('; '),
      });
      continue;
    }
    const sendResult = await sendEmailDraft({
      id: draftResult.draft.id,
      automated: true,
      operatorName: 'Executive Agent',
      operatorTool: 'Daily Executive Email Briefing',
    });
    results.push({
      ...attempt,
      auditId: latestAuditIdForDraft(draftResult.draft.id),
      draftId: draftResult.draft.id,
      gmailMessageId: sendResult.gmailMessageId ?? null,
      sendStatus: sendResult.status,
      skipReason: sendResult.status === 'skipped' ? sendResult.reason : attempt.skipReason,
      failureReason: sendResult.status === 'failed' ? sendResult.reason : null,
    });
  }
  const payload = {
    ...briefing,
    title: 'Daily Executive Email Briefing Send Audit',
    generatedAt: new Date().toISOString(),
    attempts: results,
    status: summarizeAttempts(results),
    reports: [],
  };
  payload.reports = writeExecutiveEmailReports('daily-briefing-email-send-audit', payload, { json: true, markdown: true });
  return payload;
}

export function validateExecutiveEmailBriefing(options = {}) {
  const errors = [];
  let briefing = null;
  try {
    briefing = buildExecutiveEmailBriefing(options);
  } catch (error) {
    errors.push(error.message);
  }
  if (briefing) {
    if (!briefing.attempts.length) errors.push('daily briefing email must include recipient attempts.');
    if (briefing.sender !== defaultEmailSender) errors.push(`Executive email sender must be ${defaultEmailSender}.`);
    if (!briefing.attempts.some((attempt) => attempt.recipientName === 'Shared Inbox' && attempt.recipient === sharedInboxEmail && attempt.recipientStatus === 'ready')) {
      errors.push(`Shared inbox ${sharedInboxEmail} must be the ready internal recipient.`);
    }
    if (briefing.safety.internalRecipientsOnly !== true) errors.push('internal-recipient safety gate must be enabled.');
    if (briefing.safety.noBulkSending !== true) errors.push('bulk sending must be disabled.');
    if (!briefing.preview.body.includes('Recommended actions')) errors.push('preview body must include recommended actions.');
  }
  return {
    title: 'Daily Executive Email Briefing Validation',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands: executiveEmailBriefingCommands,
    recipients: briefing?.recipients ?? [],
    safety: executiveEmailSafety(),
  };
}

function buildRecipients(emailStatus) {
  const statusByName = Object.fromEntries(emailStatus.internalRecipients.map((recipient) => [recipient.name, recipient]));
  const sharedInbox = statusByName['Shared Inbox'] ?? { name: 'Shared Inbox', email: sharedInboxEmail, status: 'ready' };
  return [{ ...sharedInbox, enabled: true, scheduleRole: 'shared_internal_inbox' }];
}

function renderEmailBody({ operations, briefingDate }) {
  const briefing = operations.briefing;
  return [
    `Vyra Executive Briefing - ${briefingDate}`,
    '',
    `Executive score: ${operations.overallExecutiveScore}/100`,
    `Operating status: ${operations.dailyOperatingStatus}`,
    '',
    'Top priorities:',
    ...bulletLines(briefing.todaysPriorities),
    '',
    'Blocked work:',
    ...bulletLines(briefing.blockedWork.length ? briefing.blockedWork : ['No blocked work recorded in the local briefing.']),
    '',
    `Engineering health: ${operations.engineeringHealth}`,
    `Sales health: ${operations.salesHealth}`,
    `Release readiness: ${briefing.releaseReadinessSummary.releaseHealth}; ${briefing.releaseReadinessSummary.readyProjects} ready, ${briefing.releaseReadinessSummary.blockedProjects} blocked, average score ${briefing.releaseReadinessSummary.averageReadinessScore}/100.`,
    '',
    'Pending approvals:',
    `- Runtime approvals: ${briefing.pendingApprovals.runtimeApprovals}`,
    `- Task review items: ${briefing.pendingApprovals.taskReviewItems}`,
    `- GitHub plans needing review: ${briefing.pendingApprovals.githubPlansNeedingReview}`,
    `- Ship plans needing review: ${briefing.pendingApprovals.shipPlansNeedingReview}`,
    '',
    'Recommended actions:',
    ...bulletLines(briefing.recommendedNextActions),
    '',
    'Safety:',
    '- Internal recipients only.',
    '- No marketing, bulk, CRM, Stripe, Supabase production, GitHub, deployment, or release actions were performed.',
    '- Gmail sends are config-gated and audited by the existing Gmail connector workflow.',
  ].join('\n');
}

function dailyBriefingSchedule() {
  return {
    template: 'daily_executive_email_briefing',
    cadence: 'daily',
    timezone: 'America/New_York',
    nextRunLabel: 'Next local briefing: tomorrow 8:00 AM America/New_York',
    sender: defaultEmailSender,
    recipient: sharedInboxEmail,
    sharedInboxEnabled: true,
    directPersonalRecipientsDisabled: true,
    scheduledThreadRunner: 'codex-agent-threads/shared/schedules/executive-daily-email-briefing.schedule.example.json',
  };
}

function summarizeAttempts(attempts) {
  const sent = attempts.filter((attempt) => attempt.sendStatus === 'sent').length;
  const failed = attempts.filter((attempt) => attempt.sendStatus === 'failed').length;
  const skipped = attempts.filter((attempt) => attempt.sendStatus === 'skipped').length;
  const ready = attempts.filter((attempt) => attempt.sendStatus === 'ready_for_send').length;
  return {
    status: failed ? 'attention' : skipped ? 'skipped_safely' : sent ? 'sent' : ready ? 'ready_for_send' : 'preview',
    recipientCount: attempts.length,
    sent,
    failed,
    skipped,
    ready,
  };
}

function executiveEmailSafety() {
  return {
    internalRecipientsOnly: true,
    noMarketingEmails: true,
    noBulkSending: true,
    noExternalCustomerEmails: true,
    gmailSafetyChecksRequired: true,
    gmailAuditRequired: true,
    crmWrites: false,
    stripeWrites: false,
    supabaseProductionWrites: false,
    githubWrites: false,
    deployments: false,
    secretsCommitted: false,
  };
}

function latestEmailAudits() {
  if (!existsSync(emailDirectories.audit)) return [];
  return readdirSync(emailDirectories.audit)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readJson(path.join(emailDirectories.audit, file)))
    .filter(Boolean)
    .filter((entry) => String(entry.draftId ?? '').startsWith('executive-daily-briefing-'))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

function latestAuditIdForRecipient(name) {
  return latestEmailAudits().find((entry) => entry.recipientName === name)?.id ?? null;
}

function latestAuditIdForDraft(draftId) {
  return latestEmailAudits().find((entry) => entry.draftId === draftId)?.id ?? null;
}

function writeExecutiveEmailReports(slug, payload, options = {}) {
  mkdirSync(executiveOperationsReportRoot, { recursive: true });
  const base = `${stamp(payload.generatedAt)}-${slug}`;
  const files = [];
  if (options.json !== false) {
    const jsonPath = path.join(executiveOperationsReportRoot, `${base}.json`);
    writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
    files.push(jsonPath);
  }
  if (options.markdown !== false) {
    const mdPath = path.join(executiveOperationsReportRoot, `${base}.md`);
    writeFileSync(mdPath, toMarkdown(payload));
    files.push(mdPath);
  }
  return files;
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Daily Executive Email Briefing'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title' && key !== 'preview')
    .forEach(([key, value]) => appendMarkdownValue(lines, labelize(key), value, 2));
  if (payload.preview?.body) {
    lines.push('## Email Preview', '', '```text', payload.preview.body, '```', '');
  }
  return `${lines.join('\n').trim()}\n`;
}

function appendMarkdownValue(lines, title, value, level) {
  lines.push(`${'#'.repeat(level)} ${title}`, '');
  if (Array.isArray(value)) value.forEach((item) => lines.push(`- ${formatValue(item)}`));
  else if (typeof value === 'object' && value !== null) Object.entries(value).forEach(([key, child]) => lines.push(`- ${labelize(key)}: ${formatValue(child)}`));
  else lines.push(String(value ?? ''));
  lines.push('');
}

function bulletLines(items) {
  return items.length ? items.map((item) => `- ${item}`) : ['- None recorded.'];
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function stamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function slugify(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
