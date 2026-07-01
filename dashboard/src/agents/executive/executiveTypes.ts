import type { RiskLevel } from '../../components/RiskBadge';
import type { ConnectorReadinessSummary } from '../../runtime/connectorReadiness';
import type { CrossAgentCollaborationSummary } from '../../runtime/crossAgentCollaboration';
import type { EngineeringTaskGeneratorSummary } from '../../runtime/engineeringTaskGenerator';
import type { ExecutiveAutomationSummary } from '../../runtime/executiveAutomation';
import type { ExecutiveEmailBriefingSummary } from '../../runtime/executiveEmailBriefing';
import type { ExecutiveOperationsDashboardSummary } from '../../runtime/executiveOperations';
import type { ExecutivePlanningSummary } from '../../runtime/executivePlanning';
import type { GmailEmailDashboardSummary } from '../../runtime/gmailEmail';
import type { GitHubPlanningDashboardSummary } from '../../runtime/githubPlanning';
import type { GitHubReadOnlyDashboardSummary } from '../../runtime/githubReadOnly';
import type { ProjectRegistryDashboardSummary } from '../../runtime/projectRegistry';
import type { ReleaseReadinessDashboardSummary } from '../../runtime/releaseReadiness';
import type { ReleaseShipPlanDashboardSummary } from '../../runtime/releaseShipPlans';
import type { RepositoryIntelligenceDashboardSummary } from '../../runtime/repositoryIntelligence';
import type { AgentRuntimeSnapshot, RuntimeActivityEntry, RuntimeApproval } from '../../runtime/runtimeTypes';
import type { SharedTaskDashboardSummary } from '../../runtime/sharedTaskQueue';
import type { MarketingDashboardSummary } from '../../runtime/marketingIntelligence';
import type { AssetLibraryDashboardSummary } from '../../runtime/assetLibrary';
import type { CustomerSuccessDashboardSummary } from '../../runtime/customerSuccess';
import type { FinanceDashboardSummary } from '../../runtime/financeIntelligence';
import type { LocalReport } from '../../storage/reportExport';
import type {
  SalesAgentTeamSummary,
  SalesIntegrationSummary,
  SalesIntelligenceSummary,
  SalesPipelineAnalytics,
  SalesOrganizationIntelligenceSummary,
  SalesProposalSummary,
  SalesProspectDossierSummary,
  SalesResearchIntelligenceSummary,
  SalesScoringSummary,
  SharedMemoryStore,
  SalesSummary,
  SalesWorkflowSummary,
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
  salesPipelineAnalytics?: SalesPipelineAnalytics;
  salesOrganizationIntelligenceSummary?: SalesOrganizationIntelligenceSummary;
  sharedMemory?: SharedMemoryStore;
  salesProposalSummary?: SalesProposalSummary;
  salesProspectDossierSummary?: SalesProspectDossierSummary;
  salesResearchIntelligenceSummary?: SalesResearchIntelligenceSummary;
  salesScoringSummary?: SalesScoringSummary;
  salesWorkflowSummary?: SalesWorkflowSummary;
  connectorReadiness?: ConnectorReadinessSummary;
  email?: GmailEmailDashboardSummary;
  engineeringTasks?: EngineeringTaskGeneratorSummary;
  executiveAutomation?: ExecutiveAutomationSummary;
  executiveEmailBriefing?: ExecutiveEmailBriefingSummary;
  executiveOperations?: ExecutiveOperationsDashboardSummary;
  executivePlanning?: ExecutivePlanningSummary;
  marketing?: MarketingDashboardSummary;
  assetLibrary?: AssetLibraryDashboardSummary;
  customerSuccess?: CustomerSuccessDashboardSummary;
  finance?: FinanceDashboardSummary;
  githubPlanning?: GitHubPlanningDashboardSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  projectRegistry?: ProjectRegistryDashboardSummary;
  releaseReadiness?: ReleaseReadinessDashboardSummary;
  releaseShipPlans?: ReleaseShipPlanDashboardSummary;
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary;
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
  salesPipelineAnalytics?: SalesPipelineAnalytics;
  salesOrganizationIntelligenceSummary?: SalesOrganizationIntelligenceSummary;
  sharedMemory?: SharedMemoryStore;
  salesProposalSummary?: SalesProposalSummary;
  salesProspectDossierSummary?: SalesProspectDossierSummary;
  salesResearchIntelligenceSummary?: SalesResearchIntelligenceSummary;
  salesScoringSummary?: SalesScoringSummary;
  salesWorkflowSummary?: SalesWorkflowSummary;
  salesSummary?: SalesSummary;
  connectorReadiness?: ConnectorReadinessSummary;
  email?: GmailEmailDashboardSummary;
  engineeringTasks?: EngineeringTaskGeneratorSummary;
  executiveAutomation?: ExecutiveAutomationSummary;
  executiveEmailBriefing?: ExecutiveEmailBriefingSummary;
  executiveOperations?: ExecutiveOperationsDashboardSummary;
  executivePlanning?: ExecutivePlanningSummary;
  marketing?: MarketingDashboardSummary;
  assetLibrary?: AssetLibraryDashboardSummary;
  customerSuccess?: CustomerSuccessDashboardSummary;
  finance?: FinanceDashboardSummary;
  githubPlanning?: GitHubPlanningDashboardSummary;
  githubReadOnly?: GitHubReadOnlyDashboardSummary;
  projectRegistry?: ProjectRegistryDashboardSummary;
  releaseReadiness?: ReleaseReadinessDashboardSummary;
  releaseShipPlans?: ReleaseShipPlanDashboardSummary;
  repositoryIntelligence?: RepositoryIntelligenceDashboardSummary;
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
