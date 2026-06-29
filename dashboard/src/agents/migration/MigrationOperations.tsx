import { CheckCircle2, Download, FileClock, Network, ShieldCheck, Trash2, Workflow } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { RiskBadge } from '../../components/RiskBadge';
import { StatusBadge } from '../../components/StatusBadge';
import type { SupabaseTableCheck } from '../../integrations/supabase/supabaseTypes';
import type { ApprovalItem } from '../../state/approvalStore';
import type { ReportFormat } from '../../storage/reportExport';
import type { ApprovalHistoryEntry, MigrationDryRunRecord } from '../../types/localRecords';
import { formatHealth, tableTone } from './migrationDisplay';
import { migrationRules } from './migrationRules';
import type { MigrationSummary } from './migrationTypes';

export function MigrationPanel({
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

export function MigrationDataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
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

export function MigrationFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function MigrationExportButtons({
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

export function MigrationSummaryCards({ summary }: { summary: MigrationSummary }) {
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
    <section className="summary-grid migration-summary" aria-label="Migration summary">
      {summaryCards.map(([label, value]) => (
        <article className="metric-card" key={label}>
          <CheckCircle2 size={20} />
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

export function MigrationDryRunPanel({ lastDryRunAt, onDryRun }: { lastDryRunAt: string | null; onDryRun: () => void }) {
  return (
    <MigrationPanel title="Migration Agent Dry Run" icon={<Workflow size={18} />} wide>
      <div className="dry-run-panel">
        <div>
          <strong>Local dry run only. No production changes made.</strong>
          <p>
            Validates mock member imports, records local agent run state, and appends local audit history. It does not write
            to Supabase, call AI, send invitations, or create real organization memberships.
          </p>
          <small>{lastDryRunAt ? `Last dry run: ${formatDate(lastDryRunAt)}` : 'No migration dry run yet.'}</small>
        </div>
        <div className="button-row end-row">
          <button className="approval-button compact-button" onClick={onDryRun} type="button">
            Run Migration Agent Dry Run
          </button>
        </div>
      </div>
    </MigrationPanel>
  );
}

export function MigrationHistoryPanel({ dryRuns }: { dryRuns: MigrationDryRunRecord[] }) {
  return (
    <MigrationPanel title="Migration Queue History" icon={<FileClock size={18} />} wide>
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
    </MigrationPanel>
  );
}

export function MigrationRulesPanel() {
  return (
    <MigrationPanel title="Critical Migration Rules" icon={<ShieldCheck size={18} />}>
      <div className="rule-list">
        {migrationRules.map((rule) => (
          <p key={rule}>{rule}</p>
        ))}
      </div>
    </MigrationPanel>
  );
}

export function MigrationTableReadiness({ expectedTables }: { expectedTables: SupabaseTableCheck[] }) {
  return (
    <MigrationPanel title="Migration Table Readiness" icon={<Network size={18} />} wide>
      <MigrationDataTable
        columns={['Expected Table', 'Status', 'Detail']}
        rows={expectedTables.map((table) => [
          table.tableName,
          <StatusBadge key={table.tableName} value={formatHealth(table.status)} tone={tableTone(table.status)} />,
          table.detail,
        ])}
      />
    </MigrationPanel>
  );
}

export function MigrationApprovalQueuePanel({
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
    <MigrationPanel title="Approval Queue Foundation" icon={<ShieldCheck size={18} />} wide>
      <div className="toolbar-row">
        <p className="panel-copy">Mock approval decisions persist locally and are exportable for review.</p>
        <div className="button-row">
          <MigrationExportButtons disabled={!history.length} onExport={onExportHistory} />
          <button className="clear-button" disabled={!history.length} onClick={onClearHistory} type="button">
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        </div>
      </div>
      <MigrationDataTable
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
    </MigrationPanel>
  );
}

export function MigrationGymReviewChecklist() {
  const checklistItems = [
    'Duplicates reviewed',
    'Missing info reviewed',
    'Existing user matches reviewed',
    'Pending profiles reviewed',
    'Offline members reviewed',
    'Invitations prepared',
    'Organization memberships ready',
  ];

  return (
    <MigrationPanel title="Gym Review Checklist" icon={<CheckCircle2 size={18} />}>
      <div className="checklist">
        {checklistItems.map((item) => (
          <label key={item}>
            <input checked readOnly type="checkbox" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </MigrationPanel>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
