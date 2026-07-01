import type { LocalReport } from '../storage/reportExport';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';
import type {
  SalesOpportunity,
  SalesOrganizationIntelligenceStore,
  SalesResearchIntakeItem,
  SalesResearchSource,
  SalesWorkflowRecord,
  SharedMemoryAgentView,
  SharedMemoryConflict,
  SharedMemoryEntity,
  SharedMemoryEntityType,
  SharedMemoryFact,
  SharedMemoryRelationship,
  SharedMemoryStore,
} from '../agents/sales/salesTypes';

export function buildSharedKnowledgeGraph(input: {
  localReports: LocalReport[];
  opportunities: SalesOpportunity[];
  organizationIntelligence: SalesOrganizationIntelligenceStore;
  researchIntake: SalesResearchIntakeItem[];
  researchSources: SalesResearchSource[];
  sharedTaskSummary?: SharedTaskDashboardSummary;
  workflows: SalesWorkflowRecord[];
}): SharedMemoryStore {
  const now = new Date().toISOString();
  const entities: SharedMemoryEntity[] = [];
  const facts: SharedMemoryFact[] = [];
  const relationships: SharedMemoryRelationship[] = [];

  input.organizationIntelligence.organizations.forEach((organization) => {
    entities.push(entity('organization', organization.organizationId, organization.legalName, 'Sales', ['Executive', 'Operator', 'Proposal Prep', 'Contract Intelligence'], organization.confidence, organization.riskRating, organization.currentSalesStage, [organization.primaryDomain, organization.website], ['organization', organization.industry, organization.headquarters], organization.reports));
    facts.push(fact(organization.organizationId, 'organization health', organization.evaluations.organizationHealth.score, 'organization intelligence', organization.evaluations.organizationHealth.confidence, 'derived local signal', 'Sales'));
    facts.push(fact(organization.organizationId, 'relationship health', organization.evaluations.relationshipHealth.score, 'organization intelligence', organization.evaluations.relationshipHealth.confidence, 'derived local signal', 'Sales'));
    facts.push(fact(organization.organizationId, 'decision maker coverage', organization.evaluations.decisionMakerCoverage.score, 'organization intelligence', organization.evaluations.decisionMakerCoverage.confidence, 'derived local signal', 'Sales'));
    facts.push(fact(organization.organizationId, 'proposal readiness', organization.evaluations.proposalReadiness.score, 'organization intelligence', organization.evaluations.proposalReadiness.confidence, 'derived local signal', 'Proposal Prep'));
  });

  input.organizationIntelligence.contacts.forEach((contact) => {
    entities.push(entity('contact', contact.contactId, contact.preferredName || `${contact.firstName} ${contact.lastName}`.trim(), 'Sales', ['Operator', 'Proposal Prep'], contact.confidence, contact.riskScore > 60 ? 'high' : contact.riskScore > 35 ? 'medium' : 'low', contact.email || contact.phone ? 'partially_verified' : 'missing_contact_data', [contact.email, contact.phone], ['contact', contact.department, contact.decisionAuthority], contact.notes));
    relationships.push(relationship(contact.contactId, contact.organizationId, 'works_at', 'contact intelligence', contact.confidence, 'Sales'));
    facts.push(fact(contact.contactId, 'email', contact.email || 'missing', 'contact intelligence', contact.email ? contact.confidence : 20, contact.email ? 'local contact field' : 'missing', 'Sales'));
    facts.push(fact(contact.contactId, 'phone', contact.phone || 'missing', 'contact intelligence', contact.phone ? contact.confidence : 20, contact.phone ? 'local contact field' : 'missing', 'Sales'));
    facts.push(fact(contact.contactId, 'decision authority', contact.decisionAuthority, 'contact intelligence', contact.confidence, 'local contact field', 'Sales'));
  });

  input.opportunities.forEach((opportunity) => {
    entities.push(entity('opportunity', opportunity.id, opportunity.company, 'Sales', ['Executive', 'Operator', 'Proposal Prep', 'Contract Intelligence'], opportunity.score.confidence || opportunity.icpScore, opportunity.score.priority === 'Critical' ? 'high' : opportunity.score.priority === 'High' ? 'medium' : 'low', opportunity.stage, [opportunity.website, opportunity.email], ['opportunity', opportunity.industry, opportunity.city, opportunity.state], [opportunity.source]));
    const organization = input.organizationIntelligence.organizations.find((item) => normalize(item.legalName) === normalize(opportunity.company));
    if (organization) relationships.push(relationship(opportunity.id, organization.organizationId, 'belongs_to', 'local CRM', opportunity.score.confidence || 60, 'Sales'));
    facts.push(fact(opportunity.id, 'stage', opportunity.stage, 'local CRM', 80, 'local CRM field', 'Sales'));
    facts.push(fact(opportunity.id, 'estimated value', opportunity.followUpPlan.estimatedCloseProbability ?? opportunity.leadScore, 'local CRM', 70, 'local CRM field', 'Sales'));
    facts.push(fact(opportunity.id, 'proposal status', opportunity.proposalPreparationStatus.status, 'local CRM', 70, 'local CRM field', 'Proposal Prep'));
  });

  input.researchSources.forEach((source) => {
    entities.push(entity('research source', source.id, source.name, 'Sales', ['Executive', 'Operator'], source.confidenceScore, source.approvalStatus === 'Approved' ? 'low' : 'medium', source.approvalStatus, [source.category], ['source', source.category], [source.category]));
  });

  input.researchIntake.forEach((intake) => {
    entities.push(entity('research intake', intake.id, `${intake.company} ${intake.researchType}`, 'Sales', ['Executive', 'Operator'], intake.confidence, intake.riskRating, intake.reviewStatus, [intake.sourceId], ['research intake', intake.researchType], [intake.sourceId]));
    const organization = input.organizationIntelligence.organizations.find((item) => normalize(item.legalName) === normalize(intake.company));
    if (organization) relationships.push(relationship(intake.id, organization.organizationId, 'supports_research_for', 'research intake', intake.confidence, 'Sales'));
  });

  input.workflows.forEach((workflow) => {
    entities.push(entity('workflow', workflow.id, workflow.requestedAction, workflow.sourceAgent, [workflow.targetAgent], workflow.status === 'approved' || workflow.status === 'completed' ? 80 : 60, workflow.status === 'blocked' ? 'high' : 'medium', workflow.status, workflow.relatedSourceIds, ['workflow', workflow.type, workflow.priority], workflow.relatedSourceIds));
    if (workflow.opportunityId) relationships.push(relationship(workflow.id, workflow.opportunityId, 'requests_action_for', 'workflow orchestration', 80, workflow.sourceAgent));
  });

  input.localReports.slice(0, 40).forEach((report) => {
    entities.push(entity('report', `report:${report.slug}`, report.title, 'Sales', ['Executive', 'Operator'], 70, 'low', 'local', [report.slug], ['report', 'local'], [report.slug]));
  });

  entities.push(entity('contract', 'contract:intelligence-placeholder', 'Contract Intelligence Placeholder', 'Contract Intelligence', ['Sales', 'Executive', 'Proposal Prep'], 35, 'medium', 'placeholder_ready', [], ['contract', 'future'], []));
  entities.push(entity('market segment', 'market:vyra-first-fitness-segments', 'Vyra First Fitness Segments', 'Marketing', ['Sales', 'Executive'], 75, 'low', 'active', ['Sales saved context'], ['mma', 'crossfit', 'small gyms'], ['Sales saved context']));
  entities.push(entity('brand asset', 'brand:vyra-local-assets-placeholder', 'Vyra Local Brand Assets Placeholder', 'Marketing', ['Sales', 'Executive'], 30, 'medium', 'needs_assets', [], ['marketing', 'future'], []));

  input.organizationIntelligence.relationshipEdges.forEach((edge) => {
    relationships.push(relationship(edge.from, edge.to, edge.relationship, 'organization intelligence', 65, 'Sales'));
  });

  const uniqueEntities = uniqueBy(entities, (item) => item.entityId);
  const uniqueFacts = uniqueBy(facts, (item) => item.factId);
  const uniqueRelationships = uniqueBy(relationships, (item) => item.relationshipId);
  const conflicts = detectConflicts(uniqueEntities, uniqueFacts);
  const summary = {
    averageEntityConfidence: average(uniqueEntities.map((item) => item.confidence)),
    averageFactConfidence: average(uniqueFacts.map((item) => item.confidence)),
    conflictCount: conflicts.filter((item) => item.status === 'open').length,
    duplicateEntityQueue: conflicts.filter((item) => item.conflictType.includes('duplicate')).length,
    entityCount: uniqueEntities.length,
    factCount: uniqueFacts.length,
    recommendedReviewAction: conflicts.length ? 'Review open conflicts manually before using affected facts in Executive decisions.' : 'No open conflict review required.',
    relationshipCount: uniqueRelationships.length,
    riskyFacts: uniqueFacts.filter((item) => item.confidence < 55 || item.verificationStatus !== 'verified').length,
    staleFacts: uniqueFacts.filter((item) => item.supersededBy || item.verificationStatus !== 'verified' || item.confidence < 55).length,
  };
  const store: SharedMemoryStore = {
    agentViews: {},
    conflicts,
    entities: uniqueEntities,
    facts: uniqueFacts,
    generatedAt: now,
    localOnly: true,
    relationships: uniqueRelationships,
    safety: {
      automaticApprovals: false,
      automaticMerge: false,
      autonomousBrowsing: false,
      autonomousEmailing: false,
      externalSync: false,
      hiddenFactOverwrite: false,
      localOnly: true,
      proposalSubmission: false,
    },
    summary,
  };
  store.agentViews = {
    Sales: agentView(store, 'Sales'),
    Executive: agentView(store, 'Executive'),
    Operator: agentView(store, 'Operator'),
    'Proposal Prep': agentView(store, 'Proposal Prep'),
    'Contract Intelligence': agentView(store, 'Contract Intelligence'),
    Marketing: agentView(store, 'Marketing'),
  };
  return store;
}

