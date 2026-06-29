import { buildRuntimeActivity } from './agentActivity';
import { buildRuntimeApprovals } from './agentApproval';
import { buildAgentHealth } from './agentHealth';
import { agentLifecycle } from './agentLifecycle';
import { buildRuntimeMemory } from './agentMemory';
import { getAgentRegistry } from './agentRegistry';
import { buildRuntimeSync } from './agentSync';
import type { AgentRuntimeInput, AgentRuntimeSnapshot } from './runtimeTypes';

export const runtimeVersion = '18.0.0-local';

export function buildAgentRuntime(input: AgentRuntimeInput): AgentRuntimeSnapshot {
  const agents = getAgentRegistry(input.workflows);
  return {
    activities: buildRuntimeActivity(input.agentRuns, input.agentEvents, input.auditLogs),
    agents,
    approvals: buildRuntimeApprovals(input.approvalItems, input.approvalHistory),
    health: buildAgentHealth({
      agents,
      approvals: input.approvalItems,
      auditLogs: input.auditLogs,
      events: input.agentEvents,
      runs: input.agentRuns,
      syncStatus: input.syncStatus,
      tasks: input.agentTasks,
    }),
    lifecycle: agentLifecycle,
    memory: buildRuntimeMemory(input),
    permissions: agents.reduce<AgentRuntimeSnapshot['permissions']>((permissions, agent) => {
      permissions[agent.id] = agent.permissions;
      return permissions;
    }, {}),
    runtimeVersion,
    sync: buildRuntimeSync(input.syncStatus),
    workflows: input.workflows,
  };
}
