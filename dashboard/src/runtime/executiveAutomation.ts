import type { ConnectorReadinessSummary } from './connectorReadiness';
import type { CrossAgentCollaborationSummary } from './crossAgentCollaboration';
import type { EngineeringTaskGeneratorSummary } from './engineeringTaskGenerator';
import type { GmailEmailDashboardSummary } from './gmailEmail';
import type { GitHubPlanningDashboardSummary } from './githubPlanning';
import type { GitHubReadOnlyDashboardSummary } from './githubReadOnly';
import type { ProjectRegistryDashboardSummary } from './projectRegistry';
import type { ReleaseReadinessDashboardSummary } from './releaseReadiness';
import type { RepositoryIntelligenceDashboardSummary } from './repositoryIntelligence';
import type { AgentRuntimeSnapshot } from './runtimeTypes';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';

export type ExecutiveAutomationTriggerType =
  | 'manual'
  | 'scheduled'
  | 'event-detected'
  | 'threshold-crossed'
  | 'validation-failed'
  | 'report-ready';

export type ExecutiveAutomationActionType =
  | 'run agent workflow'
  | 'create shared task'
  | 'create GitHub plan'
  | 'create email draft'
  | 'send configured internal email'
  | 'create Executive review item'
  | 'archive low-priority item'
  | 'generate report';

export interface ExecutiveAutomationRuleSummary {
  actions: ExecutiveAutomationActionType[];
  category: string;
  enabled: boolean;
  id: string;
  recommendedAction: string;
  severity: 'high' | 'medium' | 'low';
  signals: string[];
  trigger: ExecutiveAutomationTriggerType;
}

export interface ExecutiveAutomationSummary {
  actionTypes: ExecutiveAutomationActionType[];
  agentWorkflowsRun: number;
  automationEnabled: boolean;
  automationHealth: string;
  emailsSent: number;
  emailsSkipped: number;
  generatedEmails: number;
  generatedReports: number;
  generatedTasks: number;
  latestAutomationRun: string;
  nextRecommendedAction: string;
  rulesConfigured: number;
  safetyStatus: string;
  skippedOrBlockedActions: number;
  topTriggeredRules: ExecutiveAutomationRuleSummary[];
  triggerTypes: ExecutiveAutomationTriggerType[];
  triggeredRules: ExecutiveAutomationRuleSummary[];
  unresolvedAutomationItems: number;
}

export const executiveAutomationTriggerTypes: ExecutiveAutomationTriggerType[] = [
  'manual',
  'scheduled',
  'event-detected',
  'threshold-crossed',
  'validation-failed',
  'report-ready',
];

export const executiveAutomationActionTypes: ExecutiveAutomationActionType[] = [
  'run agent workflow',
  'create shared task',
  'create GitHub plan',
  'create email draft',
  'send configured internal email',
  'create Executive review item',
  'archive low-priority item',
  'generate report',
];

const safetyStatus = 'Pass: local-only, internal-email-only, no GitHub/CRM/Stripe/Supabase writes';

