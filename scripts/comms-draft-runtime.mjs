import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const sharedRoot = path.join(repoRoot, 'codex-agent-threads/shared');
export const draftDirectories = {
  email: path.join(sharedRoot, 'drafts/email'),
  sms: path.join(sharedRoot, 'drafts/sms'),
  archive: path.join(sharedRoot, 'drafts/archive'),
};

const supportedDraftTypes = new Set([
  'email_draft',
  'sms_draft',
  'sales_follow_up_draft',
  'executive_summary_draft',
  'customer_research_update_draft',
]);

const blockedActions = [
  'email sends',
  'SMS sends',
  'Gmail connections',
  'Twilio connections',
  'SendGrid connections',
  'Resend connections',
  'CRM writes',
  'Stripe writes',
  'Supabase production writes',
  'production business writes',
  'secret output',
];

export function ensureDraftDirectories() {
  Object.values(draftDirectories).forEach((directory) => mkdirSync(directory, { recursive: true }));
}

export function buildCommunicationDraftStatus() {
  const drafts = listCommunicationDrafts();
  const validDrafts = drafts.filter((item) => validateCommunicationDraft(item.parsed).valid);
  const summary = summarizeDrafts(validDrafts.map((item) => item.parsed));
  return {
    draftRoot: 'codex-agent-threads/shared/drafts',
    draftCount: validDrafts.length,
    emailDrafts: validDrafts.filter((item) => item.parsed.channel === 'email' && item.location !== 'archive').length,
    smsDrafts: validDrafts.filter((item) => item.parsed.channel === 'sms' && item.location !== 'archive').length,
    archivedDrafts: validDrafts.filter((item) => item.location === 'archive' || item.parsed.status === 'archived').length,
    pendingReviewDrafts: summary.pendingReview,
    approvedLocalDrafts: summary.approvedLocal,
    draftsByType: summary.byType,
    notSentStatus: 'All drafts are Draft only, Not sent, Local only, Requires human review, External sending disabled.',
    blockedActions,
  };
}

export function getCommunicationDraftReport() {
  const drafts = listCommunicationDrafts();
  const validDrafts = drafts.filter((item) => validateCommunicationDraft(item.parsed).valid);
  const payload = {
    title: 'Communication Draft Report',
    generatedAt: new Date().toISOString(),
    status: buildCommunicationDraftStatus(),
    drafts: validDrafts.map((item) => toDraftListItem(item)),
    safety: 'Draft report only. No email, SMS, provider connection, CRM write, Stripe write, Supabase write, or production business write occurred.',
  };
  writeCommsReport('communication-draft-report', payload);
  return payload;
}

export function createCommunicationDraft(options = {}) {
  ensureDraftDirectories();
  const now = new Date().toISOString();
  const type = normalizeDraftType(options.type);
  const channel = normalizeChannel(options.channel, type);
  const id = options.id || `draft:${type}:${compactStamp(now)}`;
  const draft = {
    schemaType: 'communication_draft',
    id,
    type,
    channel,
    title: options.title || defaultTitle(type),
    recipient: {
      name: options.recipientName || 'Local review recipient',
      contact: options.recipientContact || 'not-sent',
    },
    ...(channel === 'email' ? { subject: options.subject || defaultSubject(type) } : {}),
    body: options.body || defaultBody(type),
    sourceApprovalId: options.sourceApprovalId || 'local-draft-request',
    createdAt: now,
    createdBy: options.createdBy || 'Vyra Agent',
    status: 'pending_review',
    review: null,
    safety: draftSafety(),
  };
  const validation = validateCommunicationDraft(draft);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  const filePath = path.join(draftDirectories[channel], `${safeFileName(id)}.json`);
  writeFileSync(filePath, `${JSON.stringify(draft, null, 2)}\n`);
  const payload = {
    title: 'Communication Draft Created',
    generatedAt: now,
    status: 'pass',
    draft: toDraftListItem({ parsed: draft, path: filePath, fileName: path.basename(filePath), location: channel }),
    safety: 'Local draft creation only. External sending remains disabled.',
  };
  writeCommsReport('communication-draft-created', payload);
  return payload;
}

