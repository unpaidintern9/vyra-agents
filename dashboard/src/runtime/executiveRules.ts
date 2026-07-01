import type { AgentRuntimeSnapshot } from './runtimeTypes';
import type { ConnectorReadinessSummary } from './connectorReadiness';
import type { CrossAgentCollaborationSummary } from './crossAgentCollaboration';
import type { EngineeringTaskGeneratorSummary } from './engineeringTaskGenerator';
import type { ExecutiveAutomationSummary } from './executiveAutomation';
import type { GmailEmailDashboardSummary } from './gmailEmail';
import type { GitHubPlanningDashboardSummary } from './githubPlanning';
import type { GitHubReadOnlyDashboardSummary } from './githubReadOnly';
import type { ProjectRegistryDashboardSummary } from './projectRegistry';
import type { ReleaseReadinessDashboardSummary } from './releaseReadiness';
import type { ReleaseShipPlanDashboardSummary } from './releaseShipPlans';
import type { RepositoryIntelligenceDashboardSummary } from './repositoryIntelligence';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';
import type { ExecutivePriority } from '../agents/executive/executiveTypes';
import type {
  SalesAgentTeamSummary,
  SalesIntegrationSummary,
  SalesIntelligenceSummary,
  SalesProposalSummary,
  SalesProspectDossierSummary,
  SalesScoringSummary,
  SalesSummary,
} from '../agents/sales/salesTypes';

export const executiveRuleCount = 16;

