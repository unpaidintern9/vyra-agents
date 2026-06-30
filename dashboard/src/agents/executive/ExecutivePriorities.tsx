import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { RiskBadge } from '../../components/RiskBadge';
import type { ExecutivePriority } from './executiveTypes';

export function ExecutivePriorities({
  onNavigate,
  priorities,
}: {
  onNavigate(_page: string): void;
  priorities: ExecutivePriority[];
}) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <AlertTriangle size={18} />
          <h2>Executive Priorities</h2>
        </div>
        <span>{priorities.length} deterministic rule signal(s)</span>
      </div>
      {priorities.length ? (
        <div className="executive-priority-list">
          {priorities.map((priority) => (
            <article className="approval-item" key={priority.id}>
              <div>
                <strong>{priority.detail}</strong>
                <span>
                  {priority.agent} · {priority.source} · {priority.recommendedAction}
                </span>
              </div>
              <div className="button-row compact-row">
                <RiskBadge risk={priority.priority} />
                <button className="report-button small" onClick={() => onNavigate(targetForDepartment(priority.department))} type="button">
                  Open
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="No executive priorities are active." />
      )}
    </section>
  );
}

function targetForDepartment(department: string): string {
  const normalized = department.toLowerCase();
  if (normalized.includes('engineering')) return 'Engineering';
  if (normalized.includes('migration')) return 'Migration';
  if (normalized.includes('product')) return 'Products';
  return 'Runtime';
}