function agentView(store: SharedMemoryStore, agent: string): SharedMemoryAgentView {
  const relevantTypes: Record<string, SharedMemoryEntityType[]> = {
    Sales: ['organization', 'contact', 'opportunity', 'workflow', 'proposal', 'research source', 'research intake'],
    Executive: ['organization', 'opportunity', 'approval', 'workflow', 'report', 'contract', 'market segment'],
    Operator: ['task', 'workflow', 'research intake', 'contact', 'organization'],
    'Proposal Prep': ['opportunity', 'proposal', 'contact', 'organization', 'research source', 'artifact'],
    'Contract Intelligence': ['contract', 'organization', 'opportunity', 'research source', 'proposal'],
    Marketing: ['brand asset', 'market segment', 'organization', 'note', 'artifact'],
  };
  const types = relevantTypes[agent] ?? [];
  const entities = store.entities.filter((entity) => types.includes(entity.entityType) || entity.owningAgent === agent || entity.relatedAgents.includes(agent));
  const ids = new Set(entities.map((entity) => entity.entityId));
  const facts = store.facts.filter((factItem) => ids.has(factItem.entityId));
  const relationships = store.relationships.filter((rel) => ids.has(rel.fromEntity) || ids.has(rel.toEntity));
  const conflicts = store.conflicts.filter((conflict) => conflict.entityIds.some((id) => ids.has(id)));
  const stale = facts.filter((factItem) => factItem.supersededBy || factItem.verificationStatus !== 'verified' || factItem.confidence < 55);
  return {
    agent,
    conflictCount: conflicts.length,
    conflictQueue: conflicts.slice(0, 12),
    entityCount: entities.length,
    factCount: facts.length,
    maintenanceQueue: [
      ...conflicts.slice(0, 6).map((conflict) => ({ type: 'conflict', label: conflict.conflictType, detail: conflict.description, action: conflict.recommendedReviewAction })),
      ...stale.slice(0, 6).map((factItem) => ({ type: 'fact', label: factItem.factType, detail: `${factItem.entityId}: ${factItem.verificationStatus} at ${factItem.confidence}% confidence`, action: 'Verify source or supersede fact manually.' })),
    ].slice(0, 12),
    relationshipCount: relationships.length,
    relationshipGraph: relationships.slice(0, 12),
    riskyFactCount: facts.filter((factItem) => factItem.confidence < 55 || factItem.verificationStatus !== 'verified').length,
    sourceBackedFacts: facts.filter((factItem) => factItem.source && factItem.source !== 'unknown').slice(0, 12),
    staleFactCount: stale.length,
    topEntities: entities.slice(0, 8),
  };
}

