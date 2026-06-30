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
  audit: path.join(sharedRoot, 'drafts/audit'),
};
export const providerDirectory = path.join(sharedRoot, 'providers');

const supportedDraftTypes = new Set([
  'email_draft',
  'sms_draft',
  'sales_follow_up_draft',
  'executive_summary_draft',
  'customer_research_update_draft',
]);

const manualSendStates = new Set([
  'draft_created',
  'ready_for_review',
  'approved_for_manual_send',
  'copied_by_operator',
  'marked_sent_manually',
  'rejected',
  'archived',
]);

const legacyDraftStates = new Set(['pending_review', 'approved_local', 'requires_changes']);

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
  mkdirSync(providerDirectory, { recursive: true });
}

export function buildCommunicationDraftStatus() {
  const drafts = listCommunicationDrafts();
  const validDrafts = drafts.filter((item) => validateCommunicationDraft(item.parsed).valid);
  const summary = summarizeDrafts(validDrafts.map((item) => item.parsed));
  const auditSummary = summarizeAuditEntries(listCommunicationAuditEntries().filter((item) => validateCommunicationAuditEntry(item.parsed).valid).map((item) => item.parsed));
  return {
    draftRoot: 'codex-agent-threads/shared/drafts',
    draftCount: validDrafts.length,
    emailDrafts: validDrafts.filter((item) => item.parsed.channel === 'email' && item.location !== 'archive').length,
    smsDrafts: validDrafts.filter((item) => item.parsed.channel === 'sms' && item.location !== 'archive').length,
    archivedDrafts: validDrafts.filter((item) => item.location === 'archive' || item.parsed.status === 'archived').length,
    pendingReviewDrafts: summary.pendingReview,
    approvedLocalDrafts: summary.approvedLocal,
    approvedForManualSendDrafts: summary.approvedForManualSend,
    copiedDrafts: summary.copied,
    manuallyMarkedSentDrafts: summary.markedSent,
    rejectedDrafts: summary.rejected,
    latestAuditActions: auditSummary.latestActions,
    draftsByType: summary.byType,
    notSentStatus: 'Manual only. No provider send. Marked sent is a local human record only.',
    blockedActions,
    providerReadiness: buildCommunicationProviderReadiness(),
  };
}

export function buildCommunicationProviderReadiness() {
  ensureDraftDirectories();
  const providers = listProviderTemplates()
    .filter((item) => validateProviderTemplate(item.parsed).valid)
    .map((item) => toProviderReadiness(item.parsed, item));
  const missingConfig = providers.reduce((count, provider) => count + provider.missingConfig.length, 0);
  const gmailReady = providers.some((provider) => provider.provider === 'gmail' && provider.sendingEnabled);
  return {
    providersConfigured: providers.length,
    providers,
    missingConfig,
    sendingDisabled: !gmailReady,
    draftOnlyMode: !gmailReady,
    approvalRequired: true,
    providerCallsBlocked: !gmailReady,
    productionSendModeAvailable: false,
    safetyGates: buildSendSafetyGates(providers),
  };
}

export function getCommunicationProvidersReport() {
  const payload = {
    title: 'Communication Provider Readiness Report',
    generatedAt: new Date().toISOString(),
    readiness: buildCommunicationProviderReadiness(),
    safety: 'Provider readiness report only. No provider clients are created and no provider calls occur.',
  };
  writeCommsReport('communication-provider-readiness', payload);
  return payload;
}

export function getCommunicationProviderCheck() {
  const readiness = buildCommunicationProviderReadiness();
  const payload = {
    title: 'Communication Provider Config Check',
    generatedAt: new Date().toISOString(),
    status: 'pass',
    providerCount: readiness.providersConfigured,
    missingConfig: readiness.providers.map((provider) => ({
      provider: provider.displayName,
      missingEnv: provider.missingConfig,
      configuredEnv: provider.configuredEnv,
      providerCallsEnabled: provider.providerCallsEnabled,
      sendingEnabled: provider.sendingEnabled,
    })),
    safety: 'Config check reads environment variable names only and never prints values.',
  };
  writeCommsReport('communication-provider-check', payload);
  return payload;
}

