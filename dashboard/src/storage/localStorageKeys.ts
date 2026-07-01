export const localStorageKeys = {
  agentRuns: 'vyra-agents:agent-runs',
  agentEvents: 'vyra-agents:agent-events',
  agentTasks: 'vyra-agents:agent-tasks',
  approvals: 'vyra-agents:approvals',
  approvalHistory: 'vyra-agents:approval-history',
  auditLogs: 'vyra-agents:audit-logs',
  workflowResults: 'vyra-agents:workflow-results',
  migrationDryRuns: 'vyra-agents:migration-dry-runs',
  migrationImportWizard: 'vyra-agents:migration-import-wizard',
  migrationBatchPreview: 'vyra-agents:migration-batch-preview',
  operatorDashboard: 'vyra-agents:operator-dashboard',
  salesActivities: 'vyra-agents:sales-activities',
  salesLeads: 'vyra-agents:sales-leads',
  salesOpportunities: 'vyra-agents:sales-opportunities',
  salesProspectDossiers: 'vyra-agents:sales-prospect-dossiers',
  salesProspectIntakes: 'vyra-agents:sales-prospect-intakes',
  salesProspectResearch: 'vyra-agents:sales-prospect-research',
  salesProposalDrafts: 'vyra-agents:sales-proposal-drafts',
  salesProposals: 'vyra-agents:sales-proposals',
  syncQueue: 'vyra-agents:sync-queue',
} as const;

export type LocalStorageKey = (typeof localStorageKeys)[keyof typeof localStorageKeys];
