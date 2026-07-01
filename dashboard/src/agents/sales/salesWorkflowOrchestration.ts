import type { LocalReport } from '../../storage/reportExport';
import type {
  SalesOpportunity,
  SalesProposalPrepQueueItem,
  SalesResearchIntakeItem,
  SalesResearchSource,
  SalesWorkflowAgent,
  SalesWorkflowRecord,
  SalesWorkflowStatus,
  SalesWorkflowSummary,
  SalesWorkflowType,
} from './salesTypes';

const generatedAt = '2026-07-01T13:30:00.000Z';

export function createInitialSalesWorkflows(
  opportunities: SalesOpportunity[],
  intakeQueue: SalesResearchIntakeItem[],
  sources: SalesResearchSource[],
): SalesWorkflowRecord[] {
  const top = opportunities.slice(0, 8);
  return [
    workflow('wf-research-area-502', 'research_request', 'Sales', 'Operator', top[0], 'High', 'queued', 'Verify website, owner/contact path, and current software.', false, intakeQueue, sources),
    workflow('wf-verify-louisville-combat', 'verification_request', 'Sales', 'Operator', top[1], 'High', 'assigned', 'Verify contact path and source confidence before outreach prep.', false, intakeQueue, sources),
    workflow('wf-duplicate-louisville-combat', 'duplicate_review', 'Sales', 'Operator', top[1], 'High', 'in_review', 'Review possible duplicate opportunity; do not merge automatically.', false, intakeQueue, sources),
    workflow('wf-proposal-core-combat', 'proposal_prep_handoff', 'Sales', 'Proposal Prep', top[2], 'High', 'queued', 'Prepare proposal package after missing requirements are resolved.', true, intakeQueue, sources),
    workflow('wf-exec-apex', 'executive_approval', 'Sales', 'Executive', top[3], 'High', 'in_review', 'High-fit prospect requires Executive approval before proposal readiness.', true, intakeQueue, sources),
    workflow('wf-risky-linkedin-source', 'risky_source_review', 'Sales', 'Executive', top[0], 'Medium', 'blocked', 'LinkedIn manual reference remains pending and cannot enrich opportunities yet.', true, intakeQueue, sources, ['src-linkedin-manual']),
    workflow('wf-external-action-gate', 'external_action_gate', 'Sales', 'Executive', top[0], 'Critical', 'draft', 'Any external email, CRM sync, browsing job, or proposal submission requires manual approval.', true, intakeQueue, sources),
    workflow('wf-follow-up-butchertown', 'follow_up_preparation', 'Sales', 'Operator', top[4], 'Medium', 'assigned', 'Prepare follow-up plan after verification queue clears.', false, intakeQueue, sources),
    workflow('wf-stalled-full-moon', 'stalled_opportunity_review', 'Sales', 'Executive', top[5], 'Medium', 'queued', 'Review stalled opportunity before changing status or archiving.', true, intakeQueue, sources),
    workflow('wf-missing-covalence', 'missing_info_request', 'Sales', 'Operator', top[6], 'Medium', 'queued', 'Collect missing pricing, requirements, and decision-maker fields.', false, intakeQueue, sources),
  ].filter((item): item is SalesWorkflowRecord => Boolean(item));
}

export function buildSalesProposalPrepQueue(workflows: SalesWorkflowRecord[], opportunities: SalesOpportunity[], intakeQueue: SalesResearchIntakeItem[]): SalesProposalPrepQueueItem[] {
  return workflows
    .filter((workflow) => workflow.type === 'proposal_prep_handoff' || workflow.type === 'proposal_readiness_review' || workflow.targetAgent === 'Proposal Prep')
    .map((workflow) => {
      const opportunity = opportunities.find((item) => item.id === workflow.opportunityId);
      const intake = intakeQueue.find((item) => workflow.relatedIntakeIds.includes(item.id));
      return {
        company: workflow.company,
        executiveApprovalStatus: workflow.approvalStatus,
        missingInfo: opportunity?.proposalPreparationStatus.missing ?? workflow.missingInformation,
        nextAction: workflow.requestedAction,
        opportunityId: workflow.opportunityId,
        proposalStatus: opportunity?.proposalPreparationStatus.status ?? 'not_ready',
        readinessPercent: opportunity?.proposalPreparationStatus.readinessPercent ?? 0,
        sourceConfidence: intake?.confidence ?? 0,
        verificationStatus: intake?.verificationStatus ?? 'unverified',
        workflowId: workflow.id,
      };
    });
}