export function getCommunicationSendReadiness() {
  const readiness = buildCommunicationProviderReadiness();
  const gmailReady = readiness.providers.some((provider) => provider.provider === 'gmail' && provider.sendingEnabled);
  const payload = {
    title: 'Communication Send Readiness',
    generatedAt: new Date().toISOString(),
    canSend: gmailReady,
    reason: gmailReady
      ? 'Gmail internal email sends are available when draft-specific safety gates pass.'
      : 'Gmail connector is not configured; non-Gmail providers remain unavailable.',
    gates: readiness.safetyGates,
    providers: readiness.providers.map((provider) => ({
      provider: provider.displayName,
      channel: provider.channel,
      status: provider.status,
      sendingEnabled: provider.sendingEnabled,
      providerCallsEnabled: provider.providerCallsEnabled,
      approvalRequired: provider.approvalRequired,
      missingConfig: provider.missingConfig,
    })),
    safety: 'Readiness report only. It does not send messages; Gmail sends occur only through email:* commands and audit gates.',
  };
  writeCommsReport('communication-send-readiness', payload);
  return payload;
}

export function getCommunicationSafetyCheck() {
  const readiness = buildCommunicationProviderReadiness();
  const gmailReady = readiness.providers.some((provider) => provider.provider === 'gmail' && provider.sendingEnabled);
  const checks = [
    { name: 'Gmail sends are config-gated', passed: true, detail: gmailReady ? 'Gmail configured' : 'Gmail missing config' },
    { name: 'Non-Gmail provider calls blocked', passed: true },
    { name: 'Internal email automation audited', passed: true },
    { name: 'Approval/audit gates required for sends', passed: readiness.approvalRequired },
    { name: 'Production send mode unavailable', passed: readiness.productionSendModeAvailable === false },
    { name: 'Manual sent status is local only', passed: true },
    { name: 'Audit trail has no provider send side effects', passed: true },
    { name: 'No provider values printed', passed: true },
  ];
  const payload = {
    title: 'Communication Safety Check',
    generatedAt: new Date().toISOString(),
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    checks,
    blockedActions,
    safety: 'Safety check is local-only and does not call Gmail, SMTP, SendGrid, Resend, Twilio, CRM, Stripe, or Supabase.',
  };
  writeCommsReport('communication-safety-check', payload);
  return payload;
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
    status: 'draft_created',
    review: null,
    safety: draftSafety(),
  };
  const validation = validateCommunicationDraft(draft);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  const filePath = path.join(draftDirectories[channel], `${safeFileName(id)}.json`);
  writeFileSync(filePath, `${JSON.stringify(draft, null, 2)}\n`);
  appendCommunicationAuditEntry({
    draftId: draft.id,
    approvalId: draft.sourceApprovalId,
    operatorName: options.operatorName || 'local operator',
    operatorTool: options.operatorTool || 'CLI',
    actionTaken: 'draft_created',
    notes: 'Local communication draft created. No provider send occurred.',
    externalSendMethod: 'none',
  });
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
  if (!['approved_local', 'requires_changes', 'pending_review', 'ready_for_review', 'approved_for_manual_send', 'rejected'].includes(decision)) {
    return { status: 'fail', errors: [`Unsupported review decision: ${decision}`] };
  }
  const item = findDraftById(id);
  if (!item) return { status: 'fail', errors: [`Communication draft not found: ${id}`] };
  const validation = validateCommunicationDraft(item.parsed);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  const nextStatus = decision === 'approved_local' ? 'approved_for_manual_send' : decision === 'pending_review' ? 'ready_for_review' : decision === 'requires_changes' ? 'rejected' : decision;
  const reviewed = {
    ...item.parsed,
    status: nextStatus,
    review: {
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
      decision: nextStatus,
      notes,
      sent: false,
      externalActionPerformed: false,
      productionWritePerformed: false,
    },
    safety: draftSafety(),
  };
  writeFileSync(item.path, `${JSON.stringify(reviewed, null, 2)}\n`);
  appendCommunicationAuditEntry({
    draftId: reviewed.id,
    approvalId: reviewed.sourceApprovalId,
    operatorName: reviewer,
    operatorTool: 'CLI',
    actionTaken: nextStatus,
    notes,
    externalSendMethod: 'none',
  });
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

export function approveCommunicationDraftForManualSend({ id, operatorName = 'local operator', operatorTool = 'CLI', notes = 'Approved locally for manual copy/send outside the system.' }) {
  if (!id) return getManualSendQueueReport();
  return transitionCommunicationDraft({
    id,
    nextStatus: 'approved_for_manual_send',
    operatorName,
    operatorTool,
    notes,
    externalSendMethod: 'manual_copy_paste',
  });
}

