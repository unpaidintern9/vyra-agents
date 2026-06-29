import type { AgentPermissionSet, AgentRisk } from './runtimeTypes';

export function createPermissions(overrides: Partial<AgentPermissionSet> = {}): AgentPermissionSet {
  const risk: AgentRisk = overrides.risk ?? 'low';
  return {
    approvalRequired: risk !== 'low',
    externalSend: false,
    productionWrite: false,
    read: true,
    risk,
    write: false,
    ...overrides,
  };
}
