import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  GitBranch,
  ListChecks,
  Network,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { existingVyraUsers, importedMembers, migrationBatch } from './agents/migration/migrationMockData';
import { summarizeMigration } from './agents/migration/migrationSummary';
import { validateMigrationMembers } from './agents/migration/migrationValidation';
import { matchMigrationMembers } from './agents/migration/memberMatching';
import { getGitHubStatus } from './integrations/github/githubStatus';
import type { GitHubStatusResult } from './integrations/github/githubTypes';
import { buildIntegrationRegistry } from './integrations/integrationRegistry';
import { getSupabaseStatus } from './integrations/supabase/supabaseStatus';
import type { SupabaseProjectStatus, SupabaseTableCheck } from './integrations/supabase/supabaseTypes';
import {
  agents,
  approvals,
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

interface IntegrationSnapshot {
  requestedMode: IntegrationMode;
  effectiveMode: 'mock' | 'live' | 'fallback';
  github: GitHubStatusResult;
  supabase: SupabaseProjectStatus;
  warnings: string[];
  lastChecked: string;
}

const requestedMode = getRequestedMode();

function App() {
  const [activePage, setActivePage] = useState('Overview');
  const [reviewApproved, setReviewApproved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<IntegrationSnapshot | null>(null);
  const migrationIssues = useMemo(() => validateMigrationMembers(importedMembers), []);
  const memberMatches = useMemo(() => matchMigrationMembers(importedMembers, existingVyraUsers), []);
  const migrationSummary = useMemo(
    () => summarizeMigration(importedMembers, migrationIssues, memberMatches),
    [memberMatches, migrationIssues],
  );

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    const [github, supabase] = await Promise.all([getGitHubStatus(requestedMode), getSupabaseStatus(requestedMode)]);
    const warnings = [...github.warnings, ...supabase.warnings];
    const effectiveMode = requestedMode === 'mock' ? 'mock' : github.usedFallback || supabase.usedFallback ? 'fallback' : 'live';

    setSnapshot({
      requestedMode,
      effectiveMode,
      github,
      supabase,
      warnings,
      lastChecked: new Date().toISOString(),
    });
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const status = snapshot ?? buildLoadingSnapshot();

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
        <header className="hero">
          <div>
            <p className="eyebrow">Operations command center</p>
            <h1>{activePage === 'Migration' ? 'Migration Agent' : 'Vyra Agents'}</h1>
            <p className="hero-copy">
              {activePage === 'Migration'
                ? 'Migration staging, validation, matching, offline member handling, and table-readiness checks.'
                : 'Read-only ecosystem status with safe mock fallback. No AI, writes, deploys, or production data mutations.'}
            </p>
          </div>
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
        </header>

        {status.warnings.length > 0 ? <WarningsPanel warnings={status.warnings} /> : null}

        {activePage === 'Migration' ? (
          <MigrationPage
            approved={reviewApproved}
            expectedTables={status.supabase.tableChecks}
            issues={migrationIssues}
            matches={memberMatches}
            onApprove={() => setReviewApproved(true)}
            summary={migrationSummary}
          />
        ) : activePage === 'Integrations' ? (
          <IntegrationsPage snapshot={status} />
        ) : (
          <OverviewPage snapshot={status} />
        )}
      </main>
    </div>
  );
}

function OverviewPage({ snapshot }: { snapshot: IntegrationSnapshot }) {
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
                <Badge value={agent.status} />
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
                <Badge value={formatHealth(repo.healthStatus)} tone={healthTone(repo.healthStatus)} />
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
            <Fact label="Edge Functions" value={formatHealth(snapshot.supabase.edgeFunctionsStatus)} />
            <Fact label="Last Checked" value={formatDate(snapshot.supabase.lastChecked)} />
          </div>
        </Panel>

        <Panel title="Workflow Activity" icon={<ArrowRight size={18} />}>
          <div className="workflow-list">
            {workflows.map((workflow) => (
              <div className="workflow-item" key={workflow.name}>
                <span>{workflow.name}</span>
                <small>{workflow.owner}</small>
                <Badge value={workflow.status} />
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

        <Panel title="Approvals Waiting" icon={<ShieldCheck size={18} />}>
          <div className="approval-grid">
            {approvals.map((approval) => {
              const Icon = approval.icon;
              return (
                <div className="approval-item" key={approval.item}>
                  <Icon size={18} />
                  <div>
                    <strong>{approval.item}</strong>
                    <span>{approval.required}</span>
                  </div>
                </div>
              );
            })}
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
  approved,
  expectedTables,
  issues,
  matches,
  onApprove,
  summary,
}: {
  approved: boolean;
  expectedTables: SupabaseTableCheck[];
  issues: ReturnType<typeof validateMigrationMembers>;
  matches: ReturnType<typeof matchMigrationMembers>;
  onApprove: () => void;
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
  const checklist = [
    'Duplicates reviewed',
    'Missing info reviewed',
    'Existing user matches reviewed',
    'Pending profiles reviewed',
    'Offline members reviewed',
    'Invitations prepared',
    'Organization memberships ready',
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
            <p>Members belong to the gym before app login.</p>
            <p>Organization Membership is the source of truth.</p>
            <p>Existing Vyra users are linked, not duplicated.</p>
            <p>Offline/non-app members are valid gym members.</p>
          </div>
        </Panel>

        <Panel title="Offline / Non-App Members" icon={<UsersRound size={18} />}>
          <p className="panel-copy">
            These members can still attend the gym, be checked in, appear on rosters, keep billing status, receive
            coach assignments, and be managed by staff without downloading the app.
          </p>
          <div className="offline-support-grid">
            <Badge value="Attendance allowed" tone="good" />
            <Badge value="Rosters preserved" tone="good" />
            <Badge value="Staff manageable" tone="good" />
            <Badge value="App optional" tone="good" />
          </div>
        </Panel>

        <Panel title="Validation Issues" icon={<AlertTriangle size={18} />} wide>
          <DataTable
            columns={['Member', 'Issue', 'Severity', 'Recommended Action', 'Status']}
            rows={issues.slice(0, 12).map((issue) => [
              issue.memberName,
              issue.issue,
              <Badge key={issue.issue} value={issue.severity} tone={issue.severity === 'error' ? 'warn' : 'neutral'} />,
              issue.recommendedAction,
              issue.status,
            ])}
          />
        </Panel>

        <Panel title="Member Matching" icon={<CircleDot size={18} />} wide>
          <DataTable
            columns={[
              'Imported Member',
              'Match Type',
              'Member State',
              'Existing User',
              'Organization Membership Ready',
              'Notes',
            ]}
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
              <Badge key={table.tableName} value={formatHealth(table.status)} tone={tableTone(table.status)} />,
              table.detail,
            ])}
          />
        </Panel>

        <Panel title="Gym Review Checklist" icon={<CheckCircle2 size={18} />}>
          <div className="checklist">
            {checklist.map((item) => (
              <label key={item}>
                <input checked readOnly type="checkbox" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Approval" icon={<ShieldCheck size={18} />}>
          <p className="panel-copy">
            This mock approval only updates local UI state. No production data, customer messaging, or database
            migration is connected.
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
        <article className="metric-card">
          <Network size={20} />
          <span>Integration Mode</span>
          <strong>{modeLabel(snapshot.effectiveMode)}</strong>
        </article>
        <article className="metric-card">
          <GitBranch size={20} />
          <span>GitHub Repos</span>
          <strong>{snapshot.github.repositories.length}</strong>
        </article>
        <article className="metric-card">
          <Network size={20} />
          <span>Reachable Tables</span>
          <strong>{countTables(snapshot.supabase.tableChecks, 'reachable')}</strong>
        </article>
        <article className="metric-card">
          <AlertTriangle size={20} />
          <span>Warnings</span>
          <strong>{snapshot.warnings.length}</strong>
        </article>
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
                <Badge value={formatHealth(integration.healthStatus)} tone={healthTone(integration.healthStatus)} />
                <p>{integration.detail}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="GitHub Live Status" icon={<GitBranch size={18} />} wide>
          <DataTable
            columns={[
              'Repository',
              'Branch',
              'Latest Commit',
              'Message',
              'Open PRs',
              'Issues',
              'Workflow',
              'Last Checked',
              'Health',
            ]}
            rows={snapshot.github.repositories.map((repo) => [
              repo.repositoryName,
              repo.defaultBranch,
              shortSha(repo.latestCommit),
              repo.latestCommitMessage,
              String(repo.openPullRequests),
              String(repo.issueCount),
              repo.workflowStatus,
              formatDate(repo.lastUpdated),
              <Badge key={repo.repositoryName} value={formatHealth(repo.healthStatus)} tone={healthTone(repo.healthStatus)} />,
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Badge({ value, tone = 'neutral' }: { value: string; tone?: 'neutral' | 'good' | 'warn' }) {
  return <span className={`badge ${tone}`}>{value}</span>;
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

function getRequestedMode(): IntegrationMode {
  return import.meta.env.VITE_VYRA_INTEGRATION_MODE === 'live' ? 'live' : 'mock';
}

function buildLoadingSnapshot(): IntegrationSnapshot {
  const supabase = {
    projectName: import.meta.env.VITE_SUPABASE_PROJECT_NAME || 'Vyra Production',
    environment: import.meta.env.VITE_SUPABASE_ENVIRONMENT || 'production',
    migrationCount: 17,
    latestMigration: '20260629000200_gym_migration_foundation.sql',
    databaseStatus: 'prepared' as const,
    databaseReachable: false,
    authStatus: 'prepared' as const,
    storageStatus: 'prepared' as const,
    edgeFunctionsStatus: 'prepared' as const,
    lastChecked: 'Loading',
    healthStatus: 'prepared' as const,
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

function formatHealth(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function healthTone(status: string): 'neutral' | 'good' | 'warn' {
  if (status === 'healthy' || status === 'prepared' || status === 'reachable') {
    return 'good';
  }

  if (status === 'warning' || status === 'critical' || status === 'protected' || status === 'missing') {
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

function modeLabel(mode: IntegrationSnapshot['effectiveMode']): string {
  if (mode === 'live') {
    return 'Live Read-Only Mode';
  }

  if (mode === 'fallback') {
    return 'Live With Fallback';
  }

  return 'Mock Mode';
}

export default App;
