import type { WorkflowDefinition } from '../workflows/workflowTypes';
import { createAgent } from './agentFactory';
import { createPermissions } from './agentPermissions';
import type { AgentRegistration, RuntimeAgent } from './runtimeTypes';

const registeredAgents: AgentRegistration[] = [
  {
    id: 'executive',
    name: 'Executive Agent',
    description: 'Ecosystem rollups, top priorities, and cross-agent summaries.',
    owner: 'Executive Ops',
    permissions: createPermissions(),
    health: 'ready',
    activity: 'Ecosystem rollups prepared',
  },
  {
    id: 'engineering',
    name: 'Engineering Agent',
    description: 'Repository graph, impact analysis, fix queue, issue drafts, and approval-gated GitHub planning.',
    owner: 'Engineering',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'ready',
    activity: 'Knowledge graph scan prepared',
  },
  {
    id: 'migration',
    name: 'Migration Agent',
    description: 'Gym import parsing, validation, batch preview, member matching, and local migration review.',
    owner: 'Gym Operations',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'ready',
    activity: 'Import wizard and batch preview ready',
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    description: 'Future lead review and revenue workflow planning.',
    owner: 'Sales',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'planned',
    activity: 'Awaiting CRM scope',
  },
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Future ticket triage and customer support workflow planning.',
    owner: 'Support',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'planned',
    activity: 'Awaiting support channels',
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    description: 'Future billing, reporting, and finance workflow planning.',
    owner: 'Finance',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'planned',
    activity: 'Awaiting reporting rules',
  },
  {
    id: 'operations',
    name: 'Operations Agent',
    description: 'Runtime sync, status checks, approvals, and operational workflow controls.',
    owner: 'Operations',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'ready',
    activity: 'Workflow queue and sync controls ready',
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    description: 'Future campaign, lifecycle, and content workflow planning.',
    owner: 'Marketing',
    permissions: createPermissions({ approvalRequired: true, risk: 'medium' }),
    health: 'planned',
    activity: 'Awaiting campaign sources',
  },
  {
    id: 'product',
    name: 'Product Agent',
    description: 'Product surface maps, release planning, and feature-area workflow planning.',
    owner: 'Product',
    permissions: createPermissions(),
    health: 'ready',
    activity: 'Surface map initialized',
  },
];

export function getAgentRegistry(workflows: WorkflowDefinition[]): RuntimeAgent[] {
  return registeredAgents.map((agent) => ({
    ...createAgent(agent),
    workflows: workflows.filter((workflow) => workflow.ownerAgent === agent.name),
  }));
}

export function registerAgent(agent: AgentRegistration): RuntimeAgent {
  return createAgent(agent);
}
