import type { ParsedImportRow, ParsedMigrationFile } from './importWizardTypes';

const supportedExtensions = ['csv', 'xlsx', 'xls'];

export function isSupportedMigrationFile(file: File): boolean {
  return supportedExtensions.includes(fileExtension(file.name));
}

export async function parseMigrationFile(file: File): Promise<ParsedMigrationFile> {
  if (!isSupportedMigrationFile(file)) {
    throw new Error('Unsupported file type. Upload a CSV, XLSX, or XLS file.');
  }

  const XLSX = await import('xlsx');
  const extension = fileExtension(file.name);
  const workbook =
    extension === 'csv'
      ? XLSX.read(await file.text(), { type: 'string', raw: false })
      : XLSX.read(await file.arrayBuffer(), { cellDates: true, type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    throw new Error('No worksheet data found in this file.');
  }

  const matrix = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(sheet, {
    blankrows: false,
    defval: '',
    header: 1,
    raw: false,
  });
  const headerRow = matrix.find((row) => row.some((cell) => String(cell).trim()));

  if (!headerRow) {
    throw new Error('No header row found in this file.');
  }

  const columns = uniqueColumns(headerRow.map((cell, index) => String(cell || `Column ${index + 1}`).trim()));
  const dataRows = matrix.slice(matrix.indexOf(headerRow) + 1);
  const rows: ParsedImportRow[] = dataRows.map((row, rowIndex) => ({
    rowNumber: rowIndex + 2,
    values: columns.reduce<Record<string, string>>((record, column, index) => {
      record[column] = formatCell(row[index]);
      return record;
    }, {}),
  }));

  return { columns, rows };
}

function uniqueColumns(columns: string[]): string[] {
  const counts = new Map<string, number>();
  return columns.map((column, index) => {
    const fallback = column || `Column ${index + 1}`;
    const count = counts.get(fallback) ?? 0;
    counts.set(fallback, count + 1);
    return count ? `${fallback} ${count + 1}` : fallback;
  });
}

function formatCell(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value === null || value === undefined ? '' : String(value).trim();
}

function fileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}
