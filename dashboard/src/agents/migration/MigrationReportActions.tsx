import { Download, Trash2 } from 'lucide-react';
import type { ReportFormat } from '../../storage/reportExport';
import { MigrationExportButtons, MigrationPanel } from './MigrationOperations';

export function MigrationReportActions({
  disabled,
  onClearDryRuns,
  onExportDryRun,
}: {
  disabled: boolean;
  onClearDryRuns(): void;
  onExportDryRun(_format: ReportFormat): void;
}) {
  return (
    <MigrationPanel title="Export Migration Report" icon={<Download size={18} />} wide>
      <div className="split-panel">
        <p className="panel-copy">
          Export the latest local dry-run report for review. Reports are generated in the browser and do not write to
          Supabase, send invitations, or finalize memberships.
        </p>
        <div className="button-row end-row">
          <MigrationExportButtons disabled={disabled} onExport={onExportDryRun} />
          <button className="clear-button" disabled={disabled} onClick={onClearDryRuns} type="button">
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </MigrationPanel>
  );
}