export function buildExecutivePriorities(
  runtime: AgentRuntimeSnapshot,
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
  githubPlanning?: GitHubPlanningDashboardSummary,
  githubReadOnly?: GitHubReadOnlyDashboardSummary,
  projectRegistry?: ProjectRegistryDashboardSummary,
  releaseReadiness?: ReleaseReadinessDashboardSummary,
  releaseShipPlans?: ReleaseShipPlanDashboardSummary,
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary,
  sharedTaskSummary?: SharedTaskDashboardSummary,
): ExecutivePriority[] {
  const priorities: ExecutivePriority[] = [];
  const pendingApprovals = runtime.approvals.filter((approval) => approval.status === 'pending');
  const warningAgents = runtime.agents.filter((agent) => runtime.health[agent.id]?.warnings > 0);
  const criticalAgents = runtime.agents.filter((agent) => (runtime.health[agent.id]?.errors ?? 0) > 0);
  const plannedAgents = runtime.agents.filter((agent) => agent.health === 'planned');

  if (pendingApprovals.length) {
    priorities.push({
      id: 'pending-approvals',
      agent: 'Executive Agent',
      department: 'Operations',
      detail: `${pendingApprovals.length} approval item(s) are waiting for Robert.`,
      priority: 'high',
      recommendedAction: 'Review pending approvals before new operational work.',
      source: 'Runtime approvals',
    });
  }

  if (runtime.sync.failedRecords > 0) {
    priorities.push({
      id: 'active-sync-failures',
      agent: 'Operations Agent',
      department: 'Operations',
      detail: `${runtime.sync.failedRecords} active sync record(s) failed.`,
      priority: 'high',
      recommendedAction: 'Open Sync Queue and retry or inspect active sync failures.',
      source: 'Runtime sync',
    });
  }

  criticalAgents.forEach((agent) => {
    priorities.push({
      id: `critical-${agent.id}`,
      agent: agent.name,
      department: agent.owner,
      detail: `${agent.name} has runtime errors.`,
      priority: 'high',
      recommendedAction: `Open ${agent.name.replace(' Agent', '')} and review the latest activity.`,
      source: 'Runtime health',
    });
  });

  warningAgents.forEach((agent) => {
    priorities.push({
      id: `warning-${agent.id}`,
      agent: agent.name,
      department: agent.owner,
      detail: `${agent.name} has ${runtime.health[agent.id].warnings} warning signal(s).`,
      priority: 'medium',
      recommendedAction: `Review ${agent.name.replace(' Agent', '')} queue and approvals.`,
      source: 'Runtime health',
    });
  });

  if (runtime.sync.recordsWaiting > 0) {
    priorities.push({
      id: 'sync-pending',
      agent: 'Operations Agent',
      department: 'Operations',
      detail: `${runtime.sync.recordsWaiting} agent-memory record(s) are waiting to sync.`,
      priority: 'medium',
      recommendedAction: 'Run Sync Now when the Edge Function path is configured.',
      source: 'Runtime sync',
    });
  }

  if (salesSummary && salesSummary.followUpsDue > 0) {
    priorities.push({
      id: 'sales-follow-ups-due',
      agent: 'Sales Agent',
      department: 'Sales',
      detail: `${salesSummary.followUpsDue} sales follow-up(s) are due or overdue.`,
      priority: 'medium',
      recommendedAction: 'Open Sales and clear the local follow-up planner.',
      source: 'Sales pipeline',
    });
  }

  if (salesScoringSummary && (salesScoringSummary.overdueFollowUpCount > 0 || salesScoringSummary.atRiskLeadCount > 0)) {
    priorities.push({
      id: 'sales-scoring-attention',
      agent: 'Sales Agent',
      department: 'Sales',
      detail: `${salesScoringSummary.overdueFollowUpCount} overdue follow-up(s) and ${salesScoringSummary.atRiskLeadCount} at-risk lead(s) need local review.`,
      priority: salesScoringSummary.overdueFollowUpCount > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Sales and review the deterministic follow-up queue.',
      source: 'Sales lead scoring',
    });
  }

  if (salesProposalSummary && (salesProposalSummary.riskCount > 0 || salesProposalSummary.missingPricing > 0)) {
    priorities.push({
      id: 'sales-proposal-review',
      agent: 'Sales Agent',
      department: 'Sales',
      detail: `${salesProposalSummary.riskCount} proposal draft risk(s) and ${salesProposalSummary.missingPricing} missing pricing item(s) need local review.`,
      priority: salesProposalSummary.missingPricing > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Sales and review proposal drafts before any future approved external use.',
      source: 'Sales proposal builder',
    });
  }

  if (salesIntegration?.mode === 'live_read_only' && salesIntegration.crmReadinessStatus !== 'ready') {
    priorities.push({
      id: 'sales-crm-readiness',
      agent: 'Sales Agent',
      department: 'Sales',
      detail: 'Sales CRM live read-only mode is selected but CRM readiness is not configured.',
      priority: 'medium',
      recommendedAction: 'Open Sales and review the integration readiness panel.',
      source: 'Sales integration adapter',
    });
  }

  if (salesAgentTeamSummary && salesAgentTeamSummary.highFitProspects > 0 && salesAgentTeamSummary.needsResearch > 0) {
    priorities.push({
      id: 'sales-prospect-research',
      agent: 'Head Sales Agent',
      department: 'Sales',
      detail: `${salesAgentTeamSummary.highFitProspects} high-fit prospect slot(s) are ready for public-source research planning.`,
      priority: 'medium',
      recommendedAction: 'Open Sales and review the Prospect Research Command Center before adding verified sources.',
      source: 'Sales agent team',
    });
  }

  if (salesProspectDossierSummary && (salesProspectDossierSummary.missingInfoProspects > 0 || salesProspectDossierSummary.highFitDossiers > 0)) {
    priorities.push({
      id: 'sales-research-dossier-review',
      agent: 'Sales Intelligence Agent',
      department: 'Sales',
      detail: `${salesProspectDossierSummary.highFitDossiers} high-fit dossier(s) and ${salesProspectDossierSummary.missingInfoProspects} prospect(s) with missing info are ready for local review.`,
      priority: salesProspectDossierSummary.highFitDossiers > 0 ? 'medium' : 'low',
      recommendedAction: 'Open Sales and review the Research Dossier preview before any outreach planning.',
      source: 'Sales research dossiers',
    });
  }

  if (salesIntelligenceSummary && salesIntelligenceSummary.organizationsTracked > 0 && salesIntelligenceSummary.intelligenceCompletenessScore < 75) {
    priorities.push({
      id: 'sales-intelligence-completeness',
      agent: 'Sales Intelligence Agent',
      department: 'Sales',
      detail: `${salesIntelligenceSummary.organizationsTracked} organization(s) are tracked with ${salesIntelligenceSummary.intelligenceCompletenessScore}/100 average intelligence completeness.`,
      priority: 'medium',
      recommendedAction: 'Open Sales and review the Organization Intelligence dashboard for missing relationships, proposals, or migration readiness.',
      source: 'Sales intelligence graph',
    });
  }

  if (
    crossAgentSummary &&
    (crossAgentSummary.highValueOpportunitiesBlockedByEngineering > 0 ||
      crossAgentSummary.proposalsNeedingApproval > 0 ||
      crossAgentSummary.organizationsNeedingExecutiveReview > 0)
  ) {
    priorities.push({
      id: 'cross-agent-collaboration-review',
      agent: 'Executive Agent',
      department: 'Operations',
      detail: `${crossAgentSummary.highValueOpportunitiesBlockedByEngineering} opportunity blocker(s), ${crossAgentSummary.proposalsNeedingApproval} approval item(s), and ${crossAgentSummary.organizationsNeedingExecutiveReview} organization review item(s) are linked across agents.`,
      priority: crossAgentSummary.highValueOpportunitiesBlockedByEngineering > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Sales and review Cross-Agent Collaboration before approving follow-up, proposal, or migration work.',
      source: 'Cross-agent collaboration graph',
    });
  }

  if (sharedTaskSummary && (sharedTaskSummary.blockedTasks > 0 || sharedTaskSummary.overdueTasks > 0)) {
    priorities.push({
      id: 'shared-work-queue-health',
      agent: 'Executive Agent',
      department: 'Operations',
      detail: `${sharedTaskSummary.blockedTasks} blocked task(s) and ${sharedTaskSummary.overdueTasks} overdue task(s) are in the shared work queue.`,
      priority: sharedTaskSummary.blockedTasks > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Operator and review the Shared Work Queue before assigning new agent work.',
      source: 'Shared task system',
    });
  }

  if (sharedTaskSummary && sharedTaskSummary.tasksRequiringExecutiveReview > 0) {
    priorities.push({
      id: 'shared-task-executive-review',
      agent: 'Executive Agent',
      department: 'Executive',
      detail: `${sharedTaskSummary.tasksRequiringExecutiveReview} shared task(s) require Executive review or approval.`,
      priority: 'medium',
      recommendedAction: 'Open Operator and resolve local task review items.',
      source: 'Shared task system',
    });
  }

  if (connectorReadiness && connectorReadiness.blockedWriteActionCount > 0) {
    priorities.push({
      id: 'connector-approval-gates',
      agent: 'Operations Agent',
      department: 'Operations',
      detail: `${connectorReadiness.connectorCount} connector template(s) are ready locally with ${connectorReadiness.blockedWriteActionCount} write action(s) blocked behind approval gates.`,
      priority: 'medium',
      recommendedAction: 'Open Operator and review Connector Readiness before enabling any future live tool access.',
      source: 'Connector readiness',
    });
  }

  if (email && (email.failedEmailCount > 0 || email.skippedEmailCount > 0 || email.automationStatus === 'disabled')) {
    priorities.push({
      id: 'gmail-email-automation-health',
      agent: 'Operations Agent',
      department: 'Operations',
      detail: `Gmail automation is ${email.automationStatus}; ${email.failedEmailCount} failed and ${email.skippedEmailCount} skipped email attempt(s) are recorded.`,
      priority: email.failedEmailCount > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Operator and review Gmail connector status, internal recipients, and email audit trail.',
      source: 'Gmail Email Connector',
    });
  }

  if (engineeringTasks && (engineeringTasks.criticalEngineeringTasks > 0 || engineeringTasks.salesBlockingEngineeringTasks > 0 || engineeringTasks.migrationBlockingEngineeringTasks > 0)) {
    priorities.push({
      id: 'engineering-task-generator-review',
      agent: 'Engineering Agent',
      department: 'Engineering',
      detail: `${engineeringTasks.generatedTasks} engineering task candidate(s), including ${engineeringTasks.criticalEngineeringTasks} critical, ${engineeringTasks.salesBlockingEngineeringTasks} sales-blocking, and ${engineeringTasks.migrationBlockingEngineeringTasks} migration-blocking item(s).`,
      priority: engineeringTasks.criticalEngineeringTasks > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Engineering and review generated task candidates before creating any shared work queue records.',
      source: 'Engineering Task Generator',
    });
  }

  if (executiveAutomation && executiveAutomation.unresolvedAutomationItems > 0) {
    priorities.push({
      id: 'executive-automation-engine-review',
      agent: 'Executive Agent',
      department: 'Executive',
      detail: `${executiveAutomation.triggeredRules.length} automation rule(s) triggered with ${executiveAutomation.skippedOrBlockedActions} skipped or blocked action(s).`,
      priority: executiveAutomation.automationHealth === 'Attention' ? 'high' : 'medium',
      recommendedAction: executiveAutomation.nextRecommendedAction,
      source: 'Executive Automation Engine',
    });
  }

  if (githubReadOnly && githubReadOnly.writeActionsEnabled === false) {
    priorities.push({
      id: 'github-read-only-ready',
      agent: 'Engineering Agent',
      department: 'Engineering',
      detail: 'GitHub connector is prepared for repository reads only; issue creation, PR creation, commits, branches, and workflow dispatch stay blocked.',
      priority: 'medium',
      recommendedAction: 'Use npm run github:validate and configure VYRA_GITHUB_* locally before live read-only inspection.',
      source: 'GitHub read-only connector',
    });
  }

  if (githubPlanning && githubPlanning.plansNeedingReview > 0) {
    priorities.push({
      id: 'github-plans-need-review',
      agent: 'Engineering Agent',
      department: 'Engineering',
      detail: `${githubPlanning.plansNeedingReview} local GitHub issue/PR plan(s) need Executive review.`,
      priority: 'medium',
      recommendedAction: 'Review the GitHub planning queue before approving any future GitHub write workflow.',
      source: 'GitHub planning layer',
    });
  }

  if (repositoryIntelligence && repositoryIntelligence.repositoryRisk !== 'Low') {
    priorities.push({
      id: 'repository-intelligence-risk',
      agent: 'Engineering Agent',
      department: 'Engineering',
      detail: `Repository Intelligence reports ${repositoryIntelligence.repositoryRisk} repository risk with health score ${repositoryIntelligence.engineeringHealthScore}/100.`,
      priority: repositoryIntelligence.repositoryRisk === 'High' ? 'high' : 'medium',
      recommendedAction: 'Review Repository Intelligence before approving Engineering or GitHub planning work.',
      source: 'Repository Intelligence Engine',
    });
  }

  if (projectRegistry && projectRegistry.releaseReadinessStatus !== 'Ready') {
    priorities.push({
      id: 'multi-project-release-readiness',
      agent: 'Executive Agent',
      department: 'Executive',
      detail: `${projectRegistry.blockedProjects} blocked project(s), ${projectRegistry.missingPaths} missing path(s), and release readiness ${projectRegistry.releaseReadinessStatus}.`,
      priority: projectRegistry.blockedProjects > 0 ? 'high' : 'medium',
      recommendedAction: 'Open Engineering or Operator and review the Project Registry before release planning.',
      source: 'Real Repo Multi-Project Registry',
    });
  }

  if (releaseReadiness && releaseReadiness.releaseHealth !== 'ready') {
    priorities.push({
      id: 'release-readiness-command-center',
      agent: 'Executive Agent',
      department: 'Executive',
      detail: `${releaseReadiness.blockedProjects} blocked release(s), ${releaseReadiness.criticalReleaseRisks} critical release risk(s), and average readiness ${releaseReadiness.averageReadinessScore}/100.`,
      priority: releaseReadiness.criticalReleaseRisks > 0 ? 'high' : 'medium',
      recommendedAction: releaseReadiness.recommendedExecutiveAction,
      source: 'Release Readiness Command Center',
    });
  }

  if (releaseShipPlans && (releaseShipPlans.blockedShipPlans > 0 || releaseShipPlans.shipPlansNeedingReview > 0)) {
    priorities.push({
      id: 'release-ship-plan-workflow',
      agent: 'Executive Agent',
      department: 'Executive',
      detail: `${releaseShipPlans.shipPlansNeedingReview} ship plan(s) need review, ${releaseShipPlans.approvedPreparationPlans} approved to prepare, and ${releaseShipPlans.blockedShipPlans} blocked.`,
      priority: releaseShipPlans.blockedShipPlans > 0 ? 'high' : 'medium',
      recommendedAction: releaseShipPlans.recommendedExecutiveDecision,
      source: 'Release Approval & Ship Plan Workflow',
    });
  }

  plannedAgents.forEach((agent) => {
    priorities.push({
      id: `planned-${agent.id}`,
      agent: agent.name,
      department: agent.owner,
      detail: `${agent.name} is registered but still planned.`,
      priority: 'low',
      recommendedAction: 'Define first workflow owner and operating rules when ready.',
      source: 'Agent registry',
    });
  });

  return priorities.slice(0, 12);
}
