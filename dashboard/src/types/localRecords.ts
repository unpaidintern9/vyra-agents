import type { ApprovalItem } from '../state/approvalStore';
import type { WorkflowDefinition } from '../workflows/workflowTypes';
import type { summarizeMigration } from '../agents/migration/migrationSummary';

export interface MigrationDryRunRecord {
  id: string;
  createdAt: string;
  agent: string;
  workflow: string;
  summary: ReturnType<typeof summarizeMigration>;
  rules: string[];
  productionWritesOccurred: 'No';
}

export interface WorkflowDryCheckRecord {
  id: string;
  workflowKey: string;
  agent: string;
  riskLevel: WorkflowDefinition['riskLevel'];
  result: string;
  createdAt: string;
  approvalRequired: boolean;
  productionWritesOccurred: 'No';
}

export interface ApprovalHistoryEntry {
  id: string;
  approvalId: string;
  title: string;
  requestedBy: string;
  riskLevel: ApprovalItem['riskLevel'];
  action: string;
  result: string;
  decidedBy: string;
  decidedAt: string;
  productionWritesOccurred: 'No';
}
