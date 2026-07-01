import { buildExecutivePriorities } from '../../runtime/executiveRules';
import type { ConnectorReadinessSummary } from '../../runtime/connectorReadiness';
import type { CrossAgentCollaborationSummary } from '../../runtime/crossAgentCollaboration';
import type { EngineeringTaskGeneratorSummary } from '../../runtime/engineeringTaskGenerator';
import type { ExecutiveAutomationSummary } from '../../runtime/executiveAutomation';
import type { ExecutiveEmailBriefingSummary } from '../../runtime/executiveEmailBriefing';
import type { ExecutiveOperationsDashboardSummary } from '../../runtime/executiveOperations';
import type { GmailEmailDashboardSummary } from '../../runtime/gmailEmail';
import type { GitHubPlanningDashboardSummary } from '../../runtime/githubPlanning';
import type { GitHubReadOnlyDashboardSummary } from '../../runtime/githubReadOnly';
import type { ProjectRegistryDashboardSummary } from '../../runtime/projectRegistry';
import type { ReleaseReadinessDashboardSummary } from '../../runtime/releaseReadiness';
import type { ReleaseShipPlanDashboardSummary } from '../../runtime/releaseShipPlans';
import type { RepositoryIntelligenceDashboardSummary } from '../../runtime/repositoryIntelligence';
import type { AgentRuntimeSnapshot, RuntimeActivityEntry } from '../../runtime/runtimeTypes';
import type { SharedTaskDashboardSummary } from '../../runtime/sharedTaskQueue';
import type { LocalReport } from '../../storage/reportExport';
import type {
  SalesAgentTeamSummary,
  SalesIntegrationSummary,
  SalesIntelligenceSummary,
  SalesProposalSummary,
  SalesProspectDossierSummary,
  SalesScoringSummary,
  SalesSummary,
} from '../sales/salesTypes';
import type {
  ExecutiveHealthRow,
  ExecutiveReportContext,
  ExecutiveReportKind,
  ExecutiveRuntimeSummary,
  ExecutiveSummary,
  ExecutiveTimelineItem,
} from './executiveTypes';

