import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const memoryRoot = path.join(repoRoot, 'codex-agent-threads/shared/agent-memory');
export const memoryPath = path.join(memoryRoot, 'shared-memory.json');
export const memoryReportRoot = path.join(repoRoot, 'reports/agents/memory');
const salesRoot = path.join(repoRoot, 'codex-agent-threads/shared/sales-opportunities');
const tasksRoot = path.join(repoRoot, 'codex-agent-threads/shared/tasks');
const salesReportRoot = path.join(repoRoot, 'reports/agents/sales');

const entityTypes = new Set(['organization', 'contact', 'opportunity', 'workflow', 'proposal', 'research source', 'research intake', 'report', 'task', 'approval', 'contract', 'market segment', 'brand asset', 'note', 'artifact']);
const blockedActions = ['external sync', 'autonomous browsing', 'autonomous emailing', 'external CRM sync', 'proposal submission', 'automatic approvals', 'automatic source approval', 'automatic merge', 'hidden fact overwrite'];

export function ensureMemoryDirectories() {
  mkdirSync(memoryRoot, { recursive: true });
  mkdirSync(memoryReportRoot, { recursive: true });
}

export function readSharedMemoryStore() {
  ensureMemoryDirectories();
  if (existsSync(memoryPath)) {
    const parsed = readJson(memoryPath, null);
    if (parsed?.entities && parsed?.facts && parsed?.relationships) return rebuildSharedMemoryStore(parsed);
  }
  const seeded = buildSharedMemoryStore();
  writeSharedMemoryStore(seeded);
  return seeded;
}

export function writeSharedMemoryStore(store) {
  ensureMemoryDirectories();
  writeFileSync(memoryPath, `${JSON.stringify(store, null, 2)}\n`);
}

export function listMemoryEntities() {
  const store = readSharedMemoryStore();
  return { title: 'Shared Memory Entities', generatedAt: timestamp(), entities: store.entities, summary: store.summary, safety: safetySummary() };
}

export function getMemoryEntity(options = {}) {
  const store = readSharedMemoryStore();
  const id = options.id ?? process.env.MEMORY_ENTITY_ID ?? store.entities[0]?.entityId;
  const entity = store.entities.find((item) => item.entityId === id || item.displayName === id);
  return {
    title: 'Shared Memory Entity',
    generatedAt: timestamp(),
    entity,
    facts: store.facts.filter((fact) => fact.entityId === entity?.entityId),
    relationships: store.relationships.filter((rel) => rel.fromEntity === entity?.entityId || rel.toEntity === entity?.entityId),
    auditHistory: store.auditHistory.filter((audit) => audit.affectedEntities.includes(entity?.entityId)),
    safety: safetySummary(),
  };
}

export function listMemoryFacts() {
  const store = readSharedMemoryStore();
  return { title: 'Shared Memory Facts', generatedAt: timestamp(), facts: store.facts, summary: summarizeFacts(store.facts), safety: safetySummary() };
}

export function addMemoryFact(options = {}) {
  const store = readSharedMemoryStore();
  const entityId = options.entityId ?? process.env.MEMORY_ENTITY_ID ?? store.entities[0]?.entityId;
  const factType = options.factType ?? process.env.MEMORY_FACT_TYPE ?? 'note';
  const value = options.value ?? process.env.MEMORY_FACT_VALUE ?? 'Local shared memory fact added by operator.';
  const now = timestamp();
  const fact = normalizeFact({
    factId: `fact:${slugify(entityId)}:${slugify(factType)}:${compactStamp(now)}`,
    entityId,
    factType,
    value,
    source: options.source ?? process.env.MEMORY_FACT_SOURCE ?? 'local operator input',
    confidence: Number(options.confidence ?? process.env.MEMORY_FACT_CONFIDENCE ?? 60),
    evidenceLevel: options.evidenceLevel ?? process.env.MEMORY_FACT_EVIDENCE ?? 'operator supplied',
    createdBy: options.operator ?? process.env.MEMORY_OPERATOR ?? 'local operator',
    verifiedBy: null,
    verificationStatus: 'pending_review',
    createdDate: now,
    updatedDate: now,
    supersededBy: null,
    auditTrail: [audit('fact_added', options.operator, null, value, options.source ?? 'local operator input', [entityId], [])],
  });
  const next = rebuildSharedMemoryStore({ ...store, facts: [fact, ...store.facts], auditHistory: [fact.auditTrail[0], ...store.auditHistory] });
  writeSharedMemoryStore(next);
  return { title: 'Shared Memory Fact Added', generatedAt: now, fact, summary: next.summary, safety: safetySummary() };
}

export function updateMemoryFact(options = {}) {
  const store = readSharedMemoryStore();
  const factId = options.factId ?? process.env.MEMORY_FACT_ID ?? store.facts[0]?.factId;
  const existing = store.facts.find((fact) => fact.factId === factId);
  if (!existing) return { title: 'Shared Memory Fact Update', status: 'not_found', factId, safety: safetySummary() };
  return supersedeMemoryFact({
    factId,
    value: options.value ?? process.env.MEMORY_FACT_VALUE ?? existing.value,
    reason: options.reason ?? process.env.MEMORY_REASON ?? 'Local fact update preserved previous fact as superseded.',
    operator: options.operator ?? process.env.MEMORY_OPERATOR ?? 'local operator',
  });
}

