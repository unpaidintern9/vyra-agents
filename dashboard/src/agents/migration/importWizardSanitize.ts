import { MAX_CELL_LENGTH } from './importWizardLimits';

const unsafeFormulaPrefix = /^[=+\-@]/;

export interface SanitizedCell {
  value: string;
  warnings: string[];
}

export function sanitizeImportedCell(value: unknown, location: string): SanitizedCell {
  const warnings: string[] = [];
  const rawValue = formatRawValue(value);
  let sanitized = removeControlCharacters(rawValue).trim();

  if (sanitized.length !== rawValue.trim().length) {
    warnings.push(`${location}: removed unsupported control characters.`);
  }

  if (sanitized.length > MAX_CELL_LENGTH) {
    sanitized = sanitized.slice(0, MAX_CELL_LENGTH);
    warnings.push(`${location}: value truncated to ${MAX_CELL_LENGTH} characters.`);
  }

  if (unsafeFormulaPrefix.test(sanitized)) {
    warnings.push(`${location}: formula-like value was kept as plain text for review.`);
  }

  return { value: sanitized, warnings };
}

function removeControlCharacters(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code > 31 && code !== 127);
    })
    .join('');
}

export function escapeSpreadsheetFormula(value: string): string {
  const trimmedStart = value.trimStart();
  return unsafeFormulaPrefix.test(trimmedStart) ? `'${value}` : value;
}

export function escapeMarkdownCell(value: string): string {
  return escapeSpreadsheetFormula(value).replace(/\|/g, '\\|');
}

function formatRawValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value === null || value === undefined ? '' : String(value);
}
