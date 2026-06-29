export type ReportFormat = 'json' | 'markdown';

export interface ReportSection {
  title: string;
  summary?: Record<string, unknown>;
  rows?: object[];
  notes?: string[];
}

export interface LocalReport {
  title: string;
  slug: string;
  summary?: Record<string, unknown>;
  rows?: object[];
  sections?: ReportSection[];
}

const safetyNote = 'No production writes were made.';
const source = 'local dashboard state';

export function downloadReport(report: LocalReport, format: ReportFormat): void {
  const generatedAt = new Date().toISOString();
  const payload = {
    title: report.title,
    generatedAt,
    source,
    safetyNote,
    summary: report.summary ?? {},
    rows: report.rows ?? [],
    sections: report.sections ?? [],
  };
  const content = format === 'json' ? JSON.stringify(payload, null, 2) : toMarkdown(payload);
  const type = format === 'json' ? 'application/json' : 'text/markdown';
  const extension = format === 'json' ? 'json' : 'md';
  const date = generatedAt.slice(0, 10);
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.slug}-${date}.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toMarkdown(payload: {
  title: string;
  generatedAt: string;
  source: string;
  safetyNote: string;
  summary: Record<string, unknown>;
  rows: object[];
  sections: ReportSection[];
}): string {
  const lines = [
    `# ${payload.title}`,
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    `Source: ${payload.source}`,
    '',
    `Safety note: ${payload.safetyNote}`,
    '',
  ];

  appendRecord(lines, 'Summary', payload.summary);
  appendRows(lines, 'Details', payload.rows);

  payload.sections.forEach((section) => {
    lines.push(`## ${section.title}`, '');
    if (section.summary) {
      appendRecord(lines, 'Summary', section.summary, 3);
    }
    if (section.notes?.length) {
      section.notes.forEach((note) => lines.push(`- ${note}`));
      lines.push('');
    }
    if (section.rows?.length) {
      appendRows(lines, 'Rows', section.rows, 3);
    }
  });

  return `${lines.join('\n').trim()}\n`;
}

function appendRecord(lines: string[], title: string, record: Record<string, unknown>, level = 2): void {
  const entries = Object.entries(record);
  if (!entries.length) {
    return;
  }
  lines.push(`${'#'.repeat(level)} ${title}`, '');
  entries.forEach(([key, value]) => lines.push(`- ${labelize(key)}: ${formatValue(value)}`));
  lines.push('');
}

function appendRows(lines: string[], title: string, rows: object[], level = 2): void {
  if (!rows.length) {
    return;
  }
  lines.push(`${'#'.repeat(level)} ${title}`, '');
  rows.forEach((row, index) => {
    lines.push(`### ${title} ${index + 1}`);
    Object.entries(row).forEach(([key, value]) => lines.push(`- ${labelize(key)}: ${formatValue(value)}`));
    lines.push('');
  });
}

function labelize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
