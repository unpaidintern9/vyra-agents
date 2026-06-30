import type { LocalReport } from '../../storage/reportExport';
import type {
  FollowUpQueueItem,
  ProposalPrep,
  SalesActivity,
  SalesIntelligenceEdge,
  SalesIntelligenceGraph,
  SalesIntelligenceNode,
  SalesIntelligenceRelationshipType,
  SalesIntelligenceSummary,
  SalesLead,
  SalesOrganizationProfile,
  SalesOrganizationTimelineItem,
  SalesProposalDraft,
  SalesProspectIntake,
  SalesResearchDossier,
} from './salesTypes';

export function buildSalesIntelligenceGraph(input: {
  activities: SalesActivity[];
  followUpQueue: FollowUpQueueItem[];
  leads: SalesLead[];
  proposalDrafts: SalesProposalDraft[];
  proposals: ProposalPrep[];
  prospectDossiers: SalesResearchDossier[];
  prospectIntakes: SalesProspectIntake[];
}): SalesIntelligenceGraph {
  const nodes: SalesIntelligenceNode[] = [];
  const edges: SalesIntelligenceEdge[] = [];

  input.prospectIntakes.forEach((intake) => {
    const organizationId = organizationNodeId(intake.id);
    nodes.push(node(organizationId, 'organization', intake.gymName, {
      city: intake.city,
      state: intake.state,
      businessType: intake.businessType,
      migrationComplexity: intake.migrationComplexity,
    }));
    nodes.push(node(`prospect:${intake.id}`, 'prospect', intake.contactName || `${intake.gymName} prospect`, {
      emailPresent: Boolean(intake.contactEmail),
      phonePresent: Boolean(intake.contactPhone),
      websitePresent: Boolean(intake.websiteUrl),
    }));
    edge(edges, `prospect:${intake.id}`, organizationId, 'interested_in', 'Prospect intake links this contact to the organization.');
    if (intake.contactName) edge(edges, `prospect:${intake.id}`, organizationId, 'owns', 'Owner/contact name was captured on the intake.');
    if (intake.estimatedCoaches) {
      edge(edges, organizationId, `coach_group:${intake.id}`, 'employs', 'Estimated coaches imply a local coaching team.');
      nodes.push(node(`coach_group:${intake.id}`, 'coach', `${intake.gymName} coaches`, { estimatedCoaches: intake.estimatedCoaches }));
    }
    if (intake.migrationComplexity !== 'unknown') {
      nodes.push(node(`migration:${intake.id}`, 'migration_plan', `${intake.gymName} migration`, { complexity: intake.migrationComplexity }));
      edge(edges, organizationId, `migration:${intake.id}`, 'migration_target', 'Migration complexity was captured during prospect intake.');
    }
  });

  input.leads.forEach((lead) => {
    const organizationId = `org:lead:${lead.id}`;
    nodes.push(node(organizationId, 'organization', lead.businessName || lead.name, {
      estimatedValue: lead.estimatedValue,
      location: lead.location,
      stage: lead.pipelineStage,
    }));
    nodes.push(node(`prospect:lead:${lead.id}`, lead.leadType === 'coach' ? 'coach' : 'prospect', lead.contactName || lead.name, {
      emailPresent: Boolean(lead.email),
      phonePresent: Boolean(lead.phone),
      source: lead.source,
    }));
    edge(edges, `prospect:lead:${lead.id}`, organizationId, lead.leadType === 'coach' ? 'manages' : 'interested_in', 'Local lead record links contact and organization.');
    if (/referral/i.test(lead.source) || lead.leadType === 'referral') {
      edge(edges, organizationId, `prospect:lead:${lead.id}`, 'referred_by', 'Lead source indicates a referral path.');
    }
  });

  input.prospectDossiers.forEach((dossier) => {
    const organizationId = organizationNodeId(dossier.intakeId);
    nodes.push(node(dossier.dossierId, 'research_dossier', `Dossier: ${dossier.recommendedVyraProduct}`, {
      fitScore: dossier.fitScore,
      icpFit: dossier.icpFit,
      highFit: dossier.highFit,
    }));
    edge(edges, dossier.dossierId, organizationId, 'interested_in', 'Research dossier was generated from this organization intake.');
  });

  input.proposals.forEach((proposal) => {
    const organizationId = `org:lead:${proposal.leadId}`;
    nodes.push(node(`proposal:${proposal.leadId}`, 'proposal', proposal.recommendedProduct, {
      monthlyFee: proposal.monthlyFee,
      setupFee: proposal.setupFee,
      status: proposal.status,
    }));
    edge(edges, `proposal:${proposal.leadId}`, organizationId, 'proposal_for', 'Proposal prep is linked to this local lead organization.');
    if (proposal.migrationNeeded) edge(edges, organizationId, `proposal:${proposal.leadId}`, 'migration_target', 'Proposal prep flags migration need.');
  });

  input.proposalDrafts.forEach((draft) => {
    const organizationId = `org:lead:${draft.leadId}`;
    nodes.push(node(draft.draftId, 'proposal', draft.title, { status: draft.status, estimatedValue: draft.estimatedValue }));
    edge(edges, draft.draftId, organizationId, 'proposal_for', 'Proposal draft was generated locally for this lead.');
  });

  input.followUpQueue.forEach((followUp) => {
    const organizationId = `org:lead:${followUp.leadId}`;
    nodes.push(node(`follow_up:${followUp.leadId}:${followUp.queue}`, 'follow_up', followUp.nextAction, {
      dueDate: followUp.dueDate,
      priority: followUp.priorityLabel,
      queue: followUp.queue,
    }));
    edge(edges, `follow_up:${followUp.leadId}:${followUp.queue}`, organizationId, 'follow_up_for', 'Follow-up queue item was derived from local lead state.');
  });

  input.activities.forEach((activity) => {
    const organizationId = `org:lead:${activity.leadId}`;
    nodes.push(node(activity.id, 'activity', activity.summary, { activityType: activity.activityType, timestamp: activity.timestamp }));
    edge(edges, activity.id, organizationId, 'manages', 'Sales activity belongs to this local lead organization.');
  });

  const dedupedNodes = dedupeNodes(nodes);
  const dedupedEdges = dedupeEdges(edges).filter((edgeItem) => dedupedNodes.some((item) => item.id === edgeItem.from) && dedupedNodes.some((item) => item.id === edgeItem.to));

  return {
    edges: dedupedEdges,
    generatedAt: new Date().toISOString(),
    localOnly: true,
    nodes: dedupedNodes,
    organizationProfiles: buildOrganizationProfiles(dedupedNodes, dedupedEdges, input),
  };
}

