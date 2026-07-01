import type { AgentRuntimeSnapshot } from './runtimeTypes';
import type { SalesOpportunityPipelineSummary, SalesResearchIntelligenceSummary, SalesWorkflowSummary } from '../agents/sales/salesTypes';
import { buildDashboardConnectorReadiness, type ConnectorReadinessSummary } from './connectorReadiness';
import { defaultEngineeringTaskSummary, type EngineeringTaskGeneratorSummary } from './engineeringTaskGenerator';
import { buildDashboardExecutiveAutomationSummary, type ExecutiveAutomationSummary } from './executiveAutomation';
import { buildDashboardExecutiveEmailBriefingSummary, type ExecutiveEmailBriefingSummary } from './executiveEmailBriefing';
import { buildDashboardExecutiveOperationsSummary, type ExecutiveOperationsDashboardSummary } from './executiveOperations';
import { buildDashboardGmailEmailSummary, type GmailEmailDashboardSummary } from './gmailEmail';
import { buildDashboardGitHubPlanningSummary, type GitHubPlanningDashboardSummary } from './githubPlanning';
import { buildDashboardGitHubReadOnlySummary, type GitHubReadOnlyDashboardSummary } from './githubReadOnly';
import { buildDashboardProjectRegistrySummary, type ProjectRegistryDashboardSummary } from './projectRegistry';
import { buildDashboardReleaseReadinessSummary, type ReleaseReadinessDashboardSummary } from './releaseReadiness';
import { buildDashboardReleaseShipPlanSummary, type ReleaseShipPlanDashboardSummary } from './releaseShipPlans';
import { defaultRepositoryIntelligenceSummary, type RepositoryIntelligenceDashboardSummary } from './repositoryIntelligence';
import { buildDashboardSharedTaskSummary, type SharedTaskDashboardSummary } from './sharedTaskQueue';

export interface AiOperatorMetadata {
  gitBranch: string;
  gitCommit: string;
  integrationMode: string;
  operatorName: string;
  operatorTool: string;
  operatorVersion: string;
  safetyMode: string;
  timestamp: string;
}

export interface AiOperatorDashboardSnapshot {
  activeOperator: string;
  agentRuntimeHealth: string;
  blockedExternalActions: string[];
  commands: string[];
  integrationMode: string;
  lastReport: string;
  lastRun: string;
  lastValidation: string;
  metadata: AiOperatorMetadata;
  communicationDrafts: AiCommunicationDraftSnapshot;
  communicationProviders: AiCommunicationProviderSnapshot;
  connectorReadiness: ConnectorReadinessSummary;
  email: GmailEmailDashboardSummary;
  engineeringTasks: EngineeringTaskGeneratorSummary;
  executiveAutomation: ExecutiveAutomationSummary;
  executiveEmailBriefing: ExecutiveEmailBriefingSummary;
  executiveOperations: ExecutiveOperationsDashboardSummary;
  githubPlanning: GitHubPlanningDashboardSummary;
  githubReadOnly: GitHubReadOnlyDashboardSummary;
  projectRegistry: ProjectRegistryDashboardSummary;
  releaseReadiness: ReleaseReadinessDashboardSummary;
  releaseShipPlans: ReleaseShipPlanDashboardSummary;
  repositoryIntelligence: RepositoryIntelligenceDashboardSummary;
  salesResearchIntelligence: SalesResearchIntelligenceSummary;
  salesWorkflowSummary: SalesWorkflowSummary;
  salesLocalCrm: SalesOpportunityPipelineSummary;
  safetyMode: string;
  sharedTasks: SharedTaskDashboardSummary;
  threadBridge: AiThreadBridgeSnapshot;
}

export interface AiCommunicationDraftSnapshot {
  approvedLocalDrafts: number;
  approvedForManualSendDrafts: number;
  archivedDrafts: number;
  copiedDrafts: number;
  draftCount: number;
  draftsByType: Record<string, number>;
  draftRoot: string;
  latestAuditActions: AiCommunicationAuditAction[];
  manuallyMarkedSentDrafts: number;
  notSentStatus: string;
  pendingReviewDrafts: number;
  rejectedDrafts: number;
}

export interface AiCommunicationAuditAction {
  actionTaken: string;
  draftId: string;
  externalSendMethod: string;
  operatorName: string;
  operatorTool: string;
  timestamp: string;
}

export interface AiCommunicationProviderStatus {
  displayName: string;
  missingConfig: string[];
  provider: string;
  sendingEnabled: boolean;
  status: string;
}