export function buildExecutiveSummary(
  runtime: AgentRuntimeSnapshot,
  integrationWarnings: string[] = [],
  salesSummary?: SalesSummary,
  salesIntegration?: SalesIntegrationSummary,
  salesScoringSummary?: SalesScoringSummary,
  salesProposalSummary?: SalesProposalSummary,
  salesAgentTeamSummary?: SalesAgentTeamSummary,
  salesProspectDossierSummary?: SalesProspectDossierSummary,
  salesIntelligenceSummary?: SalesIntelligenceSummary,
  crossAgentSummary?: CrossAgentCollaborationSummary,
  connectorReadiness?: ConnectorReadinessSummary,
  email?: GmailEmailDashboardSummary,
  engineeringTasks?: EngineeringTaskGeneratorSummary,
  executiveAutomation?: ExecutiveAutomationSummary,
  executiveEmailBriefing?: ExecutiveEmailBriefingSummary,
  executiveOperations?: ExecutiveOperationsDashboardSummary,
  githubPlanning?: GitHubPlanningDashboardSummary,
  githubReadOnly?: GitHubReadOnlyDashboardSummary,
  projectRegistry?: ProjectRegistryDashboardSummary,
  releaseReadiness?: ReleaseReadinessDashboardSummary,
  releaseShipPlans?: ReleaseShipPlanDashboardSummary,
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary,
  sharedTaskSummary?: SharedTaskDashboardSummary,
): ExecutiveSummary {
  const healthRows = buildExecutiveHealthRows(runtime);
  const healthyAgents = healthRows.filter((agent) => agent.risk === 'low').length;
  const criticalAgents = healthRows.filter((agent) => agent.risk === 'high').length;
  const warningAgents = healthRows.filter((agent) => agent.risk === 'medium').length;
  const pendingApprovals = runtime.approvals.filter((approval) => approval.status === 'pending').length;
  const activeSyncQueue = runtime.sync.recordsWaiting + runtime.sync.failedRecords;
  const engineeringHealth = runtime.health.engineering;
  const migrationHealth = runtime.health.migration;
  const overallHealth =
    criticalAgents > 0 || runtime.sync.failedRecords > 0
      ? 'Attention'
      : warningAgents > 0 || pendingApprovals > 0 || integrationWarnings.length > 0
        ? 'Watch'
        : 'Healthy';

  return {
    criticalAgents,
    engineeringBacklog: engineeringHealth?.pendingTasks ?? 0,
    generatedAt: new Date().toISOString(),
    githubDrafts: runtime.workflows.filter((workflow) => workflow.key.includes('github') || workflow.key.includes('issue')).length,
    healthyAgents,
    migrationBatches: migrationHealth?.pendingTasks ?? 0,
    overallHealth,
    pendingApprovals,
    priorities: buildExecutivePriorities(
      runtime,
      salesSummary,
      salesIntegration,
      salesScoringSummary,
      salesProposalSummary,
      salesAgentTeamSummary,
      salesProspectDossierSummary,
      salesIntelligenceSummary,
      crossAgentSummary,
      connectorReadiness,
      email,
      engineeringTasks,
      executiveAutomation,
      executiveOperations,
      githubPlanning,
      githubReadOnly,
      projectRegistry,
      releaseReadiness,
      releaseShipPlans,
      repositoryIntelligence,
      sharedTaskSummary,
    ),
    recentRuntimeEvents: runtime.activities.length,
    registeredAgents: runtime.agents.length,
    runtime: buildRuntimeSummary(runtime),
    runtimeVersion: runtime.runtimeVersion,
    syncQueue: activeSyncQueue,
    timeline: buildExecutiveTimeline(runtime.activities),
    warningAgents,
    workflowsToday: countWorkflowActivity(runtime.activities),
    crossAgentSummary,
    salesIntegration,
    engineeringTasks,
    executiveAutomation,
    executiveEmailBriefing,
    executiveOperations,
    salesAgentTeamSummary,
    salesIntelligenceSummary,
    salesProposalSummary,
    salesProspectDossierSummary,
    salesScoringSummary,
    salesSummary,
    connectorReadiness,
    email,
    githubPlanning,
    githubReadOnly,
    projectRegistry,
    releaseReadiness,
    releaseShipPlans,
    repositoryIntelligence,
    sharedTaskSummary,
  };
}

export function buildExecutiveHealthRows(runtime: AgentRuntimeSnapshot): ExecutiveHealthRow[] {
  return runtime.agents
    .filter((agent) => agent.id !== 'executive')
    .map((agent) => {
      const health = runtime.health[agent.id];
      const errors = health?.errors ?? 0;
      const warnings = health?.warnings ?? 0;
      const healthScore = health?.healthScore ?? 0;
      const risk = errors > 0 || healthScore < 50 ? 'high' : warnings > 0 || healthScore < 80 ? 'medium' : 'low';

      return {
        agent: agent.name,
        agentId: agent.id,
        approvalCount: health?.approvalCount ?? 0,
        errors,
        health: agent.health,
        lastActivity: health?.lastActivity ?? 'No activity recorded',
        navigationTarget: navigationTargetForAgent(agent.id),
        pendingTasks: health?.pendingTasks ?? 0,
        risk,
        syncStatus: health?.syncStatus ?? 'local',
        warnings,
        workflowCount: health?.workflowCount ?? agent.workflows.length,
      };
    });
}