export function summarizeSalesIntelligenceGraph(graph: SalesIntelligenceGraph): SalesIntelligenceSummary {
  const organizationsTracked = graph.organizationProfiles.length;
  const averageRelationshipDepth = organizationsTracked
    ? Math.round(graph.organizationProfiles.reduce((total, profile) => total + profile.relationshipDepth, 0) / organizationsTracked)
    : 0;
  const proposalCoverage = organizationsTracked
    ? Math.round((graph.organizationProfiles.filter((profile) => profile.connectedProposalIds.length > 0).length / organizationsTracked) * 100)
    : 0;
  const intelligenceCompletenessScore = organizationsTracked
    ? Math.round(graph.organizationProfiles.reduce((total, profile) => total + profile.completenessScore, 0) / organizationsTracked)
    : 0;

  return {
    activeOpportunities: graph.organizationProfiles.filter((profile) => profile.activeOpportunity).length,
    averageRelationshipDepth,
    intelligenceCompletenessScore,
    migrationReadyOrganizations: graph.organizationProfiles.filter((profile) => profile.migrationReadiness === 'ready' || profile.migrationReadiness === 'planned').length,
    organizationsTracked,
    proposalCoverage,
  };
}

export function buildOrganizationIntelligenceReport(graph: SalesIntelligenceGraph, organizationId: string): LocalReport {
  const profile = graph.organizationProfiles.find((item) => item.id === organizationId) ?? graph.organizationProfiles[0];
  return {
    title: `${profile?.label ?? 'Sales'} Organization Intelligence Report`,
    slug: `sales-organization-intelligence-${slugify(profile?.label ?? 'organization')}`,
    summary: profile
      ? {
          organization: profile.label,
          completenessScore: profile.completenessScore,
          relationshipDepth: profile.relationshipDepth,
          migrationReadiness: profile.migrationReadiness,
          activeOpportunity: profile.activeOpportunity ? 'Yes' : 'No',
          localOnly: 'Yes',
          productionWritesOccurred: 'No',
        }
      : {},
    sections: profile
      ? [
          { title: 'Profile', rows: [profile] },
          { title: 'Timeline', rows: profile.timeline },
          { title: 'Relationships', rows: graph.edges.filter((edgeItem) => edgeItem.from === profile.id || edgeItem.to === profile.id) },
        ]
      : [],
  };
}