function detectConflicts(entities: SharedMemoryEntity[], facts: SharedMemoryFact[]): SharedMemoryConflict[] {
  const conflicts: SharedMemoryConflict[] = [];
  const orgGroups = groupBy(entities.filter((item) => item.entityType === 'organization'), (item) => normalize(item.displayName));
  Object.entries(orgGroups).forEach(([key, group]) => {
    if (key && group.length > 1) conflicts.push(conflict('duplicate organizations', group.map((item) => item.entityId), [], `Multiple organizations share ${key}.`));
  });
  facts.forEach((factItem) => {
    if (factItem.confidence < 45) conflicts.push(conflict('low-confidence fact', [factItem.entityId], [factItem.factId], `${factItem.factType} has ${factItem.confidence}% confidence.`));
    if (factItem.verificationStatus !== 'verified') conflicts.push(conflict('missing verification', [factItem.entityId], [factItem.factId], `${factItem.factType} is ${factItem.verificationStatus}.`));
    if (factItem.supersededBy) conflicts.push(conflict('outdated fact', [factItem.entityId], [factItem.factId], `${factItem.factType} was superseded.`));
  });
  return uniqueBy(conflicts, (item) => item.conflictId);
}

function entity(entityType: SharedMemoryEntityType, entityId: string, displayName: string, owningAgent: string, relatedAgents: string[], confidence: number, riskRating: string, status: string, aliases: Array<string | undefined>, tags: Array<string | undefined>, sourceReferences: Array<string | undefined>): SharedMemoryEntity {
  const now = new Date().toISOString();
  return { aliases: aliases.filter(Boolean) as string[], archivedDate: null, auditHistory: ['entity_recorded'], confidence: clamp(confidence), createdDate: now, displayName, entityId, entityType, owningAgent, relatedAgents: relatedAgents.filter(Boolean), riskRating, sourceReferences: sourceReferences.filter(Boolean) as string[], status, tags: tags.filter(Boolean) as string[], updatedDate: now };
}