export function buildDashboardExecutiveAutomationSummary(input: {
  connectorReadiness?: ConnectorReadinessSummary;
  crossAgentSummary?: CrossAgentCollaborationSummary;
  email?: GmailEmailDashboardSummary;
  engineeringTasks?: EngineeringTaskGeneratorSummary;
  githubPlanning?: GitHubPlanningDashboardSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  projectRegistry?: ProjectRegistryDashboardSummary;
  releaseReadiness?: ReleaseReadinessDashboardSummary;
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary;
  runtime: AgentRuntimeSnapshot;
  sharedTasks?: SharedTaskDashboardSummary;
}): ExecutiveAutomationSummary {
  const triggeredRules = buildRules(input);
  const emailRules = triggeredRules.filter((rule) => rule.actions.includes('create email draft'));
  const taskRules = triggeredRules.filter((rule) => rule.actions.includes('create shared task') || rule.actions.includes('create Executive review item'));
  const reportRules = triggeredRules.filter((rule) => rule.actions.includes('generate report'));
  const workflowRules = triggeredRules.filter((rule) => rule.actions.includes('run agent workflow'));
  const skippedOrBlockedActions = triggeredRules.filter((rule) => rule.actions.includes('send configured internal email')).length;
  return {
    actionTypes: executiveAutomationActionTypes,
    agentWorkflowsRun: workflowRules.length,
    automationEnabled: true,
    automationHealth: triggeredRules.some((rule) => rule.severity === 'high') ? 'Attention' : triggeredRules.length ? 'Watch' : 'Ready',
    emailsSent: input.email?.sentEmailCount ?? 0,
    emailsSkipped: input.email?.skippedEmailCount ?? 0,
    generatedEmails: emailRules.length,
    generatedReports: reportRules.length,
    generatedTasks: taskRules.length,
    latestAutomationRun: new Date().toISOString(),
    nextRecommendedAction: triggeredRules[0]?.recommendedAction ?? 'No automation rule requires attention.',
    rulesConfigured: 10,
    safetyStatus,
    skippedOrBlockedActions,
    topTriggeredRules: triggeredRules.slice(0, 5),
    triggerTypes: executiveAutomationTriggerTypes,
    triggeredRules,
    unresolvedAutomationItems: triggeredRules.length + skippedOrBlockedActions,
  };
}

