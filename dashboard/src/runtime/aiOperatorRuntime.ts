import type { AgentRuntimeSnapshot } from './runtimeTypes';

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
  safetyMode: string;
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
];

export const aiOperatorBlockedActions = [
  'No emails',
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
}): AiOperatorDashboardSnapshot {
  const metadata = buildAiOperatorMetadata(input.integrationMode);
  const warningAgents = input.runtime.agents.filter((agent) => input.runtime.health[agent.id]?.warnings > 0).length;
  const blockedAgents = input.runtime.agents.filter((agent) => input.runtime.health[agent.id]?.errors > 0).length;
  const runtimeHealth = blockedAgents > 0 ? 'Attention' : warningAgents > 0 ? 'Watch' : 'Ready';

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
    safetyMode,
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
