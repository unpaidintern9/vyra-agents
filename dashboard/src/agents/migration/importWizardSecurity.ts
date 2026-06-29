import { MAX_IMPORT_COLUMNS, MAX_IMPORT_FILE_SIZE_BYTES, MAX_IMPORT_FILE_SIZE_MB, MAX_IMPORT_ROWS } from './importWizardLimits';
import type { ParsedImportRow } from './importWizardTypes';

export function fileExtension(filename: string): 'csv' | 'xlsx' | 'xls' | 'unsupported' {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
    return extension;
  }
  return 'unsupported';
}

export function isExcelExtension(extension: string): boolean {
  return extension === 'xlsx' || extension === 'xls';
}

export function assertSupportedFile(file: File): void {
  if (fileExtension(file.name) === 'unsupported') {
    throw new Error('Unsupported file type. Upload a CSV, XLSX, or XLS file.');
  }
  if (file.size === 0) {
    throw new Error('This import file is empty. Choose a file with a header row and member data.');
  }
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    throw new Error(`This import file is too large. The local preview limit is ${MAX_IMPORT_FILE_SIZE_MB} MB.`);
  }
}

export function assertImportShape(columns: string[], rows: ParsedImportRow[]): void {
  if (!columns.length) {
    throw new Error('No recognizable columns were found. Confirm the first populated row contains column headers.');
  }
  if (columns.length > MAX_IMPORT_COLUMNS) {
    throw new Error(`This file has ${columns.length} columns. The local preview limit is ${MAX_IMPORT_COLUMNS} columns.`);
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`This file has ${rows.length.toLocaleString()} rows. The local preview limit is ${MAX_IMPORT_ROWS.toLocaleString()} rows.`);
  }
}
