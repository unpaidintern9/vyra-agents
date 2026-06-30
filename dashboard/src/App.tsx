import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CircleDot,
  Database,
  Download,
  FileClock,
  GitBranch,
  ListChecks,
  Network,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Trash2,
  Workflow,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { EngineeringScanResult } from './agents/engineering/engineeringTypes';
import ExecutiveDashboard from './agents/executive/ExecutiveDashboard';
import MigrationPage from './agents/migration/MigrationPage';
import type { BatchPacketExportFormat } from './agents/migration/batchBuilderExports';
import type { MigrationBatchPreview } from './agents/migration/batchBuilderTypes';
import { existingVyraUsers, importedMembers, migrationBatch } from './agents/migration/migrationMockData';
import { migrationRules } from './agents/migration/migrationRules';
import { summarizeMigration } from './agents/migration/migrationSummary';
import { validateMigrationMembers } from './agents/migration/migrationValidation';
import { matchMigrationMembers } from './agents/migration/memberMatching';
import SalesPage from './agents/sales/SalesPage';
import { salesTeamAgents, summarizeSalesAgentTeam } from './agents/sales/salesAgentTeam';
import { buildSalesFollowUpQueue } from './agents/sales/salesFollowUpEngine';
import { parseSalesLeadJson, emptySalesImportResult } from './agents/sales/salesImport';
import { buildSalesIntegrationSummary } from './agents/sales/salesIntegrationAdapter';
import {
  buildOrganizationIntelligenceReport,
  buildOrganizationTimelineReport,
  buildSalesIntelligenceGraph,
  buildSalesIntelligenceGraphReport,
  summarizeSalesIntelligenceGraph,
} from './agents/sales/salesIntelligenceGraph';
import { buildProposalDraftReport, generateSalesProposalDraft, summarizeSalesProposalDrafts } from './agents/sales/salesProposalBuilder';
import {
  buildResearchDossierReport,
  createSalesProspectIntake,
  generateResearchDossier,
  summarizeProspectDossiers,
} from './agents/sales/salesProspectDossiers';
import {
  buildFollowUpQueueReport,
  buildFollowUpReport,
  buildLeadScoringReport,
  buildProposalReport,
  buildSalesPipelineReport,
  buildWeightedPipelineReport,
  downloadSalesPipelineCsv,
} from './agents/sales/salesReports';
import { mergeSalesScoringSummary, scoreSalesLeads, summarizeSalesScoring } from './agents/sales/salesScoring';
import { createInitialSalesActivities, createInitialSalesLeads, createInitialSalesProposals, createInitialSalesProspects } from './agents/sales/salesStorage';
import type {
  ProposalPrep,
  SalesAction,
  SalesActivity,
  SalesLead,
  SalesProspectIntake,
  SalesProspectIntakeDraft,
  SalesProposalDraft,
  SalesProposalTemplateType,
  SalesProspectResearchRecord,
  SalesResearchDossier,
} from './agents/sales/salesTypes';
import { summarizeSalesPipeline } from './agents/sales/salesPipeline';
import { EmptyState } from './components/EmptyState';
import { PageHeader } from './components/PageHeader';
import { RiskBadge } from './components/RiskBadge';
import { StatusBadge } from './components/StatusBadge';
import { getGitHubStatus } from './integrations/github/githubStatus';
import { gitHubTokenConfigurationStatus } from './integrations/github/githubTokenResolver';
import type { GitHubStatusResult } from './integrations/github/githubTypes';
import { buildIntegrationRegistry } from './integrations/integrationRegistry';
import { getAgentMemoryFunctionConfig } from './integrations/supabase/agentMemoryFunctionClient';
import { getSupabaseEnvStatus } from './integrations/supabase/supabaseClient';
import { getSupabaseStatus } from './integrations/supabase/supabaseStatus';
import type { SupabaseProjectStatus, SupabaseTableCheck } from './integrations/supabase/supabaseTypes';
import { buildAgentRuntime } from './runtime/agentRuntime';
import { buildAiOperatorDashboardSnapshot, type AiOperatorDashboardSnapshot } from './runtime/aiOperatorRuntime';
import {
  buildCrossAgentCollaborationGraph,
  buildCrossAgentCollaborationReport,
  buildCrossAgentGraphReport,
  buildExecutivePriorityQueueReport,
  summarizeCrossAgentCollaboration,
} from './runtime/crossAgentCollaboration';
import type { AgentRuntimeSnapshot } from './runtime/runtimeTypes';
import {
  createInitialAgentEvents,
  createInitialAgentNotes,
  createInitialAgentRuns,
  createInitialAgentTasks,
  type AgentEvent,
  type AgentRun,
} from './state/agentRunStore';
import { createInitialApprovals, type ApprovalItem } from './state/approvalStore';
import { createInitialAuditLogs, type AuditLogEntry } from './state/auditLogStore';
import { localStorageKeys } from './storage/localStorageKeys';
import {
  clearLocalState,
  getLocalPersistenceStatus,
  loadLocalState,
  saveLocalState,
  type LocalPersistenceStatus,
} from './storage/localStorageStore';
import { downloadReport, type ReportFormat } from './storage/reportExport';
import { agentMemoryRecords, detectAgentMemoryConnection, getSyncWriteMode, syncPendingQueue } from './sync/syncManager';
import {
  clearLegacyRlsFailures,
  clearSyncQueueStorage,
  enqueueSyncRecords,
  isLegacyRlsFailure,
  loadSyncQueue,
  requeueLegacyRlsFailures,
  resetFailedQueueItems,
  saveSyncQueue,
} from './sync/syncQueue';
import { buildSyncStatusSnapshot } from './sync/syncStatus';
import type { SyncConnectionState, SyncQueueItem, SyncStatusSnapshot } from './sync/syncTypes';
import type { ApprovalHistoryEntry, MigrationDryRunRecord, WorkflowDryCheckRecord } from './types/localRecords';
import { getWorkflowRegistry } from './workflows/workflowRegistry';
import type { WorkflowDefinition } from './workflows/workflowTypes';
import { navItems } from './data';

type IntegrationMode = 'mock' | 'live';
type EffectiveMode = 'mock' | 'live' | 'fallback';

interface OperatorDashboardState {
  lastScheduledRun: string | null;
  lastReport: string | null;
  lastRun: string;
  lastThreadArchive: string | null;
  lastThreadIngest: string | null;
  lastValidation: string | null;
  pendingApprovalCount: number;
  pendingApprovalsByType: Record<string, number>;
  pendingThreadOutputs: number;
  threadApprovalDecisionCounts: {
    approved: number;
    rejected: number;
  };
  threadDueSchedules: number;
}

interface IntegrationSnapshot {
  requestedMode: IntegrationMode;
  effectiveMode: EffectiveMode;
  github: GitHubStatusResult;
  supabase: SupabaseProjectStatus;
  warnings: string[];
  lastChecked: string;
}

const requestedMode = import.meta.env.VITE_VYRA_INTEGRATION_MODE === 'live' ? 'live' : 'mock';
const EngineeringPage = lazy(() => import('./agents/engineering/EngineeringPage'));

