import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
  UsersRound,
  Workflow,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { existingVyraUsers, importedMembers, migrationBatch } from './agents/migration/migrationMockData';
import { summarizeMigration } from './agents/migration/migrationSummary';
import { validateMigrationMembers } from './agents/migration/migrationValidation';
import { matchMigrationMembers } from './agents/migration/memberMatching';
import { EmptyState } from './components/EmptyState';
import { PageHeader } from './components/PageHeader';
import { RiskBadge } from './components/RiskBadge';
import { StatusBadge } from './components/StatusBadge';
import { getGitHubStatus } from './integrations/github/githubStatus';
import type { GitHubStatusResult } from './integrations/github/githubTypes';
import { buildIntegrationRegistry } from './integrations/integrationRegistry';
import { getAgentMemoryFunctionConfig } from './integrations/supabase/agentMemoryFunctionClient';
import { getSupabaseEnvStatus } from './integrations/supabase/supabaseClient';
import { getSupabaseStatus } from './integrations/supabase/supabaseStatus';
import type { SupabaseProjectStatus, SupabaseTableCheck } from './integrations/supabase/supabaseTypes';
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
  clearSyncQueueStorage,
  enqueueSyncRecords,
  loadSyncQueue,
  resetFailedQueueItems,
  saveSyncQueue,
} from './sync/syncQueue';
import { buildSyncStatusSnapshot } from './sync/syncStatus';
import type { SyncConnectionState, SyncQueueItem, SyncStatusSnapshot } from './sync/syncTypes';
import type { ApprovalHistoryEntry, MigrationDryRunRecord, WorkflowDryCheckRecord } from './types/localRecords';
import { getWorkflowRegistry } from './workflows/workflowRegistry';
import type { WorkflowDefinition } from './workflows/workflowTypes';
import {
  agents,
  ecosystemNodes,
  migrationStatus,
  navItems,
  priorities,
  recentActivity,
  summaryStats,
  systemHealth,
  workflows,
} from './data';

type IntegrationMode = 'mock' | 'live';
type EffectiveMode = 'mock' | 'live' | 'fallback';

interface IntegrationSnapshot {
  requestedMode: IntegrationMode;
  effectiveMode: EffectiveMode;
  github: GitHubStatusResult;
  supabase: SupabaseProjectStatus;
  warnings: string[];
  lastChecked: string;
}

