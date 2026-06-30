import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const bridgeRoot = path.join(repoRoot, 'codex-agent-threads');
export const sharedRoot = path.join(bridgeRoot, 'shared');
export const threadDirectories = {
  inbox: path.join(sharedRoot, 'inbox'),
  outbox: path.join(sharedRoot, 'outbox'),
  archive: path.join(sharedRoot, 'archive'),
  schedules: path.join(sharedRoot, 'schedules'),
  approvalQueue: path.join(sharedRoot, 'approval-queue'),
};

const supportedSchemaTypes = new Set([
  'thread_output',
  'agent_handoff',
  'task_recommendation',
  'sales_research_note',
  'customer_research_note',
  'executive_summary_item',
]);

const supportedApprovalTypes = new Set([
  'email_draft_request',
  'sms_draft_request',
  'crm_write_request',
  'stripe_invoice_request',
  'supabase_write_request',
  'executive_review_request',
  'sales_follow_up_request',
]);

const blockedActions = [
  'email sends',
  'SMS sends',
  'CRM writes',
  'Stripe writes',
  'Supabase production writes',
  'production business writes',
  'secret output',
];

export function ensureThreadBridgeDirectories() {
  Object.values(threadDirectories).forEach((directory) => mkdirSync(directory, { recursive: true }));
}

export function readThreadIndex() {
  const indexPath = path.join(bridgeRoot, 'threads-index.json');
  if (!existsSync(indexPath)) {
    return { threads: [], safety: { mode: 'local/mock/read-only', blockedActions } };
  }
  return JSON.parse(readFileSync(indexPath, 'utf8'));
}

export function listOutboxItems() {
  ensureThreadBridgeDirectories();
  return listPayloadFiles(threadDirectories.outbox).map(readPayloadFile);
}

export function listInboxItems() {
  ensureThreadBridgeDirectories();
  return listPayloadFiles(threadDirectories.inbox).map(readPayloadFile);
}

export function listArchiveItems() {
  ensureThreadBridgeDirectories();
  return listPayloadFiles(threadDirectories.archive).map(readPayloadFile);
}

export function listScheduleDefinitions() {
  ensureThreadBridgeDirectories();
  return listPayloadFiles(threadDirectories.schedules).map(readPayloadFile);
}

export function listApprovalQueueItems() {
  ensureThreadBridgeDirectories();
  return listPayloadFiles(threadDirectories.approvalQueue).map(readPayloadFile);
}

export function buildThreadBridgeStatus() {
  const outbox = listOutboxItems();
  const inbox = listInboxItems();
  const archive = listArchiveItems();
  const schedules = listScheduleDefinitions().filter((item) => validateScheduleDefinition(item.parsed).valid);
  const approvals = listApprovalQueueItems().filter((item) => validateApprovalQueueItem(item.parsed).valid);
  const dueSchedules = getDueSchedules(new Date());
  const approvalSummary = summarizeApprovalQueueItems(approvals.map((item) => item.parsed));
  const index = readThreadIndex();
  const latest = [...outbox, ...archive]
    .filter((item) => item.parsed)
    .sort((a, b) => String(b.parsed.createdAt ?? '').localeCompare(String(a.parsed.createdAt ?? '')))[0];

  return {
    bridgeRoot: path.relative(repoRoot, bridgeRoot),
    threadsRegistered: index.threads?.length ?? 0,
    pendingOutboxItems: outbox.length,
    inboxItems: inbox.length,
    archivedItems: archive.length,
    schedulesConfigured: schedules.length,
    dueSchedules: dueSchedules.length,
    pendingApprovals: approvalSummary.pending,
    approvalsByType: approvalSummary.pendingByType,
    approvalDecisions: {
      approved: approvalSummary.approved,
      rejected: approvalSummary.rejected,
    },
    latestThread: latest?.parsed?.sourceThread?.name ?? 'none',
    latestItem: latest?.parsed?.title ?? latest?.fileName ?? 'none',
    safetyMode: index.safety?.mode ?? 'local/mock/read-only',
    blockedActions: index.safety?.blockedActions ?? blockedActions,
  };
}

