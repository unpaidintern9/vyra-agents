import type { AgentRegistration, RuntimeAgent } from './runtimeTypes';

export function createAgent(agent: AgentRegistration): RuntimeAgent {
  return {
    ...agent,
    workflows: [],
  };
}
