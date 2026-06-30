import type { ExecutivePriority } from '../agents/executive/executiveTypes';
import type { MigrationSummary } from '../agents/migration/migrationTypes';
import type {
  FollowUpQueueItem,
  ProposalPrep,
  SalesIntelligenceGraph,
  SalesProposalDraft,
  SalesResearchDossier,
} from '../agents/sales/salesTypes';
import type { LocalReport } from '../storage/reportExport';
import type { AgentRuntimeSnapshot } from './runtimeTypes';

export type CrossAgentEntityType =
  | 'organization'
  | 'prospect'
  | 'coach'
  | 'gym'
  | 'proposal'
  | 'migration_plan'
  | 'feature_request'
  | 'engineering_blocker'
  | 'follow_up'
  | 'activity'
  | 'executive_priority';

export type CrossAgentRelationshipType =
  | 'requested_feature'
  | 'blocked_by'
  | 'related_to_migration'
  | 'sales_opportunity_for'
  | 'executive_priority_for'
  | 'requires_follow_up'
  | 'needs_approval'
  | 'ready_for_review';

export interface CrossAgentEntity {
  agent: 'Sales' | 'Migration' | 'Engineering' | 'Executive' | 'Support' | 'Success';
  id: string;
  label: string;
  localOnly: true;
  metadata: Record<string, string | number | boolean | null>;
  type: CrossAgentEntityType;
}

export interface CrossAgentRelationship {
  explanation: string;
  from: string;
  id: string;
  relationship: CrossAgentRelationshipType;
  to: string;
}

export interface CrossAgentCollaborationGraph {
  entities: CrossAgentEntity[];
  generatedAt: string;
  localOnly: true;
  relationships: CrossAgentRelationship[];
}

export interface CrossAgentCollaborationSummary {
  activeSignals: number;
  approvalNeededItems: number;
  featureRequestsTiedToProspects: number;
  highValueOpportunitiesBlockedByEngineering: number;
  migrationsTiedToActiveSalesOpportunities: number;
  organizationsNeedingExecutiveReview: number;
  proposalsNeedingApproval: number;
  relationshipCount: number;
}

