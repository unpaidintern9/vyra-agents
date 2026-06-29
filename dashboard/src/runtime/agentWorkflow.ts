import type { RuntimeAgent } from './runtimeTypes';

export function countRegisteredWorkflows(agents: RuntimeAgent[]): number {
  return agents.reduce((count, agent) => count + agent.workflows.length, 0);
}
