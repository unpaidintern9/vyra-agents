import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  GitBranch,
  ListChecks,
  Network,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { existingVyraUsers, importedMembers, migrationBatch } from './agents/migration/migrationMockData';
import { summarizeMigration } from './agents/migration/migrationSummary';
import { validateMigrationMembers } from './agents/migration/migrationValidation';
import { matchMigrationMembers } from './agents/migration/memberMatching';
import {
  agents,
  approvals,
  ecosystemNodes,
  integrations,
  migrationStatus,
  navItems,
  priorities,
  recentActivity,
  repositories,
  summaryStats,
  systemHealth,
  workflows,
} from './data';

function App() {
  const [activePage, setActivePage] = useState('Overview');
  const [reviewApproved, setReviewApproved] = useState(false);
  const migrationIssues = useMemo(() => validateMigrationMembers(importedMembers), []);
  const memberMatches = useMemo(() => matchMigrationMembers(importedMembers, existingVyraUsers), []);
  const migrationSummary = useMemo(
    () => summarizeMigration(importedMembers, migrationIssues, memberMatches),
    [memberMatches, migrationIssues],
  );

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
                ? 'Local migration staging, validation, matching, offline member handling, and gym review flow for Derby City Martial Arts.'
                : 'A local MVP for monitoring the Vyra ecosystem, preparing agent responsibilities, and staging future workflow automation without touching production systems.'}
            </p>
          </div>
          <div className="hero-status">
            <ShieldCheck size={22} />
            <span>Mock data only</span>
          </div>
        </header>

        {activePage === 'Migration' ? (
          <MigrationPage
            approved={reviewApproved}
            issues={migrationIssues}
            matches={memberMatches}
            onApprove={() => setReviewApproved(true)}
            summary={migrationSummary}
          />
        ) : (
          <OverviewPage />
        )}
      </main>
    </div>
  );
}

function OverviewPage() {
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
            {repositories.map((repo) => (
              <div className="row-item compact" key={repo.name}>
                <div>
                  <strong>{repo.name}</strong>
                  <span>{repo.branch}</span>
                </div>
                <Badge value={repo.state} tone={repo.signal === 'warn' ? 'warn' : 'good'} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Integration Status" icon={<Network size={18} />}>
          <div className="integration-grid">
            {integrations.map(([name, status]) => (
              <div className="integration-pill" key={name}>
                <span>{name}</span>
                <small>{status}</small>
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
  issues,
  matches,
  onApprove,
  summary,
}: {
  approved: boolean;
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

function Badge({ value, tone = 'neutral' }: { value: string; tone?: 'neutral' | 'good' | 'warn' }) {
  return <span className={`badge ${tone}`}>{value}</span>;
}

export default App;