export function supersedeMemoryFact(options = {}) {
  const store = readSharedMemoryStore();
  const factId = options.factId ?? process.env.MEMORY_FACT_ID ?? store.facts[0]?.factId;
  const existing = store.facts.find((fact) => fact.factId === factId);
  if (!existing) return { title: 'Shared Memory Fact Supersede', status: 'not_found', factId, safety: safetySummary() };
  const now = timestamp();
  const replacementId = `fact:${slugify(existing.entityId)}:${slugify(existing.factType)}:${compactStamp(now)}`;
  const changeAudit = audit('fact_superseded', options.operator, existing.value, options.value, options.reason ?? 'Fact changed locally.', [existing.entityId], []);
  const replacement = normalizeFact({
    ...existing,
    factId: replacementId,
    value: options.value,
    confidence: Number(options.confidence ?? existing.confidence),
    evidenceLevel: options.evidenceLevel ?? existing.evidenceLevel,
    createdBy: options.operator ?? existing.createdBy,
    verifiedBy: null,
    verificationStatus: 'pending_review',
    createdDate: now,
    updatedDate: now,
    supersededBy: null,
    auditTrail: [changeAudit],
  });
  const facts = store.facts.map((fact) => (fact.factId === existing.factId ? { ...fact, supersededBy: replacementId, updatedDate: now, auditTrail: [changeAudit, ...fact.auditTrail] } : fact));
  const next = rebuildSharedMemoryStore({ ...store, facts: [replacement, ...facts], auditHistory: [changeAudit, ...store.auditHistory] });
  writeSharedMemoryStore(next);
  return { title: 'Shared Memory Fact Superseded', generatedAt: now, previousFactId: existing.factId, replacementFact: replacement, safety: safetySummary() };
}

export function listMemoryRelationships() {
  const store = readSharedMemoryStore();
  return { title: 'Shared Memory Relationships', generatedAt: timestamp(), relationships: store.relationships, summary: summarizeRelationships(store.relationships), safety: safetySummary() };
}

export function addMemoryRelationship(options = {}) {
  const store = readSharedMemoryStore();
  const fromEntity = options.fromEntity ?? process.env.MEMORY_FROM_ENTITY ?? store.entities[0]?.entityId;
  const toEntity = options.toEntity ?? process.env.MEMORY_TO_ENTITY ?? store.entities[1]?.entityId;
  const type = options.relationshipType ?? process.env.MEMORY_RELATIONSHIP_TYPE ?? 'related_to';
  const now = timestamp();
  const relationship = normalizeRelationship({
    relationshipId: `rel:${slugify(fromEntity)}:${slugify(type)}:${slugify(toEntity)}`,
    fromEntity,
    toEntity,
    relationshipType: type,
    source: options.source ?? 'local operator input',
    confidence: Number(options.confidence ?? 60),
    direction: options.direction ?? 'directed',
    createdBy: options.operator ?? 'local operator',
    createdDate: now,
    updatedDate: now,
    auditTrail: [audit('relationship_added', options.operator, null, type, options.source ?? 'local operator input', [fromEntity, toEntity], [`${fromEntity}->${toEntity}`])],
  });
  const next = rebuildSharedMemoryStore({ ...store, relationships: upsertById(store.relationships, relationship, 'relationshipId'), auditHistory: [relationship.auditTrail[0], ...store.auditHistory] });
  writeSharedMemoryStore(next);
  return { title: 'Shared Memory Relationship Added', generatedAt: now, relationship, summary: next.summary, safety: safetySummary() };
}

export function listMemoryConflicts() {
  const store = readSharedMemoryStore();
  return { title: 'Shared Memory Conflict Queue', generatedAt: timestamp(), conflicts: store.conflicts, summary: summarizeConflicts(store.conflicts), safety: safetySummary() };
}

export function reviewMemoryConflict(options = {}) {
  const store = readSharedMemoryStore();
  const conflictId = options.conflictId ?? process.env.MEMORY_CONFLICT_ID ?? store.conflicts[0]?.conflictId;
  const now = timestamp();
  const nextConflicts = store.conflicts.map((conflict) =>
    conflict.conflictId === conflictId
      ? { ...conflict, status: 'reviewed', reviewAction: options.action ?? process.env.MEMORY_REVIEW_ACTION ?? 'manual review noted', reviewedAt: now, reviewedBy: options.operator ?? 'local operator' }
      : conflict,
  );
  const reviewAudit = audit('conflict_reviewed', options.operator, 'open', 'reviewed', options.action ?? 'Manual review noted.', [], []);
  const next = rebuildSharedMemoryStore({ ...store, conflicts: nextConflicts, auditHistory: [reviewAudit, ...store.auditHistory] });
  writeSharedMemoryStore(next);
  return { title: 'Shared Memory Conflict Reviewed', generatedAt: now, conflict: next.conflicts.find((item) => item.conflictId === conflictId), safety: safetySummary() };
}