export function validateThreadBridge() {
  ensureThreadBridgeDirectories();
  const outbox = listOutboxItems();
  const schedules = listScheduleDefinitions();
  const approvalItems = listApprovalQueueItems();
  const example = path.join(sharedRoot, 'examples/thread-output.example.json');
  const approvalExample = path.join(sharedRoot, 'examples/approval-queue.example.json');
  const exampleValidation = existsSync(example) ? validateThreadPayload(readPayloadFile(example).parsed) : { valid: false, errors: ['missing example payload'] };
  const approvalExampleValidation = existsSync(approvalExample)
    ? validateApprovalQueueItem(readPayloadFile(approvalExample).parsed)
    : { valid: false, errors: ['missing approval queue example payload'] };
  const validations = outbox.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateThreadPayload(item.parsed),
  }));
  const scheduleValidations = schedules.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateScheduleDefinition(item.parsed),
  }));
  const approvalValidations = approvalItems.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateApprovalQueueItem(item.parsed),
  }));
  const status =
    validations.every((item) => item.valid) &&
    scheduleValidations.every((item) => item.valid) &&
    approvalValidations.every((item) => item.valid) &&
    exampleValidation.valid &&
    approvalExampleValidation.valid
      ? 'pass'
      : 'fail';
  return {
    status,
    pendingOutboxItems: outbox.length,
    exampleValidation,
    approvalExampleValidation,
    validations,
    scheduleValidations,
    approvalValidations,
    directoriesReady: Object.fromEntries(Object.entries(threadDirectories).map(([key, directory]) => [key, existsSync(directory)])),
  };
}

export function ingestThreadOutbox() {
  const outbox = listOutboxItems();
  const validItems = outbox.filter((item) => validateThreadPayload(item.parsed).valid);
  const grouped = groupBySourceThread(validItems);
  const executiveItems = validItems.map((item) => toExecutiveReviewItem(item.parsed, item.fileName));
  const summary = buildThreadSummary(validItems);
  const payload = {
    title: 'Thread Outbox Ingest Summary',
    generatedAt: new Date().toISOString(),
    pendingOutboxItems: outbox.length,
    validItems: validItems.length,
    invalidItems: outbox.length - validItems.length,
    groupedByNamedAgent: grouped,
    executiveReviewItems: executiveItems,
    summary,
    safety: {
      externalActions: 'none',
      productionWrites: false,
      secretsIncluded: false,
      blockedActions,
    },
  };
  writeThreadReport('thread-outbox-ingest-summary', payload);
  return payload;
}

export function summarizeThreadOutbox() {
  const items = listOutboxItems().filter((item) => validateThreadPayload(item.parsed).valid);
  const payload = {
    title: 'Thread Outbox Summary',
    generatedAt: new Date().toISOString(),
    groupedByNamedAgent: groupBySourceThread(items),
    recommendedNextActions: items.flatMap((item) => extractRecommendations(item.parsed)).slice(0, 12),
    executiveReviewItems: items.map((item) => toExecutiveReviewItem(item.parsed, item.fileName)),
    archiveStatus: `${listArchiveItems().length} archived item(s)`,
    safety: 'Local summary only. No external actions or production writes.',
  };
  writeThreadReport('thread-outbox-summary', payload);
  return payload;
}

export function archiveThreadOutbox() {
  ensureThreadBridgeDirectories();
  const items = listOutboxItems();
  const archived = [];
  const stamp = compactStamp(new Date().toISOString());
  items.forEach((item) => {
    const destination = path.join(threadDirectories.archive, `${stamp}-${item.fileName}`);
    renameSync(item.path, destination);
    archived.push(path.relative(repoRoot, destination));
  });
  const payload = {
    title: 'Thread Outbox Archive Result',
    generatedAt: new Date().toISOString(),
    archivedCount: archived.length,
    archived,
    safety: 'Local file move only. No Supabase, CRM, Stripe, email, SMS, or production writes.',
  };
  writeThreadReport('thread-outbox-archive-result', payload);
  return payload;
}

export function getThreadSchedules() {
  const now = new Date();
  const definitions = listScheduleDefinitions();
  const schedules = definitions.map((item) => ({
    file: path.relative(repoRoot, item.path),
    schedule: item.parsed,
    validation: validateScheduleDefinition(item.parsed),
    due: validateScheduleDefinition(item.parsed).valid ? isScheduleDue(item.parsed, now) : false,
  }));
  const payload = {
    title: 'Scheduled Thread Definitions',
    generatedAt: now.toISOString(),
    scheduleCount: schedules.length,
    dueCount: schedules.filter((item) => item.due).length,
    schedules: schedules.map((item) => ({
      file: item.file,
      id: item.schedule?.id,
      name: item.schedule?.name,
      cadence: item.schedule?.cadence,
      nextRunAt: item.schedule?.nextRunAt,
      runMode: item.schedule?.runMode,
      enabled: item.schedule?.enabled,
      due: item.due,
      valid: item.validation.valid,
      errors: item.validation.errors,
    })),
    safety: 'Manual schedule inspection only. No background jobs or external actions.',
  };
  writeThreadReport('scheduled-thread-definitions', payload);
  return payload;
}

