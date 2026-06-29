export const MAX_IMPORT_FILE_SIZE_MB = 5;
export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_COLUMNS = 75;
export const MAX_CELL_LENGTH = 500;

export const MAX_IMPORT_FILE_SIZE_BYTES = MAX_IMPORT_FILE_SIZE_MB * 1024 * 1024;

export function importLimitsSummary(): string {
  return `${MAX_IMPORT_FILE_SIZE_MB} MB file, ${MAX_IMPORT_ROWS.toLocaleString()} rows, ${MAX_IMPORT_COLUMNS} columns, ${MAX_CELL_LENGTH} characters per cell`;
}