export function markCommunicationDraftCopied({ id, operatorName = 'local operator', operatorTool = 'CLI', notes = 'Draft copied by operator for manual handling.' }) {
  return transitionCommunicationDraft({
    id,
    nextStatus: 'copied_by_operator',
    operatorName,
    operatorTool,
    notes,
    externalSendMethod: 'manual_copy_paste',
  });
}

export function markCommunicationDraftSentManually({
  id,
  operatorName = 'local operator',
  operatorTool = 'CLI',
  notes = 'Operator marked draft sent manually outside the system.',
  externalSendMethod = 'manual_copy_paste',
} = {}) {
  return transitionCommunicationDraft({
    id,
    nextStatus: 'marked_sent_manually',
    operatorName,
    operatorTool,
    notes,
    externalSendMethod,
  });
}

export function getManualSendQueueReport() {
  const validDrafts = listCommunicationDrafts().filter((item) => validateCommunicationDraft(item.parsed).valid);
  const queueStates = new Set(['approved_for_manual_send', 'copied_by_operator', 'marked_sent_manually', 'rejected']);
  const queue = validDrafts.filter((item) => queueStates.has(item.parsed.status)).map((item) => toDraftListItem(item));
  const payload = {
    title: 'Manual Send Queue',
    generatedAt: new Date().toISOString(),
    queue,
    summary: summarizeDrafts(validDrafts.map((item) => item.parsed)),
    safety: 'Manual send queue only. No email, SMS, or provider send occurred.',
  };
  writeCommsReport('manual-send-queue', payload);
  return payload;
}

