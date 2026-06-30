import { CircleDot } from 'lucide-react';
import { RiskBadge } from '../../components/RiskBadge';
import { StatusBadge } from '../../components/StatusBadge';
import type { ExecutiveHealthRow } from './executiveTypes';

export function ExecutiveHealth({
  healthRows,
  onNavigate,
}: {
  healthRows: ExecutiveHealthRow[];
  onNavigate(_page: string): void;
}) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <CircleDot size={18} />
          <h2>Executive Health</h2>
        </div>
        <span>{healthRows.length} departments</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Risk</th>
              <th>Last Activity</th>
              <th>Tasks</th>
              <th>Workflows</th>
              <th>Approvals</th>
              <th>Warnings</th>
              <th>Errors</th>
              <th>Sync</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {healthRows.map((row) => (
              <tr key={row.agentId}>
                <td>
                  <strong>{row.agent}</strong>
                </td>
                <td>
                  <RiskBadge risk={row.risk} />
                </td>
                <td>{row.lastActivity}</td>
                <td>{row.pendingTasks}</td>
                <td>{row.workflowCount}</td>
                <td>{row.approvalCount}</td>
                <td>{row.warnings}</td>
                <td>{row.errors}</td>
                <td>
                  <StatusBadge value={row.syncStatus} tone={row.syncStatus === 'failed' ? 'warn' : 'neutral'} />
                </td>
                <td>
                  <button className="report-button small" onClick={() => onNavigate(row.navigationTarget)} type="button">
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
