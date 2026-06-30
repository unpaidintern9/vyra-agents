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
  safetyMode: string;
  threadBridge: AiThreadBridgeSnapshot;
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
