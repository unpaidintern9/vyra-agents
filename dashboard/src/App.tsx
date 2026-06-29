import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FileClock,
  GitBranch,
  ListChecks,
  Network,
  RefreshCcw,
  Settings,
  ShieldCheck,
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
  const [agentRuns, setAgentRuns] = useState(createInitialAgentRuns);
  const [agentEvents, setAgentEvents] = useState(createInitialAgentEvents);
  const [agentTasks] = useState(createInitialAgentTasks);
  const [agentNotes] = useState(createInitialAgentNotes);
  const [auditLogs, setAuditLogs] = useState(createInitialAuditLogs);
  const [approvalItems, setApprovalItems] = useState(createInitialApprovals);
  const [workflowRuns, setWorkflowRuns] = useState<Record<string, string>>({});
  const [lastDryRunAt, setLastDryRunAt] = useState<string | null>(null);

  const migrationIssues = useMemo(() => validateMigrationMembers(importedMembers), []);
  const memberMatches = useMemo(() => matchMigrationMembers(importedMembers, existingVyraUsers), []);
  const migrationSummary = useMemo(
    () => summarizeMigration(importedMembers, migrationIssues, memberMatches),
    [memberMatches, migrationIssues],
  );
  const workflowRegistry = useMemo(() => getWorkflowRegistry(), []);

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
    setLastDryRunAt(now);
    const run: AgentRun = {
      id: `run_${Date.now()}`,
      agent: 'Migration Agent',
      workflow: 'migration-validation-dry-run',
      status: 'completed',
      startedAt: now,
      completedAt: new Date().toISOString(),
      summary: migrationSummary,
    };
    setAgentRuns((current) => [run, ...current]);
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
    setApprovalItems((current) =>
      current.map((item) => (item.id === id && item.status === 'pending' ? { ...item, status: 'mock approved' } : item)),
    );
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
    setWorkflowRuns((current) => ({ ...current, [workflow.key]: now }));
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

  const status = snapshot ?? buildLoadingSnapshot();
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

        {status.warnings.length > 0 ? <WarningsPanel warnings={status.warnings} /> : null}

        {activePage === 'Migration' ? (
          <MigrationPage
            approvalItems={approvalItems}
            approved={reviewApproved}
            expectedTables={status.supabase.tableChecks}
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
          <SettingsPage snapshot={status} />
        ) : activePage === 'Agent Memory' ? (
          <AgentMemoryPage
            approvals={approvalItems}
            events={agentEvents}
            notes={agentNotes}
            runs={agentRuns}
            tasks={agentTasks}
          />
        ) : activePage === 'Audit Logs' ? (
          <AuditLogsPage logs={auditLogs} />
        ) : activePage === 'Workflows' ? (
          <WorkflowsPage onRunDryCheck={runWorkflowDryCheck} runs={workflowRuns} workflows={workflowRegistry} />
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
  approved,
  expectedTables,
  issues,
  lastDryRunAt,
  matches,
  onApprove,
  onApproveItem,
  onDryRun,
  summary,
}: {
  approvalItems: ApprovalItem[];
  approved: boolean;
  expectedTables: SupabaseTableCheck[];
  issues: ReturnType<typeof validateMigrationMembers>;
  lastDryRunAt: string | null;
  matches: ReturnType<typeof matchMigrationMembers>;
  onApprove: () => void;
  onApproveItem(_id: string): void;
  onDryRun: () => void;
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
            <button className="approval-button compact-button" onClick={onDryRun} type="button">
              Run Migration Agent Dry Run
            </button>
          </div>
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
        <ApprovalQueuePanel items={approvalItems} onApproveItem={onApproveItem} />
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

function SettingsPage({ snapshot }: { snapshot: IntegrationSnapshot }) {
  const envItems = envChecklist();
  return (
    <section className="dashboard-grid">
      <Panel title="Integration Configuration" icon={<Settings size={18} />} wide>
        <div className="batch-grid supabase-detail-grid">
          <Fact label="Current Mode" value={modeLabel(snapshot.effectiveMode)} />
          <Fact label="Requested Mode" value={modeLabel(snapshot.requestedMode)} />
          <Fact label="GitHub Token" value={envItems.VITE_GITHUB_TOKEN} />
          <Fact label="Supabase URL" value={envItems.VITE_SUPABASE_URL} />
          <Fact label="Supabase Anon Key" value={envItems.VITE_SUPABASE_ANON_KEY} />
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
          <p>Add a GitHub token only if private repos or higher rate limits are needed.</p>
          <p>Add Supabase URL and anon key only for live read-only table checks.</p>
          <p>Run `npm run dev` from `dashboard/`.</p>
        </div>
      </Panel>
      <Panel title="Safety Reminders" icon={<ShieldCheck size={18} />}>
        <div className="rule-list">
          <p>Frontend uses anon or publishable keys only.</p>
          <p>Service role keys are forbidden in browser code.</p>
          <p>Dashboard checks are read-only.</p>
          <p>Agent actions are mock/local only for now.</p>
        </div>
      </Panel>
    </section>
  );
}

function AgentMemoryPage({
  approvals,
  events,
  notes,
  runs,
  tasks,
}: {
  approvals: ApprovalItem[];
  events: AgentEvent[];
  notes: ReturnType<typeof createInitialAgentNotes>;
  runs: AgentRun[];
  tasks: ReturnType<typeof createInitialAgentTasks>;
}) {
  return (
    <section className="dashboard-grid">
      <Panel title="Agent Memory Boundary" icon={<ShieldCheck size={18} />} wide>
        <p className="panel-copy">
          Agent memory tables now exist in Supabase, but Phase 5 uses local/mock state only and does not write to
          production.
        </p>
      </Panel>
      <Panel title="Agent Runs" icon={<Activity size={18} />} wide>
        {runs.length === 0 ? (
          <EmptyState message="No local agent runs yet." />
        ) : (
          <DataTable
            columns={['Agent', 'Workflow', 'Status', 'Started', 'Completed', 'Summary']}
            rows={runs.map((run) => [
              run.agent,
              run.workflow,
              <StatusBadge key={run.id} value={run.status} tone="good" />,
              formatDate(run.startedAt),
              formatDate(run.completedAt),
              `${run.summary.totalImported} imported · ${run.summary.warnings} warnings · ${run.summary.errors} errors · ${run.summary.pendingProfiles} pending · ${run.summary.existingUserMatches} matches · ${run.summary.offlineMembers} offline`,
            ])}
          />
        )}
      </Panel>
      <Panel title="Agent Events" icon={<FileClock size={18} />}>
        <div className="activity-list">
          {events.map((event) => (
            <p key={event.id}>{`${formatDate(event.timestamp)} · ${event.agent}: ${event.detail}`}</p>
          ))}
        </div>
      </Panel>
      <Panel title="Agent Tasks" icon={<ListChecks size={18} />}>
        <div className="list-stack">
          {tasks.map((task) => (
            <div className="row-item" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.agent}</span>
              </div>
              <RiskBadge risk={task.priority} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Agent Approvals" icon={<ShieldCheck size={18} />}>
        <div className="list-stack">
          {approvals.slice(0, 4).map((approval) => (
            <div className="row-item" key={approval.id}>
              <div>
                <strong>{approval.title}</strong>
                <span>{approval.status}</span>
              </div>
              <RiskBadge risk={approval.riskLevel} />
            </div>
          ))}
        </div>
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

function AuditLogsPage({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <section className="dashboard-grid">
      <Panel title="Audit Logs" icon={<FileClock size={18} />} wide>
        <DataTable
          columns={['Timestamp', 'Actor', 'Agent', 'Action', 'Target', 'Result', 'Risk', 'Approval']}
          rows={logs.map((log) => [
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
  onRunDryCheck,
  runs,
  workflows: registry,
}: {
  onRunDryCheck(_workflow: WorkflowDefinition): void;
  runs: Record<string, string>;
  workflows: WorkflowDefinition[];
}) {
  return (
    <section className="dashboard-grid">
      {registry.map((workflow) => (
        <Panel key={workflow.key} title={workflow.key} icon={<Workflow size={18} />}>
          <div className="fact-list">
            <Fact label="Trigger" value={workflow.triggerType} />
            <Fact label="Owner" value={workflow.ownerAgent} />
            <Fact label="Mode" value={workflow.currentMode} />
            <Fact label="Last Run" value={runs[workflow.key] ? formatDate(runs[workflow.key]) : workflow.lastRun} />
            <Fact label="Next Status" value={workflow.nextStatus} />
            <Fact label="Approval" value={workflow.approvalRequired ? 'Yes' : 'No'} />
          </div>
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
  items,
  onApproveItem,
}: {
  items: ApprovalItem[];
  onApproveItem(_id: string): void;
}) {
  return (
    <Panel title="Approval Queue Foundation" icon={<ShieldCheck size={18} />} wide>
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
    </Panel>
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
    VITE_SUPABASE_PROJECT_NAME: import.meta.env.VITE_SUPABASE_PROJECT_NAME ? 'configured' : 'missing',
    VITE_SUPABASE_ENVIRONMENT: import.meta.env.VITE_SUPABASE_ENVIRONMENT ? 'configured' : 'missing',
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
    Settings: 'Integration mode, env setup guidance, and safety reminders without exposing secrets.',
    'Agent Memory': 'Local/mock runs, events, tasks, approvals, and notes before Supabase writes are enabled.',
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
