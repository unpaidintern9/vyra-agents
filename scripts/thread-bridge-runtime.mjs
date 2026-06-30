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
};

const supportedSchemaTypes = new Set([
  'thread_output',
  'agent_handoff',
  'task_recommendation',
  'sales_research_note',
  'customer_research_note',
  'executive_summary_item',
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

export function buildThreadBridgeStatus() {
  const outbox = listOutboxItems();
  const inbox = listInboxItems();
  const archive = listArchiveItems();
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
    latestThread: latest?.parsed?.sourceThread?.name ?? 'none',
    latestItem: latest?.parsed?.title ?? latest?.fileName ?? 'none',
    safetyMode: index.safety?.mode ?? 'local/mock/read-only',
    blockedActions: index.safety?.blockedActions ?? blockedActions,
  };
}

export function validateThreadBridge() {
  ensureThreadBridgeDirectories();
  const outbox = listOutboxItems();
  const example = path.join(sharedRoot, 'examples/thread-output.example.json');
  const exampleValidation = existsSync(example) ? validateThreadPayload(readPayloadFile(example).parsed) : { valid: false, errors: ['missing example payload'] };
  const validations = outbox.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateThreadPayload(item.parsed),
  }));
  const status = validations.every((item) => item.valid) && exampleValidation.valid ? 'pass' : 'fail';
  return {
    status,
    pendingOutboxItems: outbox.length,
    exampleValidation,
    validations,
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

function listPayloadFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(directory, file))
    .sort();
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
