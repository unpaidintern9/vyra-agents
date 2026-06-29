import { AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { MigrationDataTable, MigrationPanel } from './MigrationOperations';
import type { ValidationIssue } from './migrationTypes';

export function MigrationValidationResolution({ issues }: { issues: ValidationIssue[] }) {
  return (
    <MigrationPanel title="Validation Issue Resolution" icon={<AlertTriangle size={18} />} wide>
      <MigrationDataTable
        columns={['Member', 'Issue', 'Severity', 'Recommended Resolution', 'Resolution State']}
        rows={issues.slice(0, 12).map((issue) => [
          issue.memberName,
          issue.issue,
          <StatusBadge key={issue.issue} value={issue.severity} tone={issue.severity === 'error' ? 'warn' : 'neutral'} />,
          issue.recommendedAction,
          issue.status,
        ])}
      />
    </MigrationPanel>
  );
}