function buildRules(input: {
  connectorReadiness?: ConnectorReadinessSummary;
  crossAgentSummary?: CrossAgentCollaborationSummary;
  email?: GmailEmailDashboardSummary;
  engineeringTasks?: EngineeringTaskGeneratorSummary;
  githubPlanning?: GitHubPlanningDashboardSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  projectRegistry?: ProjectRegistryDashboardSummary;
  releaseReadiness?: ReleaseReadinessDashboardSummary;
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary;
  runtime: AgentRuntimeSnapshot;
  sharedTasks?: SharedTaskDashboardSummary;
}): ExecutiveAutomationRuleSummary[] {
  return [
    maybeRule(
      'engineering-health-warnings',
      'engineering health warnings',
      'threshold-crossed',
      ['create shared task', 'create GitHub plan', 'create Executive review item'],
      Boolean((input.repositoryIntelligence && input.repositoryIntelligence.repositoryRisk !== 'Low') || (input.projectRegistry?.blockedProjects ?? 0) > 0 || (input.releaseReadiness?.blockedProjects ?? 0) > 0),
      [
        `Repository risk ${input.repositoryIntelligence?.repositoryRisk ?? 'Unknown'}; health ${input.repositoryIntelligence?.engineeringHealthScore ?? 0}/100; blocked projects ${input.projectRegistry?.blockedProjects ?? 0}; blocked releases ${input.releaseReadiness?.blockedProjects ?? 0}.`,
      ],
      'high',
    ),
    maybeRule(
      'failed-validations',
      'failed validations',
      'validation-failed',
      ['run agent workflow', 'create shared task', 'generate report'],
      input.runtime.sync.failedRecords > 0,
      [`${input.runtime.sync.failedRecords} runtime sync validation record(s) failed.`],
      'high',
    ),
    maybeRule(
      'github-repo-changes',
      'GitHub repo changes',
      'event-detected',
      ['create GitHub plan', 'create Executive review item'],
      Boolean(input.githubReadOnly && input.repositoryIntelligence?.dependencyEdges),
      [`${input.repositoryIntelligence?.dependencyEdges ?? 0} repository dependency edge(s) are available for local planning.`],
      'medium',
    ),
    maybeRule(
      'blocked-tasks',
      'blocked tasks',
      'threshold-crossed',
      ['create shared task', 'create Executive review item'],
      Boolean(input.sharedTasks?.blockedTasks),
      [`${input.sharedTasks?.blockedTasks ?? 0} shared task(s) blocked.`],
      'high',
    ),
    maybeRule(
      'overdue-tasks',
      'overdue tasks',
      'threshold-crossed',
      ['create shared task', 'create email draft'],
      Boolean(input.sharedTasks?.overdueTasks),
      [`${input.sharedTasks?.overdueTasks ?? 0} shared task(s) overdue.`],
      'medium',
    ),
    maybeRule(
      'high-value-sales-opportunities',
      'high-value Sales opportunities',
      'event-detected',
      ['create shared task', 'create email draft', 'create Executive review item'],
      Boolean(input.crossAgentSummary?.highValueOpportunitiesBlockedByEngineering || input.crossAgentSummary?.proposalsNeedingApproval),
      [
        `${input.crossAgentSummary?.highValueOpportunitiesBlockedByEngineering ?? 0} opportunity blocker(s), ${input.crossAgentSummary?.proposalsNeedingApproval ?? 0} proposal approval item(s).`,
      ],
      'medium',
    ),
    maybeRule(
      'migration-blockers',
      'migration blockers',
      'event-detected',
      ['run agent workflow', 'create shared task', 'generate report'],
      Boolean(input.engineeringTasks?.migrationBlockingEngineeringTasks),
      [`${input.engineeringTasks?.migrationBlockingEngineeringTasks ?? 0} migration-blocking Engineering candidate(s).`],
      'high',
    ),
    maybeRule(
      'connector-readiness-failures',
      'connector readiness failures',
      'validation-failed',
      ['create shared task', 'create Executive review item'],
      Boolean(input.connectorReadiness?.blockedWriteActionCount),
      [`${input.connectorReadiness?.blockedWriteActionCount ?? 0} connector write action(s) remain blocked.`],
      'medium',
    ),
    maybeRule(
      'email-send-failures-skips',
      'email send failures/skips',
      'event-detected',
      ['create shared task', 'create email draft', 'generate report'],
      Boolean(input.email && (input.email.failedEmailCount > 0 || input.email.skippedEmailCount > 0 || input.email.automationStatus === 'disabled')),
      [`Gmail automation ${input.email?.automationStatus ?? 'unknown'}; failed ${input.email?.failedEmailCount ?? 0}; skipped ${input.email?.skippedEmailCount ?? 0}.`],
      'medium',
    ),
    maybeRule(
      'cross-agent-review-needs',
      'cross-agent review needs',
      'report-ready',
      ['create Executive review item', 'create email draft', 'send configured internal email', 'generate report'],
      Boolean(input.crossAgentSummary?.organizationsNeedingExecutiveReview || (input.projectRegistry && input.projectRegistry.releaseReadinessStatus !== 'Ready') || (input.releaseReadiness && input.releaseReadiness.releaseHealth !== 'ready')),
      [
        `${input.crossAgentSummary?.organizationsNeedingExecutiveReview ?? 0} organization(s) need Executive review; project readiness ${input.projectRegistry?.releaseReadinessStatus ?? 'unknown'}; release health ${input.releaseReadiness?.releaseHealth ?? 'unknown'}.`,
      ],
      'medium',
    ),
  ].filter((rule): rule is ExecutiveAutomationRuleSummary => Boolean(rule));
}

function maybeRule(
  id: string,
  category: string,
  trigger: ExecutiveAutomationTriggerType,
  actions: ExecutiveAutomationActionType[],
  condition: unknown,
  signals: string[],
  severity: 'high' | 'medium' | 'low',
): ExecutiveAutomationRuleSummary | null {
  if (!condition) return null;
  return {
    actions,
    category,
    enabled: true,
    id,
    recommendedAction:
      severity === 'high' ? `Review ${category} before approving dependent agent workflows.` : `Queue ${category} for Executive review and local reporting.`,
    severity,
    signals,
    trigger,
  };
}