export function buildSalesIntelligenceGraphReport(graph: SalesIntelligenceGraph): LocalReport {
  return {
    title: 'Sales Intelligence Graph',
    slug: 'sales-intelligence-graph',
    summary: {
      generatedAt: graph.generatedAt,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      organizations: graph.organizationProfiles.length,
      localOnly: 'Yes',
      productionWritesOccurred: 'No',
    },
    sections: [
      { title: 'Nodes', rows: graph.nodes },
      { title: 'Relationships', rows: graph.edges },
      { title: 'Organization Profiles', rows: graph.organizationProfiles },
    ],
  };
}

export function buildOrganizationTimelineReport(graph: SalesIntelligenceGraph, organizationId: string): LocalReport {
  const profile = graph.organizationProfiles.find((item) => item.id === organizationId) ?? graph.organizationProfiles[0];
  return {
    title: `${profile?.label ?? 'Sales'} Organization Timeline`,
    slug: `sales-organization-timeline-${slugify(profile?.label ?? 'organization')}`,
    summary: profile
      ? {
          organization: profile.label,
          timelineItems: profile.timeline.length,
          localOnly: 'Yes',
          productionWritesOccurred: 'No',
        }
      : {},
    rows: profile?.timeline ?? [],
  };
}

function buildOrganizationProfiles(
  nodes: SalesIntelligenceNode[],
  edges: SalesIntelligenceEdge[],
  input: {
    activities: SalesActivity[];
    followUpQueue: FollowUpQueueItem[];
    leads: SalesLead[];
    proposalDrafts: SalesProposalDraft[];
    proposals: ProposalPrep[];
    prospectDossiers: SalesResearchDossier[];
    prospectIntakes: SalesProspectIntake[];
  },
): SalesOrganizationProfile[] {
  return nodes
    .filter((nodeItem) => nodeItem.type === 'organization')
    .map((organization) => {
      const relatedEdges = edges.filter((edgeItem) => edgeItem.from === organization.id || edgeItem.to === organization.id);
      const connectedIds = new Set(relatedEdges.flatMap((edgeItem) => [edgeItem.from, edgeItem.to]).filter((id) => id !== organization.id));
      const connectedProposals = [...connectedIds].filter((id) => nodes.find((nodeItem) => nodeItem.id === id)?.type === 'proposal');
      const connectedDossiers = [...connectedIds].filter((id) => nodes.find((nodeItem) => nodeItem.id === id)?.type === 'research_dossier');
      const connectedFollowUps = [...connectedIds].filter((id) => nodes.find((nodeItem) => nodeItem.id === id)?.type === 'follow_up');
      const timeline = buildTimeline(organization, input);
      const migrationReadiness = migrationReadinessFor(organization.id, input);
      const completenessScore = Math.min(
        100,
        30 +
          Math.min(30, relatedEdges.length * 5) +
          (connectedDossiers.length ? 15 : 0) +
          (connectedProposals.length ? 15 : 0) +
          (migrationReadiness === 'ready' || migrationReadiness === 'planned' ? 10 : 0),
      );

      return {
        activeOpportunity: connectedProposals.length > 0 || connectedFollowUps.length > 0 || connectedDossiers.length > 0,
        completenessScore,
        connectedDossierIds: connectedDossiers,
        connectedFollowUpIds: connectedFollowUps,
        connectedProposalIds: connectedProposals,
        id: organization.id,
        label: organization.label,
        localOnly: true,
        migrationReadiness,
        profileSummary: `${organization.label} has ${relatedEdges.length} local relationship(s), ${connectedProposals.length} proposal link(s), and ${connectedDossiers.length} dossier link(s).`,
        relationshipDepth: relatedEdges.length,
        timeline,
      };
    });
}