export interface AiCommunicationProviderSnapshot {
  approvalRequired: boolean;
  draftOnlyMode: boolean;
  missingConfig: number;
  productionSendModeAvailable: boolean;
  providerCallsBlocked: boolean;
  providers: AiCommunicationProviderStatus[];
  sendingDisabled: boolean;
}

export interface AiThreadApprovalSnapshot {
  approvedCount: number;
  pendingByType: Record<string, number>;
  pendingCount: number;
  rejectedCount: number;
}

export interface AiThreadBridgeSnapshot {
  approvalQueue: AiThreadApprovalSnapshot;
  archiveStatus: string;
  dueSchedules: number;
  inboxPath: string;
  lastScheduledRun: string;
  latestIngestedThread: string;
  namedAgentSources: string[];
  outboxPath: string;
  pendingThreadOutputs: number;
  recommendedNextActions: string[];
  schedulePath: string;
}

const safetyMode = 'local/mock/read-only';

export const aiOperatorCommands = [
  'npm run agents:status',
  'npm run agents:run',
  'npm run agents:executive-summary',
  'npm run agents:report',
  'npm run agents:safety-check',
  'npm run agents:graph',
  'npm run agents:validate',
  'npm run threads:status',
  'npm run threads:ingest',
  'npm run threads:summary',
  'npm run threads:archive',
  'npm run threads:schedules',
  'npm run threads:run-due',
  'npm run threads:approval-queue',
  'npm run threads:approve',
  'npm run threads:reject',
  'npm run threads:validate',
  'npm run comms:drafts',
  'npm run comms:create-draft',
  'npm run comms:review',
  'npm run comms:archive',
  'npm run comms:providers',
  'npm run comms:provider-check',
  'npm run comms:send-readiness',
  'npm run comms:safety-check',
  'npm run comms:manual-send',
  'npm run comms:mark-copied',
  'npm run comms:mark-sent',
  'npm run comms:audit',
  'npm run comms:audit-report',
  'npm run comms:validate',
  'npm run email:status',
  'npm run email:drafts',
  'npm run email:create-draft',
  'npm run email:send',
  'npm run email:send-pending',
  'npm run email:audit',
  'npm run email:validate',
  'npm run email:safety-check',
  'npm run sales:opportunities',
  'npm run sales:create-opportunity',
  'npm run sales:update-opportunity',
  'npm run sales:move-stage',
  'npm run sales:timeline',
  'npm run sales:score',
  'npm run sales:followup',
  'npm run sales:proposal-status',
  'npm run sales:archive',
  'npm run sales:restore',
  'npm run sales:merge',
  'npm run sales:dashboard',
  'npm run sales:sources',
  'npm run sales:add-source',
  'npm run sales:update-source',
  'npm run sales:disable-source',
  'npm run sales:approve-source',
  'npm run sales:reject-source',
  'npm run sales:intake',
  'npm run sales:verify',
  'npm run sales:duplicates',
  'npm run sales:enrich',
  'npm run sales:research-report',
  'npm run sales:sources-report',
  'npm run sales:workflows',
  'npm run sales:create-handoff',
  'npm run sales:update-workflow',
  'npm run sales:assign-workflow',
  'npm run sales:approve-handoff',
  'npm run sales:reject-handoff',
  'npm run sales:block-handoff',
  'npm run sales:complete-handoff',
  'npm run sales:archive-workflow',
  'npm run sales:proposal-queue',
  'npm run sales:workflow-report',
  'npm run sales:workflow-validate',
  'npm run reports:validate',
  'npm run sales:validate',
  'npm run tasks:status',
  'npm run tasks:list',
  'npm run tasks:create',
  'npm run tasks:assign',
  'npm run tasks:claim',
  'npm run tasks:complete',
  'npm run tasks:archive',
  'npm run tasks:report',
  'npm run tasks:validate',
  'npm run connectors:status',
  'npm run connectors:readiness',
  'npm run connectors:approval-map',
  'npm run connectors:safety-check',
  'npm run connectors:validate',
  'npm run github:status',
  'npm run github:repo',
  'npm run github:branches',
  'npm run github:commits',
  'npm run github:issues',
  'npm run github:prs',
  'npm run github:safety-check',
  'npm run github:validate',
  'npm run github:plans',
  'npm run github:create-plan',
  'npm run github:review-plan',
  'npm run github:archive-plan',
  'npm run github:plan-report',
  'npm run github:planning-validate',
  'npm run repo:scan',
  'npm run repo:status',
  'npm run repo:graph',
  'npm run repo:health',
  'npm run repo:owners',
  'npm run repo:validate',
  'npm run projects:status',
  'npm run projects:list',
  'npm run projects:scan',
  'npm run projects:health',
  'npm run projects:report',
  'npm run projects:validate',
  'npm run release:status',
  'npm run release:scan',
  'npm run release:readiness',
  'npm run release:blockers',
  'npm run release:report',
  'npm run release:validate',
  'npm run release:ship-plans',
  'npm run release:create-ship-plan',
  'npm run release:review-ship-plan',
  'npm run release:approve-ship-plan',
  'npm run release:reject-ship-plan',
  'npm run release:ship-plan-report',
  'npm run release:ship-plan-validate',
  'npm run engineering:tasks',
  'npm run engineering:generate-tasks',
  'npm run engineering:task-report',
  'npm run engineering:validate',
  'npm run executive:automation-status',
  'npm run executive:automation-run',
  'npm run executive:automation-rules',
  'npm run executive:automation-report',
  'npm run executive:automation-validate',
  'npm run executive:automation-safety-check',
  'npm run executive:briefing',
  'npm run executive:kpis',
  'npm run executive:operations',
  'npm run executive:health',
  'npm run executive:report',
  'npm run executive:validate',
  'npm run executive:email-briefing',
  'npm run executive:email-preview',
  'npm run executive:email-send',
  'npm run executive:email-status',
  'npm run executive:email-validate',
];