export function summarizeSalesWorkflows(workflows: SalesWorkflowRecord[], proposalQueue: SalesProposalPrepQueueItem[]): SalesWorkflowSummary {
  const open = workflows.filter((workflow) => !['completed', 'archived', 'rejected'].includes(workflow.status));
  const blocked = workflows.filter((workflow) => workflow.status === 'blocked').length;
  const approvals = workflows.filter((workflow) => workflow.approvalRequirement && ['pending', 'required'].includes(workflow.approvalStatus)).length;
  return {
    activeHandoffs: open.length,
    approvalQueue: approvals,
    assignedToExecutive: workflows.filter((workflow) => workflow.targetAgent === 'Executive' && open.includes(workflow)).length,
    assignedToOperator: workflows.filter((workflow) => workflow.targetAgent === 'Operator' && open.includes(workflow)).length,
    assignedToProposalPrep: workflows.filter((workflow) => workflow.targetAgent === 'Proposal Prep' && open.includes(workflow)).length,
    blockedWorkflows: blocked,
    completedWorkflows: workflows.filter((workflow) => workflow.status === 'completed').length,
    externalActionGates: workflows.filter((workflow) => workflow.type === 'external_action_gate').length,
    proposalPrepItems: proposalQueue.length,
    totalWorkflows: workflows.length,
    workflowHealth: Math.max(0, Math.round(100 - blocked * 10 - approvals * 4)),
  };
}

export function buildSalesWorkflowReports(workflows: SalesWorkflowRecord[], proposalQueue: SalesProposalPrepQueueItem[]): Record<string, LocalReport> {
  const summary = summarizeSalesWorkflows(workflows, proposalQueue);
  return {
    workflowSummary: report('Workflow Summary', workflows, summary),
    handoffActivity: report('Handoff Activity Report', workflows.filter((workflow) => workflow.sourceAgent !== workflow.targetAgent), summary),
    approvalQueue: report('Approval Queue Report', workflows.filter((workflow) => workflow.approvalRequirement), summary),
    blockedWorkflow: report('Blocked Workflow Report', workflows.filter((workflow) => workflow.status === 'blocked'), summary),
    proposalPrepQueue: report('Proposal Prep Queue Report', proposalQueue, summary),
    operatorTask: report('Operator Task Report', workflows.filter((workflow) => workflow.targetAgent === 'Operator'), summary),
    executiveApproval: report('Executive Approval Report', workflows.filter((workflow) => workflow.targetAgent === 'Executive'), summary),
    workflowAudit: report('Workflow Audit Report', workflows.flatMap((workflow) => workflow.auditTrail.map((audit) => ({ workflowId: workflow.id, company: workflow.company, ...audit }))), summary),
  };
}

function workflow(
  id: string,
  type: SalesWorkflowType,
  sourceAgent: SalesWorkflowAgent,
  targetAgent: SalesWorkflowAgent,
  opportunity: SalesOpportunity | undefined,
  priority: SalesWorkflowRecord['priority'],
  status: SalesWorkflowStatus,
  requestedAction: string,
  approvalRequirement: boolean,
  intakeQueue: SalesResearchIntakeItem[],
  sources: SalesResearchSource[],
  forcedSourceIds?: string[],
): SalesWorkflowRecord | null {
  if (!opportunity) return null;
  const intake = intakeQueue.find((item) => item.opportunityId === opportunity.id);
  const relatedSourceIds = forcedSourceIds ?? (intake ? [intake.sourceId] : sources.filter((source) => source.approvalStatus === 'Approved').slice(0, 1).map((source) => source.id));
  const approvalStatus = approvalRequirement ? (status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status === 'blocked' ? 'blocked' : 'pending') : 'not_required';
  return {
    approvalRequirement,
    approvalStatus,
    auditTrail: [
      {
        affectedArtifacts: [opportunity.id, intake?.id ?? '', ...relatedSourceIds].filter(Boolean),
        confidenceImpact: intake?.confidence ?? opportunity.score.confidence,
        id: `audit-${id}`,
        newStatus: status,
        nextAction: requestedAction,
        operator: 'Sales Agent',
        previousStatus: 'draft',
        reason: 'Initial Phase 49 local orchestration seed.',
        timestamp: generatedAt,
      },
    ],
    company: opportunity.company,
    completedAt: status === 'completed' ? generatedAt : null,
    createdAt: generatedAt,
    dueAt: '2026-07-03T17:00:00.000Z',
    id,
    missingInformation: opportunity.proposalPreparationStatus.missing,
    opportunityId: opportunity.id,
    owner: targetAgent,
    priority,
    reason: requestedAction,
    relatedDraftIds: opportunity.draftOutreach.length ? [`draft-${opportunity.id}`] : [],
    relatedIntakeIds: intake ? [intake.id] : [],
    relatedReportIds: opportunity.generatedReports,
    relatedSourceIds,
    requestedAction,
    requiredInputs: ['verified contact path', 'approved source', 'current software', 'requirements notes'],
    sourceAgent,
    status,
    targetAgent,
    type,
    updatedAt: generatedAt,
  };
}

function report(title: string, rows: object[], summary: SalesWorkflowSummary): LocalReport {
  return {
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    summary: { ...summary, localOnly: true, safety: 'No autonomous browsing, messaging, CRM sync, proposal submission, or approval.' },
    rows,
  };
}
