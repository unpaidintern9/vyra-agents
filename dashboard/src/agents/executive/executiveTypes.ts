import type { RiskLevel } from '../../components/RiskBadge';
import type { ConnectorReadinessSummary } from '../../runtime/connectorReadiness';
import type { CrossAgentCollaborationSummary } from '../../runtime/crossAgentCollaboration';
import type { GitHubReadOnlyDashboardSummary } from '../../runtime/githubReadOnly';
import type { AgentRuntimeSnapshot, RuntimeActivityEntry, RuntimeApproval } from '../../runtime/runtimeTypes';
import type { SharedTaskDashboardSummary } from '../../runtime/sharedTaskQueue';
import type { LocalReport } from '../../storage/reportExport';
import type {
  SalesAgentTeamSummary,
  SalesIntegrationSummary,
  SalesIntelligenceSummary,
  SalesProposalSummary,
  SalesProspectDossierSummary,
  SalesScoringSummary,
  SalesSummary,
} from '../sales/salesTypes';

export type ExecutivePriorityLevel = RiskLevel;
export type ExecutiveReportKind = 'summary' | 'daily' | 'approval' | 'runtime' | 'engineering' | 'migration';

export interface ExecutivePriority {
  agent: string;
  department: string;
  detail: string;
  id: string;
  priority: ExecutivePriorityLevel;
  recommendedAction: string;
  source: string;
}

export interface ExecutiveOverviewMetric {
  label: string;
  tone?: 'neutral' | 'good' | 'warn';
  value: string;
}

export interface ExecutiveTimelineItem {
  agent: string;
  detail: string;
  id: string;
  timestamp: string;
  title: string;
  type: RuntimeActivityEntry['type'];
}

export interface ExecutiveHealthRow {
  agent: string;
  agentId: string;
  approvalCount: number;
  errors: number;
  health: string;
  lastActivity: string;
  navigationTarget: string;
  pendingTasks: number;
  risk: RiskLevel;
  syncStatus: string;
  warnings: number;
  workflowCount: number;
}

export interface ExecutiveRuntimeSummary {
  approvalEngine: string;
  auditEngine: string;
  permissionEngine: string;
  registeredAgents: number;
  registeredWorkflows: number;
  registryHealth: string;
  runtimeMemory: string;
  runtimeVersion: string;
  syncEngine: string;
}

export interface ExecutiveSummary {
  criticalAgents: number;
  engineeringBacklog: number;
  generatedAt: string;
  githubDrafts: number;
  healthyAgents: number;
  migrationBatches: number;
  overallHealth: string;
  pendingApprovals: number;
  priorities: ExecutivePriority[];
  recentRuntimeEvents: number;
  registeredAgents: number;
  runtime: ExecutiveRuntimeSummary;
  runtimeVersion: string;
  syncQueue: number;
  timeline: ExecutiveTimelineItem[];
  warningAgents: number;
  workflowsToday: number;
  crossAgentSummary?: CrossAgentCollaborationSummary;
  salesSummary?: SalesSummary;
  salesAgentTeamSummary?: SalesAgentTeamSummary;
  salesIntegration?: SalesIntegrationSummary;
  salesIntelligenceSummary?: SalesIntelligenceSummary;
  salesProposalSummary?: SalesProposalSummary;
  salesProspectDossierSummary?: SalesProspectDossierSummary;
  salesScoringSummary?: SalesScoringSummary;
  connectorReadiness?: ConnectorReadinessSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  sharedTaskSummary?: SharedTaskDashboardSummary;
}

export interface ExecutiveDashboardProps {
  integrationWarnings?: string[];
  crossAgentSummary?: CrossAgentCollaborationSummary;
  onNavigate(_page: string): void;
  runtime: AgentRuntimeSnapshot;
  salesAgentTeamSummary?: SalesAgentTeamSummary;
  salesIntegration?: SalesIntegrationSummary;
  salesIntelligenceSummary?: SalesIntelligenceSummary;
  salesProposalSummary?: SalesProposalSummary;
  salesProspectDossierSummary?: SalesProspectDossierSummary;
  salesScoringSummary?: SalesScoringSummary;
  salesSummary?: SalesSummary;
  connectorReadiness?: ConnectorReadinessSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  sharedTaskSummary?: SharedTaskDashboardSummary;
}

export interface ExecutiveApprovalFilters {
  agent: string;
  risk: string;
  status: string;
  workflow: string;
}

export interface ExecutiveReportContext {
  healthRows: ExecutiveHealthRow[];
  runtime: AgentRuntimeSnapshot;
  summary: ExecutiveSummary;
}

export interface ExecutiveReportDefinition {
  description: string;
  format: 'json' | 'markdown';
  kind: ExecutiveReportKind;
  label: string;
}

export type ExecutiveReportBuilder = (_kind: ExecutiveReportKind, _context: ExecutiveReportContext) => LocalReport;
export type RuntimeApprovalRow = RuntimeApproval;