export function runDueThreadSchedules() {
  const now = new Date();
  const due = getDueSchedules(now);
  const createdOutboxItems = due.map((item) => writeScheduledRunOutboxItem(item.parsed, now));
  const payload = {
    title: 'Scheduled Thread Run Report',
    generatedAt: now.toISOString(),
    dueScheduleCount: due.length,
    createdOutboxItems,
    skippedMessage: due.length === 0 ? 'No due schedules. Nothing was run.' : 'Manual local run completed for due schedule definitions.',
    safety: {
      backgroundJobsStarted: false,
      externalActions: 'none',
      productionWrites: false,
      blockedActions,
    },
  };
  writeThreadReport('scheduled-thread-run-report', payload);
  return payload;
}

export function getApprovalQueueReport() {
  const items = listApprovalQueueItems();
  const validItems = items.filter((item) => validateApprovalQueueItem(item.parsed).valid).map((item) => item.parsed);
  const summary = summarizeApprovalQueueItems(validItems);
  const payload = {
    title: 'Approval Queue Report',
    generatedAt: new Date().toISOString(),
    approvalCount: validItems.length,
    pendingApprovals: summary.pending,
    pendingByType: summary.pendingByType,
    approved: summary.approved,
    rejected: summary.rejected,
    items: validItems.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      requestingAgent: item.requestingAgent,
      status: item.status,
      risk: item.risk,
      decisionAt: item.decision?.decidedAt ?? null,
    })),
    safety: 'Local approval state only. Approval does not perform the requested external action.',
  };
  writeThreadReport('approval-queue-report', payload);
  return payload;
}

export function decideApprovalQueueItem({ id, decision, operator = 'local operator', reason = 'Local operator decision.' }) {
  if (!['approved', 'rejected'].includes(decision)) {
    return { status: 'fail', errors: [`Unsupported decision: ${decision}`] };
  }
  const items = listApprovalQueueItems();
  const item = items.find((candidate) => candidate.parsed?.id === id || candidate.fileName === id);
  if (!item) {
    return {
      status: 'fail',
      errors: [`Approval queue item not found: ${id}. Add a local item under codex-agent-threads/shared/approval-queue/ first.`],
    };
  }
  const validation = validateApprovalQueueItem(item.parsed);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };

  const decided = {
    ...item.parsed,
    status: decision,
    decision: {
      decidedAt: new Date().toISOString(),
      decidedBy: operator,
      decision,
      reason,
      externalActionPerformed: false,
      productionWritePerformed: false,
    },
  };
  writeFileSync(item.path, `${JSON.stringify(decided, null, 2)}\n`);
  const payload = {
    title: `Approval Queue ${decision === 'approved' ? 'Approval' : 'Rejection'} Result`,
    generatedAt: decided.decision.decidedAt,
    item: {
      id: decided.id,
      type: decided.type,
      title: decided.title,
      status: decided.status,
      decision: decided.decision,
    },
    safety: 'Local approval-state update only. No email, SMS, CRM, Stripe, Supabase, or production write occurred.',
  };
  writeThreadReport(`approval-queue-${decision}`, payload);
  return { status: 'pass', ...payload };
}

