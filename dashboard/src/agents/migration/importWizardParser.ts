import type { ParsedImportRow, ParsedMigrationFile } from './importWizardTypes';
import { assertImportShape, assertSupportedFile, fileExtension, isExcelExtension } from './importWizardSecurity';
import { sanitizeImportedCell } from './importWizardSanitize';

export function isSupportedMigrationFile(file: File): boolean {
  return fileExtension(file.name) !== 'unsupported';
}

export async function parseMigrationFile(file: File): Promise<ParsedMigrationFile> {
  assertSupportedFile(file);

  const extension = fileExtension(file.name);
  const parserWarnings = isExcelExtension(extension)
    ? ['Excel files are parsed locally in your browser. For safest imports, use CSV when possible. No production data is changed during this preview.']
    : ['CSV is the recommended import format.'];
  const matrix = extension === 'csv' ? parseCsv(await file.text()) : await parseExcel(file);
  const headerRow = matrix.find((row) => row.some((cell) => String(cell).trim()));

  if (!headerRow) {
    throw new Error('No header row found in this file.');
  }

  const headerIndex = matrix.indexOf(headerRow);
  const sanitizedHeaders = sanitizeRow(headerRow, 'header', parserWarnings);
  const columns = uniqueColumns(sanitizedHeaders.values.map((cell, index) => cell || `Column ${index + 1}`));
  const dataRows = matrix.slice(headerIndex + 1).filter((row) => row.some((cell) => String(cell).trim()));
  const rows: ParsedImportRow[] = dataRows.map((row, rowIndex) => {
    const rowNumber = headerIndex + rowIndex + 2;
    const sanitizedRow = sanitizeRow(row, `row ${rowNumber}`, parserWarnings);
    return {
      rowNumber,
      values: columns.reduce<Record<string, string>>((record, column, index) => {
        record[column] = sanitizedRow.values[index] ?? '';
        return record;
      }, {}),
    };
  });

  assertImportShape(columns, rows);

  if (rows.length === 0) {
    throw new Error('No member rows were found after the header row.');
  }

  const sanitizedCellCount = parserWarnings.filter((warning) => warning.includes('removed unsupported') || warning.includes('truncated') || warning.includes('formula-like')).length;

  return { columns, parserWarnings: dedupeWarnings(parserWarnings), rows, sanitizedCellCount };
}

async function parseExcel(file: File): Promise<Array<Array<unknown>>> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), {
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      cellNF: false,
      cellStyles: false,
      type: 'array',
    });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    if (!sheet) {
      throw new Error('No worksheet data found in this file.');
    }

    return XLSX.utils.sheet_to_json<Array<unknown>>(sheet, {
      blankrows: false,
      defval: '',
      header: 1,
      raw: false,
    });
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes('No worksheet')) {
      throw caught;
    }
    throw new Error('Excel parsing failed. Try exporting the file as CSV and importing again.');
  }
}

function parseCsv(content: string): Array<Array<unknown>> {
  if (!content.trim()) {
    throw new Error('This CSV file is empty. Choose a file with a header row and member data.');
  }

  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
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

function sanitizeRow(row: unknown[], label: string, warnings: string[]): { values: string[] } {
  return {
    values: row.map((cell, index) => {
      const sanitized = sanitizeImportedCell(cell, `${label}, column ${index + 1}`);
      warnings.push(...sanitized.warnings);
      return sanitized.value;
    }),
  };
}

function dedupeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings)];
}
