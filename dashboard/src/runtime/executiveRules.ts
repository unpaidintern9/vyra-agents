import type { AgentRuntimeSnapshot } from './runtimeTypes';
import type { ExecutivePriority } from '../agents/executive/executiveTypes';
import type { SalesIntegrationSummary, SalesSummary } from '../agents/sales/salesTypes';

export const executiveRuleCount = 7;

export function buildExecutivePriorities(runtime: AgentRuntimeSnapshot, salesSummary?: SalesSummary, salesIntegration?: SalesIntegrationSummary): ExecutivePriority[] {
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

  if (salesSummary && salesSummary.followUpsDue > 0) {
    priorities.push({
      id: 'sales-follow-ups-due',
      agent: 'Sales Agent',
      department: 'Sales',
      detail: `${salesSummary.followUpsDue} sales follow-up(s) are due or overdue.`,
      priority: 'medium',
      recommendedAction: 'Open Sales and clear the local follow-up planner.',
      source: 'Sales pipeline',
    });
  }

  if (salesIntegration?.mode === 'live_read_only' && salesIntegration.crmReadinessStatus !== 'ready') {
    priorities.push({
      id: 'sales-crm-readiness',
      agent: 'Sales Agent',
      department: 'Sales',
      detail: 'Sales CRM live read-only mode is selected but CRM readiness is not configured.',
      priority: 'medium',
      recommendedAction: 'Open Sales and review the integration readiness panel.',
      source: 'Sales integration adapter',
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