function localId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function App() {
  const [activePage, setActivePage] = useState('Overview');
  const [reviewApproved, setReviewApproved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<IntegrationSnapshot | null>(null);
  const [agentRuns, setAgentRuns] = useState(() => loadLocalState(localStorageKeys.agentRuns, createInitialAgentRuns));
  const [agentEvents, setAgentEvents] = useState(() => loadLocalState(localStorageKeys.agentEvents, createInitialAgentEvents));
  const [agentTasks, setAgentTasks] = useState(() => loadLocalState(localStorageKeys.agentTasks, createInitialAgentTasks));
  const [agentNotes] = useState(createInitialAgentNotes);
  const [auditLogs, setAuditLogs] = useState(() => loadLocalState(localStorageKeys.auditLogs, createInitialAuditLogs));
  const [approvalItems, setApprovalItems] = useState(() => loadLocalState(localStorageKeys.approvals, createInitialApprovals));
  const [salesLeads, setSalesLeads] = useState(() => loadLocalState<SalesLead[]>(localStorageKeys.salesLeads, createInitialSalesLeads));
  const [salesActivities, setSalesActivities] = useState(() =>
    loadLocalState<SalesActivity[]>(localStorageKeys.salesActivities, createInitialSalesActivities),
  );
  const [salesProposals, setSalesProposals] = useState(() =>
    loadLocalState<ProposalPrep[]>(localStorageKeys.salesProposals, createInitialSalesProposals),
  );
  const [salesProposalDrafts, setSalesProposalDrafts] = useState(() =>
    loadLocalState<SalesProposalDraft[]>(localStorageKeys.salesProposalDrafts, () => []),
  );
  const [salesProspectResearch] = useState(() =>
    loadLocalState<SalesProspectResearchRecord[]>(localStorageKeys.salesProspectResearch, createInitialSalesProspects),
  );
  const [salesProspectIntakes, setSalesProspectIntakes] = useState(() =>
    loadLocalState<SalesProspectIntake[]>(localStorageKeys.salesProspectIntakes, () => []),
  );
  const [salesResearchDossiers, setSalesResearchDossiers] = useState(() =>
    loadLocalState<SalesResearchDossier[]>(localStorageKeys.salesProspectDossiers, () => []),
  );
  const [salesImportResult, setSalesImportResult] = useState(emptySalesImportResult);
  const [workflowRuns, setWorkflowRuns] = useState(() =>
    loadLocalState<WorkflowDryCheckRecord[]>(localStorageKeys.workflowResults, () => []),
  );
  const [migrationDryRuns, setMigrationDryRuns] = useState(() =>
    loadLocalState<MigrationDryRunRecord[]>(localStorageKeys.migrationDryRuns, () => []),
  );
  const [approvalHistory, setApprovalHistory] = useState(() =>
    loadLocalState<ApprovalHistoryEntry[]>(localStorageKeys.approvalHistory, () => []),
  );
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [syncQueue, setSyncQueue] = useState(loadSyncQueue);
  const [syncConnectionState, setSyncConnectionState] = useState<SyncConnectionState>('disabled');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncEnabled] = useState(true);
  const [operatorDashboard, setOperatorDashboard] = useState(() =>
    loadLocalState<OperatorDashboardState>(localStorageKeys.operatorDashboard, () => ({
      lastScheduledRun: null,
      lastReport: null,
      lastRun: new Date().toISOString(),
      lastThreadArchive: null,
      lastThreadIngest: null,
      lastValidation: null,
      pendingApprovalCount: 0,
      pendingApprovalsByType: {},
      pendingThreadOutputs: 0,
      threadApprovalDecisionCounts: {
        approved: 0,
        rejected: 0,
      },
      threadDueSchedules: 0,
    })),
  );

  const migrationIssues = useMemo(() => validateMigrationMembers(importedMembers), []);
  const memberMatches = useMemo(() => matchMigrationMembers(importedMembers, existingVyraUsers), []);
  const migrationSummary = useMemo(
    () => summarizeMigration(importedMembers, migrationIssues, memberMatches),
    [memberMatches, migrationIssues],
  );
  const workflowRegistry = useMemo(() => getWorkflowRegistry(), []);
  const salesSummary = useMemo(() => summarizeSalesPipeline(salesLeads, salesProposals), [salesLeads, salesProposals]);
  const salesScores = useMemo(() => scoreSalesLeads(salesLeads, salesProposals, salesActivities), [salesActivities, salesLeads, salesProposals]);
  const salesFollowUpQueue = useMemo(
    () => buildSalesFollowUpQueue(salesLeads, salesProposals, salesActivities, salesScores),
    [salesActivities, salesLeads, salesProposals, salesScores],
  );
  const salesScoringSummary = useMemo(() => {
    const summary = summarizeSalesScoring(salesScores);
    return mergeSalesScoringSummary(
      summary,
      salesFollowUpQueue.length,
      salesFollowUpQueue.filter((item) => item.queue === 'overdue').length,
      salesFollowUpQueue.filter((item) => item.queue === 'proposal_needed').length,
    );
  }, [salesFollowUpQueue, salesScores]);
  const salesIntegration = useMemo(() => buildSalesIntegrationSummary(requestedMode), []);
  const salesProposalSummary = useMemo(() => summarizeSalesProposalDrafts(salesProposalDrafts), [salesProposalDrafts]);
  const salesAgentTeamSummary = useMemo(() => summarizeSalesAgentTeam(salesTeamAgents, salesProspectResearch), [salesProspectResearch]);
  const salesProspectDossierSummary = useMemo(
    () => summarizeProspectDossiers(salesProspectIntakes, salesResearchDossiers),
    [salesProspectIntakes, salesResearchDossiers],
  );
  const salesIntelligenceGraph = useMemo(
    () =>
      buildSalesIntelligenceGraph({
        activities: salesActivities,
        followUpQueue: salesFollowUpQueue,
        leads: salesLeads,
        proposalDrafts: salesProposalDrafts,
        proposals: salesProposals,
        prospectDossiers: salesResearchDossiers,
        prospectIntakes: salesProspectIntakes,
      }),
    [salesActivities, salesFollowUpQueue, salesLeads, salesProposalDrafts, salesProposals, salesProspectIntakes, salesResearchDossiers],
  );
  const salesIntelligenceSummary = useMemo(() => summarizeSalesIntelligenceGraph(salesIntelligenceGraph), [salesIntelligenceGraph]);
  const persistenceStatus = useMemo(() => getLocalPersistenceStatus(), []);
  const syncWriteMode = useMemo(() => getSyncWriteMode(), []);
  const syncStatus = useMemo(
    () => buildSyncStatusSnapshot(syncQueue, syncConnectionState, lastSyncAt, syncEnabled, syncWriteMode),
    [lastSyncAt, syncConnectionState, syncEnabled, syncQueue, syncWriteMode],
  );
  const runtime = useMemo(
    () =>
      buildAgentRuntime({
        agentEvents,
        agentNotes,
        agentRuns,
        agentTasks,
        approvalHistory,
        approvalItems,
        auditLogs,
        migrationDryRuns,
        syncStatus,
        workflowRuns,
        workflows: workflowRegistry,
      }),
    [
      agentEvents,
      agentNotes,
      agentRuns,
      agentTasks,
      approvalHistory,
      approvalItems,
      auditLogs,
      migrationDryRuns,
      syncStatus,
      workflowRuns,
      workflowRegistry,
    ],
  );
  const crossAgentGraph = useMemo(
    () =>
      buildCrossAgentCollaborationGraph({
        executivePriorities: [],
        followUps: salesFollowUpQueue,
        migrationSummary,
        proposals: salesProposals,
        proposalDrafts: salesProposalDrafts,
        runtime,
        salesDossiers: salesResearchDossiers,
        salesGraph: salesIntelligenceGraph,
      }),
    [migrationSummary, runtime, salesFollowUpQueue, salesIntelligenceGraph, salesProposalDrafts, salesProposals, salesResearchDossiers],
  );
  const crossAgentSummary = useMemo(() => summarizeCrossAgentCollaboration(crossAgentGraph), [crossAgentGraph]);
  const lastDryRunAt = migrationDryRuns[0]?.createdAt ?? null;

  useEffect(() => saveLocalState(localStorageKeys.agentRuns, agentRuns), [agentRuns]);
  useEffect(() => saveLocalState(localStorageKeys.agentEvents, agentEvents), [agentEvents]);
  useEffect(() => saveLocalState(localStorageKeys.agentTasks, agentTasks), [agentTasks]);
  useEffect(() => saveLocalState(localStorageKeys.auditLogs, auditLogs), [auditLogs]);
  useEffect(() => saveLocalState(localStorageKeys.approvals, approvalItems), [approvalItems]);
  useEffect(() => saveLocalState(localStorageKeys.salesLeads, salesLeads), [salesLeads]);
  useEffect(() => saveLocalState(localStorageKeys.salesActivities, salesActivities), [salesActivities]);
  useEffect(() => saveLocalState(localStorageKeys.salesProposals, salesProposals), [salesProposals]);
  useEffect(() => saveLocalState(localStorageKeys.salesProposalDrafts, salesProposalDrafts), [salesProposalDrafts]);
  useEffect(() => saveLocalState(localStorageKeys.salesProspectResearch, salesProspectResearch), [salesProspectResearch]);
  useEffect(() => saveLocalState(localStorageKeys.salesProspectIntakes, salesProspectIntakes), [salesProspectIntakes]);
  useEffect(() => saveLocalState(localStorageKeys.salesProspectDossiers, salesResearchDossiers), [salesResearchDossiers]);
  useEffect(() => saveLocalState(localStorageKeys.workflowResults, workflowRuns), [workflowRuns]);
  useEffect(() => saveLocalState(localStorageKeys.migrationDryRuns, migrationDryRuns), [migrationDryRuns]);
  useEffect(() => saveLocalState(localStorageKeys.approvalHistory, approvalHistory), [approvalHistory]);
  useEffect(() => saveLocalState(localStorageKeys.operatorDashboard, operatorDashboard), [operatorDashboard]);
  useEffect(() => saveSyncQueue(syncQueue), [syncQueue]);

  useEffect(() => {
    setSyncQueue((current) =>
      enqueueSyncRecords(
        current,
        agentMemoryRecords({
          agentRuns,
          agentEvents,
          agentTasks,
          auditLogs,
          approvalItems,
          workflowRuns,
          migrationDryRuns,
          approvalHistory,
        }),
      ),
    );
  }, [agentRuns, agentEvents, agentTasks, auditLogs, approvalItems, workflowRuns, migrationDryRuns, approvalHistory]);

  const syncNow = useCallback(async () => {
    const result = await syncPendingQueue(syncQueue);
    setSyncConnectionState(result.connectionState);
    if (result.lastSyncAt) {
      setLastSyncAt(result.lastSyncAt);
    }
    const syncedNow = result.queue.filter((item) => {
      const previous = syncQueue.find((entry) => entry.id === item.id);
      return item.status === 'synced' && previous?.status === 'pending';
    });
    const shouldAuditSync = syncedNow.some((item) => item.sourceType !== 'audit_log');
    if (shouldAuditSync) {
      setAuditLogs((current) => [
        {
          id: localId('audit_sync'),
          timestamp: new Date().toISOString(),
          actor: 'System',
          agent: 'Operations Agent',
          action: 'agent memory edge function sync completed',
          target: 'approved agent memory tables',
          result: `${syncedNow.length} records synced`,
          riskLevel: 'low',
        },
        ...current,
      ]);
    }
    setSyncQueue(result.queue);
  }, [syncQueue]);

  const retryFailedSync = useCallback(() => {
    setSyncQueue((current) => resetFailedQueueItems(current));
  }, []);

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([]);
    clearSyncQueueStorage();
  }, []);

  useEffect(() => {
    detectAgentMemoryConnection().then(setSyncConnectionState).catch(() => setSyncConnectionState('offline'));
  }, []);

  useEffect(() => {
    if (syncEnabled && syncQueue.some((item) => item.status === 'pending')) {
      void syncNow();
    }
  }, [syncEnabled, syncNow, syncQueue]);

  const appendAudit = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    setAuditLogs((current) => [
      {
        id: localId('audit'),
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...current,
    ]);
  }, []);

  const appendAgentEvent = useCallback((event: Omit<AgentEvent, 'id' | 'timestamp'>) => {
    setAgentEvents((current) => [
      {
        id: localId('evt'),
        timestamp: new Date().toISOString(),
        ...event,
      },
      ...current,
    ]);
  }, []);

  const testAgentMemoryWriteFunction = () => {
    appendAudit({
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'agent memory write function test',
      target: 'agent_logs',
      result: 'queued edge function test',
      riskLevel: 'low',
    });
  };

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    const [github, supabase] = await Promise.all([getGitHubStatus(requestedMode), getSupabaseStatus(requestedMode)]);
    const effectiveMode = requestedMode === 'mock' ? 'mock' : github.usedFallback || supabase.usedFallback ? 'fallback' : 'live';
    const warnings = [...github.warnings, ...supabase.warnings];
    setSnapshot({
      requestedMode,
      effectiveMode,
      github,
      supabase,
      warnings,
      lastChecked: new Date().toISOString(),
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'integration status refreshed',
      target: 'GitHub and Supabase',
      result: effectiveMode,
      riskLevel: 'low',
    });
    setIsRefreshing(false);
  }, [appendAudit]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const clearStaleRlsFailures = useCallback(() => {
    const staleCount = syncQueue.filter(isLegacyRlsFailure).length;
    if (!staleCount) return;
    setSyncQueue((current) => clearLegacyRlsFailures(current));
    appendAgentEvent({
      agent: 'Operations Agent',
      event: 'legacy-rls-sync-failures-cleared',
      detail: `Cleared ${staleCount} local legacy RLS sync failure(s). RLS remained intact and no Supabase records were deleted.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'legacy RLS sync failures cleared',
      target: 'local sync queue',
      result: `${staleCount} stale local queue record(s) removed`,
      riskLevel: 'low',
    });
  }, [appendAgentEvent, appendAudit, syncQueue]);

  const requeueStaleRlsFailures = useCallback(() => {
    const staleCount = syncQueue.filter(isLegacyRlsFailure).length;
    if (!staleCount) return;
    if (syncWriteMode !== 'edge_function') {
      appendAudit({
        actor: 'Robert',
        agent: 'Operations Agent',
        action: 'legacy RLS sync requeue blocked',
        target: 'local sync queue',
        result: 'Edge Function write mode is not configured',
        riskLevel: 'low',
      });
      return;
    }
    setSyncQueue((current) => requeueLegacyRlsFailures(current));
    appendAgentEvent({
      agent: 'Operations Agent',
      event: 'legacy-rls-sync-failures-requeued',
      detail: `Requeued ${staleCount} legacy RLS failure(s) through the current Edge Function sync path.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'legacy RLS sync failures requeued',
      target: 'Edge Function sync queue',
      result: `${staleCount} local record(s) requeued`,
      riskLevel: 'low',
    });
  }, [appendAgentEvent, appendAudit, syncQueue, syncWriteMode]);

  const runMigrationDryRun = () => {
    const now = new Date().toISOString();
    const run: AgentRun = {
      id: localId('run'),
      agent: 'Migration Agent',
      workflow: 'migration-validation-dry-run',
      status: 'completed',
      startedAt: now,
      completedAt: new Date().toISOString(),
      summary: migrationSummary,
    };
    const dryRun: MigrationDryRunRecord = {
      id: localId('migration_dry_run'),
      createdAt: now,
      agent: 'Migration Agent',
      workflow: 'migration-validation-dry-run',
      summary: migrationSummary,
      rules: migrationRules,
      productionWritesOccurred: 'No',
    };
    setAgentRuns((current) => [run, ...current]);
    setSelectedRunId(run.id);
    setMigrationDryRuns((current) => [dryRun, ...current]);
    appendAgentEvent({
      agent: 'Migration Agent',
      event: 'migration-validation-dry-run',
      detail: `Validated ${migrationSummary.totalImported} mock members with ${migrationSummary.warnings} warnings and ${migrationSummary.errors} errors.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Migration Agent',
      action: 'migration dry run completed',
      target: `${migrationBatch.gymName} mock import`,
      result: 'local dry run only',
      riskLevel: 'low',
    });
  };

  const recordBatchPreviewBuilt = (batch: MigrationBatchPreview) => {
    appendAgentEvent({
      agent: 'Migration Agent',
      event: 'migration-batch-preview-built',
      detail: `Built local batch preview ${batch.batchId} from ${batch.sourceFileName} with ${batch.summary.totalImported} staged row(s).`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Migration Agent',
      action: 'migration batch preview built',
      target: batch.batchId,
      result: 'local preview only',
      riskLevel: 'low',
    });
  };

  const recordBatchApprovalPacketExported = (format: BatchPacketExportFormat, batch: MigrationBatchPreview) => {
    appendAgentEvent({
      agent: 'Migration Agent',
      event: 'migration-approval-packet-exported',
      detail: `Exported ${format.toUpperCase()} approval packet for local batch preview ${batch.batchId}.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Migration Agent',
      action: 'migration approval packet exported',
      target: batch.batchId,
      result: `${format} export, local preview only`,
      riskLevel: 'low',
    });
  };

  const approveMockItem = (id: string) => {
    const item = approvalItems.find((approval) => approval.id === id);
    setApprovalItems((current) =>
      current.map((item) => (item.id === id && item.status === 'pending' ? { ...item, status: 'mock approved' } : item)),
    );
    if (item?.status === 'pending') {
      setApprovalHistory((current) => [
        {
          id: localId('approval_history'),
          approvalId: item.id,
          title: item.title,
          requestedBy: item.requestedBy,
          riskLevel: item.riskLevel,
          action: 'mock approved',
          result: 'local approval state updated',
          decidedBy: 'Robert',
          decidedAt: new Date().toISOString(),
          productionWritesOccurred: 'No',
        },
        ...current,
      ]);
    }
    appendAudit({
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'approval mock approved',
      target: id,
      result: 'local state updated',
      riskLevel: 'medium',
      approvalRequired: true,
    });
  };

  const runWorkflowDryCheck = (workflow: WorkflowDefinition) => {
    if (!workflow.safeDryRun) {
      return;
    }
    const now = new Date().toISOString();
    setWorkflowRuns((current) => [
      {
        id: localId('workflow_dry_check'),
        workflowKey: workflow.key,
        agent: workflow.ownerAgent,
        riskLevel: workflow.riskLevel,
        result: 'local dry check only',
        createdAt: now,
        approvalRequired: workflow.approvalRequired,
        productionWritesOccurred: 'No',
      },
      ...current,
    ]);
    appendAudit({
      actor: 'Robert',
      agent: workflow.ownerAgent,
      action: 'workflow dry check completed',
      target: workflow.key,
      result: 'local dry check only',
      riskLevel: workflow.riskLevel,
      approvalRequired: workflow.approvalRequired,
    });
  };

  const recordEngineeringScan = (result: EngineeringScanResult) => {
    const now = new Date().toISOString();
    const graph = result.graph;
    const summary = {
      repositoriesIndexed: graph.summary.repositoriesIndexed,
      repositoriesMissing: graph.summary.repositoriesMissing,
      filesIndexed: graph.summary.filesIndexed,
      routes: graph.summary.routes,
      components: graph.summary.components,
      supabaseFunctions: graph.summary.supabaseFunctions,
      migrations: graph.summary.migrations,
      tables: graph.summary.tables,
      dependencies: graph.summary.dependencies,
      envVariableNames: graph.summary.envVariableNames,
      docs: graph.summary.docs,
      productionWritesOccurred: 'No',
    };
    const run: AgentRun = {
      id: localId('run_engineering_scan'),
      agent: 'Engineering Agent',
      workflow: 'engineering-knowledge-graph-scan',
      status: 'completed',
      startedAt: now,
      completedAt: new Date().toISOString(),
      summary,
    };
    setAgentRuns((current) => [run, ...current]);
    setSelectedRunId(run.id);
    setWorkflowRuns((current) => [
      {
        id: localId('workflow_engineering_scan'),
        workflowKey: 'engineering-knowledge-graph-scan',
        agent: 'Engineering Agent',
        riskLevel: 'low',
        result: `${graph.summary.filesIndexed} files indexed locally`,
        createdAt: now,
        approvalRequired: false,
        productionWritesOccurred: 'No',
      },
      {
        id: localId('workflow_engineering_health'),
        workflowKey: 'engineering-ownership-health-scan',
        agent: 'Engineering Agent',
        riskLevel: 'low',
        result: `${graph.repositories.length} repo health profiles refreshed`,
        createdAt: now,
        approvalRequired: false,
        productionWritesOccurred: 'No',
      },
      ...current,
    ]);
    appendAgentEvent({
      agent: 'Engineering Agent',
      event: 'engineering-knowledge-graph-scan',
      detail: `Loaded ${graph.summary.repositoriesIndexed} repos, ${graph.summary.filesIndexed} files, ${graph.nodes.length} nodes, and ${graph.edges.length} relationships from the local graph.`,
    });
    appendAgentEvent({
      agent: 'Engineering Agent',
      event: 'engineering-ownership-health-scan',
      detail: `Mapped owners, feature areas, health scores, orphan candidates, missing docs, and relationship warnings for ${graph.repositories.length} repos.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Engineering Agent',
      action: 'engineering knowledge graph scan loaded',
      target: 'dashboard/public/engineering-graph.json',
      result: 'local read-only metadata graph loaded',
      riskLevel: 'low',
    });
  };

  const recordEngineeringImpactExport = (event: {
    affectedCount: number;
    nodeLabel: string;
    nodeType: string;
    reportType: string;
    riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  }) => {
    const now = new Date().toISOString();
    const isIssueCreation = /issue creation|github issue creation|dry-run|dry run|duplicate_skipped|duplicate skipped|create github/i.test(event.reportType);
    const isIssueDraftPlanning = /issue draft|github issue|ready github|p0 p1/i.test(event.reportType);
    const isFixQueuePlanning = /fix queue|backlog|documentation gap|broken relationship|orphan review|status|repo health improvement/i.test(event.reportType);
    const isOwnershipHealthReport = /ownership|repo health|risk queue|missing docs|orphan|table-to-screen|function-to-table/i.test(event.reportType);
    const workflowKey = isIssueCreation
      ? 'engineering-github-issue-creation'
      : isIssueDraftPlanning
      ? 'engineering-github-issue-draft-planning'
      : isFixQueuePlanning
      ? 'engineering-fix-queue-planning'
      : isOwnershipHealthReport
        ? 'engineering-ownership-health-scan'
        : 'engineering-impact-analysis';
    setWorkflowRuns((current) => [
      {
        id: localId('workflow_engineering_impact'),
        workflowKey,
        agent: 'Engineering Agent',
        riskLevel: isIssueCreation ? event.riskLevel === 'low' || event.riskLevel === 'unknown' ? 'medium' : event.riskLevel : isIssueDraftPlanning ? 'medium' : event.riskLevel === 'unknown' ? 'medium' : event.riskLevel,
        result: isIssueCreation ? `${event.reportType} recorded for ${event.nodeLabel}` : `${event.reportType} exported for ${event.nodeLabel}`,
        createdAt: now,
        approvalRequired: isIssueDraftPlanning || isIssueCreation,
        productionWritesOccurred: 'No',
      },
      ...current,
    ]);
    appendAgentEvent({
      agent: 'Engineering Agent',
      event: workflowKey,
      detail: `${event.reportType} ${isIssueCreation ? 'recorded' : 'exported'} for ${event.nodeType} ${event.nodeLabel}; ${event.affectedCount} related nodes detected.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Engineering Agent',
      action: isIssueCreation ? 'engineering github issue creation attempt recorded' : 'engineering impact report exported',
      target: `${event.nodeType}:${event.nodeLabel}`,
      result: `${event.reportType} · ${event.riskLevel} risk`,
      riskLevel: isIssueCreation ? event.riskLevel === 'low' || event.riskLevel === 'unknown' ? 'medium' : event.riskLevel : isIssueDraftPlanning ? 'medium' : event.riskLevel === 'unknown' ? 'medium' : event.riskLevel,
      approvalRequired: isIssueDraftPlanning || isIssueCreation,
    });
  };

  const recordSalesAction = (leadId: string, action: SalesAction) => {
    const now = new Date().toISOString();
    const lead = salesLeads.find((item) => item.id === leadId);
    if (!lead) {
      return;
    }
    const actionLabel = salesActionLabel(action);
    const workflowKey = salesWorkflowForAction(action);
    setSalesLeads((current) =>
      current.map((item) => (item.id === leadId ? applySalesActionToLead(item, action, now) : item)),
    );
    setSalesProposals((current) => updateSalesProposals(current, lead, action));
    setSalesActivities((current) => [
      {
        id: localId('sales_activity'),
        leadId,
        activityType: salesActivityType(action),
        summary: `${actionLabel} for ${lead.name}`,
        timestamp: now,
        outcome: 'Local Sales Agent state updated only',
        nextAction: action === 'paused' ? 'Paused until Robert resumes' : lead.nextAction,
      },
      ...current,
    ]);
    setWorkflowRuns((current) => [
      {
        id: localId('workflow_sales'),
        workflowKey,
        agent: 'Sales Agent',
        riskLevel: action === 'paused' ? 'low' : 'medium',
        result: `${actionLabel} recorded for ${lead.name}`,
        createdAt: now,
        approvalRequired: workflowKey !== 'pipeline-summary',
        productionWritesOccurred: 'No',
      },
      ...current,
    ]);
    appendAgentEvent({
      agent: 'Sales Agent',
      event: workflowKey,
      detail: `${actionLabel} recorded for ${lead.name}. No email, Stripe, CRM, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: `sales ${actionLabel.toLowerCase()}`,
      target: lead.name,
      result: 'local/mock state updated; no external send or production write',
      riskLevel: action === 'paused' ? 'low' : 'medium',
      approvalRequired: true,
    });
  };

  const importSalesLeads = (content: string) => {
    const parsed = parseSalesLeadJson(content, salesLeads.map((lead) => lead.id));
    setSalesImportResult(parsed.result);
    if (parsed.result.status !== 'success') {
      appendAudit({
        actor: 'Robert',
        agent: 'Sales Agent',
        action: 'sales lead import rejected',
        target: 'JSON import',
        result: `${parsed.result.errors.length} validation error(s)`,
        riskLevel: 'low',
      });
      return;
    }
    setSalesLeads((current) => [...parsed.leads, ...current]);
    appendAgentEvent({
      agent: 'Sales Agent',
      event: 'sales-lead-review',
      detail: `${parsed.result.importedCount} lead(s) imported after validation. Local storage only.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: 'sales lead import completed',
      target: 'JSON import',
      result: `${parsed.result.importedCount} local lead(s) saved after validation`,
      riskLevel: 'low',
    });
  };

  const saveProspectIntake = (draft: SalesProspectIntakeDraft) => {
    const intake = createSalesProspectIntake(draft, localId('sales_prospect'));
    const dossier = generateResearchDossier(intake);
    setSalesProspectIntakes((current) => [intake, ...current]);
    setSalesResearchDossiers((current) => [dossier, ...current]);
    appendAgentEvent({
      agent: 'Sales Agent',
      event: 'prospect-dossier-generated',
      detail: `${intake.gymName} intake saved locally and research dossier generated. No browsing, email, CRM, Stripe, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: 'sales prospect intake saved',
      target: intake.gymName,
      result: `local intake and deterministic dossier saved; fit score ${dossier.fitScore}`,
      riskLevel: dossier.missingInfo.length ? 'medium' : 'low',
    });
  };

  const generateProposalDraft = (leadId: string, templateType: SalesProposalTemplateType) => {
    const lead = salesLeads.find((item) => item.id === leadId);
    if (!lead) return;
    const proposal = salesProposals.find((item) => item.leadId === leadId);
    const existingDraft = salesProposalDrafts.find((draft) => draft.leadId === leadId && draft.templateType === templateType);
    const draft = generateSalesProposalDraft({ existingDraft, lead, proposal, templateType });
    setSalesProposalDrafts((current) => [draft, ...current.filter((item) => item.draftId !== draft.draftId)]);
    appendAgentEvent({
      agent: 'Sales Agent',
      event: 'proposal-draft-generated',
      detail: `${draft.title} generated locally. Draft only; not sent, not invoiced, and no CRM write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: 'sales proposal draft generated',
      target: draft.title,
      result: 'local draft only',
      riskLevel: draft.riskFlags.length ? 'medium' : 'low',
    });
  };

  const exportProposalDraft = (draftId: string, format: ReportFormat) => {
    const draft = salesProposalDrafts.find((item) => item.draftId === draftId);
    if (!draft) return;
    const report = buildProposalDraftReport(draft);
    downloadReport(report, format);
    appendAgentEvent({
      agent: 'Sales Agent',
      event: 'proposal-draft-exported',
      detail: `${draft.title} exported as ${format}. No email, Stripe, CRM, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: 'sales proposal draft exported',
      target: draft.title,
      result: `${format} downloaded locally`,
      riskLevel: 'low',
    });
  };

  const exportResearchDossier = (dossierId: string, format: ReportFormat) => {
    const dossier = salesResearchDossiers.find((item) => item.dossierId === dossierId);
    if (!dossier) return;
    const intake = salesProspectIntakes.find((item) => item.id === dossier.intakeId);
    if (!intake) return;
    const report = buildResearchDossierReport(intake, dossier);
    downloadReport(report, format);
    appendAgentEvent({
      agent: 'Sales Agent',
      event: 'research-dossier-exported',
      detail: `${report.title} exported as ${format}. No browsing, email, CRM, Stripe, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: 'sales research dossier exported',
      target: report.title,
      result: `${format} downloaded locally`,
      riskLevel: 'low',
    });
  };

  const exportSalesIntelligence = (
    report: 'organization_intelligence' | 'graph' | 'timeline',
    organizationId: string | null,
  ) => {
    const selectedOrganizationId = organizationId ?? salesIntelligenceGraph.organizationProfiles[0]?.id ?? '';
    const localReport =
      report === 'graph'
        ? buildSalesIntelligenceGraphReport(salesIntelligenceGraph)
        : report === 'timeline'
          ? buildOrganizationTimelineReport(salesIntelligenceGraph, selectedOrganizationId)
          : buildOrganizationIntelligenceReport(salesIntelligenceGraph, selectedOrganizationId);
    downloadReport(localReport, report === 'graph' ? 'json' : 'markdown');
    appendAgentEvent({
      agent: 'Sales Intelligence Agent',
      event: 'sales-intelligence-exported',
      detail: `${localReport.title} exported locally. No browsing, email, Stripe, CRM, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Intelligence Agent',
      action: 'sales intelligence exported',
      target: localReport.title,
      result: 'local report downloaded',
      riskLevel: 'low',
    });
  };

  const exportCrossAgentCollaboration = (report: 'collaboration' | 'graph' | 'priority_queue') => {
    const localReport =
      report === 'graph'
        ? buildCrossAgentGraphReport(crossAgentGraph)
        : report === 'priority_queue'
          ? buildExecutivePriorityQueueReport(crossAgentGraph)
          : buildCrossAgentCollaborationReport(crossAgentGraph, crossAgentSummary);
    downloadReport(localReport, report === 'graph' ? 'json' : 'markdown');
    appendAgentEvent({
      agent: 'Executive Agent',
      event: 'cross-agent-collaboration-exported',
      detail: `${localReport.title} exported locally. No browsing, email, Stripe, CRM, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Executive Agent',
      action: 'cross-agent collaboration exported',
      target: localReport.title,
      result: 'local report downloaded',
      riskLevel: 'low',
    });
  };

  const exportSalesReport = (
    format: ReportFormat | 'csv',
    report: 'pipeline' | 'follow_up' | 'proposal' | 'lead_scoring' | 'follow_up_queue' | 'weighted_pipeline',
  ) => {
    if (format === 'csv') {
      downloadSalesPipelineCsv(salesLeads);
      appendAgentEvent({
        agent: 'Sales Agent',
        event: 'pipeline-summary',
        detail: 'Sales Pipeline CSV exported locally. No CRM, email, Stripe, or production write occurred.',
      });
      appendAudit({
        actor: 'Robert',
        agent: 'Sales Agent',
        action: 'sales csv exported',
        target: 'Sales Pipeline CSV',
        result: 'CSV downloaded locally',
        riskLevel: 'low',
      });
      return;
    }
    const localReport =
      report === 'follow_up_queue'
        ? buildFollowUpQueueReport(salesFollowUpQueue)
        : report === 'lead_scoring'
          ? buildLeadScoringReport(salesLeads, salesScores)
          : report === 'weighted_pipeline'
            ? buildWeightedPipelineReport(salesLeads, salesScores)
            : report === 'follow_up'
        ? buildFollowUpReport(salesLeads)
        : report === 'proposal'
          ? buildProposalReport(salesLeads, salesProposals)
          : buildSalesPipelineReport(salesLeads, salesActivities, salesProposals);
    downloadReport(localReport, format);
    appendAgentEvent({
      agent: 'Sales Agent',
      event:
        report === 'pipeline' || report === 'weighted_pipeline'
          ? 'pipeline-summary'
          : report === 'follow_up' || report === 'follow_up_queue'
            ? 'follow-up-planning'
            : report === 'lead_scoring'
              ? 'lead-scoring'
              : 'quote-prep',
      detail: `${localReport.title} exported as ${format}. No email, Stripe, CRM, or production write occurred.`,
    });
    appendAudit({
      actor: 'Robert',
      agent: 'Sales Agent',
      action: 'sales report exported',
      target: localReport.title,
      result: `${format} downloaded locally`,
      riskLevel: 'low',
    });
  };

  const clearAgentMemory = () => {
    setAgentRuns([]);
    setAgentEvents([]);
    setAgentTasks([]);
    setSelectedRunId(null);
    clearLocalState(localStorageKeys.agentRuns);
    clearLocalState(localStorageKeys.agentEvents);
    clearLocalState(localStorageKeys.agentTasks);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    clearLocalState(localStorageKeys.auditLogs);
  };

  const clearWorkflowResults = () => {
    setWorkflowRuns([]);
    clearLocalState(localStorageKeys.workflowResults);
  };

  const clearMigrationDryRuns = () => {
    setMigrationDryRuns([]);
    clearLocalState(localStorageKeys.migrationDryRuns);
  };

  const clearApprovalHistory = () => {
    setApprovalHistory([]);
    clearLocalState(localStorageKeys.approvalHistory);
  };

  const exportAgentMemory = (format: ReportFormat) => {
    downloadReport(
      {
        title: 'Agent Memory Report',
        slug: 'vyra-agent-memory-report',
        summary: {
          persistenceStatus,
          agentRuns: agentRuns.length,
          agentEvents: agentEvents.length,
          agentTasks: agentTasks.length,
          approvals: approvalItems.length,
          productionWritesOccurred: 'No',
        },
        sections: [
          { title: 'Agent Runs', rows: agentRuns.map((run) => flattenAgentRun(run)) },
          { title: 'Agent Events', rows: agentEvents },
          { title: 'Agent Tasks', rows: agentTasks },
          { title: 'Approvals', rows: approvalItems },
        ],
      },
      format,
    );
  };

  const exportAuditLogs = (format: ReportFormat) => {
    downloadReport(
      {
        title: 'Audit Log Report',
        slug: 'vyra-audit-log-report',
        summary: {
          rows: auditLogs.length,
          highRisk: auditLogs.filter((log) => log.riskLevel === 'high').length,
          mediumRisk: auditLogs.filter((log) => log.riskLevel === 'medium').length,
          lowRisk: auditLogs.filter((log) => log.riskLevel === 'low').length,
          productionWritesOccurred: 'No',
        },
        rows: auditLogs,
      },
      format,
    );
  };

  const exportWorkflowRuns = (format: ReportFormat) => {
    downloadReport(
      {
        title: 'Workflow Run Report',
        slug: 'vyra-workflow-run-report',
        summary: {
          dryChecks: workflowRuns.length,
          uniqueWorkflows: new Set(workflowRuns.map((run) => run.workflowKey)).size,
          productionWritesOccurred: 'No',
        },
        rows: workflowRuns,
      },
      format,
    );
  };

  const exportMigrationDryRun = (format: ReportFormat) => {
    downloadReport(
      {
        title: 'Migration Dry Run Report',
        slug: 'vyra-migration-dry-run-report',
        summary: migrationDryRuns[0]
          ? {
              latestDryRun: migrationDryRuns[0].createdAt,
              totalDryRuns: migrationDryRuns.length,
              productionWritesOccurred: 'No',
              ...migrationDryRuns[0].summary,
            }
          : {
              totalDryRuns: 0,
              productionWritesOccurred: 'No',
            },
        sections: [
          { title: 'Migration Rules', notes: migrationRules },
          { title: 'Dry Run History', rows: migrationDryRuns.map((run) => flattenMigrationDryRun(run)) },
        ],
      },
      format,
    );
  };

  const exportApprovalHistory = (format: ReportFormat) => {
    downloadReport(
      {
        title: 'Approval History Report',
        slug: 'vyra-approval-history-report',
        summary: {
          approvals: approvalHistory.length,
          pendingQueueItems: approvalItems.filter((item) => item.status === 'pending').length,
          productionWritesOccurred: 'No',
        },
        rows: approvalHistory,
      },
      format,
    );
  };

  const status = snapshot ?? buildLoadingSnapshot();
  const pageWarnings = [...status.warnings, ...syncStatusWarnings(syncStatus)];
  const operatorSnapshot = buildAiOperatorDashboardSnapshot({
    integrationMode: modeLabel(status.effectiveMode),
    lastScheduledRun: operatorDashboard.lastScheduledRun,
    lastReport: operatorDashboard.lastReport,
    lastRun: operatorDashboard.lastRun,
    lastThreadArchive: operatorDashboard.lastThreadArchive,
    lastThreadIngest: operatorDashboard.lastThreadIngest,
    lastValidation: operatorDashboard.lastValidation,
    pendingApprovalCount: operatorDashboard.pendingApprovalCount,
    pendingApprovalsByType: operatorDashboard.pendingApprovalsByType,
    pendingThreadOutputs: operatorDashboard.pendingThreadOutputs,
    threadApprovalDecisionCounts: operatorDashboard.threadApprovalDecisionCounts,
    threadDueSchedules: operatorDashboard.threadDueSchedules,
    runtime,
  });
  const recordOperatorRun = () => setOperatorDashboard((current) => ({ ...current, lastRun: new Date().toISOString() }));
  const recordOperatorReport = () => setOperatorDashboard((current) => ({ ...current, lastReport: new Date().toISOString() }));
  const recordOperatorValidation = () => setOperatorDashboard((current) => ({ ...current, lastValidation: new Date().toISOString() }));
  const recordThreadIngest = () =>
    setOperatorDashboard((current) => ({
      ...current,
      lastThreadIngest: new Date().toISOString(),
      pendingThreadOutputs: 0,
    }));
  const recordThreadArchive = () =>
    setOperatorDashboard((current) => ({
      ...current,
      lastThreadArchive: new Date().toISOString(),
      pendingThreadOutputs: 0,
    }));
  const recordScheduledThreadRun = () =>
    setOperatorDashboard((current) => ({
      ...current,
      lastScheduledRun: new Date().toISOString(),
      pendingThreadOutputs: current.pendingThreadOutputs + Math.max(current.threadDueSchedules, 1),
      threadDueSchedules: 0,
    }));
  const recordApprovalDecision = (decision: 'approved' | 'rejected') =>
    setOperatorDashboard((current) => ({
      ...current,
      pendingApprovalCount: Math.max(current.pendingApprovalCount - 1, 0),
      threadApprovalDecisionCounts: {
        ...current.threadApprovalDecisionCounts,
        [decision]: current.threadApprovalDecisionCounts[decision] + 1,
      },
    }));
  const pageTitle =
    activePage === 'Overview'
      ? 'Executive Agent'
      : activePage === 'Migration'
        ? 'Migration Agent'
        : activePage === 'Sales'
          ? 'Sales Agent'
          : activePage === 'Operator'
            ? 'AI Operator'
            : activePage;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <p>Vyra</p>
            <span>Agent Platform</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={item.label === activePage ? 'nav-item active' : 'nav-item'}
                key={item.label}
                onClick={() => setActivePage(item.label)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        <PageHeader
          copy={pageCopy(activePage)}
          eyebrow="Operations command center"
          title={pageTitle}
          actions={
            <div className="hero-actions">
              <div className="hero-status">
                <ShieldCheck size={22} />
                <span>{modeLabel(status.effectiveMode)}</span>
              </div>
              <button className="refresh-button" disabled={isRefreshing} onClick={refreshStatus} type="button">
                <RefreshCcw size={17} />
                <span>{isRefreshing ? 'Refreshing' : 'Refresh Status'}</span>
              </button>
            </div>
          }
        />

        {pageWarnings.length > 0 ? <WarningsPanel warnings={pageWarnings} /> : null}
        <SyncStatusCard syncStatus={syncStatus} />

        {activePage === 'Engineering' ? (
          <Suspense fallback={<EngineeringFallback />}>
            <EngineeringPage onImpactExport={recordEngineeringImpactExport} onScanLoaded={recordEngineeringScan} />
          </Suspense>
        ) : activePage === 'Migration' ? (
          <MigrationPage
            approvalItems={approvalItems}
            approvalHistory={approvalHistory}
            approved={reviewApproved}
            dryRuns={migrationDryRuns}
            expectedTables={status.supabase.tableChecks}
            onBatchApprovalPacketExported={recordBatchApprovalPacketExported}
            onBatchPreviewBuilt={recordBatchPreviewBuilt}
            onClearApprovalHistory={clearApprovalHistory}
            onClearDryRuns={clearMigrationDryRuns}
            onExportApprovalHistory={exportApprovalHistory}
            onExportDryRun={exportMigrationDryRun}
            issues={migrationIssues}
            lastDryRunAt={lastDryRunAt}
            matches={memberMatches}
            onApprove={() => setReviewApproved(true)}
            onApproveItem={approveMockItem}
            onDryRun={runMigrationDryRun}
            summary={migrationSummary}
          />
        ) : activePage === 'Sales' ? (
          <SalesPage
            activities={salesActivities}
            crossAgentGraph={crossAgentGraph}
            crossAgentSummary={crossAgentSummary}
            followUpQueue={salesFollowUpQueue}
            importResult={salesImportResult}
            integration={salesIntegration}
            leads={salesLeads}
            onAction={recordSalesAction}
            onExport={exportSalesReport}
            onExportCrossAgent={exportCrossAgentCollaboration}
            onExportResearchDossier={exportResearchDossier}
            onExportSalesIntelligence={exportSalesIntelligence}
            onExportProposalDraft={exportProposalDraft}
            onGenerateProposalDraft={generateProposalDraft}
            onImportJson={importSalesLeads}
            onSaveProspectIntake={saveProspectIntake}
            proposalDrafts={salesProposalDrafts}
            proposalSummary={salesProposalSummary}
            proposals={salesProposals}
            prospectDossierSummary={salesProspectDossierSummary}
            prospectDossiers={salesResearchDossiers}
            prospectIntakes={salesProspectIntakes}
            prospectResearch={salesProspectResearch}
            scores={salesScores}
            salesIntelligenceGraph={salesIntelligenceGraph}
            salesIntelligenceSummary={salesIntelligenceSummary}
            teamAgents={salesTeamAgents}
            teamSummary={salesAgentTeamSummary}
            scoringSummary={salesScoringSummary}
          />
        ) : activePage === 'Integrations' ? (
          <IntegrationsPage snapshot={status} />
        ) : activePage === 'Settings' ? (
          <SettingsPage
            onClearQueue={clearSyncQueue}
            onRetryFailed={retryFailedSync}
            onSyncNow={syncNow}
            onTestFunction={testAgentMemoryWriteFunction}
            snapshot={status}
            syncStatus={syncStatus}
          />
        ) : activePage === 'Agent Memory' ? (
          <AgentMemoryPage
            approvals={approvalItems}
            auditLogs={auditLogs}
            onClear={clearAgentMemory}
            onExport={exportAgentMemory}
            onSelectRun={setSelectedRunId}
            persistenceStatus={persistenceStatus}
            selectedRunId={selectedRunId}
            syncQueue={syncQueue}
            events={agentEvents}
            notes={agentNotes}
            runs={agentRuns}
            tasks={agentTasks}
          />
        ) : activePage === 'Sync Queue' ? (
          <SyncQueuePage
            onClearQueue={clearSyncQueue}
            onClearStaleRlsFailures={clearStaleRlsFailures}
            onRequeueStaleRlsFailures={requeueStaleRlsFailures}
            onRetryFailed={retryFailedSync}
            onSyncNow={syncNow}
            queue={syncQueue}
            syncStatus={syncStatus}
          />
        ) : activePage === 'Audit Logs' ? (
          <AuditLogsPage logs={auditLogs} onClear={clearAuditLogs} onExport={exportAuditLogs} />
        ) : activePage === 'Workflows' ? (
          <WorkflowsPage
            onClear={clearWorkflowResults}
            onExport={exportWorkflowRuns}
            onRunDryCheck={runWorkflowDryCheck}
            runs={workflowRuns}
            workflows={workflowRegistry}
          />
        ) : activePage === 'Operator' ? (
          <OperatorPage
            onRecordApprovalDecision={recordApprovalDecision}
            onRecordReport={recordOperatorReport}
            onRecordRun={recordOperatorRun}
            onRecordScheduledThreadRun={recordScheduledThreadRun}
            onRecordThreadArchive={recordThreadArchive}
            onRecordThreadIngest={recordThreadIngest}
            onRecordValidation={recordOperatorValidation}
            operator={operatorSnapshot}
            runtime={runtime}
          />
        ) : activePage === 'Runtime' ? (
          <RuntimePage runtime={runtime} syncStatus={syncStatus} />
        ) : (
          <ExecutiveDashboard
            integrationWarnings={status.warnings}
            onNavigate={setActivePage}
            runtime={runtime}
            crossAgentSummary={crossAgentSummary}
            salesIntegration={salesIntegration}
            salesAgentTeamSummary={salesAgentTeamSummary}
            salesIntelligenceSummary={salesIntelligenceSummary}
            salesProspectDossierSummary={salesProspectDossierSummary}
            salesProposalSummary={salesProposalSummary}
            salesScoringSummary={salesScoringSummary}
            salesSummary={salesSummary}
          />
        )}
      </main>
    </div>
  );
}