function fact(entityId: string, factType: string, value: string | number, source: string, confidence: number, evidenceLevel: string, createdBy: string): SharedMemoryFact {
  const now = new Date().toISOString();
  return { auditTrail: ['fact_recorded'], confidence: clamp(confidence), createdBy, createdDate: now, entityId, evidenceLevel, factId: `fact:${slug(entityId)}:${slug(factType)}`, factType, source, supersededBy: null, updatedDate: now, value, verificationStatus: confidence >= 70 ? 'verified' : 'pending_review', verifiedBy: confidence >= 70 ? createdBy : null };
}

function relationship(fromEntity: string, toEntity: string, relationshipType: string, source: string, confidence: number, createdBy: string): SharedMemoryRelationship {
  const now = new Date().toISOString();
  return { auditTrail: ['relationship_recorded'], confidence: clamp(confidence), createdBy, createdDate: now, direction: 'directed', fromEntity, relationshipId: `rel:${slug(fromEntity)}:${slug(relationshipType)}:${slug(toEntity)}`, relationshipType, source, toEntity, updatedDate: now };
}

function conflict(conflictType: string, entityIds: string[], factIds: string[], description: string): SharedMemoryConflict {
  return { autoResolved: false, conflictId: `conflict:${slug(conflictType)}:${slug(entityIds.join('-'))}:${slug(factIds.join('-') || 'entity')}`, conflictType, createdDate: new Date().toISOString(), description, entityIds, factIds, recommendedReviewAction: 'Review manually; do not merge or overwrite automatically.', relationshipIds: [], reviewedAt: null, reviewedBy: null, severity: conflictType.includes('duplicate') ? 'medium' : 'low', status: 'open' };
}

function groupBy<T>(items: T[], keyer: (_item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyer(item);
    if (!key) return acc;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

function uniqueBy<T>(items: T[], keyer: (_item: T) => string): T[] {
  return [...new Map(items.map((item) => [keyer(item), item])).values()];
}

function average(values: number[]) {
  const nums = values.filter(Number.isFinite);
  return nums.length ? Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length) : 0;
}

function clamp(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 50;
}

function slug(value: string) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'item';
}

function normalize(value: string) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