function buildTimeline(
  organization: SalesIntelligenceNode,
  input: {
    activities: SalesActivity[];
    followUpQueue: FollowUpQueueItem[];
    leads: SalesLead[];
    proposalDrafts: SalesProposalDraft[];
    proposals: ProposalPrep[];
    prospectDossiers: SalesResearchDossier[];
    prospectIntakes: SalesProspectIntake[];
  },
): SalesOrganizationTimelineItem[] {
  const items: SalesOrganizationTimelineItem[] = [];
  const intake = input.prospectIntakes.find((item) => organization.id === organizationNodeId(item.id));
  const lead = input.leads.find((item) => organization.id === `org:lead:${item.id}`);
  if (intake) {
    items.push(timelineItem(organization.id, 'intake_created', 'Intake Created', `${intake.gymName} intake saved locally.`, intake.createdAt));
    const dossier = input.prospectDossiers.find((item) => item.intakeId === intake.id);
    if (dossier) {
      items.push(timelineItem(organization.id, 'research_completed', 'Research Completed', `${dossier.recommendedVyraProduct} dossier generated locally.`, dossier.createdAt));
    }
    if (intake.migrationComplexity !== 'unknown') {
      items.push(timelineItem(organization.id, 'migration_planned', 'Migration Planned', `${intake.migrationComplexity} migration complexity captured.`, intake.updatedAt));
    }
  }
  if (lead) {
    items.push(timelineItem(organization.id, 'executive_review', 'Executive Review', `${lead.pipelineStage.replace(/_/g, ' ')} opportunity is visible to Executive.`, lead.updatedAt));
    input.proposals
      .filter((proposal) => proposal.leadId === lead.id)
      .forEach((proposal) =>
        items.push(timelineItem(organization.id, 'proposal_drafted', 'Proposal Drafted', `${proposal.recommendedProduct} proposal prep exists.`, lead.updatedAt)),
      );
    input.proposalDrafts
      .filter((draft) => draft.leadId === lead.id)
      .forEach((draft) => items.push(timelineItem(organization.id, 'proposal_drafted', 'Proposal Drafted', `${draft.title} generated locally.`, draft.createdAt)));
    input.followUpQueue
      .filter((followUp) => followUp.leadId === lead.id)
      .forEach((followUp) =>
        items.push(timelineItem(organization.id, 'follow_up_scheduled', 'Follow-Up Scheduled', followUp.nextAction, followUp.dueDate ?? lead.updatedAt)),
      );
  }
  input.activities
    .filter((activity) => lead && activity.leadId === lead.id)
    .forEach((activity) => items.push(timelineItem(organization.id, 'executive_review', 'Activity Logged', activity.summary, activity.timestamp)));
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function migrationReadinessFor(
  organizationId: string,
  input: { leads: SalesLead[]; proposals: ProposalPrep[]; prospectIntakes: SalesProspectIntake[] },
): SalesOrganizationProfile['migrationReadiness'] {
  const intake = input.prospectIntakes.find((item) => organizationId === organizationNodeId(item.id));
  if (intake?.migrationComplexity === 'high' || intake?.migrationComplexity === 'medium') return 'planned';
  if (intake?.migrationComplexity === 'low') return 'ready';
  const lead = input.leads.find((item) => organizationId === `org:lead:${item.id}`);
  if (lead && input.proposals.some((proposal) => proposal.leadId === lead.id && proposal.migrationNeeded)) return 'planned';
  return intake || lead ? 'needs_info' : 'not_applicable';
}

function node(id: string, type: SalesIntelligenceNode['type'], label: string, metadata: SalesIntelligenceNode['metadata']): SalesIntelligenceNode {
  return { id, label, localOnly: true, metadata, type };
}

function edge(edges: SalesIntelligenceEdge[], from: string, to: string, relationship: SalesIntelligenceRelationshipType, explanation: string): void {
  edges.push({ explanation, from, id: `${relationship}:${from}->${to}`, relationship, to });
}

function timelineItem(
  organizationId: string,
  type: SalesOrganizationTimelineItem['type'],
  title: string,
  detail: string,
  timestamp: string,
): SalesOrganizationTimelineItem {
  return { detail, id: `${organizationId}:${type}:${timestamp}:${detail}`, organizationId, timestamp, title, type };
}

function dedupeNodes(nodes: SalesIntelligenceNode[]): SalesIntelligenceNode[] {
  return Array.from(new Map(nodes.map((item) => [item.id, item])).values());
}

function dedupeEdges(edges: SalesIntelligenceEdge[]): SalesIntelligenceEdge[] {
  return Array.from(new Map(edges.map((item) => [item.id, item])).values());
}

function organizationNodeId(intakeId: string): string {
  return `org:intake:${intakeId}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
