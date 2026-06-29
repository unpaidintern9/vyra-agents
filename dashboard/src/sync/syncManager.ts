import { getAgentMemoryFunctionConfig, writeAgentMemoryRecord } from '../integrations/supabase/agentMemoryFunctionClient';
import { createAgentMemorySupabaseClient } from '../integrations/supabase/supabaseClient';
import type { AuditLogEntry } from '../state/auditLogStore';
import type { ApprovalItem } from '../state/approvalStore';
import type { AgentEvent, AgentRun, AgentTask } from '../state/agentRunStore';
import type { WorkflowDryCheckRecord, MigrationDryRunRecord, ApprovalHistoryEntry } from '../types/localRecords';
import type { SyncConnectionState, SyncQueueItem, SyncableRecord, SyncWriteMode, WritableAgentTable } from './syncTypes';
import { writableAgentTables } from './syncTypes';

const source = 'vyra-agents-dashboard';

export async function detectAgentMemoryConnection(): Promise<SyncConnectionState> {
  const client = createAgentMemorySupabaseClient();
  if (!client) {
    return 'disabled';
  }

  const { error } = await client.from('agent_status').select('*', { count: 'exact', head: true });
  return error ? 'offline' : 'connected';
}

export async function syncPendingQueue(queue: SyncQueueItem[]): Promise<{
  queue: SyncQueueItem[];
  connectionState: SyncConnectionState;
  lastSyncAt: string | null;
}> {
  const functionConfig = getAgentMemoryFunctionConfig();
  if (functionConfig.mode !== 'configured') {
    return { queue, connectionState: functionConfig.enabled ? 'offline' : 'disabled', lastSyncAt: null };
  }

  const connectionState = await detectAgentMemoryConnection();
  if (connectionState !== 'connected') {
    return { queue, connectionState, lastSyncAt: null };
  }

  let changed = false;
  const nextQueue = await Promise.all(
    queue.map(async (item) => {
      if (item.status !== 'pending') {
        return item;
      }

      const result = await uploadQueueItem(item);
      changed = true;
      return result;
    }),
  );

  return {
    queue: changed ? nextQueue : queue,
    connectionState: 'connected',
    lastSyncAt: new Date().toISOString(),
  };
}

export function getSyncWriteMode(): SyncWriteMode {
  const functionConfig = getAgentMemoryFunctionConfig();
  if (!functionConfig.enabled) return 'local_only';
  if (functionConfig.mode === 'missing_token') return 'missing_token';
  if (functionConfig.mode === 'missing_supabase_env') return 'missing_supabase_env';
  return 'edge_function';
}

export function agentMemoryRecords(input: {
  agentRuns: AgentRun[];
  agentEvents: AgentEvent[];
  agentTasks: AgentTask[];
  auditLogs: AuditLogEntry[];
  approvalItems: ApprovalItem[];
  workflowRuns: WorkflowDryCheckRecord[];
  migrationDryRuns: MigrationDryRunRecord[];
  approvalHistory: ApprovalHistoryEntry[];
}): SyncableRecord[] {
  return [
    ...input.agentRuns.map(runToRecord),
    ...input.agentEvents.map(eventToRecord),
    ...input.agentTasks.map(taskToRecord),
    ...input.auditLogs.map(auditLogToRecord),
    ...input.approvalItems.map(approvalItemToRecord),
    ...input.workflowRuns.map(workflowRunToRecord),
    ...input.migrationDryRuns.map(migrationDryRunToRecord),
    ...input.approvalHistory.map(approvalHistoryToRecord),
  ];
}

async function uploadQueueItem(item: SyncQueueItem): Promise<SyncQueueItem> {
  if (!isWritableAgentTable(item.table)) {
    return {
      ...item,
      status: 'failed',
      retryCount: item.retryCount + 1,
      lastAttemptAt: new Date().toISOString(),
      error: 'Blocked non-agent table write.',
    };
  }

  const attemptedAt = new Date().toISOString();
  const result = await writeAgentMemoryRecord({
    table: item.table,
    record: item.payload,
    requestId: item.id,
  });

  if (!result.ok) {
    return {
      ...item,
      status: 'failed',
      retryCount: item.retryCount + 1,
      lastAttemptAt: attemptedAt,
      error: result.error ?? 'function_write_failed',
    };
  }

  return {
    ...item,
    status: 'synced',
    retryCount: item.retryCount,
    lastAttemptAt: attemptedAt,
    syncedAt: new Date().toISOString(),
    error: undefined,
  };
}

