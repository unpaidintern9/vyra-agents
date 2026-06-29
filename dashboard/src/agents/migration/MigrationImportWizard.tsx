import { Download, FileSpreadsheet, PlayCircle, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { localStorageKeys } from '../../storage/localStorageKeys';
import { loadLocalState, saveLocalState } from '../../storage/localStorageStore';
import { fieldLabel, importFieldOptions, requiredImportFields, detectFieldMapping } from './importWizardFields';
import { importLimitsSummary } from './importWizardLimits';
import { isSupportedMigrationFile, parseMigrationFile } from './importWizardParser';
import { escapeMarkdownCell, escapeSpreadsheetFormula } from './importWizardSanitize';
import type {
  ImportFieldKey,
  ImportReviewFilter,
  ImportValidationResult,
  ImportWizardStep,
  MigrationImportWizardState,
} from './importWizardTypes';
import { issuesForMember, validateImportedRows } from './importWizardValidation';
import { existingVyraUsers } from './migrationMockData';
import { matchMigrationMembers } from './memberMatching';
import { memberName } from './migrationDisplay';
import { MigrationDataTable, MigrationExportButtons, MigrationFact, MigrationPanel } from './MigrationOperations';
import type { ImportedMember, ValidationIssue } from './migrationTypes';

const wizardSteps: Array<{ key: ImportWizardStep; label: string }> = [
  { key: 'select-file', label: 'Select File' },
  { key: 'detect-columns', label: 'Detect Columns' },
  { key: 'map-fields', label: 'Map Fields' },
  { key: 'validate-data', label: 'Validate Data' },
  { key: 'review-results', label: 'Review Results' },
  { key: 'ready-for-review', label: 'Ready For Migration Review' },
];

const emptyWizardState: MigrationImportWizardState = {
  columns: [],
  fieldMappings: {},
  fileMetadata: null,
  parserErrors: [],
  parserWarnings: [],
  parsedRows: [],
  sanitizedCellCount: 0,
  step: 'select-file',
  validation: null,
};

export default function MigrationImportWizard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [wizardState, setWizardState] = useState(() => loadImportWizardState());
  const [error, setError] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ImportReviewFilter>('all');
  const mappingHealth = useMemo(() => mappingStatus(wizardState.columns, wizardState.fieldMappings), [wizardState.columns, wizardState.fieldMappings]);
  const reviewRows = useMemo(
    () => filterReviewRows(wizardState.validation, reviewFilter),
    [reviewFilter, wizardState.validation],
  );

  useEffect(() => {
    saveLocalState(localStorageKeys.migrationImportWizard, wizardState);
  }, [wizardState]);

  const updateState = (updates: Partial<MigrationImportWizardState>) => {
    setWizardState((current) => ({ ...current, ...updates }));
  };

  const handleFile = async (file: File) => {
    setError(null);
    if (!isSupportedMigrationFile(file)) {
      setError('Unsupported file type. Upload a CSV, XLSX, or XLS file.');
      updateState({ parserErrors: ['Unsupported file type. Upload a CSV, XLSX, or XLS file.'] });
      return;
    }

    try {
      const parsed = await parseMigrationFile(file);
      const fieldMappings = parsed.columns.reduce<Record<string, ImportFieldKey>>((mappings, column) => {
        mappings[column] = detectFieldMapping(column);
        return mappings;
      }, {});
      const recognizableColumns = Object.values(fieldMappings).filter((field) => field !== 'ignore').length;
      const parserWarnings = recognizableColumns
        ? parsed.parserWarnings
        : [...parsed.parserWarnings, 'No recognizable migration columns were detected automatically. Review field mappings before validating.'];
      updateState({
        columns: parsed.columns,
        fieldMappings,
        fileMetadata: {
          filename: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'Unknown',
          uploadedAt: new Date().toISOString(),
        },
        parserErrors: [],
        parserWarnings,
        parsedRows: parsed.rows,
        sanitizedCellCount: parsed.sanitizedCellCount,
        step: 'detect-columns',
        validation: null,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to parse this import file.';
      setError(message);
      updateState({
        columns: [],
        fieldMappings: {},
        fileMetadata: {
          filename: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'Unknown',
          uploadedAt: new Date().toISOString(),
        },
        parserErrors: [message],
        parserWarnings: [],
        parsedRows: [],
        sanitizedCellCount: 0,
        step: 'select-file',
        validation: null,
      });
    }
  };

  const removeFile = () => {
    setError(null);
    setReviewFilter('all');
    setWizardState(emptyWizardState);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runValidation = () => {
    const validation = validateImportedRows(wizardState.parsedRows, wizardState.fieldMappings);
    updateState({ step: 'review-results', validation });
  };

  const markReadyForReview = () => updateState({ step: 'ready-for-review' });

  const setFieldMapping = (column: string, field: ImportFieldKey) => {
    updateState({
      fieldMappings: {
        ...wizardState.fieldMappings,
        [column]: field,
      },
      step: 'map-fields',
      validation: null,
    });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const loadSampleCsv = () => {
    const file = new File([sampleCsv], 'sample-migration-import.csv', { type: 'text/csv' });
    void handleFile(file);
  };

  const loadSampleExcel = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.aoa_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new File([bytes], 'sample-migration-import.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    void handleFile(file);
  };

  return (
    <MigrationPanel title="Import Wizard" icon={<FileSpreadsheet size={18} />} wide>
      <div className="wizard-layout">
        <div className="wizard-steps" aria-label="Migration import wizard steps">
          {wizardSteps.map((step, index) => (
            <button
              className={wizardState.step === step.key ? 'wizard-step active' : 'wizard-step'}
              disabled={!canVisitStep(step.key, wizardState)}
              key={step.key}
              onClick={() => updateState({ step: step.key })}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          ))}
        </div>

        <div className="wizard-body">
          <div className="safety-strip">
            <StatusBadge value="Local Only" tone="neutral" />
            <span>No Supabase writes, no production data changes, no pending profiles, no memberships, no invitations. Raw file binaries are never stored.</span>
          </div>

          {error ? <p className="wizard-error">{error}</p> : null}

          <section
            className="upload-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            aria-label="Drag and drop migration import file"
          >
            <UploadCloud size={28} />
            <div>
              <strong>Migration Import</strong>
              <p>Choose File or drag and drop a CSV, XLSX, or XLS member export. CSV is recommended and parsed natively.</p>
              <small>Limits: {importLimitsSummary()}.</small>
            </div>
            <input
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={onFileChange}
              ref={fileInputRef}
              type="file"
            />
            <div className="button-row end-row">
              <button className="report-button" onClick={() => fileInputRef.current?.click()} type="button">
                Choose File
              </button>
              <button className="report-button" onClick={loadSampleCsv} type="button">
                Load Sample CSV
              </button>
              <button className="report-button" onClick={() => void loadSampleExcel()} type="button">
                Load Sample Excel
              </button>
              <button className="clear-button" disabled={!wizardState.fileMetadata} onClick={removeFile} type="button">
                <Trash2 size={15} />
                <span>Remove File</span>
              </button>
            </div>
          </section>

          <div className="batch-grid import-meta-grid">
            <MigrationFact label="Filename" value={wizardState.fileMetadata?.filename ?? 'No file selected'} />
            <MigrationFact label="File Size" value={wizardState.fileMetadata ? formatBytes(wizardState.fileMetadata.fileSize) : '0 KB'} />
            <MigrationFact label="Rows Detected" value={String(wizardState.parsedRows.length)} />
            <MigrationFact label="Columns Detected" value={String(wizardState.columns.length)} />
            <MigrationFact label="Upload Time" value={wizardState.fileMetadata ? formatDate(wizardState.fileMetadata.uploadedAt) : 'Not uploaded'} />
            <MigrationFact label="Parser" value={wizardState.fileMetadata?.filename.endsWith('.csv') ? 'Native CSV, browser-local' : 'Excel boundary, browser-local'} />
            <MigrationFact label="Sanitized Values" value={String(wizardState.sanitizedCellCount)} />
          </div>

          <WizardParserMessages errors={wizardState.parserErrors} warnings={wizardState.parserWarnings} />

          {wizardState.columns.length ? (
            <>
              <WizardColumnDetection columns={wizardState.columns} fieldMappings={wizardState.fieldMappings} />
              <WizardFieldMapping
                duplicateFields={mappingHealth.duplicateFields}
                fieldMappings={wizardState.fieldMappings}
                missingRequired={mappingHealth.missingRequired}
                onChange={setFieldMapping}
                columns={wizardState.columns}
              />
              <WizardValidationControls
                canValidate={!mappingHealth.missingRequired.length}
                mappingHealth={mappingHealth}
                onReady={markReadyForReview}
                onRunValidation={runValidation}
                validation={wizardState.validation}
              />
              {wizardState.validation ? (
                <WizardReview
                  filter={reviewFilter}
                  onExport={(format) => exportValidationReport(format, wizardState)}
                  onFilter={setReviewFilter}
                  rows={reviewRows}
                  validation={wizardState.validation}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </MigrationPanel>
  );
}

function loadImportWizardState(): MigrationImportWizardState {
  const stored = loadLocalState<Partial<MigrationImportWizardState>>(localStorageKeys.migrationImportWizard, () => ({}));
  return {
    ...emptyWizardState,
    ...stored,
    columns: Array.isArray(stored.columns) ? stored.columns : [],
    fieldMappings: stored.fieldMappings && typeof stored.fieldMappings === 'object' ? stored.fieldMappings : {},
    parserErrors: Array.isArray(stored.parserErrors) ? stored.parserErrors : [],
    parserWarnings: Array.isArray(stored.parserWarnings) ? stored.parserWarnings : [],
    parsedRows: Array.isArray(stored.parsedRows) ? stored.parsedRows : [],
    sanitizedCellCount: typeof stored.sanitizedCellCount === 'number' ? stored.sanitizedCellCount : 0,
    validation: stored.validation ?? null,
  };
}

function WizardColumnDetection({
  columns,
  fieldMappings,
}: {
  columns: string[];
  fieldMappings: Record<string, ImportFieldKey>;
}) {
  return (
    <div className="section-gap">
      <h3>Detect Columns</h3>
      <p className="subtle-note">Common gym export columns are mapped automatically. Unknown columns stay unmapped until reviewed.</p>
      <div className="column-chip-grid">
        {columns.map((column) => (
          <div className="column-chip" key={column}>
            <strong>{column}</strong>
            <StatusBadge value={fieldMappings[column] === 'ignore' ? 'Unmapped' : fieldLabel(fieldMappings[column])} tone={fieldMappings[column] === 'ignore' ? 'neutral' : 'good'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WizardParserMessages({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (!errors.length && !warnings.length) return null;
  return (
    <div className="section-gap parser-message-grid">
      {errors.length ? (
        <div className="parser-message parser-error">
          <strong>Import errors</strong>
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
      {warnings.length ? (
        <div className="parser-message parser-warning">
          <strong>Parser warnings</strong>
          {warnings.slice(0, 6).map((message) => (
            <p key={message}>{message}</p>
          ))}
          {warnings.length > 6 ? <small>{warnings.length - 6} more parser warning(s) hidden for readability.</small> : null}
        </div>
      ) : null}
    </div>
  );
}

function WizardFieldMapping({
  columns,
  duplicateFields,
  fieldMappings,
  missingRequired,
  onChange,
}: {
  columns: string[];
  duplicateFields: ImportFieldKey[];
  fieldMappings: Record<string, ImportFieldKey>;
  missingRequired: ImportFieldKey[];
  onChange(_column: string, _field: ImportFieldKey): void;
}) {
  return (
    <div className="section-gap">
      <div className="toolbar-row">
        <div>
          <h3>Map Fields</h3>
          <p className="subtle-note">Each detected column can be mapped to a migration field or ignored.</p>
        </div>
        <div className="button-row">
          <StatusBadge value={`${columns.length - unmappedCount(fieldMappings)} Mapped`} tone="good" />
          <StatusBadge value={`${unmappedCount(fieldMappings)} Unmapped`} />
          <StatusBadge value={`${duplicateFields.length} Duplicate Mapping`} tone={duplicateFields.length ? 'warn' : 'good'} />
          <StatusBadge value={`${missingRequired.length} Missing Required`} tone={missingRequired.length ? 'warn' : 'good'} />
        </div>
      </div>
      <MigrationDataTable
        columns={['Detected Column', 'Map To', 'Status']}
        rows={columns.map((column) => {
          const field = fieldMappings[column] ?? 'ignore';
          const isDuplicate = field !== 'ignore' && duplicateFields.includes(field);
          return [
            column,
            <select
              aria-label={`Map ${column}`}
              className="mapping-select"
              key={`${column}-select`}
              onChange={(event) => onChange(column, event.target.value as ImportFieldKey)}
              value={field}
            >
              {importFieldOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>,
            <StatusBadge
              key={`${column}-status`}
              value={field === 'ignore' ? 'Unmapped' : isDuplicate ? 'Duplicate Mapping' : 'Mapped'}
              tone={field === 'ignore' ? 'neutral' : isDuplicate ? 'warn' : 'good'}
            />,
          ];
        })}
      />
      {missingRequired.length ? (
        <p className="wizard-error">Missing required mapping: {missingRequired.map(fieldLabel).join(', ')}.</p>
      ) : null}
    </div>
  );
}

function WizardValidationControls({
  canValidate,
  mappingHealth,
  onReady,
  onRunValidation,
  validation,
}: {
  canValidate: boolean;
  mappingHealth: ReturnType<typeof mappingStatus>;
  onReady(): void;
  onRunValidation(): void;
  validation: ImportValidationResult | null;
}) {
  return (
    <div className="section-gap validation-action-panel">
      <div>
        <h3>Validate Data</h3>
        <p className="subtle-note">Validation reuses the existing Migration Agent rules locally. No writes or external calls are made.</p>
        <div className="button-row">
          <StatusBadge value={mappingHealth.missingRequired.length ? 'Missing Required' : 'Mapping Ready'} tone={mappingHealth.missingRequired.length ? 'warn' : 'good'} />
          <StatusBadge value={validation ? `Validated ${formatDate(validation.validatedAt)}` : 'Not Validated'} />
        </div>
      </div>
      <div className="button-row end-row">
        <button className="approval-button compact-button" disabled={!canValidate} onClick={onRunValidation} type="button">
          <PlayCircle size={15} />
          Run Migration Validation
        </button>
        <button className="report-button" disabled={!validation} onClick={onReady} type="button">
          Ready For Migration Review
        </button>
      </div>
    </div>
  );
}

function WizardReview({
  filter,
  onExport,
  onFilter,
  rows,
  validation,
}: {
  filter: ImportReviewFilter;
  onExport(_format: 'json' | 'markdown' | 'csv'): void;
  onFilter(_filter: ImportReviewFilter): void;
  rows: ReviewRow[];
  validation: ImportValidationResult;
}) {
  const warningCount = validation.issues.filter((issue) => issue.severity !== 'error').length;
  const errorCount = validation.issues.filter((issue) => issue.severity === 'error').length;
  return (
    <div className="section-gap">
      <div className="toolbar-row">
        <div>
          <h3>Review Results</h3>
          <p className="subtle-note">Imported members are shown as the gym would review them before any future migration approval.</p>
        </div>
        <div className="button-row end-row">
          <MigrationExportButtons disabled={false} onExport={onExport} />
          <button className="report-button" onClick={() => onExport('csv')} type="button">
            <Download size={15} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="summary-grid compact-summary import-review-summary">
        <ReviewMetric label="Imported" value={validation.importedMembers.length} />
        <ReviewMetric label="Warnings" value={warningCount} />
        <ReviewMetric label="Errors" value={errorCount} />
        <ReviewMetric label="Ready" value={validation.readyMemberIds.length} />
        <ReviewMetric label="Skipped" value={validation.skippedRows.length} />
      </div>

      <div className="filter-row">
        {(['all', 'errors', 'warnings', 'ready', 'skipped'] as ImportReviewFilter[]).map((candidate) => (
          <button className={filter === candidate ? 'report-button active-filter' : 'report-button'} key={candidate} onClick={() => onFilter(candidate)} type="button">
            {labelize(candidate)}
          </button>
        ))}
      </div>

      <MigrationDataTable
        columns={['Name', 'Email', 'Phone', 'Status', 'Validation Result', 'Existing Match (mock)', 'Pending Profile (mock)', 'Offline Member (mock)']}
        rows={rows.map((row) => [
          row.name,
          row.email,
          row.phone,
          row.status,
          <StatusBadge key={`${row.id}-validation`} value={row.validationLabel} tone={row.validationTone} />,
          row.existingMatch,
          row.pendingProfile,
          row.offlineMember,
        ])}
      />
    </div>
  );
}

function ReviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric-card">
      <FileSpreadsheet size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

interface ReviewRow {
  email: string;
  existingMatch: string;
  id: string;
  name: string;
  offlineMember: string;
  pendingProfile: string;
  phone: string;
  status: string;
  validationLabel: string;
  validationTone: 'neutral' | 'good' | 'warn';
}

function filterReviewRows(validation: ImportValidationResult | null, filter: ImportReviewFilter): ReviewRow[] {
  if (!validation) return [];
  const memberRows = validation.importedMembers.map((member) => reviewRow(member, validation.issues));
  const skippedRows = validation.skippedRows.map<ReviewRow>((row) => ({
    email: '',
    existingMatch: 'No',
    id: `skipped-${row.rowNumber}`,
    name: `Row ${row.rowNumber}`,
    offlineMember: 'No',
    pendingProfile: 'No',
    phone: '',
    status: 'Skipped',
    validationLabel: row.reason,
    validationTone: 'neutral',
  }));
  const allRows = [...memberRows, ...skippedRows];
  if (filter === 'all') return allRows;
  if (filter === 'skipped') return skippedRows;
  return memberRows.filter((row) =>
    filter === 'errors'
      ? row.validationLabel.includes('error')
      : filter === 'warnings'
        ? row.validationLabel.includes('warning') || row.validationLabel.includes('review')
        : row.validationLabel === 'Ready',
  );
}

function reviewRow(member: ImportedMember, issues: ValidationIssue[]): ReviewRow {
  const memberIssues = issuesForMember(issues, member.id);
  const hasError = memberIssues.some((issue) => issue.severity === 'error');
  const hasWarning = memberIssues.some((issue) => issue.severity !== 'error');
  const match = matchMigrationMembers([member], existingVyraUsers)[0];
  return {
    email: member.email || 'No email',
    existingMatch: match?.matchType === 'existing_vyra_user' ? 'Yes' : 'No',
    id: member.id,
    name: memberName(member),
    offlineMember: match?.memberState === 'offline_non_app_member' ? 'Yes' : 'No',
    pendingProfile: match?.memberState === 'pending_app_user' ? 'Mock only' : 'No',
    phone: member.phone || 'No phone',
    status: member.membershipStatus,
    validationLabel: hasError ? `${memberIssues.filter((issue) => issue.severity === 'error').length} error(s)` : hasWarning ? `${memberIssues.length} warning/review` : 'Ready',
    validationTone: hasError ? 'warn' : hasWarning ? 'neutral' : 'good',
  };
}

function mappingStatus(columns: string[], mappings: Record<string, ImportFieldKey>) {
  const mappedFields = columns
    .map((column) => mappings[column])
    .filter((field): field is Exclude<ImportFieldKey, 'ignore'> => Boolean(field) && field !== 'ignore');
  const duplicateFields = mappedFields.filter((field, index) => mappedFields.indexOf(field) !== index);
  const missingRequired = requiredImportFields.filter((field) => !mappedFields.includes(field));
  return {
    duplicateFields: [...new Set(duplicateFields)],
    missingRequired,
  };
}

function unmappedCount(mappings: Record<string, ImportFieldKey>): number {
  return Object.values(mappings).filter((field) => field === 'ignore').length;
}

function canVisitStep(step: ImportWizardStep, state: MigrationImportWizardState): boolean {
  if (step === 'select-file') return true;
  if (!state.fileMetadata) return false;
  if (step === 'detect-columns' || step === 'map-fields' || step === 'validate-data') return true;
  if (step === 'review-results') return Boolean(state.validation);
  return Boolean(state.validation);
}

function exportValidationReport(format: 'json' | 'markdown' | 'csv', state: MigrationImportWizardState): void {
  if (!state.validation) return;
  const rows = filterReviewRows(state.validation, 'all');
  const summary = {
    filename: state.fileMetadata?.filename ?? 'Unknown',
    rowsDetected: state.parsedRows.length,
    columnsDetected: state.columns.length,
    imported: state.validation.importedMembers.length,
    warnings: state.validation.issues.filter((issue) => issue.severity !== 'error').length,
    errors: state.validation.issues.filter((issue) => issue.severity === 'error').length,
    ready: state.validation.readyMemberIds.length,
    skipped: state.validation.skippedRows.length,
    sanitizedValues: state.sanitizedCellCount,
    productionWritesOccurred: 'No',
  };
  const mappingRows = Object.entries(state.fieldMappings).map(([column, field]) => ({ column, mappedTo: fieldLabel(field) }));
  const payload = {
    generatedAt: new Date().toISOString(),
    safetyNote: 'Local validation report only. No production writes were made.',
    summary,
    fieldMapping: mappingRows,
    parserWarnings: state.parserWarnings,
    warningsAndErrors: state.validation.issues,
    readyMembers: state.validation.importedMembers.filter((member) => state.validation?.readyMemberIds.includes(member.id)),
    skippedRows: state.validation.skippedRows,
    reviewRows: rows,
  };
  if (format === 'csv') {
    downloadBlob('vyra-migration-validation-report.csv', toCsv(rows), 'text/csv');
    return;
  }
  const content = format === 'json' ? JSON.stringify(payload, null, 2) : validationMarkdown(payload);
  downloadBlob(`vyra-migration-validation-report.${format === 'json' ? 'json' : 'md'}`, content, format === 'json' ? 'application/json' : 'text/markdown');
}

function validationMarkdown(payload: {
  generatedAt: string;
  safetyNote: string;
  summary: Record<string, unknown>;
  fieldMapping: Array<Record<string, string>>;
  parserWarnings: string[];
  warningsAndErrors: ValidationIssue[];
  readyMembers: ImportedMember[];
  skippedRows: Array<{ reason: string; rowNumber: number }>;
  reviewRows: ReviewRow[];
}): string {
  return [
    '# Migration Validation Report',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    `Safety note: ${payload.safetyNote}`,
    '',
    '## Import Summary',
    ...Object.entries(payload.summary).map(([key, value]) => `- ${escapeMarkdownCell(labelize(key))}: ${escapeMarkdownCell(String(value))}`),
    '',
    '## Field Mapping',
    ...payload.fieldMapping.map((row) => `- ${escapeMarkdownCell(row.column)}: ${escapeMarkdownCell(row.mappedTo)}`),
    '',
    '## Parser Warnings',
    ...(payload.parserWarnings.length ? payload.parserWarnings.map((warning) => `- ${escapeMarkdownCell(warning)}`) : ['- None']),
    '',
    '## Warnings And Errors',
    ...(payload.warningsAndErrors.length ? payload.warningsAndErrors.map((issue) => `- ${escapeMarkdownCell(issue.memberName)}: ${escapeMarkdownCell(issue.issue)} (${escapeMarkdownCell(issue.severity)})`) : ['- None']),
    '',
    '## Ready Members',
    ...(payload.readyMembers.length ? payload.readyMembers.map((member) => `- ${escapeMarkdownCell(memberName(member))} (${escapeMarkdownCell(member.email || 'no email')})`) : ['- None']),
    '',
    '## Skipped Members',
    ...(payload.skippedRows.length ? payload.skippedRows.map((row) => `- Row ${row.rowNumber}: ${escapeMarkdownCell(row.reason)}`) : ['- None']),
    '',
  ].join('\n');
}

function toCsv(rows: ReviewRow[]): string {
  const headers = ['Name', 'Email', 'Phone', 'Status', 'Validation Result', 'Existing Match (mock)', 'Pending Profile (mock)', 'Offline Member (mock)'];
  const values = rows.map((row) => [row.name, row.email, row.phone, row.status, row.validationLabel, row.existingMatch, row.pendingProfile, row.offlineMember]);
  return [headers, ...values].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function csvEscape(value: string): string {
  return `"${escapeSpreadsheetFormula(value).replace(/"/g, '""')}"`;
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function labelize(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

const sampleRows = [
  ['External Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'DOB', 'Membership Status', 'Membership Type', 'Membership Level', 'Membership Start', 'Renewal Date', 'Billing Status', 'Coach', 'Notes'],
  ['DCMA-2001', 'Maya', 'Chen', 'maya.chen@example.com', '+15025550112', '1992-04-18', 'active', 'Unlimited', 'Blue Belt', '2021-01-12', '2026-12-01', 'current', 'Coach Price', 'Existing Vyra user'],
  ['DCMA-2002', 'Ruth', 'Ellis', '', '+15025550117', '1972-06-10', 'active', 'Morning Classes', 'Black Belt', '2018-09-01', '2027-01-01', 'current', '', 'Offline member'],
  ['DCMA-2003', '', 'Morgan', 'morgan.invalid', '555-ABCD', '1980-13-41', 'expired', '', 'White Belt', '2022-10-01', '2024-01-01', 'past_due', '', '=Needs cleanup'],
];

const sampleCsv = `${sampleRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