const requestedMode = import.meta.env.VITE_VYRA_INTEGRATION_MODE === 'live' ? 'live' : 'mock';

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

  const migrationIssues = useMemo(() => validateMigrationMembers(importedMembers), []);
  const memberMatches = useMemo(() => matchMigrationMembers(importedMembers, existingVyraUsers), []);
  const migrationSummary = useMemo(
    () => summarizeMigration(importedMembers, migrationIssues, memberMatches),
    [memberMatches, migrationIssues],
  );
  const workflowRegistry = useMemo(() => getWorkflowRegistry(), []);
  const persistenceStatus = useMemo(() => getLocalPersistenceStatus(), []);
  const syncWriteMode = useMemo(() => getSyncWriteMode(), []);
  const syncStatus = useMemo(
    () => buildSyncStatusSnapshot(syncQueue, syncConnectionState, lastSyncAt, syncEnabled, syncWriteMode),
    [lastSyncAt, syncConnectionState, syncEnabled, syncQueue, syncWriteMode],
  );
  const lastDryRunAt = migrationDryRuns[0]?.createdAt ?? null;

  useEffect(() => saveLocalState(localStorageKeys.agentRuns, agentRuns), [agentRuns]);
  useEffect(() => saveLocalState(localStorageKeys.agentEvents, agentEvents), [agentEvents]);
  useEffect(() => saveLocalState(localStorageKeys.agentTasks, agentTasks), [agentTasks]);
  useEffect(() => saveLocalState(localStorageKeys.auditLogs, auditLogs), [auditLogs]);
  useEffect(() => saveLocalState(localStorageKeys.approvals, approvalItems), [approvalItems]);
  useEffect(() => saveLocalState(localStorageKeys.workflowResults, workflowRuns), [workflowRuns]);
  useEffect(() => saveLocalState(localStorageKeys.migrationDryRuns, migrationDryRuns), [migrationDryRuns]);
  useEffect(() => saveLocalState(localStorageKeys.approvalHistory, approvalHistory), [approvalHistory]);
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
          id: `audit_sync_${Date.now()}`,
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
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...current,
    ]);
  }, []);

  const appendAgentEvent = useCallback((event: Omit<AgentEvent, 'id' | 'timestamp'>) => {
    setAgentEvents((current) => [
      {
        id: `evt_${Date.now()}`,
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

  const runMigrationDryRun = () => {
    const now = new Date().toISOString();
    const run: AgentRun = {
      id: `run_${Date.now()}`,
      agent: 'Migration Agent',
      workflow: 'migration-validation-dry-run',
      status: 'completed',
      startedAt: now,
      completedAt: new Date().toISOString(),
      summary: migrationSummary,
    };
    const dryRun: MigrationDryRunRecord = {
      id: `migration_dry_run_${Date.now()}`,
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

  const approveMockItem = (id: string) => {
    const item = approvalItems.find((approval) => approval.id === id);
    setApprovalItems((current) =>
      current.map((item) => (item.id === id && item.status === 'pending' ? { ...item, status: 'mock approved' } : item)),
    );
    if (item?.status === 'pending') {
      setApprovalHistory((current) => [
        {
          id: `approval_history_${Date.now()}`,
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
        id: `workflow_dry_check_${Date.now()}`,
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
  const pageTitle = activePage === 'Migration' ? 'Migration Agent' : activePage;

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

        {activePage === 'Migration' ? (
          <MigrationPage
            approvalItems={approvalItems}
            approvalHistory={approvalHistory}
            approved={reviewApproved}
            dryRuns={migrationDryRuns}
            expectedTables={status.supabase.tableChecks}
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
        ) : (
          <OverviewPage approvalItems={approvalItems} snapshot={status} />
        )}
      </main>
    </div>
  );
}

function OverviewPage({ approvalItems, snapshot }: { approvalItems: ApprovalItem[]; snapshot: IntegrationSnapshot }) {
  const registry = buildIntegrationRegistry(snapshot.github, snapshot.supabase);
  return (
    <>
      <section className="summary-grid" aria-label="Command center summary">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="metric-card" key={stat.label}>
              <Icon size={20} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <Panel title="System Health" icon={<Activity size={18} />}>
          <div className="health-grid">
            {systemHealth.map((item) => (
              <div className={`health-tile ${item.tone}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Active Agents" icon={<CircleDot size={18} />}>
          <div className="list-stack">
            {agents.slice(0, 6).map((agent) => (
              <div className="row-item" key={agent.name}>
                <div>
                  <strong>{agent.name}</strong>
                  <span>{agent.detail}</span>
                </div>
                <StatusBadge value={agent.status} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Repository Health" icon={<GitBranch size={18} />}>
          <div className="list-stack">
            {snapshot.github.repositories.map((repo) => (
              <div className="row-item compact" key={repo.repositoryName}>
                <div>
                  <strong>{repo.repositoryName}</strong>
                  <span>
                    {repo.defaultBranch} · {shortSha(repo.latestCommit)} · {repo.workflowStatus}
                  </span>
                </div>
                <StatusBadge value={formatHealth(repo.healthStatus)} tone={healthTone(repo.healthStatus)} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Integration Status" icon={<Network size={18} />}>
          <div className="integration-grid">
            {registry.slice(0, 8).map((integration) => (
              <div className="integration-pill" key={integration.name}>
                <span>{integration.name}</span>
                <small>{integration.status}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Supabase Health" icon={<Network size={18} />}>
          <div className="batch-grid">
            <Fact label="Database" value={snapshot.supabase.databaseReachable ? 'Reachable' : 'Not checked'} />
            <Fact label="Reachable Tables" value={String(countTables(snapshot.supabase.tableChecks, 'reachable'))} />
            <Fact label="Protected Tables" value={String(countTables(snapshot.supabase.tableChecks, 'protected'))} />
            <Fact label="Missing Tables" value={String(countTables(snapshot.supabase.tableChecks, 'missing'))} />
            <Fact label="Last Checked" value={formatDate(snapshot.supabase.lastChecked)} />
            <Fact label="Mode" value={modeLabel(snapshot.effectiveMode)} />
          </div>
        </Panel>
        <Panel title="Approval Queue" icon={<ShieldCheck size={18} />}>
          <div className="list-stack">
            {approvalItems.slice(0, 3).map((item) => (
              <div className="row-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.reason}</span>
                </div>
                <RiskBadge risk={item.riskLevel} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Workflow Activity" icon={<ArrowRight size={18} />}>
          <div className="workflow-list">
            {workflows.map((workflow) => (
              <div className="workflow-item" key={workflow.name}>
                <span>{workflow.name}</span>
                <small>{workflow.owner}</small>
                <StatusBadge value={workflow.status} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Top Priorities" icon={<AlertTriangle size={18} />}>
          <ol className="priority-list">
            {priorities.map((priority) => (
              <li key={priority}>{priority}</li>
            ))}
          </ol>
        </Panel>
        <Panel title="Recent Activity" icon={<Activity size={18} />}>
          <div className="activity-list">
            {recentActivity.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </Panel>
        <Panel title="Migration Status" icon={<CircleDot size={18} />}>
          <div className="migration-grid">
            {migrationStatus.map((item) => (
              <div className="migration-tile" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Ecosystem Map" icon={<Network size={18} />} wide>
          <div className="ecosystem-map" aria-label="Vyra ecosystem map">
            {ecosystemNodes.map((node, index) => (
              <div className={`node node-${index}`} key={node}>
                {node}
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

function MigrationPage({
  approvalItems,
  approvalHistory,
  approved,
  dryRuns,
  expectedTables,
  issues,
  lastDryRunAt,
  matches,
  onClearApprovalHistory,
  onClearDryRuns,
  onApprove,
  onApproveItem,
  onDryRun,
  onExportApprovalHistory,
  onExportDryRun,
  summary,
}: {
  approvalItems: ApprovalItem[];
  approvalHistory: ApprovalHistoryEntry[];
  approved: boolean;
  dryRuns: MigrationDryRunRecord[];
  expectedTables: SupabaseTableCheck[];
  issues: ReturnType<typeof validateMigrationMembers>;
  lastDryRunAt: string | null;
  matches: ReturnType<typeof matchMigrationMembers>;
  onClearApprovalHistory(): void;
  onClearDryRuns(): void;
  onApprove: () => void;
  onApproveItem(_id: string): void;
  onDryRun: () => void;
  onExportApprovalHistory(_format: ReportFormat): void;
  onExportDryRun(_format: ReportFormat): void;
  summary: ReturnType<typeof summarizeMigration>;
}) {
  const summaryCards = [
    ['Total Imported', summary.totalImported],
    ['Ready', summary.ready],
    ['Warnings', summary.warnings],
    ['Errors', summary.errors],
    ['Existing Vyra Matches', summary.existingUserMatches],
    ['Pending Profiles', summary.pendingProfiles],
    ['Offline Members', summary.offlineMembers],
    ['Ready for Review', `${summary.readyForReview}%`],
  ];
  return (
    <>
      <section className="summary-grid migration-summary" aria-label="Migration summary">
        {summaryCards.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <ListChecks size={20} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <Panel title="Migration Dry Run" icon={<Workflow size={18} />} wide>
          <div className="dry-run-panel">
            <div>
              <strong>Local dry run only — no production changes made.</strong>
              <p>
                Validates mock member imports, calculates summary, records local agent run state, and appends local audit
                history. It does not write to Supabase, call AI, send invitations, or create real organization
                memberships.
              </p>
              <small>{lastDryRunAt ? `Last dry run: ${formatDate(lastDryRunAt)}` : 'No Phase 5 dry run yet.'}</small>
            </div>
            <div className="button-row end-row">
              <button className="approval-button compact-button" onClick={onDryRun} type="button">
                Run Migration Agent Dry Run
              </button>
              <ExportButtons disabled={!dryRuns.length} onExport={onExportDryRun} />
              <button className="clear-button" disabled={!dryRuns.length} onClick={onClearDryRuns} type="button">
                <Trash2 size={15} />
                <span>Clear History</span>
              </button>
            </div>
          </div>
        </Panel>
        <Panel title="Dry Run History" icon={<FileClock size={18} />} wide>
          {dryRuns.length === 0 ? (
            <EmptyState message="No migration dry-run history yet." />
          ) : (
            <div className="history-list">
              {dryRuns.slice(0, 6).map((run) => (
                <div className="history-item" key={run.id}>
                  <div>
                    <strong>{formatDate(run.createdAt)}</strong>
                    <span>
                      {run.summary.totalImported} imported · {run.summary.warnings} warnings · {run.summary.errors} errors ·
                      production writes: {run.productionWritesOccurred}
                    </span>
                  </div>
                  <StatusBadge value={run.workflow} tone="good" />
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Import Batch" icon={<UsersRound size={18} />}>
          <div className="batch-grid">
            <Fact label="Gym" value={migrationBatch.gymName} />
            <Fact label="Organization ID" value={migrationBatch.organizationId} />
            <Fact label="Source" value={migrationBatch.source} />
            <Fact label="Status" value={migrationBatch.status} />
            <Fact label="Imported Members" value={migrationBatch.importedMembers.toLocaleString()} />
            <Fact label="Created By" value={migrationBatch.createdBy} />
          </div>
        </Panel>
        <Panel title="Critical Migration Rules" icon={<ShieldCheck size={18} />}>
          <div className="rule-list">
            {migrationRules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </div>
        </Panel>
        <Panel title="Offline / Non-App Members" icon={<UsersRound size={18} />}>
          <p className="panel-copy">
            These members can still attend the gym, be checked in, appear on rosters, keep billing status, receive coach
            assignments, and be managed by staff without downloading the app.
          </p>
          <div className="offline-support-grid">
            <StatusBadge value="Attendance allowed" tone="good" />
            <StatusBadge value="Rosters preserved" tone="good" />
            <StatusBadge value="Staff manageable" tone="good" />
            <StatusBadge value="App optional" tone="good" />
          </div>
        </Panel>
        <Panel title="Validation Issues" icon={<AlertTriangle size={18} />} wide>
          <DataTable
            columns={['Member', 'Issue', 'Severity', 'Recommended Action', 'Status']}
            rows={issues.slice(0, 12).map((issue) => [
              issue.memberName,
              issue.issue,
              <StatusBadge key={issue.issue} value={issue.severity} tone={issue.severity === 'error' ? 'warn' : 'neutral'} />,
              issue.recommendedAction,
              issue.status,
            ])}
          />
        </Panel>
        <Panel title="Member Matching" icon={<CircleDot size={18} />} wide>
          <DataTable
            columns={['Imported Member', 'Match Type', 'Member State', 'Existing User', 'Org Membership Ready', 'Notes']}
            rows={matches.map((match) => [
              match.importedMember,
              match.matchType,
              match.memberState,
              match.existingUser,
              match.organizationMembershipReady ? 'Yes' : 'Review',
              match.notes,
            ])}
          />
        </Panel>
        <Panel title="Migration Table Readiness" icon={<Network size={18} />} wide>
          <DataTable
            columns={['Expected Table', 'Status', 'Detail']}
            rows={expectedTables.map((table) => [
              table.tableName,
              <StatusBadge key={table.tableName} value={formatHealth(table.status)} tone={tableTone(table.status)} />,
              table.detail,
            ])}
          />
        </Panel>
        <ApprovalQueuePanel
          history={approvalHistory}
          items={approvalItems}
          onApproveItem={onApproveItem}
          onClearHistory={onClearApprovalHistory}
          onExportHistory={onExportApprovalHistory}
        />
        <Panel title="Gym Review Checklist" icon={<CheckCircle2 size={18} />}>
          <div className="checklist">
            {['Duplicates reviewed', 'Missing info reviewed', 'Existing user matches reviewed', 'Pending profiles reviewed', 'Offline members reviewed', 'Invitations prepared', 'Organization memberships ready'].map((item) => (
              <label key={item}>
                <input checked readOnly type="checkbox" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </Panel>
        <Panel title="Approval" icon={<ShieldCheck size={18} />}>
          <p className="panel-copy">
            This mock approval only updates local UI state. No production data, customer messaging, or database migration is
            connected.
          </p>
          <button className="approval-button" disabled={approved} onClick={onApprove} type="button">
            {approved ? 'Review Approved' : 'Approve Migration Review'}
          </button>
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
            columns={['Repository', 'Branch', 'Latest Commit', 'Message', 'Open PRs', 'Issues', 'Workflow', 'Last Checked', 'Health']}
            rows={snapshot.github.repositories.map((repo) => [
              repo.repositoryName,
              repo.defaultBranch,
              shortSha(repo.latestCommit),
              repo.latestCommitMessage,
              String(repo.openPullRequests),
              String(repo.issueCount),
              repo.workflowStatus,
              formatDate(repo.lastUpdated),
              <StatusBadge key={repo.repositoryName} value={formatHealth(repo.healthStatus)} tone={healthTone(repo.healthStatus)} />,
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
  const supabaseEnv = getSupabaseEnvStatus();
  const functionConfig = getAgentMemoryFunctionConfig();
  return (
    <section className="dashboard-grid">
      <Panel title="Integration Configuration" icon={<Settings size={18} />} wide>
        <div className="batch-grid supabase-detail-grid">
          <Fact label="Current Mode" value={modeLabel(snapshot.effectiveMode)} />
          <Fact label="Requested Mode" value={modeLabel(snapshot.requestedMode)} />
          <Fact label="GitHub Token" value={envItems.VITE_GITHUB_TOKEN} />
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
          <p>Add a GitHub token only if private repos or higher rate limits are needed.</p>
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

function ApprovalQueuePanel({
  history,
  items,
  onClearHistory,
  onApproveItem,
  onExportHistory,
}: {
  history: ApprovalHistoryEntry[];
  items: ApprovalItem[];
  onClearHistory(): void;
  onApproveItem(_id: string): void;
  onExportHistory(_format: ReportFormat): void;
}) {
  return (
    <Panel title="Approval Queue Foundation" icon={<ShieldCheck size={18} />} wide>
      <div className="toolbar-row">
        <p className="panel-copy">Mock approval decisions persist locally and are exportable for review.</p>
        <div className="button-row">
          <ExportButtons disabled={!history.length} onExport={onExportHistory} />
          <button className="clear-button" disabled={!history.length} onClick={onClearHistory} type="button">
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        </div>
      </div>
      <DataTable
        columns={['Item', 'Requested By', 'Risk', 'Status', 'Approver', 'Reason', 'Mock Action']}
        rows={items.map((item) => [
          item.title,
          item.requestedBy,
          <RiskBadge key={`${item.id}-risk`} risk={item.riskLevel} />,
          item.status,
          item.requiredApprover,
          item.reason,
          <button
            className="inline-action"
            disabled={item.status !== 'pending'}
            key={`${item.id}-action`}
            onClick={() => onApproveItem(item.id)}
            type="button"
          >
            {item.status === 'pending' ? 'Mock Approve' : item.status}
          </button>,
        ])}
      />
      <div className="section-gap">
        <h3>Approval History</h3>
        {history.length === 0 ? (
          <EmptyState message="No mock approval decisions have been recorded yet." />
        ) : (
          <div className="history-list">
            {history.slice(0, 6).map((entry) => (
              <div className="history-item" key={entry.id}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>
                    {entry.action} by {entry.decidedBy} · production writes: {entry.productionWritesOccurred}
                  </span>
                </div>
                <small>{formatDate(entry.decidedAt)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
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
    </section>
  );
}

function SyncQueuePage({
  onClearQueue,
  onRetryFailed,
  onSyncNow,
  queue,
  syncStatus,
}: {
  onClearQueue(): void;
  onRetryFailed(): void;
  onSyncNow(): void;
  queue: SyncQueueItem[];
  syncStatus: SyncStatusSnapshot;
}) {
  const activeQueue = queue.filter((item) => item.status !== 'synced');

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
      <Panel title="Queued Agent Memory Records" icon={<FileClock size={18} />} wide>
        {activeQueue.length === 0 ? (
          <EmptyState message="No queued sync records." />
        ) : (
          <DataTable
            columns={['Status', 'Table', 'Source', 'Queued', 'Attempts', 'Last Attempt', 'Error']}
            rows={activeQueue.map((item) => [
              syncRecordBadge(queue, item.sourceType, item.sourceId),
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
  return (
    <section className="warnings-panel" aria-label="Integration warnings">
      <div>
        <AlertTriangle size={18} />
        <strong>Warnings</strong>
      </div>
      {warnings.slice(0, 5).map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </section>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
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
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
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
    VITE_GITHUB_OWNER: import.meta.env.VITE_GITHUB_OWNER ? 'configured' : 'missing',
    VITE_GITHUB_REPOS: import.meta.env.VITE_GITHUB_REPOS ? 'configured' : 'missing',
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

const migrationRules = [
  'Members belong to the gym before app login.',
  'Organization Membership is the source of truth.',
  'Existing Vyra users should be linked, not duplicated.',
  'Pending profiles reserve a member’s gym relationship before activation.',
  'Offline/non-app members are valid members.',
  'Gym operations must continue even if zero members download the app on day one.',
  'The app is optional for the member, not required for gym operations.',
  'Staff can manage all migrated members from the gym dashboard.',
];

function pageCopy(page: string): string {
  const copy: Record<string, string> = {
    Migration: 'Migration dry-runs, staging review, member matching, table readiness, and mock approvals.',
    Integrations: 'Read-only integration health with safe mock fallback and no production writes.',
    Settings: 'Integration mode, Edge Function write path, env setup guidance, and safety reminders without exposing secrets.',
    'Agent Memory': 'Local/mock runs, events, tasks, approvals, and notes before Supabase writes are enabled.',
    'Sync Queue': 'Safe Supabase agent-memory synchronization with localStorage fallback and retry controls.',
    'Audit Logs': 'Local/mock action history for agent activity, approvals, warnings, and dry checks.',
    Workflows: 'Workflow registry with safe local dry checks and approval-risk visibility.',
  };
  return copy[page] ?? 'Read-only command center for the Vyra ecosystem. No AI or production write workflows are enabled.';
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

function tableTone(status: string): 'neutral' | 'good' | 'warn' {
  if (status === 'prepared' || status === 'reachable') {
    return 'good';
  }
  if (status === 'protected' || status === 'missing') {
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

function syncRecordBadge(queue: SyncQueueItem[], sourceType: string, sourceId: string): ReactNode {
  const item = queue.find((entry) => entry.sourceType === sourceType && entry.sourceId === sourceId);
  if (!item) {
    return <StatusBadge value="Local Only" tone="neutral" />;
  }
  return <StatusBadge value={formatHealth(item.status)} tone={syncQueueItemTone(item.status)} />;
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
  return `${summary.totalImported} imported, ${summary.ready} ready, ${summary.warnings} warnings, ${summary.errors} errors, ${summary.pendingProfiles} pending profiles, ${summary.existingUserMatches} existing user matches, ${summary.offlineMembers} offline members.`;
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
