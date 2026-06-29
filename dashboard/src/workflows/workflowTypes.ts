import type { RiskLevel } from '../components/RiskBadge';

export interface WorkflowDefinition {
  key: string;
  triggerType: string;
  ownerAgent: string;
  currentMode: 'mock/local' | 'read-only';
  lastRun: string;
  nextStatus: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  safeDryRun: boolean;
}