export function buildCrossAgentCollaborationGraph(input: {
  executivePriorities: ExecutivePriority[];
  followUps: FollowUpQueueItem[];
  migrationSummary: MigrationSummary;
  proposals: ProposalPrep[];
  proposalDrafts: SalesProposalDraft[];
  runtime: AgentRuntimeSnapshot;
  salesDossiers: SalesResearchDossier[];
  salesGraph: SalesIntelligenceGraph;
}): CrossAgentCollaborationGraph {
  const entities: CrossAgentEntity[] = [];
  const relationships: CrossAgentRelationship[] = [];
  const engineeringHealth = input.runtime.health.engineering;
  const engineeringBlocked = (engineeringHealth?.warnings ?? 0) > 0 || (engineeringHealth?.pendingTasks ?? 0) > 0 || (engineeringHealth?.errors ?? 0) > 0;
  const engineeringBlockerId = 'engineering:blocker:local-health';

  if (engineeringBlocked) {
    entities.push(entity(engineeringBlockerId, 'engineering_blocker', 'Engineering local readiness blocker', 'Engineering', {
      errors: engineeringHealth?.errors ?? 0,
      pendingTasks: engineeringHealth?.pendingTasks ?? 0,
      warnings: engineeringHealth?.warnings ?? 0,
    }));
  }

  input.salesGraph.organizationProfiles.forEach((profile) => {
    entities.push(entity(profile.id, 'organization', profile.label, 'Sales', {
      completenessScore: profile.completenessScore,
      migrationReadiness: profile.migrationReadiness,
      relationshipDepth: profile.relationshipDepth,
    }));
    if (profile.activeOpportunity) {
      const opportunityId = `sales:opportunity:${profile.id}`;
      entities.push(entity(opportunityId, 'prospect', `${profile.label} opportunity`, 'Sales', {
        activeOpportunity: true,
        relationshipDepth: profile.relationshipDepth,
      }));
      relate(relationships, opportunityId, profile.id, 'sales_opportunity_for', 'Sales intelligence marks this organization as an active local opportunity.');
      if (engineeringBlocked) {
        relate(relationships, opportunityId, engineeringBlockerId, 'blocked_by', 'High-value opportunity may depend on Engineering readiness before future external motion.');
      }
    }
    if (profile.migrationReadiness === 'planned' || profile.migrationReadiness === 'ready') {
      const migrationId = `migration:plan:${profile.id}`;
      entities.push(entity(migrationId, 'migration_plan', `${profile.label} migration readiness`, 'Migration', {
        readiness: profile.migrationReadiness,
        totalImported: input.migrationSummary.totalImported,
      }));
      relate(relationships, profile.id, migrationId, 'related_to_migration', 'Organization has local migration readiness or proposal-linked migration need.');
    }
    if (profile.completenessScore < 75 || profile.relationshipDepth > 3) {
      const priorityId = `executive:priority:${profile.id}`;
      entities.push(entity(priorityId, 'executive_priority', `${profile.label} executive review`, 'Executive', {
        completenessScore: profile.completenessScore,
        relationshipDepth: profile.relationshipDepth,
      }));
      relate(relationships, priorityId, profile.id, 'executive_priority_for', 'Organization needs Executive review based on completeness or relationship depth.');
    }
  });

  input.salesDossiers.forEach((dossier) => {
    dossier.likelyPainPoints.forEach((point, index) => {
      if (!/member|app|schedule|communication|migration|class|onboarding/i.test(point)) return;
      const featureId = `feature:${dossier.dossierId}:${index}`;
      entities.push(entity(featureId, 'feature_request', point, 'Sales', {
        fitScore: dossier.fitScore,
        intakeId: dossier.intakeId,
      }));
      relate(relationships, `prospect:${dossier.intakeId}`, featureId, 'requested_feature', 'Research dossier pain point implies a possible feature request for future Product/Engineering review.');
    });
  });

  input.proposals.forEach((proposal) => {
    const proposalId = `proposal:${proposal.leadId}`;
    entities.push(entity(proposalId, 'proposal', proposal.recommendedProduct, 'Sales', {
      monthlyFee: proposal.monthlyFee,
      status: proposal.status,
    }));
    if (proposal.status === 'needed' || proposal.migrationNeeded) {
      relate(relationships, proposalId, `executive:approval:${proposal.leadId}`, 'needs_approval', 'Proposal prep or migration need requires local review before any future external use.');
      entities.push(entity(`executive:approval:${proposal.leadId}`, 'executive_priority', `${proposal.recommendedProduct} approval`, 'Executive', {
        approvalNeeded: true,
      }));
    }
  });

  input.proposalDrafts.forEach((draft) => {
    entities.push(entity(draft.draftId, 'proposal', draft.title, 'Sales', {
      status: draft.status,
      estimatedValue: draft.estimatedValue,
    }));
    if (draft.status === 'ready_for_review' || draft.status === 'risk_review' || draft.riskFlags.length > 0) {
      const approvalId = `executive:approval:${draft.draftId}`;
      entities.push(entity(approvalId, 'executive_priority', `${draft.title} approval`, 'Executive', { approvalNeeded: true }));
      relate(relationships, draft.draftId, approvalId, 'ready_for_review', 'Proposal draft is local-only and ready for human review.');
    }
  });

  input.followUps.forEach((followUp) => {
    const followUpId = `follow_up:${followUp.leadId}:${followUp.queue}`;
    entities.push(entity(followUpId, 'follow_up', followUp.nextAction, 'Sales', {
      priority: followUp.priorityLabel,
      queue: followUp.queue,
    }));
    relate(relationships, followUpId, `org:lead:${followUp.leadId}`, 'requires_follow_up', 'Follow-up queue item links Sales action to a local organization opportunity.');
  });

  input.executivePriorities.forEach((priority) => {
    const priorityId = `executive:priority:${priority.id}`;
    entities.push(entity(priorityId, 'executive_priority', priority.detail, 'Executive', {
      priority: priority.priority,
      source: priority.source,
    }));
  });

  return {
    entities: dedupeEntities(entities),
    generatedAt: new Date().toISOString(),
    localOnly: true,
    relationships: dedupeRelationships(relationships),
  };
}

