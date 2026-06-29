import type { AgentEvent, AgentNote, AgentRun, AgentTask } from '../state/agentRunStore';
import type { ApprovalItem } from '../state/approvalStore';
import type { AuditLogEntry } from '../state/auditLogStore';
import type { SyncStatusSnapshot } from '../sync/syncTypes';
import type { WorkflowDryCheckRecord } from '../types/localRecords';
import type { RuntimeMemorySnapshot } from './runtimeTypes';

export function buildRuntimeMemory(input: {
  agentEvents: AgentEvent[];
  agentNotes: AgentNote[];
  agentRuns: AgentRun[];
  agentTasks: AgentTask[];
  approvalItems: ApprovalItem[];
  auditLogs: AuditLogEntry[];
  syncStatus: SyncStatusSnapshot;
  workflowRuns: WorkflowDryCheckRecord[];
}): RuntimeMemorySnapshot {
  return {
    approvals: input.approvalItems.length,
    auditLogs: input.auditLogs.length,
    events: input.agentEvents.length,
    notes: input.agentNotes.length,
    runs: input.agentRuns.length,
    syncStatus: input.syncStatus.connectionState,
    tasks: input.agentTasks.length,
    workflowRuns: input.workflowRuns.length,
  };
}
