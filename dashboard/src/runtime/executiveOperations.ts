import type { ConnectorReadinessSummary } from './connectorReadiness';
import type { CrossAgentCollaborationSummary } from './crossAgentCollaboration';
import type { EngineeringTaskGeneratorSummary } from './engineeringTaskGenerator';
import type { ExecutiveAutomationSummary } from './executiveAutomation';
import type { GmailEmailDashboardSummary } from './gmailEmail';
import type { GitHubPlanningDashboardSummary } from './githubPlanning';
import type { ProjectRegistryDashboardSummary } from './projectRegistry';
import type { ReleaseReadinessDashboardSummary } from './releaseReadiness';
import type { ReleaseShipPlanDashboardSummary } from './releaseShipPlans';
import type { RepositoryIntelligenceDashboardSummary } from './repositoryIntelligence';
import type { AgentRuntimeSnapshot } from './runtimeTypes';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';
import type {
  SalesIntegrationSummary,
  SalesIntelligenceSummary,
  SalesScoringSummary,
  SalesSummary,
} from '../agents/sales/salesTypes';

export interface ExecutiveOperationsKpis {
  automationSuccess: number;
  blockedTasks: number;
  completedTasks: number;
  connectorReadiness: number;
  criticalEngineeringTasks: number;
  emailDeliveryStatus: string;
  engineeringHealthPercent: number;
  openTasks: number;
  projectsOnTrack: number;
  projectsOnTrackPercent: number;
  releaseReadinessPercent: number;
  salesPipelineHealth: number;
  scheduledCommunications: number;
}

export interface ExecutiveDailyBriefingSummary {
  blockedWork: string[];
  criticalEngineeringIssues: string[];
  criticalSalesOpportunities: string[];
  date: string;
  overnightChanges: string[];
  pendingApprovals: {
    githubPlansNeedingReview: number;
    runtimeApprovals: number;
    shipPlansNeedingReview: number;
    taskReviewItems: number;
  };
  recommendedNextActions: string[];
  releaseReadinessSummary: {
    averageReadinessScore: number;
    blockedProjects: number;
    readyProjects: number;
    releaseHealth: string;
    shipPlanDecision: string;
  };
  scheduledCommunications: {
    deliveryStatus: string;
    draftsAwaitingSend: number;
    scheduledEmailReports: number;
  };
  todaysPriorities: string[];
}

export interface ExecutiveOperationsDashboardSummary {
  automationHealth: string;
  briefing: ExecutiveDailyBriefingSummary;
  commands: string[];
  communicationHealth: string;
  connectorReadiness: string;
  dailyOperatingStatus: string;
  generatedReports: string[];
  latestBriefing: string;
  latestKpiSnapshot: string;
  nextScheduledBriefing: string;
  operationalAlerts: string[];
  organizationHealth: string;
  overallExecutiveScore: number;
  projectHealth: string;
  releaseHealth: string;
  salesHealth: string;
  engineeringHealth: string;
  taskHealth: string;
  kpis: ExecutiveOperationsKpis;
}

export const executiveOperationsCommands = [
  'npm run executive:briefing',
  'npm run executive:kpis',
  'npm run executive:operations',
  'npm run executive:health',
  'npm run executive:report',
  'npm run executive:validate',
];

export function buildDashboardExecutiveOperationsSummary(input: {
  connectorReadiness: ConnectorReadinessSummary;
  crossAgentSummary?: CrossAgentCollaborationSummary;
  email: GmailEmailDashboardSummary;
  engineeringTasks: EngineeringTaskGeneratorSummary;
  executiveAutomation: ExecutiveAutomationSummary;
  githubPlanning: GitHubPlanningDashboardSummary;
  projectRegistry: ProjectRegistryDashboardSummary;
  releaseReadiness: ReleaseReadinessDashboardSummary;
  releaseShipPlans: ReleaseShipPlanDashboardSummary;
  repositoryIntelligence: RepositoryIntelligenceDashboardSummary;
  runtime: AgentRuntimeSnapshot;
  salesIntegration?: SalesIntegrationSummary;
  salesIntelligenceSummary?: SalesIntelligenceSummary;
  salesScoringSummary?: SalesScoringSummary;
  salesSummary?: SalesSummary;
  sharedTasks: SharedTaskDashboardSummary;
}): ExecutiveOperationsDashboardSummary {
  const generatedAt = new Date().toISOString();
  const kpis = buildKpis(input);
  const scores = buildScores(input, kpis);
  const briefing = buildBriefing(input, generatedAt, kpis, scores.overallExecutiveScore);
  const operationalAlerts = [
    ...briefing.blockedWork,
    input.executiveAutomation.triggeredRules.length ? `${input.executiveAutomation.triggeredRules.length} automation rule(s) triggered.` : null,
    input.connectorReadiness.blockedWriteActionCount ? `${input.connectorReadiness.blockedWriteActionCount} connector write action(s) blocked.` : null,
  ].filter(Boolean) as string[];

  return {
    automationHealth: healthLabel(scores.automationScore),
    briefing,
    commands: executiveOperationsCommands,
    communicationHealth: healthLabel(scores.communicationScore),
    connectorReadiness: healthLabel(scores.connectorScore),
    dailyOperatingStatus: healthLabel(scores.overallExecutiveScore),
    engineeringHealth: healthLabel(scores.engineeringScore),
    generatedReports: ['Executive Daily Briefing Markdown', 'Executive KPI Report Markdown', 'Executive Operations Report Markdown', 'Executive Operations JSON'],
    kpis,
    latestBriefing: generatedAt,
    latestKpiSnapshot: generatedAt,
    nextScheduledBriefing: 'Next local briefing: tomorrow 8:00 AM operator time',
    operationalAlerts,
    organizationHealth: healthLabel(scores.organizationScore),
    overallExecutiveScore: scores.overallExecutiveScore,
    projectHealth: healthLabel(scores.projectScore),
    releaseHealth: healthLabel(scores.releaseScore),
    salesHealth: healthLabel(scores.salesScore),
    taskHealth: healthLabel(scores.taskScore),
  };
}