export function getMemoryAgentView(options = {}) {
  const store = readSharedMemoryStore();
  const agent = options.agent ?? process.env.MEMORY_AGENT ?? 'Sales';
  return { title: `${agent} Shared Memory View`, generatedAt: timestamp(), agent, view: store.agentViews[agent] ?? buildAgentView(store, agent), safety: safetySummary() };
}

export function getMemoryGraph() {
  const store = readSharedMemoryStore();
  return { title: 'Shared Knowledge Graph', generatedAt: timestamp(), entities: store.entities, relationships: store.relationships, conflicts: store.conflicts, summary: store.summary, safety: safetySummary() };
}

export function getMemoryAudit() {
  const store = readSharedMemoryStore();
  return { title: 'Shared Memory Audit History', generatedAt: timestamp(), auditHistory: store.auditHistory, safety: safetySummary() };
}

export function buildMemoryReports() {
  const store = readSharedMemoryStore();
  const reports = {
    'shared-memory-inventory': { title: 'Shared Memory Inventory', generatedAt: timestamp(), summary: store.summary, entities: store.entities },
    'entity-confidence-report': { title: 'Entity Confidence Report', generatedAt: timestamp(), entities: store.entities.map(({ entityId, entityType, displayName, confidence, riskRating, status }) => ({ entityId, entityType, displayName, confidence, riskRating, status })) },
    'fact-verification-report': { title: 'Fact Verification Report', generatedAt: timestamp(), summary: summarizeFacts(store.facts), facts: store.facts },
    'relationship-graph-report': { title: 'Relationship Graph Report', generatedAt: timestamp(), summary: summarizeRelationships(store.relationships), relationships: store.relationships },
    'conflict-queue-report': { title: 'Conflict Queue Report', generatedAt: timestamp(), summary: summarizeConflicts(store.conflicts), conflicts: store.conflicts },
    'cross-agent-activity-report': { title: 'Cross-Agent Activity Report', generatedAt: timestamp(), auditHistory: store.auditHistory.slice(0, 80) },
    'executive-knowledge-summary': { title: 'Executive Knowledge Summary', generatedAt: timestamp(), view: store.agentViews.Executive, riskyFacts: store.facts.filter((fact) => fact.confidence < 55 || fact.verificationStatus !== 'verified').slice(0, 20) },
    'operator-memory-maintenance-report': { title: 'Operator Memory Maintenance Report', generatedAt: timestamp(), view: store.agentViews.Operator, conflicts: store.conflicts, staleFacts: staleFacts(store.facts) },
  };
  Object.entries(reports).forEach(([slug, payload]) => writeMemoryReport(slug, payload));
  return { title: 'Shared Memory Reports', generatedAt: timestamp(), reports: Object.keys(reports), summary: store.summary, safety: safetySummary() };
}

export function validateSharedMemory() {
  const store = readSharedMemoryStore();
  const reports = buildMemoryReports();
  const checks = [
    check('Shared memory entities available', store.entities.length > 0),
    check('Shared memory facts available', store.facts.length > 0),
    check('Cross-agent relationships available', store.relationships.length > 0),
    check('Agent memory views available', ['Sales', 'Executive', 'Operator', 'Proposal Prep', 'Contract Intelligence', 'Marketing'].every((agent) => Boolean(store.agentViews[agent]))),
    check('Conflict queue is review-only', store.conflicts.every((conflict) => conflict.autoResolved === false)),
    check('Facts preserve supersession model', store.facts.every((fact) => Object.hasOwn(fact, 'supersededBy'))),
    check('Audit history available', store.auditHistory.length > 0),
    check('Memory reports generated', reports.reports.length >= 8),
    check('Local-only safety boundaries present', safetySummary().blockedActions.length >= 8),
  ];
  const status = checks.every((item) => item.passed) ? 'pass' : 'fail';
  return { title: 'Shared Memory Validation', generatedAt: timestamp(), status, checks, summary: store.summary, safety: safetySummary() };
}

