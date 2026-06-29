export const localStorageKeys = {
  agentRuns: 'vyra-agents:agent-runs',
  agentEvents: 'vyra-agents:agent-events',
  agentTasks: 'vyra-agents:agent-tasks',
  approvals: 'vyra-agents:approvals',
  approvalHistory: 'vyra-agents:approval-history',
  auditLogs: 'vyra-agents:audit-logs',
  workflowResults: 'vyra-agents:workflow-results',
  migrationDryRuns: 'vyra-agents:migration-dry-runs',
} as const;

export type LocalStorageKey = (typeof localStorageKeys)[keyof typeof localStorageKeys];
