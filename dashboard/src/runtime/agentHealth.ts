import type { ApprovalItem } from '../state/approvalStore';
import type { AuditLogEntry } from '../state/auditLogStore';
import type { SyncStatusSnapshot } from '../sync/syncTypes';
import type { AgentEvent, AgentRun, AgentTask } from '../state/agentRunStore';
import { latestAuditForAgent } from './agentAudit';
import type { AgentHealthSnapshot, RuntimeAgent } from './runtimeTypes';

export function buildAgentHealth(input: {
  agents: RuntimeAgent[];
  approvals: ApprovalItem[];
  auditLogs: AuditLogEntry[];
  events: AgentEvent[];
  runs: AgentRun[];
  syncStatus: SyncStatusSnapshot;
  tasks: AgentTask[];
}): Record<string, AgentHealthSnapshot> {
  return input.agents.reduce<Record<string, AgentHealthSnapshot>>((health, agent) => {
    const pendingTasks = input.tasks.filter((task) => task.agent === agent.name && task.status === 'open').length;
    const approvalCount = input.approvals.filter((approval) => approval.requestedBy === agent.name).length;
    const failedRuns = input.runs.filter((run) => run.agent === agent.name && run.status === 'failed').length;
    const warnings = pendingTasks + input.approvals.filter((approval) => approval.requestedBy === agent.name && approval.status === 'pending').length;
    const latestEvent = input.events.find((event) => event.agent === agent.name);
    const latestAudit = latestAuditForAgent(input.auditLogs, agent.name);
    const healthPenalty = agent.health === 'planned' ? 20 : 0;
    const score = Math.max(0, 100 - warnings * 8 - failedRuns * 20 - healthPenalty);

    health[agent.id] = {
      approvalCount,
      errors: failedRuns,
      healthScore: score,
      lastActivity: latestEvent?.timestamp ?? latestAudit?.timestamp ?? 'No activity yet',
      pendingTasks,
      syncStatus: input.syncStatus.connectionState,
      warnings,
      workflowCount: agent.workflows.length,
    };
    return health;
  }, {});
}