export function buildSharedMemoryStore() {
  const now = timestamp();
  const opportunities = readJson(path.join(salesRoot, 'opportunities.json'), []);
  const research = readJson(path.join(salesRoot, 'research-intelligence.json'), {});
  const workflows = readJson(path.join(salesRoot, 'sales-workflows.json'), {});
  const orgContacts = readJson(path.join(salesRoot, 'organization-contact-intelligence.json'), {});
  const tasks = readTasks();
  const reports = readReports();

  const entities = [];
  const facts = [];
  const relationships = [];
  const auditHistory = [];

  for (const organization of orgContacts.organizations ?? []) {
    const entity = entityRecord({
      entityId: organization.organizationId,
      entityType: 'organization',
      displayName: organization.legalName,
      aliases: [organization.primaryDomain, organization.website].filter(Boolean),
      owningAgent: 'Sales',
      relatedAgents: ['Executive', 'Operator', 'Proposal Prep', 'Contract Intelligence'],
      sourceReferences: organization.sourceIds ?? [],
      confidence: organization.confidenceScore ?? 60,
      riskRating: organization.riskRating ?? 'medium',
      status: organization.currentSalesStage ?? 'active',
      tags: ['organization', organization.industry, organization.headquarters].filter(Boolean),
      createdDate: organization.createdDate ?? now,
      updatedDate: organization.updatedDate ?? now,
    });
    entities.push(entity);
    auditHistory.push(audit('entity_seeded', 'Shared Memory', null, entity.displayName, 'Phase 52 local seed', [entity.entityId], []));
    addFact(facts, entity.entityId, 'organization health', organization.evaluations?.organizationHealth?.score, 'organization intelligence', organization.evaluations?.organizationHealth?.confidence ?? 60, 'derived local signal', 'Sales');
    addFact(facts, entity.entityId, 'relationship health', organization.evaluations?.relationshipHealth?.score, 'organization intelligence', organization.evaluations?.relationshipHealth?.confidence ?? 60, 'derived local signal', 'Sales');
    addFact(facts, entity.entityId, 'decision maker coverage', organization.evaluations?.decisionMakerCoverage?.score, 'organization intelligence', organization.evaluations?.decisionMakerCoverage?.confidence ?? 60, 'derived local signal', 'Sales');
    addFact(facts, entity.entityId, 'proposal readiness', organization.evaluations?.proposalReadiness?.score, 'organization intelligence', organization.evaluations?.proposalReadiness?.confidence ?? 60, 'derived local signal', 'Proposal Prep');
  }

  for (const contact of orgContacts.contacts ?? []) {
    const entity = entityRecord({
      entityId: contact.contactId,
      entityType: 'contact',
      displayName: contact.preferredName || `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || contact.contactId,
      aliases: [contact.email, contact.phone].filter(Boolean),
      owningAgent: 'Sales',
      relatedAgents: ['Operator', 'Proposal Prep'],
      sourceReferences: contact.sourceIds ?? [],
      confidence: contact.confidence ?? 45,
      riskRating: contact.missingInformation?.length ? 'medium' : 'low',
      status: contact.verificationStatus ?? 'unverified',
      tags: ['contact', contact.role, contact.decisionAuthority].filter(Boolean),
      createdDate: contact.createdDate ?? now,
      updatedDate: contact.updatedDate ?? now,
    });
    entities.push(entity);
    relationships.push(rel(contact.contactId, contact.organizationId, 'works_at', 'organization contact intelligence', contact.confidence ?? 45, 'Sales'));
    addFact(facts, contact.contactId, 'email', contact.email || 'missing', 'contact intelligence', contact.email ? contact.confidence : 20, contact.email ? 'local contact field' : 'missing', 'Sales');
    addFact(facts, contact.contactId, 'phone', contact.phone || 'missing', 'contact intelligence', contact.phone ? contact.confidence : 20, contact.phone ? 'local contact field' : 'missing', 'Sales');
    addFact(facts, contact.contactId, 'decision authority', contact.decisionAuthority ?? 'unknown', 'contact intelligence', contact.confidence ?? 45, 'local contact field', 'Sales');
  }

  for (const opportunity of opportunities) {
    const entity = entityRecord({
      entityId: opportunity.id,
      entityType: 'opportunity',
      displayName: opportunity.company,
      aliases: [opportunity.website, opportunity.email].filter(Boolean),
      owningAgent: 'Sales',
      relatedAgents: ['Executive', 'Operator', 'Proposal Prep', 'Contract Intelligence'],
      sourceReferences: [opportunity.source].filter(Boolean),
      confidence: opportunity.researchConfidence ?? opportunity.icpScore ?? 50,
      riskRating: opportunity.riskLevel ?? 'medium',
      status: opportunity.stage ?? 'prospect',
      tags: ['opportunity', opportunity.industry, opportunity.city, opportunity.state].filter(Boolean),
      createdDate: opportunity.createdAt ?? now,
      updatedDate: opportunity.updatedAt ?? now,
    });
    entities.push(entity);
    const organization = (orgContacts.organizations ?? []).find((item) => normalize(item.legalName) === normalize(opportunity.company));
    if (organization) relationships.push(rel(opportunity.id, organization.organizationId, 'belongs_to', 'local CRM', opportunity.researchConfidence ?? 60, 'Sales'));
    addFact(facts, opportunity.id, 'stage', opportunity.stage, 'local CRM', 80, 'local CRM field', 'Sales');
    addFact(facts, opportunity.id, 'estimated value', opportunity.estimatedValue ?? 0, 'local CRM', 70, 'local CRM field', 'Sales');
    addFact(facts, opportunity.id, 'proposal status', opportunity.proposalStatus ?? 'unknown', 'local CRM', 70, 'local CRM field', 'Proposal Prep');
  }

  for (const source of research.sources ?? []) {
    entities.push(entityRecord({ entityId: source.id, entityType: 'research source', displayName: source.name, owningAgent: 'Sales', relatedAgents: ['Executive', 'Operator'], sourceReferences: [source.category], confidence: source.confidenceScore ?? 50, riskRating: source.status === 'approved' ? 'low' : 'medium', status: source.approvalStatus ?? source.status, tags: ['source', source.category], createdDate: source.created, updatedDate: source.updated }));
  }

  for (const intake of research.intakeQueue ?? []) {
    entities.push(entityRecord({ entityId: intake.id, entityType: 'research intake', displayName: `${intake.company} ${intake.researchType}`, owningAgent: 'Sales', relatedAgents: ['Operator', 'Executive'], sourceReferences: [intake.sourceId].filter(Boolean), confidence: intake.confidence ?? 50, riskRating: intake.riskRating ?? 'medium', status: intake.reviewStatus ?? intake.verificationStatus, tags: ['research intake', intake.researchType], createdDate: intake.date, updatedDate: intake.date }));
    const org = (orgContacts.organizations ?? []).find((item) => normalize(item.legalName) === normalize(intake.company));
    if (org) relationships.push(rel(intake.id, org.organizationId, 'supports_research_for', 'research intake', intake.confidence ?? 50, 'Sales'));
  }

  for (const workflow of workflows.workflows ?? []) {
    entities.push(entityRecord({ entityId: workflow.id, entityType: 'workflow', displayName: workflow.requestedAction ?? workflow.type, owningAgent: workflow.sourceAgent ?? 'Sales', relatedAgents: [workflow.targetAgent].filter(Boolean), sourceReferences: workflow.relatedSourceIds ?? [], confidence: workflow.confidence ?? 60, riskRating: workflow.status === 'blocked' ? 'high' : 'medium', status: workflow.status, tags: ['workflow', workflow.type, workflow.priority].filter(Boolean), createdDate: workflow.createdDate, updatedDate: workflow.updatedDate }));
    if (workflow.opportunityId) relationships.push(rel(workflow.id, workflow.opportunityId, 'requests_action_for', 'workflow orchestration', 80, workflow.sourceAgent ?? 'Sales'));
  }

  for (const task of tasks) {
    entities.push(entityRecord({ entityId: task.id, entityType: 'task', displayName: task.title, owningAgent: task.sourceAgent ?? 'Operator', relatedAgents: [task.assignedAgent].filter(Boolean), sourceReferences: task.linkedEntities ?? [], confidence: 75, riskRating: task.status === 'Blocked' ? 'high' : 'medium', status: task.status, tags: ['task', task.category, task.priority].filter(Boolean), createdDate: task.createdTimestamp, updatedDate: task.completionTimestamp ?? task.createdTimestamp }));
    for (const linked of task.linkedEntities ?? []) relationships.push(rel(task.id, linked, 'references', 'shared task queue', 60, task.sourceAgent ?? 'Operator'));
  }

  for (const report of reports) {
    entities.push(entityRecord({ entityId: report.id, entityType: 'report', displayName: report.name, owningAgent: report.agent, relatedAgents: ['Executive', 'Operator'], sourceReferences: [report.path], confidence: 70, riskRating: 'low', status: 'local', tags: ['report', report.format], createdDate: report.updatedAt, updatedDate: report.updatedAt }));
  }

  entities.push(entityRecord({ entityId: 'contract:intelligence-placeholder', entityType: 'contract', displayName: 'Contract Intelligence Placeholder', owningAgent: 'Contract Intelligence', relatedAgents: ['Sales', 'Executive', 'Proposal Prep'], sourceReferences: [], confidence: 35, riskRating: 'medium', status: 'placeholder_ready', tags: ['contract', 'future'], createdDate: now, updatedDate: now }));
  entities.push(entityRecord({ entityId: 'market:vyra-first-fitness-segments', entityType: 'market segment', displayName: 'Vyra First Fitness Segments', owningAgent: 'Marketing', relatedAgents: ['Sales', 'Executive'], sourceReferences: ['Sales saved context'], confidence: 75, riskRating: 'low', status: 'active', tags: ['mma', 'crossfit', 'small gyms'], createdDate: now, updatedDate: now }));
  entities.push(entityRecord({ entityId: 'brand:vyra-local-assets-placeholder', entityType: 'brand asset', displayName: 'Vyra Local Brand Assets Placeholder', owningAgent: 'Marketing', relatedAgents: ['Sales', 'Executive'], sourceReferences: [], confidence: 30, riskRating: 'medium', status: 'needs_assets', tags: ['marketing', 'future'], createdDate: now, updatedDate: now }));

  for (const edge of orgContacts.relationshipEdges ?? []) {
    relationships.push(rel(edge.from, edge.to, edge.relationship, edge.source ?? 'organization intelligence', edge.confidence ?? 60, 'Sales'));
  }

  const rebuilt = rebuildSharedMemoryStore({
    version: 'phase52.shared-memory.v1',
    generatedAt: now,
    entities: dedupeById(entities, 'entityId'),
    facts: dedupeById(facts, 'factId'),
    relationships: dedupeById(relationships, 'relationshipId'),
    conflicts: [],
    auditHistory,
    agentViews: {},
    reports: [],
    summary: {},
    safety: safetySummary(),
  });
  return rebuilt;
}

function rebuildSharedMemoryStore(store) {
  const entities = dedupeById((store.entities ?? []).map(normalizeEntity), 'entityId');
  const facts = dedupeById((store.facts ?? []).map(normalizeFact), 'factId');
  const relationships = dedupeById((store.relationships ?? []).map(normalizeRelationship), 'relationshipId');
  const conflicts = detectConflicts(entities, facts, relationships, store.conflicts ?? []);
  const next = {
    version: store.version ?? 'phase52.shared-memory.v1',
    generatedAt: store.generatedAt ?? timestamp(),
    entities,
    facts,
    relationships,
    conflicts,
    auditHistory: store.auditHistory ?? [],
    agentViews: {},
    reports: store.reports ?? [],
    summary: summarizeMemory(entities, facts, relationships, conflicts),
    safety: safetySummary(),
  };
  next.agentViews = {
    Sales: buildAgentView(next, 'Sales'),
    Executive: buildAgentView(next, 'Executive'),
    Operator: buildAgentView(next, 'Operator'),
    'Proposal Prep': buildAgentView(next, 'Proposal Prep'),
    'Contract Intelligence': buildAgentView(next, 'Contract Intelligence'),
    Marketing: buildAgentView(next, 'Marketing'),
  };
  return next;
}

function buildAgentView(store, agent) {
  const relevantTypes = {
    Sales: ['organization', 'contact', 'opportunity', 'workflow', 'proposal', 'research source', 'research intake'],
    Executive: ['organization', 'opportunity', 'approval', 'workflow', 'report', 'contract', 'market segment'],
    Operator: ['task', 'workflow', 'research intake', 'contact', 'organization'],
    'Proposal Prep': ['opportunity', 'proposal', 'contact', 'organization', 'research source', 'artifact'],
    'Contract Intelligence': ['contract', 'organization', 'opportunity', 'research source', 'proposal'],
    Marketing: ['brand asset', 'market segment', 'organization', 'note', 'artifact'],
  }[agent] ?? [];
  const entities = store.entities.filter((entity) => relevantTypes.includes(entity.entityType) || entity.owningAgent === agent || entity.relatedAgents.includes(agent));
  const entityIds = new Set(entities.map((entity) => entity.entityId));
  const facts = store.facts.filter((fact) => entityIds.has(fact.entityId));
  const relationships = store.relationships.filter((rel) => entityIds.has(rel.fromEntity) || entityIds.has(rel.toEntity));
  const conflicts = store.conflicts.filter((conflict) => conflict.entityIds.some((id) => entityIds.has(id)));
  return {
    agent,
    entityCount: entities.length,
    factCount: facts.length,
    relationshipCount: relationships.length,
    conflictCount: conflicts.length,
    riskyFactCount: facts.filter((fact) => fact.confidence < 55 || fact.verificationStatus !== 'verified').length,
    staleFactCount: staleFacts(facts).length,
    topEntities: entities.slice(0, 8),
    sourceBackedFacts: facts.filter((fact) => fact.source && fact.source !== 'unknown').slice(0, 12),
    relationshipGraph: relationships.slice(0, 12),
    conflictQueue: conflicts.slice(0, 12),
    maintenanceQueue: buildMaintenanceQueue(entities, facts, conflicts),
  };
}

function detectConflicts(entities, facts, relationships, existingConflicts) {
  const conflicts = [];
  const existingById = new Map(existingConflicts.map((item) => [item.conflictId, item]));
  const buckets = [
    ['duplicate organizations', entities.filter((e) => e.entityType === 'organization'), (e) => normalize(e.displayName)],
    ['duplicate contacts', entities.filter((e) => e.entityType === 'contact'), (e) => normalize(e.displayName)],
    ['conflicting emails', entities, (e) => (e.aliases ?? []).find((alias) => String(alias).includes('@'))?.toLowerCase() ?? ''],
    ['conflicting phone numbers', entities, (e) => (e.aliases ?? []).find((alias) => String(alias).replace(/\D/g, '').length >= 7)?.replace(/\D/g, '') ?? ''],
  ];
  for (const [type, items, keyer] of buckets) {
    const grouped = groupBy(items, keyer);
    for (const [key, group] of Object.entries(grouped)) {
      if (!key || group.length < 2) continue;
      conflicts.push(conflictRecord(type, group.map((item) => item.entityId), `Multiple records share ${key}.`, existingById));
    }
  }
  for (const fact of facts) {
    if (fact.confidence < 45) conflicts.push(conflictRecord('low-confidence fact', [fact.entityId], `${fact.factType} has ${fact.confidence}% confidence.`, existingById, [fact.factId]));
    if (fact.verificationStatus !== 'verified') conflicts.push(conflictRecord('missing verification', [fact.entityId], `${fact.factType} is ${fact.verificationStatus}.`, existingById, [fact.factId]));
    if (!fact.source || fact.source === 'unknown') conflicts.push(conflictRecord('unsupported fact', [fact.entityId], `${fact.factType} has no source.`, existingById, [fact.factId]));
    if (fact.supersededBy) conflicts.push(conflictRecord('outdated fact', [fact.entityId], `${fact.factType} was superseded by ${fact.supersededBy}.`, existingById, [fact.factId]));
  }
  const relationshipKeys = new Set(relationships.map((rel) => `${rel.fromEntity}|${rel.toEntity}|${rel.relationshipType}`));
  for (const rel of relationships) {
    if (rel.direction === 'bidirectional' && !relationshipKeys.has(`${rel.toEntity}|${rel.fromEntity}|${rel.relationshipType}`)) {
      conflicts.push(conflictRecord('relationship direction review', [rel.fromEntity, rel.toEntity], `${rel.relationshipType} is bidirectional but has no reverse edge.`, existingById, [], [rel.relationshipId]));
    }
  }
  return dedupeById(conflicts, 'conflictId');
}

function conflictRecord(type, entityIds, description, existingById, factIds = [], relationshipIds = []) {
  const conflictId = `conflict:${slugify(type)}:${slugify(entityIds.join('-'))}:${slugify(factIds.join('-') || relationshipIds.join('-') || 'entity')}`;
  const existing = existingById.get(conflictId);
  return {
    conflictId,
    conflictType: type,
    entityIds,
    factIds,
    relationshipIds,
    description,
    severity: type.includes('duplicate') || type.includes('conflicting') ? 'medium' : 'low',
    status: existing?.status ?? 'open',
    autoResolved: false,
    recommendedReviewAction: existing?.reviewAction ?? 'Review manually; do not merge or overwrite automatically.',
    createdDate: existing?.createdDate ?? timestamp(),
    reviewedAt: existing?.reviewedAt ?? null,
    reviewedBy: existing?.reviewedBy ?? null,
  };
}

function entityRecord(input) {
  return normalizeEntity({
    entityId: input.entityId,
    entityType: input.entityType,
    displayName: input.displayName,
    aliases: input.aliases ?? [],
    owningAgent: input.owningAgent,
    relatedAgents: input.relatedAgents ?? [],
    sourceReferences: input.sourceReferences ?? [],
    confidence: input.confidence,
    riskRating: input.riskRating,
    status: input.status,
    tags: input.tags ?? [],
    createdDate: input.createdDate,
    updatedDate: input.updatedDate,
    archivedDate: null,
    auditHistory: [audit('entity_recorded', input.owningAgent, null, input.displayName, 'Local shared memory seed.', [input.entityId], [])],
  });
}

function normalizeEntity(entity) {
  return {
    entityId: String(entity.entityId),
    entityType: entityTypes.has(entity.entityType) ? entity.entityType : 'artifact',
    displayName: String(entity.displayName ?? entity.entityId),
    aliases: array(entity.aliases),
    owningAgent: entity.owningAgent ?? 'Operator',
    relatedAgents: array(entity.relatedAgents),
    sourceReferences: array(entity.sourceReferences),
    confidence: clamp(Number(entity.confidence ?? 50)),
    riskRating: entity.riskRating ?? 'medium',
    status: entity.status ?? 'active',
    tags: array(entity.tags),
    createdDate: entity.createdDate ?? timestamp(),
    updatedDate: entity.updatedDate ?? timestamp(),
    archivedDate: entity.archivedDate ?? null,
    auditHistory: array(entity.auditHistory),
  };
}

function normalizeFact(fact) {
  return {
    factId: String(fact.factId),
    entityId: String(fact.entityId),
    factType: String(fact.factType ?? 'note'),
    value: fact.value ?? '',
    source: fact.source ?? 'unknown',
    confidence: clamp(Number(fact.confidence ?? 50)),
    evidenceLevel: fact.evidenceLevel ?? 'unknown',
    createdBy: fact.createdBy ?? 'Operator',
    verifiedBy: fact.verifiedBy ?? null,
    verificationStatus: fact.verificationStatus ?? 'pending_review',
    createdDate: fact.createdDate ?? timestamp(),
    updatedDate: fact.updatedDate ?? timestamp(),
    supersededBy: fact.supersededBy ?? null,
    auditTrail: array(fact.auditTrail),
  };
}

function normalizeRelationship(relInput) {
  return {
    relationshipId: relInput.relationshipId,
    fromEntity: relInput.fromEntity,
    toEntity: relInput.toEntity,
    relationshipType: relInput.relationshipType,
    source: relInput.source ?? 'local shared memory',
    confidence: clamp(Number(relInput.confidence ?? 50)),
    direction: relInput.direction ?? 'directed',
    createdBy: relInput.createdBy ?? 'Operator',
    createdDate: relInput.createdDate ?? timestamp(),
    updatedDate: relInput.updatedDate ?? timestamp(),
    auditTrail: array(relInput.auditTrail),
  };
}

function addFact(facts, entityId, factType, value, source, confidence, evidenceLevel, createdBy) {
  facts.push(normalizeFact({ factId: `fact:${slugify(entityId)}:${slugify(factType)}`, entityId, factType, value, source, confidence, evidenceLevel, createdBy, verifiedBy: confidence >= 70 ? createdBy : null, verificationStatus: confidence >= 70 ? 'verified' : 'pending_review', createdDate: timestamp(), updatedDate: timestamp(), supersededBy: null, auditTrail: [audit('fact_recorded', createdBy, null, value, source, [entityId], [])] }));
}

function rel(fromEntity, toEntity, relationshipType, source, confidence, createdBy) {
  return normalizeRelationship({ relationshipId: `rel:${slugify(fromEntity)}:${slugify(relationshipType)}:${slugify(toEntity)}`, fromEntity, toEntity, relationshipType, source, confidence, direction: 'directed', createdBy, createdDate: timestamp(), updatedDate: timestamp(), auditTrail: [audit('relationship_recorded', createdBy, null, relationshipType, source, [fromEntity, toEntity], [`${fromEntity}->${toEntity}`])] });
}

function audit(action, operator = 'local operator', previousValue, newValue, reason, affectedEntities = [], affectedRelationships = []) {
  return { auditId: `audit:${compactStamp(timestamp())}:${slugify(action)}:${Math.random().toString(36).slice(2, 7)}`, timestamp: timestamp(), agent: 'Shared Memory', operator: operator ?? 'local operator', action, previousValue, newValue, reason, source: 'local shared memory', affectedEntities: array(affectedEntities), affectedRelationships: array(affectedRelationships) };
}

function readTasks() {
  if (!existsSync(tasksRoot)) return [];
  return readdirSync(tasksRoot).filter((name) => name.endsWith('.json')).map((name) => readJson(path.join(tasksRoot, name), null)).filter(Boolean);
}

function readReports() {
  if (!existsSync(salesReportRoot)) return [];
  return readdirSync(salesReportRoot).filter((name) => name.endsWith('.json') || name.endsWith('.md')).slice(0, 80).map((name) => ({ id: `report:sales:${name}`, name, agent: 'Sales', format: path.extname(name).slice(1), path: path.relative(repoRoot, path.join(salesReportRoot, name)), updatedAt: timestamp() }));
}

function readJson(filePath, fallback) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeMemoryReport(slug, payload) {
  writeFileSync(path.join(memoryReportRoot, `${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`);
}

function summarizeMemory(entities, facts, relationships, conflicts) {
  return {
    entityCount: entities.length,
    factCount: facts.length,
    relationshipCount: relationships.length,
    conflictCount: conflicts.filter((conflict) => conflict.status === 'open').length,
    duplicateEntityQueue: conflicts.filter((conflict) => conflict.conflictType.includes('duplicate')).length,
    riskyFacts: facts.filter((fact) => fact.confidence < 55 || fact.verificationStatus !== 'verified').length,
    staleFacts: staleFacts(facts).length,
    averageEntityConfidence: average(entities.map((entity) => entity.confidence)),
    averageFactConfidence: average(facts.map((fact) => fact.confidence)),
    entityTypes: countBy(entities, 'entityType'),
    owningAgents: countBy(entities, 'owningAgent'),
    recommendedReviewAction: conflicts.length ? 'Review open conflicts manually before using affected facts in Executive decisions.' : 'No open conflict review required.',
  };
}

function summarizeFacts(facts) {
  return { total: facts.length, verified: facts.filter((fact) => fact.verificationStatus === 'verified').length, pendingReview: facts.filter((fact) => fact.verificationStatus !== 'verified').length, lowConfidence: facts.filter((fact) => fact.confidence < 55).length, superseded: facts.filter((fact) => fact.supersededBy).length };
}

function summarizeRelationships(relationships) {
  return { total: relationships.length, relationshipTypes: countBy(relationships, 'relationshipType'), averageConfidence: average(relationships.map((rel) => rel.confidence)) };
}

function summarizeConflicts(conflicts) {
  return { total: conflicts.length, open: conflicts.filter((conflict) => conflict.status === 'open').length, reviewed: conflicts.filter((conflict) => conflict.status === 'reviewed').length, byType: countBy(conflicts, 'conflictType') };
}

function staleFacts(facts) {
  return facts.filter((fact) => fact.supersededBy || fact.verificationStatus !== 'verified' || fact.confidence < 55);
}

function buildMaintenanceQueue(entities, facts, conflicts) {
  return [
    ...conflicts.slice(0, 6).map((conflict) => ({ type: 'conflict', label: conflict.conflictType, detail: conflict.description, action: conflict.recommendedReviewAction })),
    ...staleFacts(facts).slice(0, 6).map((fact) => ({ type: 'fact', label: fact.factType, detail: `${fact.entityId}: ${fact.verificationStatus} at ${fact.confidence}% confidence`, action: 'Verify source or supersede fact manually.' })),
    ...entities.filter((entity) => entity.confidence < 45).slice(0, 6).map((entity) => ({ type: 'entity', label: entity.displayName, detail: `${entity.entityType} has low confidence.`, action: 'Add source-backed facts or archive if obsolete.' })),
  ].slice(0, 12);
}

function safetySummary() {
  return { mode: 'local/mock/read-only', localOnly: true, externalSync: false, autonomousBrowsing: false, autonomousEmailing: false, proposalSubmission: false, automaticApprovals: false, automaticSourceApproval: false, automaticMerge: false, hiddenFactOverwrite: false, blockedActions };
}

function check(name, passed) {
  return { name, passed: Boolean(passed) };
}

function groupBy(items, keyer) {
  return items.reduce((acc, item) => {
    const key = keyer(item);
    if (!key) return acc;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? 'unknown';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function dedupeById(items, key) {
  return [...new Map(items.filter(Boolean).map((item) => [item[key], item])).values()];
}

function upsertById(items, item, key) {
  return [item, ...items.filter((existing) => existing[key] !== item[key])];
}

function array(value) {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : value ? [value] : [];
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return 0;
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
}

function clamp(value) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function slugify(value) {
  return String(value ?? 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'item';
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function compactStamp(value) {
  return String(value).replace(/[-:.TZ]/g, '').slice(0, 14);
}

function timestamp() {
  return new Date().toISOString();
}