function buildBriefing(
  input: Parameters<typeof buildDashboardExecutiveOperationsSummary>[0],
  generatedAt: string,
  kpis: ExecutiveOperationsKpis,
  overallExecutiveScore: number,
): ExecutiveDailyBriefingSummary {
  const blockedWork = [
    input.sharedTasks.blockedTasks ? `${input.sharedTasks.blockedTasks} shared task(s) blocked.` : null,
    input.releaseReadiness.blockedProjects ? `${input.releaseReadiness.blockedProjects} release project(s) blocked.` : null,
    input.releaseShipPlans.blockedShipPlans ? `${input.releaseShipPlans.blockedShipPlans} ship plan(s) blocked.` : null,
    input.email.skippedEmailCount ? `${input.email.skippedEmailCount} email send(s) skipped safely.` : null,
  ].filter(Boolean) as string[];

  return {
    blockedWork,
    criticalEngineeringIssues: input.engineeringTasks.candidates
      .filter((candidate) => candidate.recommendedPriority === 'Critical')
      .slice(0, 5)
      .map((candidate) => `${candidate.title}: ${candidate.reason}`),
    criticalSalesOpportunities: [
      `$${input.salesSummary?.estimatedPipelineValue?.toLocaleString() ?? '55,200'} local estimated pipeline`,
      `${input.salesScoringSummary?.hotLeadCount ?? input.salesSummary?.hotLeads ?? 0} hot scored lead(s)`,
      `${input.salesScoringSummary?.overdueFollowUpCount ?? 0} overdue follow-up(s)`,
      `${input.salesSummary?.proposalNeeded ?? 0} proposal-needed lead(s)`,
      `${input.crossAgentSummary?.organizationsNeedingExecutiveReview ?? 0} organization(s) need Executive sales review.`,
    ],
    date: generatedAt.slice(0, 10),
    overnightChanges: [
      `Repository Intelligence health is ${input.repositoryIntelligence.repositoryRisk} with ${input.repositoryIntelligence.dependencyEdges} dependency edge(s).`,
      `Executive automation has ${input.executiveAutomation.triggeredRules.length} triggered rule(s).`,
      `Shared task queue has ${input.sharedTasks.openTasks} open task(s), ${input.sharedTasks.blockedTasks} blocked.`,
      `Release readiness is ${input.releaseReadiness.releaseHealth}.`,
    ],
    pendingApprovals: {
      githubPlansNeedingReview: input.githubPlanning.plansNeedingReview,
      runtimeApprovals: input.runtime.approvals.filter((approval) => approval.status === 'pending').length,
      shipPlansNeedingReview: input.releaseShipPlans.shipPlansNeedingReview,
      taskReviewItems: input.sharedTasks.tasksRequiringExecutiveReview,
    },
    recommendedNextActions: unique([
      input.executiveAutomation.nextRecommendedAction,
      input.releaseReadiness.recommendedExecutiveAction,
      input.releaseShipPlans.recommendedExecutiveDecision,
      input.sharedTasks.blockedTasks ? 'Open Operator and clear blocked shared tasks.' : null,
      overallExecutiveScore < 70 ? 'Review Executive Operations score before approving new work.' : null,
    ]).slice(0, 8),
    releaseReadinessSummary: {
      averageReadinessScore: input.releaseReadiness.averageReadinessScore,
      blockedProjects: input.releaseReadiness.blockedProjects,
      readyProjects: input.releaseReadiness.readyProjects,
      releaseHealth: input.releaseReadiness.releaseHealth,
      shipPlanDecision: input.releaseShipPlans.recommendedExecutiveDecision,
    },
    scheduledCommunications: {
      deliveryStatus: input.email.failedEmailCount ? 'failed_attempts_need_review' : input.email.skippedEmailCount ? 'skipped_safely' : input.email.automationStatus,
      draftsAwaitingSend: input.email.draftsAwaitingSend,
      scheduledEmailReports: input.email.scheduledReports,
    },
    todaysPriorities: unique([
      ...input.executiveAutomation.topTriggeredRules.map((rule) => rule.recommendedAction),
      input.releaseReadiness.recommendedExecutiveAction,
      input.releaseShipPlans.recommendedExecutiveDecision,
      `${kpis.criticalEngineeringTasks} critical Engineering task candidate(s) need triage.`,
      input.salesIntegration?.crmReadinessStatus !== 'ready' ? 'Keep Sales external actions disabled until CRM/email/Stripe gates exist.' : null,
    ]).slice(0, 10),
  };
}