export function validateThreadPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be a JSON object.'] };
  }
  if (!supportedSchemaTypes.has(payload.schemaType)) errors.push(`Unsupported schemaType: ${payload.schemaType ?? 'missing'}`);
  if (!nonEmpty(payload.id)) errors.push('id is required.');
  if (!payload.sourceThread || !nonEmpty(payload.sourceThread.name) || !nonEmpty(payload.sourceThread.slug)) {
    errors.push('sourceThread.name and sourceThread.slug are required.');
  }
  if (payload.targetAgents !== undefined && (!Array.isArray(payload.targetAgents) || payload.targetAgents.length === 0)) {
    errors.push('targetAgents must be a non-empty array when present.');
  }
  if (!nonEmpty(payload.createdAt)) errors.push('createdAt is required.');
  if (!payload.safety || payload.safety.externalActions !== 'none' || payload.safety.productionWrites !== false || payload.safety.secretsIncluded !== false) {
    errors.push('safety must declare externalActions none, productionWrites false, and secretsIncluded false.');
  }

  if (payload.schemaType === 'thread_output' && (!nonEmpty(payload.title) || !nonEmpty(payload.summary))) {
    errors.push('thread_output requires title and summary.');
  }
  if (payload.schemaType === 'agent_handoff' && !nonEmpty(payload.handoffSummary)) errors.push('agent_handoff requires handoffSummary.');
  if (payload.schemaType === 'task_recommendation' && (!nonEmpty(payload.task) || !nonEmpty(payload.priority))) {
    errors.push('task_recommendation requires task and priority.');
  }
  if (payload.schemaType === 'sales_research_note' && (!nonEmpty(payload.prospect) || !nonEmpty(payload.summary))) {
    errors.push('sales_research_note requires prospect and summary.');
  }
  if (payload.schemaType === 'customer_research_note' && (!nonEmpty(payload.customerOrProspect) || !nonEmpty(payload.summary))) {
    errors.push('customer_research_note requires customerOrProspect and summary.');
  }
  if (payload.schemaType === 'executive_summary_item' && (!nonEmpty(payload.priority) || !nonEmpty(payload.summary) || !nonEmpty(payload.recommendedAction))) {
    errors.push('executive_summary_item requires priority, summary, and recommendedAction.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateScheduleDefinition(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['Schedule must be a JSON object.'] };
  if (payload.schemaType !== 'scheduled_thread_run') errors.push(`Unsupported schedule schemaType: ${payload.schemaType ?? 'missing'}`);
  if (!nonEmpty(payload.id)) errors.push('id is required.');
  if (!nonEmpty(payload.name)) errors.push('name is required.');
  if (!payload.sourceThread || !nonEmpty(payload.sourceThread.name) || !nonEmpty(payload.sourceThread.slug)) {
    errors.push('sourceThread.name and sourceThread.slug are required.');
  }
  if (!nonEmpty(payload.cadence)) errors.push('cadence is required.');
  if (!nonEmpty(payload.timezone)) errors.push('timezone is required.');
  if (!nonEmpty(payload.nextRunAt) || Number.isNaN(Date.parse(payload.nextRunAt))) errors.push('nextRunAt must be an ISO date.');
  if (!Array.isArray(payload.targetAgents) || payload.targetAgents.length === 0) errors.push('targetAgents must be a non-empty array.');
  if (payload.runMode !== 'manual') errors.push('runMode must be manual.');
  if (typeof payload.enabled !== 'boolean') errors.push('enabled must be boolean.');
  if (!payload.safety || payload.safety.externalActions !== 'none' || payload.safety.productionWrites !== false || payload.safety.secretsIncluded !== false) {
    errors.push('safety must declare externalActions none, productionWrites false, and secretsIncluded false.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateApprovalQueueItem(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['Approval queue item must be a JSON object.'] };
  if (payload.schemaType !== 'approval_queue_item') errors.push(`Unsupported approval schemaType: ${payload.schemaType ?? 'missing'}`);
  if (!nonEmpty(payload.id)) errors.push('id is required.');
  if (!supportedApprovalTypes.has(payload.type)) errors.push(`Unsupported approval type: ${payload.type ?? 'missing'}`);
  if (!nonEmpty(payload.title)) errors.push('title is required.');
  if (!nonEmpty(payload.requestingAgent)) errors.push('requestingAgent is required.');
  if (!nonEmpty(payload.requestedAt) || Number.isNaN(Date.parse(payload.requestedAt))) errors.push('requestedAt must be an ISO date.');
  if (!['pending', 'approved', 'rejected'].includes(payload.status)) errors.push('status must be pending, approved, or rejected.');
  if (!['low', 'medium', 'high'].includes(payload.risk)) errors.push('risk must be low, medium, or high.');
  if (!payload.safety || !['none', 'blocked_until_approved'].includes(payload.safety.externalActions) || payload.safety.productionWrites !== false || payload.safety.secretsIncluded !== false) {
    errors.push('safety must block external actions, production writes, and secrets.');
  }
  return { valid: errors.length === 0, errors };
}

function listPayloadFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(directory, file))
    .sort();
}

function getDueSchedules(now) {
  return listScheduleDefinitions().filter((item) => validateScheduleDefinition(item.parsed).valid && isScheduleDue(item.parsed, now));
}

function isScheduleDue(schedule, now) {
  return schedule.enabled === true && schedule.runMode === 'manual' && Date.parse(schedule.nextRunAt) <= now.getTime();
}

function writeScheduledRunOutboxItem(schedule, now) {
  const payload = {
    schemaType: 'thread_output',
    id: `scheduled-run:${schedule.sourceThread.slug}:${compactStamp(now.toISOString())}`,
    sourceThread: schedule.sourceThread,
    targetAgents: schedule.targetAgents,
    createdAt: now.toISOString(),
    title: `${schedule.name} Scheduled Local Run`,
    summary: `Manual due-run placeholder for ${schedule.name}. This creates a local outbox item only; no background job or external action ran.`,
    recommendations: [
      {
        priority: 'medium',
        detail: `Review ${schedule.name} output locally and create explicit approval queue items for any future external action.`,
      },
    ],
    schedule: {
      id: schedule.id,
      cadence: schedule.cadence,
      nextRunAt: schedule.nextRunAt,
      runMode: schedule.runMode,
    },
    safety: {
      externalActions: 'none',
      productionWrites: false,
      secretsIncluded: false,
    },
  };
  const fileName = `${compactStamp(now.toISOString())}-${schedule.sourceThread.slug}-scheduled-run.json`;
  const filePath = path.join(threadDirectories.outbox, fileName);
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return path.relative(repoRoot, filePath);
}

function summarizeApprovalQueueItems(items) {
  return items.reduce(
    (summary, item) => {
      if (item.status === 'pending') {
        summary.pending += 1;
        summary.pendingByType[item.type] = (summary.pendingByType[item.type] ?? 0) + 1;
      }
      if (item.status === 'approved') summary.approved += 1;
      if (item.status === 'rejected') summary.rejected += 1;
      return summary;
    },
    { pending: 0, pendingByType: {}, approved: 0, rejected: 0 },
  );
}

function readPayloadFile(filePath) {
  const fileName = path.basename(filePath);
  try {
    return { fileName, path: filePath, parsed: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { fileName, path: filePath, parsed: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function groupBySourceThread(items) {
  return items.reduce((result, item) => {
    const name = item.parsed.sourceThread.name;
    const existing = result[name] ?? { count: 0, sourceSlug: item.parsed.sourceThread.slug, items: [] };
    existing.count += 1;
    existing.items.push({
      id: item.parsed.id,
      title: item.parsed.title ?? item.parsed.task ?? item.parsed.summary,
      schemaType: item.parsed.schemaType,
      targetAgents: item.parsed.targetAgents ?? [],
      fileName: item.fileName,
    });
    result[name] = existing;
    return result;
  }, {});
}

function buildThreadSummary(items) {
  if (!items.length) return 'No valid pending thread outbox items.';
  return `${items.length} valid pending thread output(s) from ${Object.keys(groupBySourceThread(items)).length} named Codex agent source(s).`;
}

function toExecutiveReviewItem(payload, fileName) {
  return {
    id: `thread-review:${payload.id}`,
    source: payload.sourceThread.name,
    sourceSlug: payload.sourceThread.slug,
    fileName,
    priority: payload.priority ?? recommendationPriority(payload),
    summary: payload.summary ?? payload.handoffSummary ?? payload.task,
    recommendedAction: payload.recommendedAction ?? extractRecommendations(payload)[0]?.detail ?? 'Review locally in the Vyra Operator Dashboard.',
    targetAgents: payload.targetAgents ?? [],
    externalActions: 'none',
    productionWrites: false,
  };
}

function extractRecommendations(payload) {
  const candidates = payload.recommendations ?? payload.recommendedNextActions ?? [];
  return Array.isArray(candidates) ? candidates : [];
}

function recommendationPriority(payload) {
  const recommendations = extractRecommendations(payload);
  return recommendations.some((item) => item.priority === 'high') ? 'high' : recommendations.some((item) => item.priority === 'medium') ? 'medium' : 'low';
}

function writeThreadReport(slug, payload) {
  const directory = path.join(repoRoot, 'reports/agents/runtime');
  mkdirSync(directory, { recursive: true });
  const stamp = compactStamp(payload.generatedAt ?? new Date().toISOString());
  writeFileSync(path.join(directory, `${stamp}-${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(directory, `${stamp}-${slug}.md`), toMarkdown(payload));
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Thread Bridge Report'}`, '', `Generated: ${payload.generatedAt ?? new Date().toISOString()}`, ''];
  Object.entries(payload)
    .filter(([key]) => !['title', 'generatedAt'].includes(key))
    .forEach(([key, value]) => {
      lines.push(`## ${labelize(key)}`, '');
      if (Array.isArray(value)) {
        value.forEach((item) => lines.push(`- ${formatValue(item)}`));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([childKey, childValue]) => lines.push(`- ${labelize(childKey)}: ${formatValue(childValue)}`));
      } else {
        lines.push(String(value));
      }
      lines.push('');
    });
  return `${lines.join('\n').trim()}\n`;
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}
