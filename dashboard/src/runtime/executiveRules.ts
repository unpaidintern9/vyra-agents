import type { AgentRuntimeSnapshot } from './runtimeTypes';
import type { ExecutivePriority } from '../agents/executive/executiveTypes';

export const executiveRuleCount = 6;

export function buildExecutivePriorities(runtime: AgentRuntimeSnapshot): ExecutivePriority[] {
  const priorities: ExecutivePriority[] = [];
  const pendingApprovals = runtime.approvals.filter((approval) => approval.status === 'pending');
  const warningAgents = runtime.agents.filter((agent) => runtime.health[agent.id]?.warnings > 0);
  const criticalAgents = runtime.agents.filter((agent) => (runtime.health[agent.id]?.errors ?? 0) > 0);
  const plannedAgents = runtime.agents.filter((agent) => agent.health === 'planned');

  if (pendingApprovals.length) {
    priorities.push({
      id: 'pending-approvals',
      agent: 'Executive Agent',
      department: 'Operations',
      detail: `${pendingApprovals.length} approval item(s) are waiting for Robert.`,
      priority: 'high',
      recommendedAction: 'Review pending approvals before new operational work.',
      source: 'Runtime approvals',
    });
  }

  if (runtime.sync.failedRecords > 0) {
    priorities.push({
      id: 'active-sync-failures',
      agent: 'Operations Agent',
      department: 'Operations',
      detail: `${runtime.sync.failedRecords} active sync record(s) failed.`,
      priority: 'high',
      recommendedAction: 'Open Sync Queue and retry or inspect active sync failures.',
      source: 'Runtime sync',
    });
  }

  criticalAgents.forEach((agent) => {
    priorities.push({
      id: `critical-${agent.id}`,
      agent: agent.name,
      department: agent.owner,
      detail: `${agent.name} has runtime errors.`,
      priority: 'high',
      recommendedAction: `Open ${agent.name.replace(' Agent', '')} and review the latest activity.`,
      source: 'Runtime health',
    });
  });

  warningAgents.forEach((agent) => {
    priorities.push({
      id: `warning-${agent.id}`,
      agent: agent.name,
      department: agent.owner,
      detail: `${agent.name} has ${runtime.health[agent.id].warnings} warning signal(s).`,
      priority: 'medium',
      recommendedAction: `Review ${agent.name.replace(' Agent', '')} queue and approvals.`,
      source: 'Runtime health',
    });
  });

  if (runtime.sync.recordsWaiting > 0) {
    priorities.push({
      id: 'sync-pending',
      agent: 'Operations Agent',
      department: 'Operations',
      detail: `${runtime.sync.recordsWaiting} agent-memory record(s) are waiting to sync.`,
      priority: 'medium',
      recommendedAction: 'Run Sync Now when the Edge Function path is configured.',
      source: 'Runtime sync',
    });
  }

  plannedAgents.forEach((agent) => {
    priorities.push({
      id: `planned-${agent.id}`,
      agent: agent.name,
      department: agent.owner,
      detail: `${agent.name} is registered but still planned.`,
      priority: 'low',
      recommendedAction: 'Define first workflow owner and operating rules when ready.',
      source: 'Agent registry',
    });
  });

  return priorities.slice(0, 12);
}