function buildKpis(input: Parameters<typeof buildDashboardExecutiveOperationsSummary>[0]): ExecutiveOperationsKpis {
  const releaseProjectCount = Math.max(1, input.releaseReadiness.projects.length);
  const projectCount = Math.max(1, input.projectRegistry.registeredProjects);
  return {
    automationSuccess: clamp(100 - input.executiveAutomation.triggeredRules.length * 8 - input.executiveAutomation.skippedOrBlockedActions * 10),
    blockedTasks: input.sharedTasks.blockedTasks,
    completedTasks: input.sharedTasks.recentlyCompleted.length,
    connectorReadiness: Math.round((input.connectorReadiness.readyTemplates / Math.max(1, input.connectorReadiness.connectorCount)) * 100),
    criticalEngineeringTasks: input.engineeringTasks.criticalEngineeringTasks,
    emailDeliveryStatus: input.email.failedEmailCount ? 'failed_attempts_need_review' : input.email.skippedEmailCount ? 'skipped_safely' : input.email.automationStatus,
    engineeringHealthPercent: input.repositoryIntelligence.engineeringHealthScore,
    openTasks: input.sharedTasks.openTasks,
    projectsOnTrack: input.projectRegistry.registeredProjects - input.projectRegistry.blockedProjects,
    projectsOnTrackPercent: Math.round(((input.projectRegistry.registeredProjects - input.projectRegistry.blockedProjects) / projectCount) * 100),
    releaseReadinessPercent: Math.round((input.releaseReadiness.readyProjects / releaseProjectCount) * 100),
    salesPipelineHealth: salesHealth(input),
    scheduledCommunications: input.email.scheduledReports,
  };
}

function buildScores(input: Parameters<typeof buildDashboardExecutiveOperationsSummary>[0], kpis: ExecutiveOperationsKpis) {
  const engineeringScore = input.repositoryIntelligence.engineeringHealthScore;
  const salesScore = kpis.salesPipelineHealth;
  const projectScore = clamp(kpis.projectsOnTrackPercent);
  const releaseScore = input.releaseReadiness.averageReadinessScore;
  const communicationScore = clamp(100 - input.email.failedEmailCount * 25 - input.email.skippedEmailCount * 10 - (input.email.automationStatus === 'enabled' ? 0 : 15));
  const taskScore = clamp(100 - input.sharedTasks.blockedTasks * 15 - input.sharedTasks.overdueTasks * 10 - input.sharedTasks.tasksRequiringExecutiveReview * 4);
  const automationScore = kpis.automationSuccess;
  const connectorScore = input.connectorReadiness.riskSummary.executiveRiskLevel === 'Watch' ? 75 : 90;
  const organizationScore = clamp((salesScore + projectScore + taskScore + communicationScore) / 4);
  const overallExecutiveScore = clamp((organizationScore + engineeringScore + salesScore + projectScore + releaseScore + communicationScore + taskScore + automationScore + connectorScore) / 9);
  return { automationScore, communicationScore, connectorScore, engineeringScore, organizationScore, overallExecutiveScore, projectScore, releaseScore, salesScore, taskScore };
}

function salesHealth(input: Parameters<typeof buildDashboardExecutiveOperationsSummary>[0]) {
  return clamp(85 - (input.crossAgentSummary?.organizationsNeedingExecutiveReview ?? 0) * 3 - (input.salesScoringSummary?.atRiskLeadCount ?? 0) * 8 + Math.min(10, input.salesScoringSummary?.hotLeadCount ?? 0));
}

function healthLabel(score: number) {
  return score < 60 ? 'attention' : score < 80 ? 'watch' : 'ready';
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function unique(items: Array<string | null | undefined>) {
  return [...new Set(items.filter(Boolean) as string[])];
}
