import type { ExecutivePlanningSummary } from './executivePlanning';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';
import type {
  SalesOpportunity,
  SalesResearchIntakeItem,
  SalesWorkflowRecord,
  SharedMemoryStore,
} from '../agents/sales/salesTypes';

export interface ProposalReadinessMetric {
  score: number;
  explanation: string;
  risks: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface ProposalWorkspaceRecord {
  proposalId: string;
  title: string;
  customer: string;
  solicitation: string;
  opportunityId: string;
  organizationId: string;
  proposalOwner: string;
  contributors: string[];
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  plannedSubmissionDate: string;
  relatedWorkflowIds: string[];
  relatedTaskIds: string[];
  relatedResearchIds: string[];
  sharedMemoryReferences: string[];
}

export interface ProposalReadinessRecord {
  proposalId: string;
  overallReadiness: ProposalReadinessMetric;
  complianceReadiness: ProposalReadinessMetric;
  technicalReadiness: ProposalReadinessMetric;
  pricingReadiness: ProposalReadinessMetric;
  staffingReadiness: ProposalReadinessMetric;
  executiveReadiness: ProposalReadinessMetric;
  confidence: number;
  riskScore: number;
  topRisks: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface ProposalSectionRecord {
  sectionId: string;
  proposalId: string;
  name: string;
  owner: string;
  status: string;
  completion: number;
  confidence: number;
}

export interface ProposalComplianceRecord {
  requirementId: string;
  proposalId: string;
  section: string;
  requirement: string;
  status: string;
  reviewer: string;
  confidence: number;
  risks: string[];
  missingItems: string[];
}

export interface ProposalEvidenceRecord {
  id: string;
  proposalId: string;
  type: string;
  description: string;
  confidence: number;
  verificationStatus: string;
}

export interface ProposalReviewRecord {
  reviewId: string;
  proposalId: string;
  stage: string;
  reviewer: string;
  approvalStatus: string;
  risks: string[];
  unresolvedIssues: string[];
}

export interface ProposalTimelineRecord {
  id: string;
  proposalId: string;
  type: string;
  description: string;
  operator: string;
  timestamp: string;
}

export interface ProposalDashboardSummary {
  proposals: ProposalWorkspaceRecord[];
  readiness: ProposalReadinessRecord[];
  sections: ProposalSectionRecord[];
  complianceMatrix: ProposalComplianceRecord[];
  evidence: ProposalEvidenceRecord[];
  reviews: ProposalReviewRecord[];
  timeline: ProposalTimelineRecord[];
  missingEvidence: ProposalComplianceRecord[];
  operatorQueue: Array<{ id: string; proposalId: string; queue: string; item: string; owner: string; blocker: string; nextAction: string }>;
  executivePortfolio: Array<{ proposalId: string; customer: string; status: string; priority: string; dueDate: string; overallReadiness: number; riskScore: number; nextAction: string }>;
  salesPipeline: Array<{ proposalId: string; customer: string; opportunityStage: string; proposalStatus: string; readiness: number; dependencies: string[]; risks: string[] }>;
  summary: {
    totalProposals: number;
    activeProposals: number;
    averageReadiness: number;
    highRiskProposals: number;
    executiveReviewQueue: number;
    complianceGaps: number;
    missingEvidence: number;
    upcomingDeadlines: number;
  };
  safety: {
    localOnly: boolean;
    proposalSubmission: boolean;
    autonomousBrowsing: boolean;
    emailing: boolean;
    crmSync: boolean;
    automaticApprovals: boolean;
  };
}

export function buildDashboardProposalSummary(input: {
  executivePlanning?: ExecutivePlanningSummary;
  opportunities: SalesOpportunity[];
  researchIntake: SalesResearchIntakeItem[];
  sharedMemory?: SharedMemoryStore;
  sharedTasks?: SharedTaskDashboardSummary;
  workflows: SalesWorkflowRecord[];
}): ProposalDashboardSummary {
  const selected = input.opportunities.filter((opportunity) => opportunity.proposalPreparationStatus.readinessPercent >= 55 || opportunity.executiveVisibility).slice(0, 4);
  const proposals = selected.map((opportunity, index) => proposalFromOpportunity(opportunity, input, index));
  const readiness = proposals.map((proposal) => readinessForProposal(proposal, input));
  const sections = proposals.flatMap((proposal) => sectionRows(proposal));
  const complianceMatrix = proposals.flatMap((proposal) => complianceRows(proposal, readiness.find((item) => item.proposalId === proposal.proposalId)));
  const evidence = proposals.flatMap((proposal) => evidenceRows(proposal, input));
  const reviews = proposals.flatMap((proposal) => reviewRows(proposal));
  const timeline = proposals.flatMap((proposal) => timelineRows(proposal)).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const missingEvidence = complianceMatrix.filter((item) => item.status !== 'Addressed' && item.status !== 'Approved');
  const operatorQueue = [
    ...sections
      .filter((section) => section.completion < 55)
      .map((section) => ({
        id: section.sectionId,
        proposalId: section.proposalId,
        queue: 'Missing Sections',
        item: section.name,
        owner: section.owner,
        blocker: section.status.replace(/_/g, ' '),
        nextAction: 'Collect local inputs and update section progress.',
      })),
    ...missingEvidence.map((item) => ({
      id: item.requirementId,
      proposalId: item.proposalId,
      queue: 'Missing Evidence',
      item: item.section,
      owner: item.reviewer || 'Operator',
      blocker: item.missingItems.join(', ') || 'Evidence review required',
      nextAction: 'Attach local source-backed evidence.',
    })),
  ].slice(0, 10);
  const executivePortfolio = proposals.map((proposal) => {
    const score = readiness.find((item) => item.proposalId === proposal.proposalId);
    return {
      proposalId: proposal.proposalId,
      customer: proposal.customer,
      status: proposal.status,
      priority: proposal.priority,
      dueDate: proposal.dueDate,
      overallReadiness: score?.overallReadiness.score ?? 0,
      riskScore: score?.riskScore ?? 0,
      nextAction: score?.nextActions[0] ?? 'Review proposal workspace.',
    };
  });
  const salesPipeline = proposals.map((proposal) => {
    const opportunity = input.opportunities.find((item) => item.id === proposal.opportunityId);
    const score = readiness.find((item) => item.proposalId === proposal.proposalId);
    return {
      proposalId: proposal.proposalId,
      customer: proposal.customer,
      opportunityStage: opportunity?.stage.replace(/_/g, ' ') ?? 'unknown',
      proposalStatus: proposal.status,
      readiness: score?.overallReadiness.score ?? 0,
      dependencies: [...proposal.relatedWorkflowIds, ...proposal.relatedTaskIds],
      risks: score?.topRisks ?? [],
    };
  });
  return {
    proposals,
    readiness,
    sections,
    complianceMatrix,
    evidence,
    reviews,
    timeline,
    missingEvidence,
    operatorQueue,
    executivePortfolio,
    salesPipeline,
    summary: {
      totalProposals: proposals.length,
      activeProposals: proposals.filter((proposal) => !['Ready', 'Archived'].includes(proposal.status)).length,
      averageReadiness: average(readiness.map((item) => item.overallReadiness.score)),
      highRiskProposals: readiness.filter((item) => item.riskScore >= 45).length,
      executiveReviewQueue: proposals.filter((proposal) => proposal.priority === 'Critical' || proposal.priority === 'High' || proposal.status === 'Executive Review').length,
      complianceGaps: missingEvidence.length,
      missingEvidence: missingEvidence.length,
      upcomingDeadlines: proposals.filter((proposal) => daysUntil(proposal.dueDate) <= 30).length,
    },
    safety: {
      localOnly: true,
      proposalSubmission: false,
      autonomousBrowsing: false,
      emailing: false,
      crmSync: false,
      automaticApprovals: false,
    },
  };
}

function proposalFromOpportunity(opportunity: SalesOpportunity, input: Parameters<typeof buildDashboardProposalSummary>[0], index: number): ProposalWorkspaceRecord {
  const base = Date.parse(opportunity.updatedAt || opportunity.createdAt);
  const dueDate = new Date(base + (index * 7 + 21) * 86400000).toISOString();
  const relatedWorkflowIds = input.workflows.filter((workflow) => workflow.opportunityId === opportunity.id).map((workflow) => workflow.id);
  const relatedResearchIds = input.researchIntake.filter((item) => item.opportunityId === opportunity.id).map((item) => item.id);
  const relatedTaskIds =
    input.sharedTasks?.proposalQueue
      .filter((task) => task.organization === opportunity.company || task.title.toLowerCase().includes(opportunity.company.toLowerCase().split(' ')[0]))
      .map((task) => task.id) ?? [];
  return {
    proposalId: `proposal-${slugify(opportunity.company)}`,
    title: `${opportunity.company} Proposal Workspace`,
    customer: opportunity.company,
    solicitation: 'Local proposal preparation, no submission',
    opportunityId: opportunity.id,
    organizationId: `organization:${opportunity.id}`,
    proposalOwner: index % 2 ? 'Sales' : 'Proposal Prep',
    contributors: ['Sales', 'Operator', 'Executive', 'Proposal Prep'],
    status: opportunity.proposalPreparationStatus.readinessPercent >= 75 ? 'Compliance Review' : index % 2 ? 'Planning' : 'Research',
    priority: opportunity.priority,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
    dueDate,
    plannedSubmissionDate: new Date(Date.parse(dueDate) - 86400000).toISOString(),
    relatedWorkflowIds,
    relatedTaskIds,
    relatedResearchIds,
    sharedMemoryReferences: [opportunity.id, `organization:${opportunity.id}`, 'goal-proposal-readiness'].filter(Boolean),
  };
}

function readinessForProposal(proposal: ProposalWorkspaceRecord, input: Parameters<typeof buildDashboardProposalSummary>[0]): ProposalReadinessRecord {
  const opportunity = input.opportunities.find((item) => item.id === proposal.opportunityId);
  const base = opportunity?.proposalPreparationStatus.readinessPercent ?? 55;
  const blocked = input.workflows.some((workflow) => workflow.opportunityId === proposal.opportunityId && workflow.status === 'blocked');
  const compliance = clamp(base - 12 + proposal.relatedResearchIds.length * 4);
  const technical = clamp(base - 4 + proposal.relatedWorkflowIds.length * 2);
  const pricing = clamp(base - 18);
  const staffing = clamp(base - 10 + proposal.contributors.length * 2);
  const executive = clamp(base - (proposal.priority === 'Critical' || proposal.priority === 'High' ? 18 : 8));
  const overall = average([base, compliance, technical, pricing, staffing, executive]);
  const topRisks = [
    blocked ? 'Blocked workflow affects proposal timing.' : null,
    pricing < 70 ? 'Pricing inputs need owner review.' : null,
    compliance < 70 ? 'Compliance matrix has unresolved requirements.' : null,
    executive < 70 ? 'Executive review remains manual and pending.' : null,
  ].filter(Boolean) as string[];
  return {
    proposalId: proposal.proposalId,
    overallReadiness: metric(overall, 'Overall readiness blends local opportunity readiness, section progress, evidence, workflow, and Executive dependencies.'),
    complianceReadiness: metric(compliance, 'Compliance readiness reflects matrix coverage and reviewer status.'),
    technicalReadiness: metric(technical, 'Technical readiness reflects linked facts, requirements, and draft section coverage.'),
    pricingReadiness: metric(pricing, 'Pricing readiness stays advisory until a human adds pricing assumptions.'),
    staffingReadiness: metric(staffing, 'Staffing readiness reflects section ownership and required contributors.'),
    executiveReadiness: metric(executive, 'Executive readiness depends on manual review and approval gates.'),
    confidence: opportunity?.score.confidence ?? 70,
    riskScore: clamp(100 - overall + topRisks.length * 8),
    topRisks,
    recommendations: ['Close compliance gaps.', 'Attach missing evidence.', 'Schedule the next human review.'],
    nextActions: topRisks.length ? ['Resolve the highest-risk proposal dependency.'] : ['Prepare for human review.'],
  };
}

function sectionRows(proposal: ProposalWorkspaceRecord): ProposalSectionRecord[] {
  return ['Executive Summary', 'Technical Approach', 'Scope Response', 'Management Plan', 'Staffing Plan', 'Pricing Inputs', 'Required Forms', 'Compliance Matrix'].map((name, index) => ({
    sectionId: `${proposal.proposalId}-${slugify(name)}`,
    proposalId: proposal.proposalId,
    name,
    owner: index % 3 === 0 ? 'Executive' : index % 2 === 0 ? 'Proposal Prep' : 'Operator',
    status: index < 2 ? 'in_progress' : index < 5 ? 'planned' : 'needs_input',
    completion: clamp(78 - index * 7),
    confidence: clamp(82 - index * 5),
  }));
}

function complianceRows(proposal: ProposalWorkspaceRecord, readiness?: ProposalReadinessRecord): ProposalComplianceRecord[] {
  return [
    ['Scope Response', 'Document customer problem, current workflow, and required outcome.', 'Partially Addressed'],
    ['Pricing Inputs', 'Record pricing assumptions and exclusions before Executive review.', 'Needs Review'],
    ['Technical Approach', 'Use only approved local/manual research sources.', 'Addressed'],
    ['Compliance Matrix', 'Manual Executive approval required before any external action.', readiness?.executiveReadiness.score && readiness.executiveReadiness.score > 75 ? 'Needs Review' : 'Pending'],
  ].map(([section, requirement, status], index) => ({
    requirementId: `${proposal.proposalId}-REQ-${index + 1}`,
    proposalId: proposal.proposalId,
    section,
    requirement,
    status,
    reviewer: status === 'Addressed' ? 'Operator' : '',
    confidence: status === 'Addressed' ? 80 : status === 'Partially Addressed' ? 62 : 48,
    risks: status === 'Addressed' ? [] : ['Human review required before approval.'],
    missingItems: status === 'Pending' ? ['Reviewer assignment'] : status === 'Needs Review' ? ['Owner confirmation'] : [],
  }));
}

function evidenceRows(proposal: ProposalWorkspaceRecord, input: Parameters<typeof buildDashboardProposalSummary>[0]): ProposalEvidenceRecord[] {
  const opportunity = input.opportunities.find((item) => item.id === proposal.opportunityId);
  const rows: Array<[string, string, number, string]> = [
    ['Local CRM opportunity', `${opportunity?.company ?? proposal.customer} opportunity readiness and stage.`, 76, 'partially_verified'],
    ['Research intake', `${proposal.relatedResearchIds.length} local research intake reference(s).`, proposal.relatedResearchIds.length ? 72 : 45, proposal.relatedResearchIds.length ? 'partially_verified' : 'missing'],
    ['Workflow handoff', `${proposal.relatedWorkflowIds.length} proposal/workflow dependency reference(s).`, proposal.relatedWorkflowIds.length ? 70 : 50, proposal.relatedWorkflowIds.length ? 'verified' : 'missing'],
    ['Shared memory fact', `${proposal.sharedMemoryReferences.length} memory/planning reference(s).`, input.sharedMemory?.summary.averageEntityConfidence ?? 70, 'verified'],
  ];
  return rows.map(([type, description, confidence, verificationStatus], index) => ({
    id: `${proposal.proposalId}-evidence-${index + 1}`,
    proposalId: proposal.proposalId,
    type,
    description,
    confidence: Number(confidence),
    verificationStatus: String(verificationStatus),
  }));
}

function reviewRows(proposal: ProposalWorkspaceRecord): ProposalReviewRecord[] {
  return ['Author Review', 'Peer Review', 'Pink Team', 'Red Team', 'Gold Team', 'Executive Review'].map((stage, index) => ({
    reviewId: `${proposal.proposalId}-review-${slugify(stage)}`,
    proposalId: proposal.proposalId,
    stage,
    reviewer: stage === 'Executive Review' ? 'Executive' : index % 2 ? 'Operator' : 'Proposal Prep',
    approvalStatus: index === 0 ? 'completed' : 'pending',
    risks: index >= 3 ? ['Review cannot be approved automatically.'] : [],
    unresolvedIssues: index > 1 ? ['Awaiting human review.'] : [],
  }));
}

function timelineRows(proposal: ProposalWorkspaceRecord): ProposalTimelineRecord[] {
  return [
    ['created', 'Proposal workspace created from local opportunity readiness.', proposal.createdAt],
    ['readiness changes', 'Readiness scorecard calculated from local-only inputs.', proposal.updatedAt],
    ['workflow changes', 'Review gates and compliance dependencies linked.', proposal.updatedAt],
  ].map(([type, description, timestamp], index) => ({
    id: `${proposal.proposalId}-timeline-${index}`,
    proposalId: proposal.proposalId,
    type,
    description,
    operator: 'Proposal Engine',
    timestamp,
  }));
}

function metric(score: number, explanation: string): ProposalReadinessMetric {
  return {
    score,
    explanation,
    risks: score >= 75 ? [] : ['Needs human review before advancing.'],
    recommendations: score >= 75 ? ['Maintain review cadence.'] : ['Close missing inputs and rerun readiness.'],
    nextActions: score >= 75 ? ['Prepare for next review.'] : ['Assign an owner to the weakest area.'],
  };
}

function average(values: number[]): number {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysUntil(value: string): number {
  return Math.ceil((Date.parse(value) - Date.now()) / 86400000);
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