export function buildExecutiveReport(kind: ExecutiveReportKind, context: ExecutiveReportContext): LocalReport {
  const { healthRows, runtime, summary } = context;
  const baseSummary = {
    overallHealth: summary.overallHealth,
    registeredAgents: summary.registeredAgents,
    healthyAgents: summary.healthyAgents,
    warningAgents: summary.warningAgents,
    criticalAgents: summary.criticalAgents,
    pendingApprovals: summary.pendingApprovals,
    salesFollowUpsDue: summary.salesSummary?.followUpsDue ?? 0,
    salesHotLeads: summary.salesSummary?.hotLeads ?? 0,
    salesIntegrationMode: summary.salesIntegration?.modeLabel ?? 'Not configured',
    salesPipelineValue: summary.salesSummary?.estimatedPipelineValue ?? 0,
    salesProposalNeeded: summary.salesSummary?.proposalNeeded ?? 0,
    salesScoredHotLeads: summary.salesScoringSummary?.hotLeadCount ?? 0,
    salesScoredAtRiskLeads: summary.salesScoringSummary?.atRiskLeadCount ?? 0,
    salesOverdueFollowUps: summary.salesScoringSummary?.overdueFollowUpCount ?? 0,
    salesWeightedPipelineValue: summary.salesScoringSummary?.estimatedWeightedPipelineValue ?? 0,
    salesProposalDraftsCreated: summary.salesProposalSummary?.draftsCreated ?? 0,
    salesProposalMissingPricing: summary.salesProposalSummary?.missingPricing ?? 0,
    salesProposalsReadyForReview: summary.salesProposalSummary?.readyForReview ?? 0,
    salesProposalRiskCount: summary.salesProposalSummary?.riskCount ?? 0,
    salesBlockedExternalActions: summary.salesIntegration?.blockedExternalActionCount ?? 0,
    registeredProjects: summary.projectRegistry?.registeredProjects ?? 0,
    blockedProjects: summary.projectRegistry?.blockedProjects ?? 0,
    releaseReadinessStatus: summary.projectRegistry?.releaseReadinessStatus ?? 'Not available',
    releaseReadyProjects: summary.releaseReadiness?.readyProjects ?? 0,
    blockedReleases: summary.releaseReadiness?.blockedProjects ?? 0,
    criticalReleaseRisks: summary.releaseReadiness?.criticalReleaseRisks ?? 0,
    shipPlansNeedingReview: summary.releaseShipPlans?.shipPlansNeedingReview ?? 0,
    approvedPreparationPlans: summary.releaseShipPlans?.approvedPreparationPlans ?? 0,
    blockedShipPlans: summary.releaseShipPlans?.blockedShipPlans ?? 0,
    recommendedShipDecision: summary.releaseShipPlans?.recommendedExecutiveDecision ?? 'Not available',
    salesAgentTeamActiveAgents: summary.salesAgentTeamSummary?.activeAgents ?? 0,
    salesAgentTeamTotalAgents: summary.salesAgentTeamSummary?.totalAgents ?? 0,
    salesProspectResearchSlots: summary.salesAgentTeamSummary?.totalProspects ?? 0,
    salesHighFitProspects: summary.salesAgentTeamSummary?.highFitProspects ?? 0,
    salesProspectsNeedResearch: summary.salesAgentTeamSummary?.needsResearch ?? 0,
    salesAverageProspectFit: summary.salesAgentTeamSummary?.averageFitScore ?? 0,
    salesSavedProspects: summary.salesProspectDossierSummary?.savedProspects ?? 0,
    salesResearchDossiersCreated: summary.salesProspectDossierSummary?.dossiersCreated ?? 0,
    salesHighFitDossiers: summary.salesProspectDossierSummary?.highFitDossiers ?? 0,
    salesMissingInfoProspects: summary.salesProspectDossierSummary?.missingInfoProspects ?? 0,
    salesMigrationOpportunityProspects: summary.salesProspectDossierSummary?.migrationOpportunityProspects ?? 0,
    salesOrganizationsTracked: summary.salesIntelligenceSummary?.organizationsTracked ?? 0,
    salesActiveOpportunities: summary.salesIntelligenceSummary?.activeOpportunities ?? 0,
    salesAverageRelationshipDepth: summary.salesIntelligenceSummary?.averageRelationshipDepth ?? 0,
    salesProposalCoverage: summary.salesIntelligenceSummary?.proposalCoverage ?? 0,
    salesMigrationReadyOrganizations: summary.salesIntelligenceSummary?.migrationReadyOrganizations ?? 0,
    salesIntelligenceCompletenessScore: summary.salesIntelligenceSummary?.intelligenceCompletenessScore ?? 0,
    crossAgentHighValueOpportunitiesBlockedByEngineering: summary.crossAgentSummary?.highValueOpportunitiesBlockedByEngineering ?? 0,
    crossAgentMigrationsTiedToActiveOpportunities: summary.crossAgentSummary?.migrationsTiedToActiveSalesOpportunities ?? 0,
    crossAgentProposalsNeedingApproval: summary.crossAgentSummary?.proposalsNeedingApproval ?? 0,
    crossAgentFeatureRequestsTiedToProspects: summary.crossAgentSummary?.featureRequestsTiedToProspects ?? 0,
    crossAgentOrganizationsNeedingExecutiveReview: summary.crossAgentSummary?.organizationsNeedingExecutiveReview ?? 0,
    connectorCount: summary.connectorReadiness?.connectorCount ?? 0,
    connectorBlockedWrites: summary.connectorReadiness?.blockedWriteActionCount ?? 0,
    connectorApprovalMappedActions: summary.connectorReadiness?.approvalMappedActionCount ?? 0,
    connectorExecutiveRiskLevel: summary.connectorReadiness?.riskSummary.executiveRiskLevel ?? 'Not configured',
    emailsSentAutomatically: summary.email?.sentEmailCount ?? 0,
    scheduledEmailReports: summary.email?.scheduledReports ?? 0,
    failedEmailAttempts: summary.email?.failedEmailCount ?? 0,
    skippedEmailAttempts: summary.email?.skippedEmailCount ?? 0,
    emailAutomationHealth: summary.email?.automationHealthStatus ?? 'Not configured',
    engineeringGeneratedTasks: summary.engineeringTasks?.generatedTasks ?? 0,
    executiveAutomationTriggeredRules: summary.executiveAutomation?.triggeredRules.length ?? 0,
    executiveAutomationGeneratedTasks: summary.executiveAutomation?.generatedTasks ?? 0,
    executiveAutomationGeneratedEmails: summary.executiveAutomation?.generatedEmails ?? 0,
    executiveAutomationSkippedActions: summary.executiveAutomation?.skippedOrBlockedActions ?? 0,
    executiveAutomationHealth: summary.executiveAutomation?.automationHealth ?? 'Not configured',
    executiveEmailBriefingStatus: summary.executiveEmailBriefing?.automationStatus ?? 'Not configured',
    executiveEmailBriefingRecipients: summary.executiveEmailBriefing?.recipientReadiness.length ?? 0,
    executiveEmailBriefingSkipped: summary.executiveEmailBriefing?.failedOrSkippedAttempts.length ?? 0,
    executiveOperationsScore: summary.executiveOperations?.overallExecutiveScore ?? 0,
    executiveDailyOperatingStatus: summary.executiveOperations?.dailyOperatingStatus ?? 'Not configured',
    executiveOperationalAlerts: summary.executiveOperations?.operationalAlerts.length ?? 0,
    engineeringCriticalTasks: summary.engineeringTasks?.criticalEngineeringTasks ?? 0,
    engineeringSalesBlockingTasks: summary.engineeringTasks?.salesBlockingEngineeringTasks ?? 0,
    engineeringMigrationBlockingTasks: summary.engineeringTasks?.migrationBlockingEngineeringTasks ?? 0,
    engineeringReleaseReadinessTasks: summary.engineeringTasks?.releaseReadinessTasks ?? 0,
    sharedOpenTasks: summary.sharedTaskSummary?.openTasks ?? 0,
    sharedBlockedTasks: summary.sharedTaskSummary?.blockedTasks ?? 0,
    sharedOverdueTasks: summary.sharedTaskSummary?.overdueTasks ?? 0,
    sharedTasksRequiringExecutiveReview: summary.sharedTaskSummary?.tasksRequiringExecutiveReview ?? 0,
    sharedQueueHealth: summary.sharedTaskSummary?.queueHealth ?? 'Not configured',
    syncQueue: summary.syncQueue,
    runtimeVersion: summary.runtimeVersion,
    productionWritesOccurred: 'No',
  };

  if (kind === 'approval') {
    return {
      title: 'Executive Approval Report',
      slug: 'executive-approval-report',
      summary: baseSummary,
      rows: runtime.approvals,
    };
  }

  if (kind === 'runtime') {
    return {
      title: 'Executive Runtime Report',
      slug: 'executive-runtime-report',
      summary: { ...summary.runtime },
      sections: [
        { title: 'Runtime Health', rows: healthRows },
        { title: 'Runtime Activity', rows: summary.timeline },
      ],
    };
  }

  if (kind === 'engineering') {
    return agentReport('Engineering Summary', 'executive-engineering-summary', 'engineering', context);
  }

  if (kind === 'migration') {
    return agentReport('Migration Summary', 'executive-migration-summary', 'migration', context);
  }

  if (kind === 'daily') {
    return {
      title: 'Daily Operations Report',
      slug: 'executive-daily-operations-report',
      summary: baseSummary,
      sections: [
        { title: 'Executive Priorities', rows: summary.priorities },
        { title: 'Department Health', rows: healthRows },
        { title: 'Recent Timeline', rows: summary.timeline },
      ],
    };
  }

  return {
    title: 'Executive Summary',
    slug: 'executive-summary',
    summary: baseSummary,
    sections: [
      { title: 'Priorities', rows: summary.priorities },
      { title: 'Health', rows: healthRows },
      { title: 'Approvals', rows: runtime.approvals },
    ],
  };
}