export const aiOperatorBlockedActions = [
  'No external marketing emails',
  'No SMS',
  'No CRM writes',
  'No Stripe writes',
  'No Supabase production writes',
  'No production business writes',
  'No secret output',
  'No .env.local modifications',
];

export function buildAiOperatorMetadata(integrationMode: string): AiOperatorMetadata {
  return {
    gitBranch: import.meta.env.VITE_GIT_BRANCH ?? 'local',
    gitCommit: import.meta.env.VITE_GIT_COMMIT ?? 'local',
    integrationMode,
    operatorName: import.meta.env.VITE_OPERATOR_NAME ?? 'Robert',
    operatorTool: import.meta.env.VITE_OPERATOR_TOOL ?? 'Dashboard Operator',
    operatorVersion: import.meta.env.VITE_OPERATOR_VERSION ?? 'not provided',
    safetyMode,
    timestamp: new Date().toISOString(),
  };
}

export function buildAiOperatorDashboardSnapshot(input: {
  integrationMode: string;
  lastReport?: string | null;
  lastRun?: string | null;
  lastScheduledRun?: string | null;
  lastThreadArchive?: string | null;
  lastThreadIngest?: string | null;
  lastValidation?: string | null;
  communicationDraftCounts?: {
    approvedLocalDrafts: number;
    approvedForManualSendDrafts?: number;
    archivedDrafts: number;
    copiedDrafts?: number;
    draftCount: number;
    manuallyMarkedSentDrafts?: number;
    pendingReviewDrafts: number;
    rejectedDrafts?: number;
  };
  communicationDraftsByType?: Record<string, number>;
  communicationLatestAuditActions?: AiCommunicationAuditAction[];
  communicationProviders?: AiCommunicationProviderSnapshot;
  pendingApprovalsByType?: Record<string, number>;
  pendingApprovalCount?: number;
  pendingThreadOutputs?: number;
  threadApprovalDecisionCounts?: { approved: number; rejected: number };
  threadDueSchedules?: number;
  runtime: AgentRuntimeSnapshot;
  connectorReadiness?: ConnectorReadinessSummary;
  email?: GmailEmailDashboardSummary;
  engineeringTasks?: EngineeringTaskGeneratorSummary;
  executiveAutomation?: ExecutiveAutomationSummary;
  executiveEmailBriefing?: ExecutiveEmailBriefingSummary;
  executiveOperations?: ExecutiveOperationsDashboardSummary;
  githubPlanning?: GitHubPlanningDashboardSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  projectRegistry?: ProjectRegistryDashboardSummary;
  releaseReadiness?: ReleaseReadinessDashboardSummary;
  releaseShipPlans?: ReleaseShipPlanDashboardSummary;
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary;
  salesLocalCrm?: SalesOpportunityPipelineSummary;
  salesResearchIntelligence?: SalesResearchIntelligenceSummary;
  salesWorkflowSummary?: SalesWorkflowSummary;
  sharedTasks?: SharedTaskDashboardSummary;
}): AiOperatorDashboardSnapshot {
  const metadata = buildAiOperatorMetadata(input.integrationMode);
  const warningAgents = input.runtime.agents.filter((agent) => input.runtime.health[agent.id]?.warnings > 0).length;
  const blockedAgents = input.runtime.agents.filter((agent) => input.runtime.health[agent.id]?.errors > 0).length;
  const runtimeHealth = blockedAgents > 0 ? 'Attention' : warningAgents > 0 ? 'Watch' : 'Ready';
  const connectorReadiness = input.connectorReadiness ?? buildDashboardConnectorReadiness();
  const email = input.email ?? buildDashboardGmailEmailSummary();
  const engineeringTasks = input.engineeringTasks ?? defaultEngineeringTaskSummary();
  const githubPlanning = input.githubPlanning ?? buildDashboardGitHubPlanningSummary();
  const githubReadOnly = input.githubReadOnly ?? buildDashboardGitHubReadOnlySummary();
  const projectRegistry = input.projectRegistry ?? buildDashboardProjectRegistrySummary();
  const repositoryIntelligence = input.repositoryIntelligence ?? defaultRepositoryIntelligenceSummary();
  const sharedTasks = input.sharedTasks ?? buildDashboardSharedTaskSummary();
  const salesLocalCrm = input.salesLocalCrm ?? {
    activeOpportunities: 0,
    averageIcp: 0,
    averageLeadScore: 0,
    awaitingFollowUp: 0,
    highPriority: 0,
    lost: 0,
    proposalReady: 0,
    proposalSent: 0,
    totalOpportunities: 0,
    won: 0,
  };
  const salesResearchIntelligence = input.salesResearchIntelligence ?? {
    approvedSources: 0,
    confidenceTrend: 0,
    duplicateAlerts: 0,
    enrichmentProgress: 0,
    pendingReviews: 0,
    rejectedSources: 0,
    researchBacklog: 0,
    verificationQueue: 0,
  };
  const salesWorkflowSummary = input.salesWorkflowSummary ?? {
    activeHandoffs: 0,
    approvalQueue: 0,
    assignedToExecutive: 0,
    assignedToOperator: 0,
    assignedToProposalPrep: 0,
    blockedWorkflows: 0,
    completedWorkflows: 0,
    externalActionGates: 0,
    proposalPrepItems: 0,
    totalWorkflows: 0,
    workflowHealth: 0,
  };
  const releaseReadiness =
    input.releaseReadiness ??
    buildDashboardReleaseReadinessSummary({
      githubPlanning,
      projectRegistry,
      repositoryIntelligence,
      sharedTasks,
    });
  const releaseShipPlans =
    input.releaseShipPlans ??
    buildDashboardReleaseShipPlanSummary({
      githubPlanning,
      releaseReadiness,
      sharedTasks,
    });
  const executiveAutomation =
    input.executiveAutomation ??
    buildDashboardExecutiveAutomationSummary({
      connectorReadiness,
      email,
      engineeringTasks,
      githubPlanning,
      githubReadOnly,
      projectRegistry,
      releaseReadiness,
      releaseShipPlans,
      repositoryIntelligence,
      runtime: input.runtime,
      salesOpportunitySummary: salesLocalCrm,
      sharedTasks,
    });
  const executiveOperations =
    input.executiveOperations ??
    buildDashboardExecutiveOperationsSummary({
      connectorReadiness,
      email,
      engineeringTasks,
      executiveAutomation,
      githubPlanning,
      projectRegistry,
      releaseReadiness,
      releaseShipPlans,
      repositoryIntelligence,
      runtime: input.runtime,
      sharedTasks,
    });
  const executiveEmailBriefing =
    input.executiveEmailBriefing ??
    buildDashboardExecutiveEmailBriefingSummary({
      email,
      executiveOperations,
    });

  return {
    activeOperator: `${metadata.operatorName} / ${metadata.operatorTool}`,
    agentRuntimeHealth: runtimeHealth,
    blockedExternalActions: aiOperatorBlockedActions,
    commands: aiOperatorCommands,
    integrationMode: metadata.integrationMode,
    lastReport: input.lastReport ?? 'No local dashboard report recorded',
    lastRun: input.lastRun ?? metadata.timestamp,
    lastValidation: input.lastValidation ?? 'Use npm run agents:validate for CLI validation',
    metadata,
    communicationDrafts: {
      approvedLocalDrafts: input.communicationDraftCounts?.approvedLocalDrafts ?? 0,
      approvedForManualSendDrafts: input.communicationDraftCounts?.approvedForManualSendDrafts ?? 0,
      archivedDrafts: input.communicationDraftCounts?.archivedDrafts ?? 0,
      copiedDrafts: input.communicationDraftCounts?.copiedDrafts ?? 0,
      draftCount: input.communicationDraftCounts?.draftCount ?? 0,
      draftsByType: input.communicationDraftsByType ?? {},
      draftRoot: 'codex-agent-threads/shared/drafts/',
      latestAuditActions: input.communicationLatestAuditActions ?? [],
      manuallyMarkedSentDrafts: input.communicationDraftCounts?.manuallyMarkedSentDrafts ?? 0,
      notSentStatus: 'Manual only · No provider send · Human-marked local record only',
      pendingReviewDrafts: input.communicationDraftCounts?.pendingReviewDrafts ?? 0,
      rejectedDrafts: input.communicationDraftCounts?.rejectedDrafts ?? 0,
    },
    communicationProviders: input.communicationProviders ?? {
      approvalRequired: true,
      draftOnlyMode: true,
      missingConfig: 0,
      productionSendModeAvailable: false,
      providerCallsBlocked: true,
      providers: [
        { displayName: 'Gmail', missingConfig: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REDIRECT_URI'], provider: 'gmail', sendingEnabled: false, status: 'missing_config' },
        {
          displayName: 'Google Workspace SMTP',
          missingConfig: ['GOOGLE_WORKSPACE_SMTP_HOST', 'GOOGLE_WORKSPACE_SMTP_PORT', 'GOOGLE_WORKSPACE_SMTP_USERNAME', 'GOOGLE_WORKSPACE_SMTP_PASSWORD'],
          provider: 'google_workspace_smtp',
          sendingEnabled: false,
          status: 'missing_config',
        },
        { displayName: 'SendGrid', missingConfig: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'], provider: 'sendgrid', sendingEnabled: false, status: 'missing_config' },
        { displayName: 'Resend', missingConfig: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'], provider: 'resend', sendingEnabled: false, status: 'missing_config' },
        { displayName: 'Twilio SMS', missingConfig: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'], provider: 'twilio_sms', sendingEnabled: false, status: 'missing_config' },
        { displayName: 'Manual Copy/Paste Mode', missingConfig: [], provider: 'manual_copy_paste', sendingEnabled: false, status: 'manual_ready_not_sending' },
      ],
      sendingDisabled: true,
    },
    connectorReadiness,
    email,
    engineeringTasks,
    executiveAutomation,
    executiveEmailBriefing,
    executiveOperations,
    githubPlanning,
    githubReadOnly,
    projectRegistry,
    releaseReadiness,
    releaseShipPlans,
    repositoryIntelligence,
    salesResearchIntelligence,
    salesWorkflowSummary,
    salesLocalCrm,
    safetyMode,
    sharedTasks,
    threadBridge: {
      approvalQueue: {
        approvedCount: input.threadApprovalDecisionCounts?.approved ?? 0,
        pendingByType: input.pendingApprovalsByType ?? {},
        pendingCount: input.pendingApprovalCount ?? 0,
        rejectedCount: input.threadApprovalDecisionCounts?.rejected ?? 0,
      },
      archiveStatus: input.lastThreadArchive ? `Last archive ${input.lastThreadArchive}` : 'No local archive recorded in dashboard',
      dueSchedules: input.threadDueSchedules ?? 0,
      inboxPath: 'codex-agent-threads/shared/inbox/',
      lastScheduledRun: input.lastScheduledRun ?? 'No local scheduled run recorded in dashboard',
      latestIngestedThread: input.lastThreadIngest ?? 'No local thread ingest recorded in dashboard',
      namedAgentSources: ['Sales Tips', 'Sales Company Research', 'Customer Research Engine', 'Executive Summary', 'Cross-Agent Review'],
      outboxPath: 'codex-agent-threads/shared/outbox/',
      pendingThreadOutputs: input.pendingThreadOutputs ?? 0,
      recommendedNextActions: [
        'Run npm run threads:status before consuming scheduled thread outputs.',
        'Run npm run threads:schedules to inspect local schedule templates.',
        'Run npm run threads:run-due manually when a due schedule should produce local outbox items.',
        'Run npm run threads:ingest to create local Executive review summaries.',
        'Run npm run threads:approval-queue to review local approval requests.',
        'Run npm run threads:archive after review to move consumed outbox items locally.',
      ],
      schedulePath: 'codex-agent-threads/shared/schedules/',
    },
  };
}