export function reviewCommunicationDraft({ id, decision = 'approved_local', reviewer = 'local operator', notes = 'Reviewed locally.' }) {
  if (!['approved_local', 'requires_changes', 'pending_review'].includes(decision)) {
    return { status: 'fail', errors: [`Unsupported review decision: ${decision}`] };
  }
  const item = findDraftById(id);
  if (!item) return { status: 'fail', errors: [`Communication draft not found: ${id}`] };
  const validation = validateCommunicationDraft(item.parsed);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  const reviewed = {
    ...item.parsed,
    status: decision,
    review: {
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
      decision,
      notes,
      sent: false,
      externalActionPerformed: false,
      productionWritePerformed: false,
    },
    safety: draftSafety(),
  };
  writeFileSync(item.path, `${JSON.stringify(reviewed, null, 2)}\n`);
  const payload = {
    title: 'Communication Draft Review Result',
    generatedAt: reviewed.review.reviewedAt,
    status: 'pass',
    draft: toDraftListItem({ ...item, parsed: reviewed }),
    safety: 'Local review only. The draft was not sent.',
  };
  writeCommsReport('communication-draft-review', payload);
  return payload;
}

export function archiveCommunicationDraft(id) {
  ensureDraftDirectories();
  const allActive = listCommunicationDrafts().filter((item) => item.location !== 'archive');
  const items = id ? allActive.filter((item) => item.parsed?.id === id || item.fileName === id) : allActive;
  const stamp = compactStamp(new Date().toISOString());
  const archived = [];
  items.forEach((item) => {
    const archivedPayload = {
      ...item.parsed,
      status: 'archived',
      archivedAt: new Date().toISOString(),
      safety: draftSafety(),
    };
    writeFileSync(item.path, `${JSON.stringify(archivedPayload, null, 2)}\n`);
    const destination = path.join(draftDirectories.archive, `${stamp}-${item.fileName}`);
    renameSync(item.path, destination);
    archived.push(path.relative(repoRoot, destination));
  });
  const payload = {
    title: 'Communication Draft Archive Result',
    generatedAt: new Date().toISOString(),
    archivedCount: archived.length,
    archived,
    safety: 'Local file move only. No communication was sent.',
  };
  writeCommsReport('communication-draft-archive', payload);
  return payload;
}

export function validateCommunicationDraftLayer() {
  ensureDraftDirectories();
  const drafts = listCommunicationDrafts();
  const emailExample = path.join(sharedRoot, 'examples/email-draft.example.json');
  const smsExample = path.join(sharedRoot, 'examples/sms-draft.example.json');
  const emailExampleValidation = existsSync(emailExample)
    ? validateCommunicationDraft(readDraftFile(emailExample, 'example').parsed)
    : { valid: false, errors: ['missing email draft example'] };
  const smsExampleValidation = existsSync(smsExample)
    ? validateCommunicationDraft(readDraftFile(smsExample, 'example').parsed)
    : { valid: false, errors: ['missing SMS draft example'] };
  const validations = drafts.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateCommunicationDraft(item.parsed),
  }));
  const status = validations.every((item) => item.valid) && emailExampleValidation.valid && smsExampleValidation.valid ? 'pass' : 'fail';
  return {
    status,
    draftCount: drafts.length,
    emailExampleValidation,
    smsExampleValidation,
    validations,
    directoriesReady: Object.fromEntries(Object.entries(draftDirectories).map(([key, directory]) => [key, existsSync(directory)])),
    safety: 'Validation reads local draft files only. No provider connections or sends occur.',
  };
}