function buildRuntimeSummary(runtime: AgentRuntimeSnapshot): ExecutiveRuntimeSummary {
  return {
    approvalEngine: runtime.approvals.length > 0 ? 'approval queue active' : 'approval queue ready',
    auditEngine: `${runtime.memory.auditLogs} audit log(s) indexed`,
    permissionEngine: `${Object.keys(runtime.permissions).length} permission profile(s) registered`,
    registeredAgents: runtime.agents.length,
    registeredWorkflows: runtime.workflows.length,
    registryHealth: runtime.agents.length > 0 && runtime.workflows.length > 0 ? 'ready' : 'needs registry data',
    runtimeMemory: `${runtime.memory.runs + runtime.memory.events + runtime.memory.tasks} memory item(s)`,
    runtimeVersion: runtime.runtimeVersion,
    syncEngine: `${runtime.sync.status} (${runtime.sync.mode})`,
  };
}

function buildExecutiveTimeline(activities: RuntimeActivityEntry[]): ExecutiveTimelineItem[] {
  return activities.slice(0, 12).map((activity) => ({
    agent: activity.agent,
    detail: activity.detail,
    id: activity.id,
    timestamp: activity.timestamp,
    title: activity.type.replace(/^./, (letter) => letter.toUpperCase()),
    type: activity.type,
  }));
}