function runToRecord(run: AgentRun): SyncableRecord {
  return {
    table: 'agent_runs',
    sourceId: run.id,
    sourceType: 'agent_run',
    payload: {
      agent_key: key(run.agent),
      workflow_key: run.workflow,
      status: run.status,
      source,
      metadata: { localId: run.id, summary: run.summary, productionWritesOccurred: 'No' },
      started_at: run.startedAt,
      completed_at: run.completedAt,
    },
  };
}

function eventToRecord(event: AgentEvent): SyncableRecord {
  return {
    table: 'agent_events',
    sourceId: event.id,
    sourceType: 'agent_event',
    payload: {
      agent_key: key(event.agent),
      event_type: event.event,
      status: 'recorded',
      source,
      metadata: { localId: event.id, detail: event.detail, timestamp: event.timestamp },
      created_at: event.timestamp,
    },
  };
}

function taskToRecord(task: AgentTask): SyncableRecord {
  return {
    table: 'agent_tasks',
    sourceId: task.id,
    sourceType: 'agent_task',
    payload: {
      agent_key: key(task.agent),
      title: task.title,
      status: task.status,
      priority: task.priority,
      source,
      metadata: { localId: task.id, productionWritesOccurred: 'No' },
    },
  };
}

function auditLogToRecord(log: AuditLogEntry): SyncableRecord {
  return {
    table: 'agent_logs',
    sourceId: log.id,
    sourceType: 'audit_log',
    payload: {
      agent_key: key(log.agent),
      level: log.riskLevel === 'high' ? 'warn' : 'info',
      message: `${log.action}: ${log.target}`,
      status: 'recorded',
      source,
      metadata: { ...log, productionWritesOccurred: 'No' },
      created_at: log.timestamp,
    },
  };
}

function approvalItemToRecord(item: ApprovalItem): SyncableRecord {
  return {
    table: 'agent_approvals',
    sourceId: item.id,
    sourceType: 'approval_queue_item',
    payload: {
      agent_key: key(item.requestedBy),
      action_key: item.id,
      risk_level: item.riskLevel,
      status: item.status,
      source,
      requested_by: item.requestedBy,
      approved_by: item.status === 'mock approved' ? item.requiredApprover : null,
      metadata: { localId: item.id, title: item.title, reason: item.reason, requiredApprover: item.requiredApprover },
      decided_at: item.status === 'mock approved' ? new Date().toISOString() : null,
    },
  };
}

function workflowRunToRecord(run: WorkflowDryCheckRecord): SyncableRecord {
  return {
    table: 'agent_workflows',
    sourceId: run.id,
    sourceType: 'workflow_dry_check',
    payload: {
      agent_key: key(run.agent),
      workflow_key: `${run.workflowKey}-${run.id}`,
      status: 'dry_check_completed',
      source,
      metadata: run,
      definition: { dryCheck: true, approvalRequired: run.approvalRequired },
    },
  };
}

function migrationDryRunToRecord(run: MigrationDryRunRecord): SyncableRecord {
  return {
    table: 'agent_memory',
    sourceId: run.id,
    sourceType: 'migration_dry_run',
    payload: {
      agent_key: key(run.agent),
      memory_type: 'migration_dry_run',
      title: run.workflow,
      body: JSON.stringify(run.summary),
      status: 'active',
      source,
      metadata: run,
      created_at: run.createdAt,
    },
  };
}

function approvalHistoryToRecord(entry: ApprovalHistoryEntry): SyncableRecord {
  return {
    table: 'agent_approvals',
    sourceId: entry.id,
    sourceType: 'approval_history',
    payload: {
      agent_key: key(entry.requestedBy),
      action_key: entry.approvalId,
      risk_level: entry.riskLevel,
      status: entry.action,
      source,
      requested_by: entry.requestedBy,
      approved_by: entry.decidedBy,
      metadata: entry,
      decided_at: entry.decidedAt,
    },
  };
}

function isWritableAgentTable(table: string): table is WritableAgentTable {
  return (writableAgentTables as readonly string[]).includes(table);
}

function key(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