export function validateCommunicationDraft(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['Draft must be a JSON object.'] };
  if (payload.schemaType !== 'communication_draft') errors.push(`Unsupported draft schemaType: ${payload.schemaType ?? 'missing'}`);
  if (!nonEmpty(payload.id)) errors.push('id is required.');
  if (!supportedDraftTypes.has(payload.type)) errors.push(`Unsupported draft type: ${payload.type ?? 'missing'}`);
  if (!['email', 'sms'].includes(payload.channel)) errors.push('channel must be email or sms.');
  if (!nonEmpty(payload.title)) errors.push('title is required.');
  if (!nonEmpty(payload.body)) errors.push('body is required.');
  if (!nonEmpty(payload.createdAt) || Number.isNaN(Date.parse(payload.createdAt))) errors.push('createdAt must be an ISO date.');
  if (!nonEmpty(payload.createdBy)) errors.push('createdBy is required.');
  if (!['pending_review', 'approved_local', 'requires_changes', 'archived'].includes(payload.status)) {
    errors.push('status must be pending_review, approved_local, requires_changes, or archived.');
  }
  if (payload.channel === 'email' && !nonEmpty(payload.subject)) errors.push('email drafts require subject.');
  if (!payload.safety || payload.safety.draftOnly !== true || payload.safety.notSent !== true || payload.safety.localOnly !== true) {
    errors.push('safety must mark draftOnly, notSent, and localOnly true.');
  }
  if (
    !payload.safety ||
    payload.safety.humanReviewRequired !== true ||
    payload.safety.externalSending !== 'disabled' ||
    payload.safety.providerConnected !== false ||
    payload.safety.productionWrites !== false ||
    payload.safety.secretsIncluded !== false
  ) {
    errors.push('safety must require human review, disable sending/providers, block production writes, and exclude secrets.');
  }
  return { valid: errors.length === 0, errors };
}

function listCommunicationDrafts() {
  ensureDraftDirectories();
  return [
    ...listDraftFiles(draftDirectories.email).map((file) => readDraftFile(file, 'email')),
    ...listDraftFiles(draftDirectories.sms).map((file) => readDraftFile(file, 'sms')),
    ...listDraftFiles(draftDirectories.archive).map((file) => readDraftFile(file, 'archive')),
  ];
}

function listDraftFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(directory, file))
    .sort();
}

function readDraftFile(filePath, location) {
  const fileName = path.basename(filePath);
  try {
    return { fileName, location, path: filePath, parsed: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { fileName, location, path: filePath, parsed: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function findDraftById(id) {
  return listCommunicationDrafts().find((item) => item.parsed?.id === id || item.fileName === id);
}

function summarizeDrafts(drafts) {
  return drafts.reduce(
    (summary, draft) => {
      summary.byType[draft.type] = (summary.byType[draft.type] ?? 0) + 1;
      if (draft.status === 'pending_review') summary.pendingReview += 1;
      if (draft.status === 'approved_local') summary.approvedLocal += 1;
      return summary;
    },
    { byType: {}, pendingReview: 0, approvedLocal: 0 },
  );
}

function toDraftListItem(item) {
  return {
    id: item.parsed.id,
    type: item.parsed.type,
    channel: item.parsed.channel,
    title: item.parsed.title,
    recipient: item.parsed.recipient?.name ?? 'Local review recipient',
    status: item.parsed.status,
    location: item.location,
    notSent: item.parsed.safety?.notSent === true,
    localOnly: item.parsed.safety?.localOnly === true,
    file: path.relative(repoRoot, item.path),
  };
}

function normalizeDraftType(type = 'email_draft') {
  return supportedDraftTypes.has(type) ? type : 'email_draft';
}

function normalizeChannel(channel, type) {
  if (channel === 'email' || channel === 'sms') return channel;
  return type === 'sms_draft' ? 'sms' : 'email';
}

function defaultTitle(type) {
  return type.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function defaultSubject(type) {
  return `Vyra ${type.replace(/_/g, ' ')} draft`;
}

function defaultBody(type) {
  return `Draft only. This ${type.replace(/_/g, ' ')} is local-only, not sent, and requires human review before any external action.`;
}

function draftSafety() {
  return {
    draftOnly: true,
    notSent: true,
    localOnly: true,
    humanReviewRequired: true,
    externalSending: 'disabled',
    providerConnected: false,
    productionWrites: false,
    secretsIncluded: false,
  };
}

function writeCommsReport(slug, payload) {
  const directory = path.join(repoRoot, 'reports/agents/runtime');
  mkdirSync(directory, { recursive: true });
  const stamp = compactStamp(payload.generatedAt ?? new Date().toISOString());
  writeFileSync(path.join(directory, `${stamp}-${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(directory, `${stamp}-${slug}.md`), toMarkdown(payload));
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Communication Draft Report'}`, '', `Generated: ${payload.generatedAt ?? new Date().toISOString()}`, ''];
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

function safeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
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