function countWorkflowActivity(activities: RuntimeActivityEntry[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = activities.filter((activity) => activity.timestamp.slice(0, 10) === today).length;
  return todayCount || activities.filter((activity) => activity.type === 'started' || activity.type === 'completed').length;
}

function navigationTargetForAgent(agentId: string): string {
  const targets: Record<string, string> = {
    engineering: 'Engineering',
    finance: 'Runtime',
    marketing: 'Runtime',
    migration: 'Migration',
    operations: 'Runtime',
    product: 'Products',
    sales: 'Sales',
    support: 'Runtime',
  };
  return targets[agentId] ?? 'Runtime';
}

function agentReport(title: string, slug: string, agentId: string, context: ExecutiveReportContext): LocalReport {
  const health = context.healthRows.find((row) => row.agentId === agentId);
  return {
    title,
    slug,
    summary: {
      agent: health?.agent ?? agentId,
      health: health?.health ?? 'unknown',
      risk: health?.risk ?? 'medium',
      pendingTasks: health?.pendingTasks ?? 0,
      workflowCount: health?.workflowCount ?? 0,
      approvalCount: health?.approvalCount ?? 0,
      productionWritesOccurred: 'No',
    },
    rows: context.runtime.activities.filter((activity) => activity.agent.toLowerCase().includes(agentId)),
  };
}