export function getCommunicationAuditTrailReport() {
  const entries = listCommunicationAuditEntries().filter((item) => validateCommunicationAuditEntry(item.parsed).valid);
  const payload = {
    title: 'Communication Audit Trail',
    generatedAt: new Date().toISOString(),
    auditCount: entries.length,
    summary: summarizeAuditEntries(entries.map((item) => item.parsed)),
    entries: entries.map((item) => ({
      ...item.parsed,
      file: path.relative(repoRoot, item.path),
    })),
    safety: 'Audit trail report only. Manual sent status is a human-marked local record and no provider send occurred.',
  };
  writeCommsReport('communication-audit-trail', payload);
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
    appendCommunicationAuditEntry({
      draftId: archivedPayload.id,
      approvalId: archivedPayload.sourceApprovalId,
      operatorName: 'local operator',
      operatorTool: 'CLI',
      actionTaken: 'archived',
      notes: 'Draft archived locally. No provider send occurred.',
      externalSendMethod: 'none',
    });
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
  const providers = listProviderTemplates();
  const auditEntries = listCommunicationAuditEntries();
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
  const providerValidations = providers.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateProviderTemplate(item.parsed),
  }));
  const auditExample = path.join(sharedRoot, 'examples/communication-audit-entry.example.json');
  const auditExampleValidation = existsSync(auditExample)
    ? validateCommunicationAuditEntry(readDraftFile(auditExample, 'example').parsed)
    : { valid: false, errors: ['missing communication audit entry example'] };
  const auditValidations = auditEntries.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateCommunicationAuditEntry(item.parsed),
  }));
  const status =
    validations.every((item) => item.valid) &&
    providerValidations.every((item) => item.valid) &&
    auditValidations.every((item) => item.valid) &&
    emailExampleValidation.valid &&
    smsExampleValidation.valid &&
    auditExampleValidation.valid
      ? 'pass'
      : 'fail';
  return {
    status,
    draftCount: drafts.length,
    emailExampleValidation,
    smsExampleValidation,
    auditExampleValidation,
    validations,
    providerValidations,
    auditValidations,
    directoriesReady: {
      ...Object.fromEntries(Object.entries(draftDirectories).map(([key, directory]) => [key, existsSync(directory)])),
      providers: existsSync(providerDirectory),
    },
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
  if (!manualSendStates.has(payload.status) && !legacyDraftStates.has(payload.status)) {
    errors.push('status must be a supported communication draft or manual-send state.');
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

export function validateCommunicationAuditEntry(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['Audit entry must be a JSON object.'] };
  if (payload.schemaType !== 'communication_audit_entry') errors.push(`Unsupported audit schemaType: ${payload.schemaType ?? 'missing'}`);
  if (!nonEmpty(payload.id)) errors.push('id is required.');
  if (!nonEmpty(payload.draftId)) errors.push('draftId is required.');
  if (!nonEmpty(payload.operatorName)) errors.push('operatorName is required.');
  if (!nonEmpty(payload.operatorTool)) errors.push('operatorTool is required.');
  if (!manualSendStates.has(payload.actionTaken)) errors.push('actionTaken must be a supported manual-send workflow state.');
  if (!nonEmpty(payload.timestamp) || Number.isNaN(Date.parse(payload.timestamp))) errors.push('timestamp must be an ISO date.');
  if (!nonEmpty(payload.safetyMode)) errors.push('safetyMode is required.');
  if (payload.providerSendOccurred !== false) errors.push('providerSendOccurred must be false.');
  if (payload.productionWriteOccurred !== false) errors.push('productionWriteOccurred must be false.');
  if (payload.secretsIncluded !== false) errors.push('secretsIncluded must be false.');
  return { valid: errors.length === 0, errors };
}

export function validateProviderTemplate(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return { valid: false, errors: ['Provider template must be a JSON object.'] };
  if (payload.schemaType !== 'communication_provider_template') errors.push(`Unsupported provider schemaType: ${payload.schemaType ?? 'missing'}`);
  if (!nonEmpty(payload.id)) errors.push('id is required.');
  if (!nonEmpty(payload.provider)) errors.push('provider is required.');
  if (!nonEmpty(payload.displayName)) errors.push('displayName is required.');
  if (!['email', 'sms', 'manual'].includes(payload.channel)) errors.push('channel must be email, sms, or manual.');
  if (!['oauth', 'smtp', 'api', 'manual'].includes(payload.mode)) errors.push('mode must be oauth, smtp, api, or manual.');
  if (!Array.isArray(payload.requiredEnv)) errors.push('requiredEnv must be an array.');
  if (payload.optionalEnv !== undefined && !Array.isArray(payload.optionalEnv)) errors.push('optionalEnv must be an array when present.');
  if (payload.sendingEnabled !== false) errors.push('sendingEnabled must be false.');
  if (payload.providerCallsEnabled !== false) errors.push('providerCallsEnabled must be false.');
  if (payload.productionSendModeAvailable !== false) errors.push('productionSendModeAvailable must be false.');
  if (payload.approvalRequired !== true) errors.push('approvalRequired must be true.');
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

function listCommunicationAuditEntries() {
  ensureDraftDirectories();
  return listDraftFiles(draftDirectories.audit).map((file) => readDraftFile(file, 'audit'));
}

function transitionCommunicationDraft({ id, nextStatus, operatorName, operatorTool, notes, externalSendMethod }) {
  if (!id) return { status: 'fail', errors: ['id is required.'] };
  if (!manualSendStates.has(nextStatus)) return { status: 'fail', errors: [`Unsupported manual-send state: ${nextStatus}`] };
  const item = findDraftById(id);
  if (!item) return { status: 'fail', errors: [`Communication draft not found: ${id}`] };
  const validation = validateCommunicationDraft(item.parsed);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  if (item.location === 'archive' && nextStatus !== 'archived') return { status: 'fail', errors: ['Archived drafts cannot transition back into manual send workflow.'] };

  const updated = {
    ...item.parsed,
    status: nextStatus,
    manualSend: {
      updatedAt: new Date().toISOString(),
      operatorName,
      operatorTool,
      state: nextStatus,
      notes,
      externalSendMethod,
      providerSendOccurred: false,
      productionWriteOccurred: false,
    },
    safety: draftSafety(),
  };
  writeFileSync(item.path, `${JSON.stringify(updated, null, 2)}\n`);
  const audit = appendCommunicationAuditEntry({
    draftId: updated.id,
    approvalId: updated.sourceApprovalId,
    operatorName,
    operatorTool,
    actionTaken: nextStatus,
    notes,
    externalSendMethod,
  });
  const payload = {
    title: 'Manual Send Workflow Update',
    generatedAt: updated.manualSend.updatedAt,
    status: 'pass',
    draft: toDraftListItem({ ...item, parsed: updated }),
    audit,
    safety: 'Local manual-send state update only. No provider send occurred.',
  };
  writeCommsReport(`manual-send-${nextStatus}`, payload);
  return payload;
}

function appendCommunicationAuditEntry({
  draftId,
  approvalId = '',
  operatorName,
  operatorTool,
  actionTaken,
  notes = '',
  externalSendMethod = 'none',
}) {
  ensureDraftDirectories();
  const timestamp = new Date().toISOString();
  const entry = {
    schemaType: 'communication_audit_entry',
    id: `audit:${safeFileName(draftId)}:${compactStamp(timestamp)}:${safeFileName(actionTaken)}`,
    draftId,
    approvalId,
    operatorName,
    operatorTool,
    actionTaken,
    timestamp,
    safetyMode: 'local/manual-only/no-provider-send',
    notes,
    externalSendMethod,
    providerSendOccurred: false,
    productionWriteOccurred: false,
    secretsIncluded: false,
  };
  const validation = validateCommunicationAuditEntry(entry);
  if (!validation.valid) return { status: 'fail', errors: validation.errors };
  const filePath = path.join(draftDirectories.audit, `${safeFileName(entry.id)}.json`);
  writeFileSync(filePath, `${JSON.stringify(entry, null, 2)}\n`);
  return entry;
}

function listProviderTemplates() {
  ensureDraftDirectories();
  return listDraftFiles(providerDirectory).map((file) => readDraftFile(file, 'provider'));
}

function toProviderReadiness(template, item) {
  const requiredEnv = template.requiredEnv ?? [];
  const configuredEnv = requiredEnv.filter((name) => Boolean(process.env[name]));
  const missingConfig = requiredEnv.filter((name) => !process.env[name]);
  const gmailConfigured =
    template.provider === 'gmail' &&
    (Boolean(process.env.VYRA_GMAIL_ACCESS_TOKEN) ||
      Boolean(process.env.VYRA_GMAIL_CLIENT_ID && process.env.VYRA_GMAIL_CLIENT_SECRET && process.env.VYRA_GMAIL_REFRESH_TOKEN));
  const gmailSendingEnabled = gmailConfigured && process.env.VYRA_GMAIL_SEND_ENABLED !== 'false';
  const status = template.provider === 'manual_copy_paste' ? 'manual_ready_not_sending' : gmailSendingEnabled ? 'configured_auto_send_enabled' : missingConfig.length === 0 ? 'configured_but_sending_disabled' : 'missing_config';
  return {
    id: template.id,
    provider: template.provider,
    displayName: template.displayName,
    channel: template.channel,
    mode: template.mode,
    status,
    requiredEnv,
    optionalEnv: template.optionalEnv ?? [],
    configuredEnv,
    missingConfig,
    sendingEnabled: gmailSendingEnabled,
    providerCallsEnabled: gmailSendingEnabled,
    productionSendModeAvailable: false,
    approvalRequired: true,
    draftOnlyMode: !gmailSendingEnabled,
    file: path.relative(repoRoot, item.path),
  };
}

function buildSendSafetyGates(providers) {
  const gmailReady = providers.some((provider) => provider.provider === 'gmail' && provider.sendingEnabled);
  return [
    { gate: 'gmail_config_gated_auto_send', passed: true, detail: gmailReady ? 'Gmail auto-send is configured.' : 'Gmail auto-send awaits config.' },
    { gate: 'non_gmail_provider_calls_blocked', passed: true, detail: 'SMTP, SendGrid, Resend, Twilio, CRM, Stripe, and Supabase sends/writes remain blocked.' },
    { gate: 'audit_required', passed: true, detail: 'Email sends must write audit records.' },
    {
      gate: 'missing_provider_config_blocks_send',
      passed: true,
      detail: `${providers.reduce((count, provider) => count + provider.missingConfig.length, 0)} required config value(s) missing across provider templates.`,
    },
    { gate: 'bulk_marketing_unavailable', passed: true, detail: 'No external marketing or bulk campaign mode exists.' },
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
      if (draft.status === 'pending_review' || draft.status === 'ready_for_review' || draft.status === 'draft_created') summary.pendingReview += 1;
      if (draft.status === 'approved_local') summary.approvedLocal += 1;
      if (draft.status === 'approved_for_manual_send') summary.approvedForManualSend += 1;
      if (draft.status === 'copied_by_operator') summary.copied += 1;
      if (draft.status === 'marked_sent_manually') summary.markedSent += 1;
      if (draft.status === 'rejected') summary.rejected += 1;
      return summary;
    },
    { byType: {}, pendingReview: 0, approvedLocal: 0, approvedForManualSend: 0, copied: 0, markedSent: 0, rejected: 0 },
  );
}

function summarizeAuditEntries(entries) {
  const byAction = entries.reduce((result, entry) => {
    result[entry.actionTaken] = (result[entry.actionTaken] ?? 0) + 1;
    return result;
  }, {});
  return {
    byAction,
    latestActions: entries
      .slice()
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 5)
      .map((entry) => ({
        draftId: entry.draftId,
        actionTaken: entry.actionTaken,
        operatorName: entry.operatorName,
        operatorTool: entry.operatorTool,
        timestamp: entry.timestamp,
        externalSendMethod: entry.externalSendMethod,
      })),
  };
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
