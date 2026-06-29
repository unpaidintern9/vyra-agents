import type { AgentLifecycleState } from './runtimeTypes';

export const agentLifecycle: AgentLifecycleState[] = [
  'initialize',
  'load_memory',
  'register_workflows',
  'load_health',
  'load_activity',
  'ready',
  'run_workflow',
  'log_activity',
  'sync',
  'complete',
];
