import type { RiskLevel } from '../components/RiskBadge';
import type { AgentEvent, AgentNote, AgentRun, AgentTask } from '../state/agentRunStore';
import type { ApprovalItem } from '../state/approvalStore';
import type { AuditLogEntry } from '../state/auditLogStore';
import type { SyncStatusSnapshot } from '../sync/syncTypes';
import type { ApprovalHistoryEntry, MigrationDryRunRecord, WorkflowDryCheckRecord } from '../types/localRecords';
import type { WorkflowDefinition } from '../workflows/workflowTypes';

export type AgentId =
  | 'executive'
  | 'engineering'
  | 'migration'
  | 'sales'
  | 'support'
  | 'finance'
  | 'operations'
  | 'marketing'
  | 'product';

export type AgentLifecycleState =
  | 'initialize'
  | 'load_memory'
  | 'register_workflows'
  | 'load_health'
  | 'load_activity'
  | 'ready'
  | 'run_workflow'
  | 'log_activity'
  | 'sync'
  | 'complete';

export type AgentRisk = RiskLevel;
export type AgentHealthStatus = 'ready' | 'warning' | 'blocked' | 'planned';

export interface AgentPermissionSet {
  approvalRequired: boolean;
  externalSend: boolean;
  productionWrite: boolean;
  read: boolean;
  risk: AgentRisk;
  write: boolean;
}

export interface AgentRegistration {
  activity: string;
  description: string;
  health: AgentHealthStatus;
  id: AgentId;
  name: string;
  owner: string;
  permissions: AgentPermissionSet;
}

export interface RuntimeAgent extends AgentRegistration {
  workflows: WorkflowDefinition[];
}

export interface AgentHealthSnapshot {
  approvalCount: number;
  errors: number;
  healthScore: number;
  lastActivity: string;
  pendingTasks: number;
  syncStatus: string;
  warnings: number;
  workflowCount: number;
}

export interface RuntimeActivityEntry {
  agent: string;
  detail: string;
  id: string;
  timestamp: string;
  type: 'started' | 'completed' | 'failed' | 'warning' | 'export' | 'approval' | 'activity';
}

export interface RuntimeApproval {
  agent: string;
  approvalId: string;
  completed: string | null;
  created: string;
  requiredBy: string;
  risk: RiskLevel;
  status: ApprovalItem['status'];
  title: string;
  workflow: string;
}

export interface RuntimeMemorySnapshot {
  approvals: number;
  auditLogs: number;
  events: number;
  notes: number;
  runs: number;
  syncStatus: string;
  tasks: number;
  workflowRuns: number;
}

export interface RuntimeSyncSnapshot {
  failedRecords: number;
  lastSyncAt: string | null;
  mode: string;
  recordsWaiting: number;
  status: string;
  syncedRecords: number;
}

export interface AgentRuntimeSnapshot {
  activities: RuntimeActivityEntry[];
  agents: RuntimeAgent[];
  approvals: RuntimeApproval[];
  health: Record<string, AgentHealthSnapshot>;
  lifecycle: AgentLifecycleState[];
  memory: RuntimeMemorySnapshot;
  permissions: Record<string, AgentPermissionSet>;
  runtimeVersion: string;
  sync: RuntimeSyncSnapshot;
  workflows: WorkflowDefinition[];
}

export interface AgentRuntimeInput {
  agentEvents: AgentEvent[];
  agentNotes: AgentNote[];
  agentRuns: AgentRun[];
  agentTasks: AgentTask[];
  approvalHistory: ApprovalHistoryEntry[];
  approvalItems: ApprovalItem[];
  auditLogs: AuditLogEntry[];
  migrationDryRuns: MigrationDryRunRecord[];
  syncStatus: SyncStatusSnapshot;
  workflowRuns: WorkflowDryCheckRecord[];
  workflows: WorkflowDefinition[];
}
