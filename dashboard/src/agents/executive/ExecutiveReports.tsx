import { Download } from 'lucide-react';
import type { ReportFormat } from '../../storage/reportExport';
import { downloadReport } from '../../storage/reportExport';
import { buildExecutiveReport } from './executiveSummary';
import type { ExecutiveReportContext, ExecutiveReportDefinition } from './executiveTypes';

const reports: ExecutiveReportDefinition[] = [
  { description: 'Platform snapshot with priorities and health.', format: 'json', kind: 'summary', label: 'Executive Summary JSON' },
  { description: 'Markdown summary for human review.', format: 'markdown', kind: 'summary', label: 'Executive Summary Markdown' },
  { description: 'Daily cross-agent operations rollup.', format: 'markdown', kind: 'daily', label: 'Daily Operations Report' },
  { description: 'Approval queue and risk view.', format: 'markdown', kind: 'approval', label: 'Approval Report' },
  { description: 'Shared runtime registry and memory state.', format: 'markdown', kind: 'runtime', label: 'Runtime Report' },
  { description: 'Engineering Agent operating summary.', format: 'markdown', kind: 'engineering', label: 'Engineering Summary' },
  { description: 'Migration Agent operating summary.', format: 'markdown', kind: 'migration', label: 'Migration Summary' },
];

export function ExecutiveReports({ context }: { context: ExecutiveReportContext }) {
  const exportReport = (definition: ExecutiveReportDefinition) => {
    downloadReport(buildExecutiveReport(definition.kind, context), definition.format as ReportFormat);
  };

  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Download size={18} />
          <h2>Executive Reports</h2>
        </div>
        <span>Local export only</span>
      </div>
      <div className="report-grid executive-report-grid">
        {reports.map((report) => (
          <button className="report-button" key={`${report.kind}-${report.format}`} onClick={() => exportReport(report)} type="button">
            <Download size={16} />
            <span>{report.label}</span>
            <small>{report.description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