function EngineeringFallback() {
  return (
    <section className="dashboard-grid">
      <Panel title="Engineering Graph" icon={<Network size={18} />} wide>
        <EmptyState message="Loading Engineering Agent graph tools." />
      </Panel>
    </section>
  );
}

function RuntimePage({ runtime, syncStatus }: { runtime: AgentRuntimeSnapshot; syncStatus: SyncStatusSnapshot }) {
  return (
    <section className="dashboard-grid">
      <Panel title="Runtime Summary" icon={<ListChecks size={18} />} wide>
        <div className="batch-grid">
          <Fact label="Runtime Version" value={runtime.runtimeVersion} />
          <Fact label="Registered Agents" value={String(runtime.agents.length)} />
          <Fact label="Registered Workflows" value={String(runtime.workflows.length)} />
          <Fact label="Approvals" value={String(runtime.approvals.length)} />
          <Fact label="Memory Records" value={String(runtimeMemoryTotal(runtime))} />
          <Fact label="Sync Status" value={syncStatusLabel(syncStatus)} />
        </div>
      </Panel>

      <Panel title="Registered Agents" icon={<CircleDot size={18} />} wide>
        <DataTable
          columns={['Agent', 'Owner', 'Health', 'Score', 'Workflows', 'Pending Tasks', 'Approvals', 'Last Activity']}
          rows={runtime.agents.map((agent) => {
            const health = runtime.health[agent.id];
            return [
              agent.name,
              agent.owner,
              <StatusBadge key={`${agent.id}-health`} value={runtimeAgentStatus(agent.health)} tone={agent.health === 'ready' ? 'good' : 'neutral'} />,
              String(health.healthScore),
              String(health.workflowCount),
              String(health.pendingTasks),
              String(health.approvalCount),
              health.lastActivity,
            ];
          })}
        />
      </Panel>

      <Panel title="Registered Workflows" icon={<Workflow size={18} />} wide>
        <DataTable
          columns={['Workflow', 'Agent', 'Mode', 'Trigger', 'Risk', 'Approval', 'Dry Run']}
          rows={runtime.workflows.map((workflow) => [
            workflow.key,
            workflow.ownerAgent,
            workflow.currentMode,
            workflow.triggerType,
            <RiskBadge key={`${workflow.key}-risk`} risk={workflow.riskLevel} />,
            workflow.approvalRequired ? 'Required' : 'No',
            workflow.safeDryRun ? 'Enabled' : 'Disabled',
          ])}
        />
      </Panel>

      <Panel title="Permissions" icon={<ShieldCheck size={18} />} wide>
        <DataTable
          columns={['Agent', 'Read', 'Write', 'Production Write', 'External Send', 'Approval Required', 'Risk']}
          rows={runtime.agents.map((agent) => {
            const permissions = runtime.permissions[agent.id];
            return [
              agent.name,
              yesNo(permissions.read),
              yesNo(permissions.write),
              yesNo(permissions.productionWrite),
              yesNo(permissions.externalSend),
              yesNo(permissions.approvalRequired),
              <RiskBadge key={`${agent.id}-risk`} risk={permissions.risk} />,
            ];
          })}
        />
      </Panel>

      <Panel title="Runtime Memory" icon={<Database size={18} />}>
        <div className="fact-list">
          <Fact label="Runs" value={String(runtime.memory.runs)} />
          <Fact label="Events" value={String(runtime.memory.events)} />
          <Fact label="Tasks" value={String(runtime.memory.tasks)} />
          <Fact label="Notes" value={String(runtime.memory.notes)} />
          <Fact label="Approvals" value={String(runtime.memory.approvals)} />
          <Fact label="Audit Logs" value={String(runtime.memory.auditLogs)} />
          <Fact label="Workflow Runs" value={String(runtime.memory.workflowRuns)} />
        </div>
      </Panel>

      <Panel title="Runtime Sync" icon={<Database size={18} />}>
        <div className="fact-list">
          <Fact label="Mode" value={runtime.sync.mode} />
          <Fact label="Status" value={runtime.sync.status} />
          <Fact label="Waiting" value={String(runtime.sync.recordsWaiting)} />
          <Fact label="Synced" value={String(runtime.sync.syncedRecords)} />
          <Fact label="Failed" value={String(runtime.sync.failedRecords)} />
          <Fact label="Last Sync" value={runtime.sync.lastSyncAt ? formatDate(runtime.sync.lastSyncAt) : 'Never'} />
        </div>
      </Panel>

      <Panel title="Lifecycle" icon={<ArrowRight size={18} />}>
        <div className="workflow-list">
          {runtime.lifecycle.map((step) => (
            <div className="workflow-item" key={step}>
              <span>{step.replace(/_/g, ' ')}</span>
              <StatusBadge value="Inherited" tone="good" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Runtime Activity" icon={<Activity size={18} />} wide>
        <DataTable
          columns={['Time', 'Agent', 'Type', 'Detail']}
          rows={runtime.activities.slice(0, 12).map((activity) => [
            formatDate(activity.timestamp),
            activity.agent,
            activity.type,
            activity.detail,
          ])}
        />
      </Panel>

      <Panel title="Runtime Approvals" icon={<ShieldCheck size={18} />} wide>
        <DataTable
          columns={['Approval ID', 'Agent', 'Workflow', 'Risk', 'Status', 'Required By', 'Completed']}
          rows={runtime.approvals.map((approval) => [
            approval.approvalId,
            approval.agent,
            approval.workflow,
            <RiskBadge key={`${approval.approvalId}-risk`} risk={approval.risk} />,
            approval.status,
            approval.requiredBy,
            approval.completed ?? 'Open',
          ])}
        />
      </Panel>
    </section>
  );
}

function OperatorPage({
  onRecordApprovalDecision,
  onRecordReport,
  onRecordRun,
  onRecordScheduledThreadRun,
  onRecordThreadArchive,
  onRecordThreadIngest,
  onRecordValidation,
  operator,
  runtime,
}: {
  onRecordApprovalDecision: (_decision: 'approved' | 'rejected') => void;
  onRecordReport(): void;
  onRecordRun(): void;
  onRecordScheduledThreadRun(): void;
  onRecordThreadArchive(): void;
  onRecordThreadIngest(): void;
  onRecordValidation(): void;
  operator: AiOperatorDashboardSnapshot;
  runtime: AgentRuntimeSnapshot;
}) {
  return (
    <>
      <section className="summary-grid" aria-label="Operator summary">
        <Metric icon={<Bot size={20} />} label="Active Operator" value={operator.activeOperator} />
        <Metric icon={<ShieldCheck size={20} />} label="Safety Mode" value={operator.safetyMode} />
        <Metric icon={<Network size={20} />} label="Integration Mode" value={operator.integrationMode} />
        <Metric icon={<ListChecks size={20} />} label="Runtime Health" value={operator.agentRuntimeHealth} />
        <Metric icon={<FileClock size={20} />} label="Due Schedules" value={String(operator.threadBridge.dueSchedules)} />
        <Metric icon={<ShieldCheck size={20} />} label="Pending Approvals" value={String(operator.threadBridge.approvalQueue.pendingCount)} />
      </section>
      <section className="dashboard-grid">
        <Panel title="Operator Identity" icon={<Bot size={18} />} wide>
          <div className="batch-grid supabase-detail-grid">
            <Fact label="Operator Name" value={operator.metadata.operatorName} />
            <Fact label="Operator Tool" value={operator.metadata.operatorTool} />
            <Fact label="Operator Version" value={operator.metadata.operatorVersion} />
            <Fact label="Git Branch" value={operator.metadata.gitBranch} />
            <Fact label="Git Commit" value={operator.metadata.gitCommit} />
            <Fact label="Timestamp" value={formatDate(operator.metadata.timestamp)} />
            <Fact label="Last Run" value={formatDate(operator.lastRun)} />
            <Fact label="Last Report" value={formatOptionalDate(operator.lastReport)} />
            <Fact label="Last Validation" value={formatOptionalDate(operator.lastValidation)} />
          </div>
          <div className="button-row sales-action-row">
            <button className="report-button small" onClick={onRecordRun} type="button">
              Record Local Run
            </button>
            <button className="report-button small" onClick={onRecordReport} type="button">
              Record Local Report
            </button>
            <button className="report-button small" onClick={onRecordValidation} type="button">
              Record Local Validation
            </button>
          </div>
          <p className="subtle-note">These controls update local dashboard metadata only. They do not call external tools or write production data.</p>
        </Panel>

        <Panel title="Shared Command Interface" icon={<Workflow size={18} />} wide>
          <p className="panel-description">
            Codex, Claude, and future supported assistants use the same tool-agnostic command surface from the repo root.
          </p>
          <DataTable
            columns={['Command', 'Purpose']}
            rows={operator.commands.map((command) => [
              <code key={command}>{command}</code>,
              operatorCommandPurpose(command),
            ])}
          />
        </Panel>

        <Panel title="Thread Outbox Bridge" icon={<FileClock size={18} />} wide>
          <p className="panel-description">
            Named Codex agent thread outputs land in the local shared outbox. Vyra agents ingest and summarize them through the same local operator surface.
          </p>
          <div className="batch-grid supabase-detail-grid">
            <Fact label="Pending Thread Outputs" value={String(operator.threadBridge.pendingThreadOutputs)} />
            <Fact label="Due Schedules" value={String(operator.threadBridge.dueSchedules)} />
            <Fact label="Last Scheduled Run" value={formatOptionalDate(operator.threadBridge.lastScheduledRun)} />
            <Fact label="Latest Ingested Thread" value={formatOptionalDate(operator.threadBridge.latestIngestedThread)} />
            <Fact label="Outbox Path" value={operator.threadBridge.outboxPath} />
            <Fact label="Inbox Path" value={operator.threadBridge.inboxPath} />
            <Fact label="Schedule Path" value={operator.threadBridge.schedulePath} />
            <Fact label="Archive Status" value={formatOptionalDate(operator.threadBridge.archiveStatus)} />
            <Fact label="Named Agent Sources" value={operator.threadBridge.namedAgentSources.join(', ')} />
          </div>
          <div className="button-row sales-action-row">
            <button className="report-button small" onClick={onRecordScheduledThreadRun} type="button">
              Record Manual Due Run
            </button>
            <button className="report-button small" onClick={onRecordThreadIngest} type="button">
              Record Local Thread Ingest
            </button>
            <button className="report-button small" onClick={onRecordThreadArchive} type="button">
              Record Local Archive
            </button>
          </div>
          <div className="activity-list">
            {operator.threadBridge.recommendedNextActions.map((action) => (
              <p key={action}>{action}</p>
            ))}
          </div>
        </Panel>

        <Panel title="Approval Queue" icon={<ShieldCheck size={18} />} wide>
          <p className="panel-description">
            Approval records are local decisions only. Approving an item never sends the email, SMS, CRM write, Stripe invoice, or Supabase write it describes.
          </p>
          <div className="batch-grid supabase-detail-grid">
            <Fact label="Pending Approvals" value={String(operator.threadBridge.approvalQueue.pendingCount)} />
            <Fact label="Approved Local Decisions" value={String(operator.threadBridge.approvalQueue.approvedCount)} />
            <Fact label="Rejected Local Decisions" value={String(operator.threadBridge.approvalQueue.rejectedCount)} />
            <Fact label="Pending By Type" value={formatPendingApprovalTypes(operator.threadBridge.approvalQueue.pendingByType)} />
          </div>
          <div className="button-row sales-action-row">
            <button className="report-button small" onClick={() => onRecordApprovalDecision('approved')} type="button">
              Record Local Approval
            </button>
            <button className="secondary-button small" onClick={() => onRecordApprovalDecision('rejected')} type="button">
              Record Local Rejection
            </button>
          </div>
          <DataTable
            columns={['Approval Type', 'Pending']}
            rows={Object.entries(operator.threadBridge.approvalQueue.pendingByType).map(([type, count]) => [type.replace(/_/g, ' '), String(count)])}
            emptyMessage="No pending local approval items recorded in dashboard metadata."
          />
        </Panel>

        <Panel title="Safety Controls" icon={<ShieldCheck size={18} />} wide>
          <div className="safety-badge-row">
            {operator.blockedExternalActions.map((action) => (
              <StatusBadge key={action} value={action} tone="good" />
            ))}
          </div>
          <p className="panel-description">
            Future external actions remain placeholders behind explicit approval gates. Operator reports must not include secrets or production write payloads.
          </p>
        </Panel>

        <Panel title="Agent Runtime Health" icon={<ListChecks size={18} />} wide>
          <DataTable
            columns={['Agent', 'Owner', 'Health', 'Warnings', 'Errors', 'Workflows', 'Production Write', 'External Send']}
            rows={runtime.agents.map((agent) => {
              const health = runtime.health[agent.id];
              const permissions = runtime.permissions[agent.id];
              return [
                agent.name,
                agent.owner,
                <StatusBadge key={`${agent.id}-operator-health`} value={runtimeAgentStatus(agent.health)} tone={agent.health === 'ready' ? 'good' : 'neutral'} />,
                String(health?.warnings ?? 0),
                String(health?.errors ?? 0),
                String(health?.workflowCount ?? agent.workflows.length),
                yesNo(permissions.productionWrite),
                yesNo(permissions.externalSend),
              ];
            })}
          />
        </Panel>
      </section>
    </>
  );
}

function IntegrationsPage({ snapshot }: { snapshot: IntegrationSnapshot }) {
  const registry = buildIntegrationRegistry(snapshot.github, snapshot.supabase);
  return (
    <>
      <section className="summary-grid" aria-label="Integration summary">
        <Metric icon={<Network size={20} />} label="Integration Mode" value={modeLabel(snapshot.effectiveMode)} />
        <Metric icon={<GitBranch size={20} />} label="GitHub Repos" value={String(snapshot.github.repositories.length)} />
        <Metric icon={<Network size={20} />} label="Reachable Tables" value={String(countTables(snapshot.supabase.tableChecks, 'reachable'))} />
        <Metric icon={<AlertTriangle size={20} />} label="Warnings" value={String(snapshot.warnings.length)} />
      </section>
      <section className="dashboard-grid">
        <Panel title="Integration Registry" icon={<Network size={18} />} wide>
          <div className="integration-card-grid">
            {registry.map((integration) => (
              <article className="integration-card" key={integration.name}>
                <div>
                  <strong>{integration.name}</strong>
                  <span>{integration.category}</span>
                </div>
                <StatusBadge value={formatHealth(integration.healthStatus)} tone={healthTone(integration.healthStatus)} />
                <p>{integration.detail}</p>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="GitHub Live Status" icon={<GitBranch size={18} />} wide>
          <DataTable
            columns={['Repository', 'Owner', 'Branch', 'Latest Commit', 'Message', 'Open PRs', 'Issues', 'Workflow', 'Last Checked', 'Health']}
            rows={snapshot.github.repositories.map((repo) => [
              repo.repositoryName,
              repo.repositoryOwner || 'Unknown',
              repo.defaultBranch,
              shortSha(repo.latestCommit),
              repo.latestCommitMessage,
              String(repo.openPullRequests),
              String(repo.issueCount),
              repo.workflowStatus,
              formatDate(repo.lastUpdated),
              <StatusBadge key={repo.repositoryFullName || repo.repositoryName} value={formatHealth(repo.healthStatus)} tone={healthTone(repo.healthStatus)} />,
            ])}
          />
        </Panel>
        <Panel title="Supabase Live Status" icon={<Network size={18} />} wide>
          <div className="batch-grid supabase-detail-grid">
            <Fact label="Project" value={snapshot.supabase.projectName} />
            <Fact label="Environment" value={snapshot.supabase.environment} />
            <Fact label="Database" value={snapshot.supabase.databaseReachable ? 'Reachable' : 'Not checked'} />
            <Fact label="Protected Tables" value={String(countTables(snapshot.supabase.tableChecks, 'protected'))} />
            <Fact label="Missing Tables" value={String(countTables(snapshot.supabase.tableChecks, 'missing'))} />
            <Fact label="Auth" value={formatHealth(snapshot.supabase.authStatus)} />
            <Fact label="Storage" value={formatHealth(snapshot.supabase.storageStatus)} />
            <Fact label="Edge Functions" value={formatHealth(snapshot.supabase.edgeFunctionsStatus)} />
            <Fact label="Agent Status Rows" value={String(snapshot.supabase.latestAgentStatusRows)} />
            <Fact label="Workflow Rows" value={String(snapshot.supabase.latestWorkflowRows)} />
          </div>
        </Panel>
      </section>
    </>
  );
}

function SettingsPage({
  onClearQueue,
  onRetryFailed,
  onSyncNow,
  onTestFunction,
  snapshot,
  syncStatus,
}: {
  onClearQueue(): void;
  onRetryFailed(): void;
  onSyncNow(): void;
  onTestFunction(): void;
  snapshot: IntegrationSnapshot;
  syncStatus: SyncStatusSnapshot;
}) {
  const envItems = envChecklist();
  const githubTokenStatus = gitHubTokenConfigurationStatus();
  const supabaseEnv = getSupabaseEnvStatus();
  const functionConfig = getAgentMemoryFunctionConfig();
  return (
    <section className="dashboard-grid">
      <Panel title="Integration Configuration" icon={<Settings size={18} />} wide>
        <div className="batch-grid supabase-detail-grid">
          <Fact label="Current Mode" value={modeLabel(snapshot.effectiveMode)} />
          <Fact label="Requested Mode" value={modeLabel(snapshot.requestedMode)} />
          <Fact label="Default GitHub Token" value={githubTokenStatus.defaultToken} />
          <Fact label="Vyra-Part-1 GitHub Token" value={githubTokenStatus.vyraPart1Token} />
          <Fact label="GitHub Issue Creation" value={import.meta.env.VITE_GITHUB_ISSUE_CREATION_ENABLED === 'true' ? 'Enabled' : 'Disabled'} />
          <Fact label="GitHub Issue Dry Run" value={import.meta.env.VITE_GITHUB_ISSUE_CREATION_DRY_RUN === 'false' ? 'Disabled' : 'Enabled'} />
          <Fact label="GitHub Owner" value={import.meta.env.VITE_GITHUB_OWNER || 'Missing'} />
          <Fact label="Supabase URL" value={supabaseEnv.url} />
          <Fact label="Supabase Anon/Publishable Key" value={supabaseEnv.key} />
        </div>
      </Panel>
      <Panel title="Agent Memory Sync" icon={<Database size={18} />} wide>
        <div className="split-panel">
          <div className="batch-grid supabase-detail-grid">
            <Fact label="Supabase Connected" value={syncStatus.connected ? 'Yes' : 'No'} />
            <Fact label="Local Storage Enabled" value={syncStatus.localStorageEnabled ? 'Yes' : 'No'} />
            <Fact label="Sync Enabled" value={syncStatus.syncEnabled ? 'Yes' : 'No'} />
            <Fact label="Write Mode" value={formatSyncWriteMode(syncStatus.writeMode)} />
            <Fact label="Edge Function" value={functionConfig.functionName} />
            <Fact label="Function Config" value={formatHealth(functionConfig.mode)} />
            <Fact label="Records Waiting" value={String(syncStatus.recordsWaiting)} />
            <Fact label="Failed Records" value={String(syncStatus.failedRecords)} />
            <Fact label="Last Sync" value={syncStatus.lastSyncAt ? formatDate(syncStatus.lastSyncAt) : 'Never'} />
          </div>
          <div className="button-row end-row">
            <button className="report-button" onClick={onSyncNow} type="button">
              <RefreshCcw size={15} />
              <span>Sync Now</span>
            </button>
            <button className="report-button" disabled={!syncStatus.failedRecords} onClick={onRetryFailed} type="button">
              <RefreshCcw size={15} />
              <span>Retry Failed</span>
            </button>
            <button className="clear-button" disabled={!syncStatus.recordsWaiting && !syncStatus.failedRecords} onClick={onClearQueue} type="button">
              <Trash2 size={15} />
              <span>Clear Queue</span>
            </button>
            <button className="report-button" disabled={syncStatus.writeMode !== 'edge_function'} onClick={onTestFunction} type="button">
              <Database size={15} />
              <span>Test Agent Memory Write Function</span>
            </button>
          </div>
        </div>
      </Panel>
      <Panel title="Environment Checklist" icon={<ListChecks size={18} />} wide>
        <DataTable
          columns={['Variable', 'Status']}
          rows={Object.entries(envItems).map(([key, value]) => [
            key,
            <StatusBadge key={key} value={value} tone={value === 'configured' ? 'good' : 'warn'} />,
          ])}
        />
      </Panel>
      <Panel title="Setup Instructions" icon={<FileClock size={18} />}>
        <div className="activity-list">
          <p>Copy `dashboard/.env.example` to `dashboard/.env`.</p>
          <p>Copied Vyra-Part-1 files may use EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p>
          <p>Add the default GitHub token for Robert-owned repos, and add the Vyra-Part-1 token only when Matthew-owned repo access needs its own credential.</p>
          <p>GitHub issue creation stays disabled and dry-run by default until explicitly configured.</p>
          <p>Add only Supabase URL and anon/publishable keys; service role keys are never used in browser code.</p>
          <p>Enable Edge Function writes with VITE_AGENT_MEMORY_WRITE_ENABLED and a local write token.</p>
          <p>Run `npm run dev` from `dashboard/`.</p>
        </div>
      </Panel>
      <Panel title="Safety Reminders" icon={<ShieldCheck size={18} />}>
        <div className="rule-list">
          <p>Frontend uses anon or publishable keys only.</p>
          <p>Service role keys are forbidden in browser code.</p>
          <p>Direct browser inserts remain blocked by RLS.</p>
          <p>The Edge Function is the approved server-side write path for agent memory.</p>
          <p>GitHub issue creation requires a ready draft, explicit approval, enabled creation, dry-run disabled, a repo-resolved token, and duplicate protection.</p>
          <p>Production business data remains out of scope.</p>
        </div>
      </Panel>
    </section>
  );
}

function AgentMemoryPage({
  approvals,
  auditLogs,
  events,
  notes,
  onClear,
  onExport,
  onSelectRun,
  persistenceStatus,
  runs,
  selectedRunId,
  syncQueue,
  tasks,
}: {
  approvals: ApprovalItem[];
  auditLogs: AuditLogEntry[];
  events: AgentEvent[];
  notes: ReturnType<typeof createInitialAgentNotes>;
  onClear(): void;
  onExport(_format: ReportFormat): void;
  onSelectRun(_id: string): void;
  persistenceStatus: LocalPersistenceStatus;
  runs: AgentRun[];
  selectedRunId: string | null;
  syncQueue: SyncQueueItem[];
  tasks: ReturnType<typeof createInitialAgentTasks>;
}) {
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null;
  const relatedEvents = selectedRun ? events.filter((event) => event.agent === selectedRun.agent) : [];
  const relatedAuditLogs = selectedRun ? auditLogs.filter((log) => log.agent === selectedRun.agent) : [];
  return (
    <section className="dashboard-grid">
      <Panel title="Agent Memory Boundary" icon={<ShieldCheck size={18} />} wide>
        <div className="split-panel">
          <p className="panel-copy">
            Phase 7 syncs operational memory to approved Supabase agent tables when available, with localStorage as the
            offline fallback.
          </p>
          <div className="button-row">
            <StatusBadge value={`Persistence ${persistenceStatus}`} tone={persistenceStatus === 'available' ? 'good' : 'warn'} />
            <ExportButtons disabled={runs.length + events.length + tasks.length === 0} onExport={onExport} />
            <button className="clear-button" onClick={onClear} type="button">
              <Trash2 size={15} />
              <span>Clear Memory</span>
            </button>
          </div>
        </div>
      </Panel>
      <Panel title="Agent Runs" icon={<Activity size={18} />} wide>
        {runs.length === 0 ? (
          <EmptyState message="No local agent runs yet." />
        ) : (
          <DataTable
            columns={['Agent', 'Workflow', 'Status', 'Sync', 'Started', 'Completed', 'Production Writes', 'Detail']}
            rows={runs.map((run) => [
              run.agent,
              run.workflow,
              <StatusBadge key={run.id} value={run.status} tone="good" />,
              syncRecordBadge(syncQueue, 'agent_run', run.id),
              formatDate(run.startedAt),
              formatDate(run.completedAt),
              'No',
              <button className="inline-action" key={`${run.id}-detail`} onClick={() => onSelectRun(run.id)} type="button">
                View Details
              </button>,
            ])}
          />
        )}
      </Panel>
      <Panel title="Agent Run Detail" icon={<ListChecks size={18} />} wide>
        {selectedRun ? (
          <div className="detail-panel">
            <div className="fact-list">
              <Fact label="Agent" value={selectedRun.agent} />
              <Fact label="Workflow" value={selectedRun.workflow} />
              <Fact label="Status" value={selectedRun.status} />
              <Fact label="Started" value={formatDate(selectedRun.startedAt)} />
              <Fact label="Completed" value={formatDate(selectedRun.completedAt)} />
              <Fact label="Duration" value={durationLabel(selectedRun.startedAt, selectedRun.completedAt)} />
              <Fact label="Production Writes" value="No" />
              <Fact label="Related Audit Logs" value={String(relatedAuditLogs.length)} />
            </div>
            <p className="detail-summary">{migrationSummaryLabel(selectedRun.summary)}</p>
            <div className="history-list compact-history">
              {relatedEvents.slice(0, 4).map((event) => (
                <div className="history-item" key={event.id}>
                  <div>
                    <strong>{event.event}</strong>
                    <span>{event.detail}</span>
                  </div>
                  <small>{formatDate(event.timestamp)}</small>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="Select or run an agent action to see detail." />
        )}
      </Panel>
      <Panel title="Agent Events" icon={<FileClock size={18} />}>
        <DataTable
          columns={['Timestamp', 'Agent', 'Event', 'Sync', 'Detail']}
          rows={events.map((event) => [
            formatDate(event.timestamp),
            event.agent,
            event.event,
            syncRecordBadge(syncQueue, 'agent_event', event.id),
            event.detail,
          ])}
        />
      </Panel>
      <Panel title="Agent Tasks" icon={<ListChecks size={18} />}>
        <DataTable
          columns={['Task', 'Agent', 'Priority', 'Status', 'Sync']}
          rows={tasks.map((task) => [
            task.title,
            task.agent,
            <RiskBadge key={`${task.id}-risk`} risk={task.priority} />,
            task.status,
            syncRecordBadge(syncQueue, 'agent_task', task.id),
          ])}
        />
      </Panel>
      <Panel title="Agent Approvals" icon={<ShieldCheck size={18} />}>
        <DataTable
          columns={['Approval', 'Status', 'Risk', 'Sync']}
          rows={approvals.map((approval) => [
            approval.title,
            approval.status,
            <RiskBadge key={`${approval.id}-risk`} risk={approval.riskLevel} />,
            syncRecordBadge(syncQueue, 'approval_queue_item', approval.id),
          ])}
        />
      </Panel>
      <Panel title="Agent Notes" icon={<FileClock size={18} />}>
        <div className="activity-list">
          {notes.map((note) => (
            <p key={note.id}>{`${note.agent}: ${note.note}`}</p>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function AuditLogsPage({
  logs,
  onClear,
  onExport,
}: {
  logs: AuditLogEntry[];
  onClear(): void;
  onExport(_format: ReportFormat): void;
}) {
  const [riskFilter, setRiskFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const agentsForFilter = Array.from(new Set(logs.map((log) => log.agent))).sort();
  const resultsForFilter = Array.from(new Set(logs.map((log) => log.result))).sort();
  const filteredLogs = logs.filter(
    (log) =>
      (riskFilter === 'all' || log.riskLevel === riskFilter) &&
      (agentFilter === 'all' || log.agent === agentFilter) &&
      (resultFilter === 'all' || log.result === resultFilter),
  );
  return (
    <section className="dashboard-grid">
      <Panel title="Audit Logs" icon={<FileClock size={18} />} wide>
        <div className="toolbar-row">
          <div className="filter-row">
            <select aria-label="Filter by risk" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
              <option value="all">All risk</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select aria-label="Filter by agent" value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
              <option value="all">All agents</option>
              {agentsForFilter.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            <select aria-label="Filter by result" value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}>
              <option value="all">All results</option>
              {resultsForFilter.map((result) => (
                <option key={result} value={result}>
                  {result}
                </option>
              ))}
            </select>
          </div>
          <div className="button-row">
            <ExportButtons disabled={!logs.length} onExport={onExport} />
            <button className="clear-button" disabled={!logs.length} onClick={onClear} type="button">
              <Trash2 size={15} />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>
        <DataTable
          columns={['Timestamp', 'Actor', 'Agent', 'Action', 'Target', 'Result', 'Risk', 'Approval']}
          rows={filteredLogs.map((log) => [
            formatDate(log.timestamp),
            log.actor,
            log.agent,
            log.action,
            log.target,
            log.result,
            <RiskBadge key={log.id} risk={log.riskLevel} />,
            log.approvalRequired ? 'Approval Required' : 'No',
          ])}
        />
      </Panel>
    </section>
  );
}

function WorkflowsPage({
  onClear,
  onExport,
  onRunDryCheck,
  runs,
  workflows: registry,
}: {
  onClear(): void;
  onExport(_format: ReportFormat): void;
  onRunDryCheck(_workflow: WorkflowDefinition): void;
  runs: WorkflowDryCheckRecord[];
  workflows: WorkflowDefinition[];
}) {
  const latestByWorkflow = runs.reduce<Record<string, WorkflowDryCheckRecord>>((accumulator, run) => {
    if (!accumulator[run.workflowKey] || run.createdAt > accumulator[run.workflowKey].createdAt) {
      accumulator[run.workflowKey] = run;
    }
    return accumulator;
  }, {});
  return (
    <section className="dashboard-grid">
      <Panel title="Workflow Run Reports" icon={<Download size={18} />} wide>
        <div className="split-panel">
          <p className="panel-copy">
            Workflow dry checks are stored in browser localStorage only. They do not run production jobs, deploy code, or
            write to external systems.
          </p>
          <div className="button-row">
            <ExportButtons disabled={!runs.length} onExport={onExport} />
            <button className="clear-button" disabled={!runs.length} onClick={onClear} type="button">
              <Trash2 size={15} />
              <span>Clear Results</span>
            </button>
          </div>
        </div>
      </Panel>
      {registry.map((workflow) => (
        <Panel key={workflow.key} title={workflow.key} icon={<Workflow size={18} />}>
          <div className="fact-list">
            <Fact label="Trigger" value={workflow.triggerType} />
            <Fact label="Owner" value={workflow.ownerAgent} />
            <Fact label="Mode" value={workflow.currentMode} />
            <Fact
              label="Last Dry Check"
              value={latestByWorkflow[workflow.key] ? formatDate(latestByWorkflow[workflow.key].createdAt) : workflow.lastRun}
            />
            <Fact label="Next Status" value={workflow.nextStatus} />
            <Fact label="Approval" value={workflow.approvalRequired ? 'Yes' : 'No'} />
          </div>
          {latestByWorkflow[workflow.key] ? (
            <p className="detail-summary">
              Latest result: {latestByWorkflow[workflow.key].result}. Production writes:{' '}
              {latestByWorkflow[workflow.key].productionWritesOccurred}.
            </p>
          ) : null}
          <div className="workflow-actions">
            <RiskBadge risk={workflow.riskLevel} />
            <button
              className="approval-button compact-button"
              disabled={!workflow.safeDryRun}
              onClick={() => onRunDryCheck(workflow)}
              type="button"
            >
              {workflow.safeDryRun ? 'Run Dry Check' : 'Approval Required'}
            </button>
          </div>
        </Panel>
      ))}
    </section>
  );
}

function ExportButtons({
  disabled = false,
  onExport,
}: {
  disabled?: boolean;
  onExport(_format: ReportFormat): void;
}) {
  return (
    <div className="button-row compact-row">
      <button className="report-button" disabled={disabled} onClick={() => onExport('json')} type="button">
        <Download size={15} />
        <span>JSON</span>
      </button>
      <button className="report-button" disabled={disabled} onClick={() => onExport('markdown')} type="button">
        <Download size={15} />
        <span>Markdown</span>
      </button>
    </div>
  );
}

function SyncStatusCard({ syncStatus }: { syncStatus: SyncStatusSnapshot }) {
  return (
    <section className="sync-status-card" aria-label="Supabase agent memory sync status">
      <div>
        <Database size={18} />
        <strong>Agent Memory Sync</strong>
      </div>
      <StatusBadge value={syncStatusLabel(syncStatus)} tone={syncStatusTone(syncStatus)} />
      <span>Mode: {formatSyncWriteMode(syncStatus.writeMode)}</span>
      <span>Last Sync: {syncStatus.lastSyncAt ? formatDate(syncStatus.lastSyncAt) : 'Never'}</span>
      <span>Waiting: {syncStatus.recordsWaiting}</span>
      <span>Errors: {syncStatus.failedRecords}</span>
      <span>Legacy: {syncStatus.legacyFailedRecords}</span>
    </section>
  );
}

function SyncQueuePage({
  onClearQueue,
  onClearStaleRlsFailures,
  onRequeueStaleRlsFailures,
  onRetryFailed,
  onSyncNow,
  queue,
  syncStatus,
}: {
  onClearQueue(): void;
  onClearStaleRlsFailures(): void;
  onRequeueStaleRlsFailures(): void;
  onRetryFailed(): void;
  onSyncNow(): void;
  queue: SyncQueueItem[];
  syncStatus: SyncStatusSnapshot;
}) {
  const activeQueue = queue.filter((item) => item.status !== 'synced');
  const legacyFailures = queue.filter(isLegacyRlsFailure);

  return (
    <section className="dashboard-grid">
      <Panel title="Sync Queue Controls" icon={<Database size={18} />} wide>
        <div className="split-panel">
          <div className="batch-grid supabase-detail-grid">
            <Fact label="Connection" value={syncStatus.connectionState} />
            <Fact label="Write Mode" value={formatSyncWriteMode(syncStatus.writeMode)} />
            <Fact label="Sync Pending" value={String(syncStatus.recordsWaiting)} />
            <Fact label="Synced Records" value={String(syncStatus.syncedRecords)} />
            <Fact label="Failed Records" value={String(syncStatus.failedRecords)} />
            <Fact label="Legacy RLS Failures" value={String(syncStatus.legacyFailedRecords)} />
            <Fact label="Local Storage" value={syncStatus.localStorageEnabled ? 'Enabled' : 'Unavailable'} />
            <Fact label="Last Sync" value={syncStatus.lastSyncAt ? formatDate(syncStatus.lastSyncAt) : 'Never'} />
          </div>
          <div className="button-row end-row">
            <button className="report-button" onClick={onSyncNow} type="button">
              <RefreshCcw size={15} />
              <span>Sync Now</span>
            </button>
            <button className="report-button" disabled={!syncStatus.failedRecords} onClick={onRetryFailed} type="button">
              <RefreshCcw size={15} />
              <span>Retry Failed</span>
            </button>
            <button className="clear-button" disabled={!activeQueue.length} onClick={onClearQueue} type="button">
              <Trash2 size={15} />
              <span>Clear Queue</span>
            </button>
          </div>
        </div>
      </Panel>
      <Panel title="Legacy Failed Records" icon={<ShieldCheck size={18} />} wide>
        <div className="split-panel">
          <div>
            <p className="panel-copy">
              These records failed before secure Edge Function sync was active. They were blocked by RLS, which is the
              correct safe behavior. Cleanup only changes the local queue; it does not delete Supabase records or modify
              production data.
            </p>
            {syncStatus.writeMode !== 'edge_function' ? (
              <p className="wizard-error">Edge Function write mode is not configured. Requeue is disabled until the approved write path is active.</p>
            ) : null}
          </div>
          <div className="button-row end-row">
            <button className="clear-button" disabled={!legacyFailures.length} onClick={onClearStaleRlsFailures} type="button">
              <Trash2 size={15} />
              <span>Clear Stale RLS Failures</span>
            </button>
            <button
              className="report-button"
              disabled={!legacyFailures.length || syncStatus.writeMode !== 'edge_function'}
              onClick={onRequeueStaleRlsFailures}
              type="button"
            >
              <RefreshCcw size={15} />
              <span>Requeue Valid Records Through Edge Function</span>
            </button>
          </div>
        </div>
        {legacyFailures.length === 0 ? (
          <EmptyState message="No legacy direct-insert RLS failures in the local queue." />
        ) : (
          <DataTable
            columns={['Legacy Status', 'Table', 'Source', 'Queued', 'Attempts', 'Error']}
            rows={legacyFailures.map((item) => [
              <StatusBadge key={`${item.id}-legacy`} value="Legacy direct-insert failure" tone="neutral" />,
              item.table,
              item.sourceType,
              formatDate(item.queuedAt),
              String(item.retryCount),
              item.error ?? '',
            ])}
          />
        )}
      </Panel>
      <Panel title="Queued Agent Memory Records" icon={<FileClock size={18} />} wide>
        {activeQueue.length === 0 ? (
          <EmptyState message="No queued sync records." />
        ) : (
          <DataTable
            columns={['Status', 'Table', 'Source', 'Queued', 'Attempts', 'Last Attempt', 'Error']}
            rows={activeQueue.map((item) => [
              syncRecordBadge(queue, item),
              item.table,
              item.sourceType,
              formatDate(item.queuedAt),
              String(item.retryCount),
              item.lastAttemptAt ? formatDate(item.lastAttemptAt) : 'Never',
              item.error ?? '',
            ])}
          />
        )}
      </Panel>
      <Panel title="Sync Errors" icon={<AlertTriangle size={18} />} wide>
        {syncStatus.syncErrors.length === 0 ? (
          <EmptyState message="No sync errors recorded." />
        ) : (
          <div className="activity-list">
            {syncStatus.syncErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}

function WarningsPanel({ warnings }: { warnings: string[] }) {
  const visibleWarnings = warnings.slice(0, 3);
  const remainingCount = warnings.length - visibleWarnings.length;
  return (
    <section className="warnings-panel" aria-label="Integration warnings">
      <div>
        <AlertTriangle size={18} />
        <strong>Warnings</strong>
      </div>
      {visibleWarnings.map((warning) => (
        <p key={warning}>{formatWarningMessage(warning)}</p>
      ))}
      {remainingCount > 0 ? <small>{remainingCount} more warning{remainingCount === 1 ? '' : 's'} hidden for readability.</small> : null}
    </section>
  );
}

function formatWarningMessage(warning: string): string {
  const githubMatch = warning.match(/^([^:]+\/[^:]+): GitHub GET .* failed with (\d+)$/);
  if (githubMatch) return `${githubMatch[1]}: GitHub read failed (${githubMatch[2]})`;
  const repoMatch = warning.match(/^([^:]+): GitHub GET .* failed with (\d+)$/);
  if (repoMatch) return `${repoMatch[1]}: GitHub read failed (${repoMatch[2]})`;
  return warning;
}

function formatPendingApprovalTypes(pendingByType: Record<string, number>): string {
  const entries = Object.entries(pendingByType);
  if (entries.length === 0) return 'None';
  return entries.map(([type, count]) => `${type.replace(/_/g, ' ')}: ${count}`).join(', ');
}

function DataTable({ columns, emptyMessage, rows }: { columns: string[]; emptyMessage?: string; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyMessage ?? 'No records to display.'}</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="metric-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
  wide = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={wide ? 'panel wide-panel' : 'panel'}>
      <div className="panel-header">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function buildLoadingSnapshot(): IntegrationSnapshot {
  const supabase: SupabaseProjectStatus = {
    projectName: import.meta.env.VITE_SUPABASE_PROJECT_NAME || 'Vyra Production',
    environment: import.meta.env.VITE_SUPABASE_ENVIRONMENT || 'production',
    migrationCount: 17,
    latestMigration: '20260629000200_gym_migration_foundation.sql',
    databaseStatus: 'prepared',
    databaseReachable: false,
    authStatus: 'prepared',
    storageStatus: 'prepared',
    edgeFunctionsStatus: 'prepared',
    lastChecked: 'Loading',
    healthStatus: 'prepared',
    tableChecks: [],
    latestAgentStatusRows: 0,
    latestWorkflowRows: 0,
    warnings: [],
    usedFallback: requestedMode === 'mock',
  };

  return {
    requestedMode,
    effectiveMode: requestedMode,
    github: {
      repositories: [],
      warnings: [],
      usedFallback: requestedMode === 'mock',
      lastChecked: 'Loading',
    },
    supabase,
    warnings: [],
    lastChecked: 'Loading',
  };
}

function envChecklist(): Record<string, 'configured' | 'missing' | 'invalid/unknown'> {
  return {
    VITE_VYRA_INTEGRATION_MODE: import.meta.env.VITE_VYRA_INTEGRATION_MODE ? 'configured' : 'missing',
    VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN ? 'configured' : 'missing',
    VITE_GITHUB_TOKEN_VYRA_PART_1: import.meta.env.VITE_GITHUB_TOKEN_VYRA_PART_1 ? 'configured' : 'missing',
    VITE_GITHUB_OWNER: import.meta.env.VITE_GITHUB_OWNER ? 'configured' : 'missing',
    VITE_GITHUB_REPOS: import.meta.env.VITE_GITHUB_REPOS ? 'configured' : 'missing',
    VITE_GITHUB_ISSUE_CREATION_ENABLED: import.meta.env.VITE_GITHUB_ISSUE_CREATION_ENABLED ? 'configured' : 'missing',
    VITE_GITHUB_ISSUE_CREATION_DRY_RUN: import.meta.env.VITE_GITHUB_ISSUE_CREATION_DRY_RUN ? 'configured' : 'missing',
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'configured' : 'missing',
    EXPO_PUBLIC_SUPABASE_URL: import.meta.env.EXPO_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: import.meta.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'configured' : 'missing',
    VITE_SUPABASE_PROJECT_NAME: import.meta.env.VITE_SUPABASE_PROJECT_NAME ? 'configured' : 'missing',
    VITE_SUPABASE_ENVIRONMENT: import.meta.env.VITE_SUPABASE_ENVIRONMENT ? 'configured' : 'missing',
    VITE_AGENT_MEMORY_WRITE_ENABLED: import.meta.env.VITE_AGENT_MEMORY_WRITE_ENABLED ? 'configured' : 'missing',
    VITE_AGENT_MEMORY_WRITE_FUNCTION: import.meta.env.VITE_AGENT_MEMORY_WRITE_FUNCTION ? 'configured' : 'missing',
    VITE_AGENT_MEMORY_WRITE_TOKEN: import.meta.env.VITE_AGENT_MEMORY_WRITE_TOKEN ? 'configured' : 'missing',
  };
}

function pageCopy(page: string): string {
  const copy: Record<string, string> = {
    Migration: 'Migration dry-runs, staging review, member matching, table readiness, and mock approvals.',
    Sales: 'Local lead queue, prospect tracking, follow-up planning, and proposal prep without emails, Stripe, or CRM writes.',
    Engineering: 'Read-only repository knowledge graph for files, routes, components, Supabase assets, dependencies, and docs.',
    Integrations: 'Read-only integration health with safe mock fallback and no production writes.',
    Runtime: 'Shared Agent OS for registry, lifecycle, permissions, health, workflows, memory, approvals, and sync.',
    Settings: 'Integration mode, Edge Function write path, env setup guidance, and safety reminders without exposing secrets.',
    'Agent Memory': 'Local/mock runs, events, tasks, approvals, and notes before Supabase writes are enabled.',
    'Sync Queue': 'Safe Supabase agent-memory synchronization with localStorage fallback and retry controls.',
    'Audit Logs': 'Local/mock action history for agent activity, approvals, warnings, and dry checks.',
    Workflows: 'Workflow registry with safe local dry checks and approval-risk visibility.',
  };
  return copy[page] ?? 'Read-only command center for the Vyra ecosystem. No AI or production write workflows are enabled.';
}

function applySalesActionToLead(lead: SalesLead, action: SalesAction, timestamp: string): SalesLead {
  if (action === 'follow_up_planned') {
    return {
      ...lead,
      nextAction: 'Follow-up planned locally',
      nextFollowUpDate: nextDayIso(),
      status: 'active',
      updatedAt: timestamp,
    };
  }
  if (action === 'contacted') {
    return {
      ...lead,
      nextAction: 'Capture response and decide next pipeline step',
      pipelineStage: lead.pipelineStage === 'new' ? 'contacted' : lead.pipelineStage,
      status: 'active',
      updatedAt: timestamp,
    };
  }
  if (action === 'proposal_needed') {
    return {
      ...lead,
      nextAction: 'Prepare quote/proposal draft locally',
      pipelineStage: 'proposal_needed',
      status: 'active',
      updatedAt: timestamp,
    };
  }
  return {
    ...lead,
    nextAction: 'Paused locally; no follow-up will be sent',
    pipelineStage: 'paused',
    status: 'paused',
    updatedAt: timestamp,
  };
}

function updateSalesProposals(proposals: ProposalPrep[], lead: SalesLead, action: SalesAction): ProposalPrep[] {
  if (action !== 'proposal_needed') {
    return proposals;
  }
  if (proposals.some((proposal) => proposal.leadId === lead.id)) {
    return proposals.map((proposal) => (proposal.leadId === lead.id ? { ...proposal, status: 'needed' } : proposal));
  }
  return [
    {
      leadId: lead.id,
      recommendedProduct: lead.likelyProductFit ?? (lead.leadType === 'coach' ? 'Coach starter plan' : 'Gym dashboard'),
      pricingTier: lead.leadType === 'coach' ? 'Coach Pro' : 'Growth Gym',
      setupFee: lead.leadType === 'coach' ? 250 : 1000,
      monthlyFee: lead.leadType === 'coach' ? 300 : 900,
      migrationFee: lead.leadType === 'gym' ? 750 : 0,
      migrationNeeded: lead.leadType === 'gym',
      notes: 'Local proposal prep only. No Stripe invoice or external send.',
      status: 'needed',
    },
    ...proposals,
  ];
}

function salesWorkflowForAction(action: SalesAction): string {
  if (action === 'follow_up_planned' || action === 'contacted') return 'follow-up-planning';
  if (action === 'proposal_needed') return 'quote-prep';
  return 'sales-lead-review';
}

function salesActivityType(action: SalesAction): SalesActivity['activityType'] {
  if (action === 'contacted') return 'contacted';
  if (action === 'proposal_needed') return 'proposal';
  if (action === 'follow_up_planned') return 'follow_up';
  return 'status_change';
}

function salesActionLabel(action: SalesAction): string {
  const labels: Record<SalesAction, string> = {
    contacted: 'Contacted',
    follow_up_planned: 'Follow-up planned',
    paused: 'Paused',
    proposal_needed: 'Proposal needed',
  };
  return labels[action];
}

function nextDayIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

function runtimeAgentStatus(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function runtimeMemoryTotal(runtime: AgentRuntimeSnapshot): number {
  return (
    runtime.memory.approvals +
    runtime.memory.auditLogs +
    runtime.memory.events +
    runtime.memory.notes +
    runtime.memory.runs +
    runtime.memory.tasks +
    runtime.memory.workflowRuns
  );
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function formatHealth(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function healthTone(status: string): 'neutral' | 'good' | 'warn' {
  if (status === 'healthy' || status === 'prepared' || status === 'reachable' || status === 'completed') {
    return 'good';
  }
  if (status === 'warning' || status === 'critical' || status === 'protected' || status === 'missing' || status === 'failed') {
    return 'warn';
  }
  return 'neutral';
}

function shortSha(value: string): string {
  return value && value !== 'unknown' ? value.slice(0, 7) : value;
}

function countTables(tables: SupabaseTableCheck[], status: SupabaseTableCheck['status']): number {
  return tables.filter((table) => table.status === status).length;
}

function syncRecordBadge(queue: SyncQueueItem[], itemOrSourceType: SyncQueueItem | string, sourceId?: string): ReactNode {
  const item =
    typeof itemOrSourceType === 'string'
      ? queue.find((entry) => entry.sourceType === itemOrSourceType && entry.sourceId === sourceId)
      : itemOrSourceType;
  if (!item) return <StatusBadge value="Local Only" tone="neutral" />;
  const currentItem = queue.find((entry) => entry.sourceType === item.sourceType && entry.sourceId === item.sourceId);
  if (!currentItem) return <StatusBadge value="Local Only" tone="neutral" />;
  if (isLegacyRlsFailure(currentItem)) return <StatusBadge value="Legacy RLS Failure" tone="neutral" />;
  return <StatusBadge value={formatHealth(currentItem.status)} tone={syncQueueItemTone(currentItem.status)} />;
}

function syncQueueItemTone(status: SyncQueueItem['status']): 'neutral' | 'good' | 'warn' {
  if (status === 'synced') {
    return 'good';
  }
  if (status === 'failed') {
    return 'warn';
  }
  return 'neutral';
}

function syncStatusLabel(syncStatus: SyncStatusSnapshot): string {
  if (syncStatus.writeMode === 'local_only') {
    return 'Local Only';
  }
  if (syncStatus.writeMode === 'missing_token') {
    return 'Missing Function Token';
  }
  if (syncStatus.writeMode === 'missing_supabase_env') {
    return 'Missing Supabase Env';
  }
  if (syncStatus.recordsWaiting > 0) {
    return 'Sync Pending';
  }
  if (syncStatus.failedRecords > 0) {
    return 'Sync Errors';
  }
  if (syncStatus.legacyFailedRecords > 0 && syncStatus.connectionState === 'connected') {
    return 'Connected';
  }
  if (syncStatus.legacyFailedRecords > 0) {
    return 'Legacy Failures';
  }
  if (syncStatus.connectionState === 'connected') {
    return 'Connected';
  }
  if (syncStatus.connectionState === 'disabled') {
    return 'Sync Disabled';
  }
  return 'Offline';
}

function syncStatusTone(syncStatus: SyncStatusSnapshot): 'neutral' | 'good' | 'warn' {
  if (syncStatus.failedRecords > 0 || syncStatus.connectionState === 'offline' || syncStatus.writeMode === 'missing_token') {
    return 'warn';
  }
  if (syncStatus.connectionState === 'connected' && syncStatus.recordsWaiting === 0) {
    return 'good';
  }
  return 'neutral';
}

function syncStatusWarnings(syncStatus: SyncStatusSnapshot): string[] {
  const warnings: string[] = [];
  if (syncStatus.writeMode === 'local_only') {
    warnings.push('Agent memory writes are local-only. Direct browser table inserts remain disabled; the Edge Function is the approved write path.');
  }
  if (syncStatus.writeMode === 'missing_token') {
    warnings.push('Agent memory Edge Function writes are enabled but the local write token is missing.');
  }
  if (syncStatus.failedRecords > 0) {
    warnings.push('Some agent-memory sync records failed and remain retryable in the local queue.');
  }
  if (syncStatus.legacyFailedRecords > 0) {
    warnings.push('Some local sync queue records are legacy RLS failures from old direct browser insert attempts. RLS blocked them safely; they can be cleared locally.');
  }
  return warnings;
}

function formatSyncWriteMode(mode: SyncStatusSnapshot['writeMode']): string {
  if (mode === 'edge_function') return 'Edge Function';
  if (mode === 'missing_token') return 'Missing Token';
  if (mode === 'missing_supabase_env') return 'Missing Supabase Env';
  return 'Local Only';
}

function flattenAgentRun(run: AgentRun): Record<string, unknown> {
  return {
    id: run.id,
    agent: run.agent,
    workflow: run.workflow,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    duration: durationLabel(run.startedAt, run.completedAt),
    productionWritesOccurred: 'No',
    summary: migrationSummaryLabel(run.summary),
    ...run.summary,
  };
}

function flattenMigrationDryRun(run: MigrationDryRunRecord): Record<string, unknown> {
  return {
    id: run.id,
    createdAt: run.createdAt,
    agent: run.agent,
    workflow: run.workflow,
    productionWritesOccurred: run.productionWritesOccurred,
    rulesIncluded: run.rules.length,
    ...run.summary,
  };
}

function migrationSummaryLabel(summary: AgentRun['summary']): string {
  if (isMigrationRunSummary(summary)) {
    return `${summary.totalImported} imported, ${summary.ready} ready, ${summary.warnings} warnings, ${summary.errors} errors, ${summary.pendingProfiles} pending profiles, ${summary.existingUserMatches} existing user matches, ${summary.offlineMembers} offline members.`;
  }
  return Object.entries(summary)
    .slice(0, 8)
    .map(([key, value]) => `${formatHealth(key)}: ${String(value)}`)
    .join(', ');
}

function isMigrationRunSummary(summary: object): summary is {
  totalImported: number;
  ready: number;
  warnings: number;
  errors: number;
  pendingProfiles: number;
  existingUserMatches: number;
  offlineMembers: number;
} {
  return 'totalImported' in summary && 'ready' in summary && 'pendingProfiles' in summary;
}

function durationLabel(startedAt: string, completedAt: string): string {
  const started = new Date(startedAt).valueOf();
  const completed = new Date(completedAt).valueOf();
  if (Number.isNaN(started) || Number.isNaN(completed)) {
    return 'unknown';
  }
  const seconds = Math.max(0, Math.round((completed - started) / 1000));
  return `${seconds}s`;
}

function formatDate(value: string): string {
  if (!value || value === 'Mock readiness only' || value === 'Loading' || value === 'unknown') {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
}

function formatOptionalDate(value: string): string {
  if (!value || value.startsWith('No ') || value.startsWith('Use ')) return value;
  return formatDate(value);
}

function operatorCommandPurpose(command: string): string {
  if (command.endsWith('agents:status')) return 'Print operator identity, runtime status, and safety status.';
  if (command.endsWith('agents:run')) return 'Run the local operator workflow and generate all report groups.';
  if (command.endsWith('agents:executive-summary')) return 'Generate the Executive Run Summary report.';
  if (command.endsWith('agents:report')) return 'Generate a selected operator report, defaulting to runtime.';
  if (command.endsWith('agents:safety-check')) return 'Check local safety rails and secret-looking diffs.';
  if (command.endsWith('agents:graph')) return 'Generate the local cross-agent operator graph.';
  if (command.endsWith('agents:validate')) return 'Validate command availability, report directories, and safety checks.';
  if (command.endsWith('threads:status')) return 'Print local thread inbox, outbox, archive, and named-source status.';
  if (command.endsWith('threads:ingest')) return 'Read valid pending outbox items and create local Executive review summaries.';
  if (command.endsWith('threads:summary')) return 'Summarize pending local thread outputs by named agent source.';
  if (command.endsWith('threads:archive')) return 'Move consumed local outbox items into the local archive folder.';
  if (command.endsWith('threads:schedules')) return 'Inspect local scheduled thread definitions and due status.';
  if (command.endsWith('threads:run-due')) return 'Manually create local outbox items for due schedules; no background job starts.';
  if (command.endsWith('threads:approval-queue')) return 'Summarize local approval requests and decisions.';
  if (command.endsWith('threads:approve')) return 'Mark one local approval queue item approved without performing the external action.';
  if (command.endsWith('threads:reject')) return 'Mark one local approval queue item rejected without performing the external action.';
  if (command.endsWith('threads:validate')) return 'Validate thread bridge directories, schemas, and pending outbox payloads.';
  return 'Shared local operator command.';
}

function modeLabel(mode: EffectiveMode | IntegrationMode): string {
  if (mode === 'live') {
    return 'Live Read-Only Mode';
  }
  if (mode === 'fallback') {
    return 'Live With Fallback';
  }
  return 'Mock Mode';
}

export default App;