export function summarizeCrossAgentCollaboration(graph: CrossAgentCollaborationGraph): CrossAgentCollaborationSummary {
  const highValueOpportunitiesBlockedByEngineering = graph.relationships.filter((item) => item.relationship === 'blocked_by').length;
  const migrationsTiedToActiveSalesOpportunities = graph.relationships.filter((item) => item.relationship === 'related_to_migration').length;
  const proposalsNeedingApproval = graph.relationships.filter((item) => item.relationship === 'needs_approval' || item.relationship === 'ready_for_review').length;
  const featureRequestsTiedToProspects = graph.relationships.filter((item) => item.relationship === 'requested_feature').length;
  const organizationsNeedingExecutiveReview = graph.relationships.filter((item) => item.relationship === 'executive_priority_for').length;

  return {
    activeSignals: graph.entities.filter((item) => item.type === 'executive_priority' || item.type === 'engineering_blocker').length,
    approvalNeededItems: proposalsNeedingApproval,
    featureRequestsTiedToProspects,
    highValueOpportunitiesBlockedByEngineering,
    migrationsTiedToActiveSalesOpportunities,
    organizationsNeedingExecutiveReview,
    proposalsNeedingApproval,
    relationshipCount: graph.relationships.length,
  };
}

export function buildCrossAgentCollaborationReport(graph: CrossAgentCollaborationGraph, summary: CrossAgentCollaborationSummary): LocalReport {
  return {
    title: 'Cross-Agent Collaboration Report',
    slug: 'cross-agent-collaboration-report',
    summary: {
      ...summary,
      localOnly: 'Yes',
      productionWritesOccurred: 'No',
    },
    sections: [
      { title: 'Entities', rows: graph.entities },
      { title: 'Relationships', rows: graph.relationships },
    ],
  };
}

export function buildCrossAgentGraphReport(graph: CrossAgentCollaborationGraph): LocalReport {
  return {
    title: 'Cross-Agent Graph',
    slug: 'cross-agent-graph',
    summary: {
      entities: graph.entities.length,
      relationships: graph.relationships.length,
      generatedAt: graph.generatedAt,
      localOnly: 'Yes',
      productionWritesOccurred: 'No',
    },
    sections: [
      { title: 'Entities', rows: graph.entities },
      { title: 'Relationships', rows: graph.relationships },
    ],
  };
}

export function buildExecutivePriorityQueueReport(graph: CrossAgentCollaborationGraph): LocalReport {
  return {
    title: 'Executive Priority Queue',
    slug: 'executive-priority-queue',
    summary: {
      priorityItems: graph.entities.filter((item) => item.type === 'executive_priority').length,
      localOnly: 'Yes',
      productionWritesOccurred: 'No',
    },
    rows: graph.entities.filter((item) => item.type === 'executive_priority'),
  };
}

function entity(
  id: string,
  type: CrossAgentEntityType,
  label: string,
  agent: CrossAgentEntity['agent'],
  metadata: CrossAgentEntity['metadata'],
): CrossAgentEntity {
  return { agent, id, label, localOnly: true, metadata, type };
}

function relate(
  relationships: CrossAgentRelationship[],
  from: string,
  to: string,
  relationship: CrossAgentRelationshipType,
  explanation: string,
): void {
  relationships.push({ explanation, from, id: `${relationship}:${from}->${to}`, relationship, to });
}

function dedupeEntities(entities: CrossAgentEntity[]): CrossAgentEntity[] {
  return Array.from(new Map(entities.map((item) => [item.id, item])).values());
}

function dedupeRelationships(relationships: CrossAgentRelationship[]): CrossAgentRelationship[] {
  return Array.from(new Map(relationships.map((item) => [item.id, item])).values());
}
