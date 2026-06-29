import type { AgentEvent, AgentRun } from '../state/agentRunStore';
import type { AuditLogEntry } from '../state/auditLogStore';
import type { RuntimeActivityEntry } from './runtimeTypes';

export function buildRuntimeActivity(runs: AgentRun[], events: AgentEvent[], auditLogs: AuditLogEntry[]): RuntimeActivityEntry[] {
  const runActivity = runs.map<RuntimeActivityEntry>((run) => ({
    agent: run.agent,
    detail: run.workflow,
    id: run.id,
    timestamp: run.completedAt || run.startedAt,
    type: run.status === 'failed' ? 'failed' : run.status === 'completed' ? 'completed' : 'started',
  }));
  const eventActivity = events.map<RuntimeActivityEntry>((event) => ({
    agent: event.agent,
    detail: event.detail,
    id: event.id,
    timestamp: event.timestamp,
    type: event.event.includes('export') ? 'export' : event.event.includes('approval') ? 'approval' : 'activity',
  }));
  const auditActivity = auditLogs.map<RuntimeActivityEntry>((entry) => ({
    agent: entry.agent,
    detail: `${entry.action}: ${entry.result}`,
    id: entry.id,
    timestamp: entry.timestamp,
    type: entry.approvalRequired ? 'approval' : entry.result.includes('warning') ? 'warning' : 'activity',
  }));

  return [...runActivity, ...eventActivity, ...auditActivity]
    .sort((first, second) => second.timestamp.localeCompare(first.timestamp))
    .slice(0, 24);
}
