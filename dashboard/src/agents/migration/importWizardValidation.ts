import { existingVyraUsers } from './migrationMockData';
import { matchMigrationMembers } from './memberMatching';
import { validateMigrationMembers } from './migrationValidation';
import type { ImportedMember, ValidationIssue } from './migrationTypes';
import type { ImportFieldKey, ImportValidationResult, ParsedImportRow, SkippedImportRow } from './importWizardTypes';

export function validateImportedRows(rows: ParsedImportRow[], fieldMappings: Record<string, ImportFieldKey>): ImportValidationResult {
  const skippedRows: SkippedImportRow[] = [];
  const importedMembers = rows.reduce<ImportedMember[]>((members, row) => {
    if (isEmptyRow(row)) {
      skippedRows.push({ reason: 'Empty row', rowNumber: row.rowNumber });
      return members;
    }
    members.push(toImportedMember(row, fieldMappings, members.length));
    return members;
  }, []);
  const issues = validateMigrationMembers(importedMembers);
  const matches = matchMigrationMembers(importedMembers, existingVyraUsers);
  const errorMemberIds = new Set(issues.filter((issue) => issue.severity === 'error').map((issue) => issue.memberId));

  return {
    importedMembers,
    issues,
    matches,
    readyMemberIds: importedMembers.filter((member) => !errorMemberIds.has(member.id)).map((member) => member.id),
    skippedRows,
    validatedAt: new Date().toISOString(),
  };
}

export function issuesForMember(issues: ValidationIssue[], memberId: string): ValidationIssue[] {
  return issues.filter((issue) => issue.memberId === memberId);
}

function toImportedMember(row: ParsedImportRow, fieldMappings: Record<string, ImportFieldKey>, index: number): ImportedMember {
  const values = Object.entries(fieldMappings).reduce<Partial<Record<ImportFieldKey, string>>>((record, [column, field]) => {
    if (field !== 'ignore') {
      record[field] = row.values[column] ?? '';
    }
    return record;
  }, {});
  const status = normalizeMembershipStatus(values.membershipStatus);

  return {
    billingStatus: values.billingStatus,
    coachAssignment: values.coachAssignment,
    dateOfBirth: normalizeDate(values.dateOfBirth),
    email: values.email,
    emergencyContact: values.emergencyContact ? { contact: values.emergencyContact } : undefined,
    externalMemberId: values.externalMemberId || `import-row-${row.rowNumber}`,
    firstName: values.firstName,
    id: `import_${Date.now()}_${index}_${row.rowNumber}`,
    lastName: values.lastName,
    membershipLevel: values.membershipLevel,
    membershipStartDate: normalizeDate(values.membershipStartDate),
    membershipStatus: status,
    membershipType: values.membershipType,
    notes: values.notes,
    phone: values.phone,
    renewalDate: normalizeDate(values.renewalDate),
    wantsAppAccess: Boolean(values.email),
  };
}

function isEmptyRow(row: ParsedImportRow): boolean {
  return Object.values(row.values).every((value) => !value.trim());
}

function normalizeMembershipStatus(value?: string): ImportedMember['membershipStatus'] {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (normalized.includes('cancel')) return 'canceled';
  if (normalized.includes('freeze') || normalized.includes('frozen') || normalized.includes('pause')) return 'frozen';
  if (normalized.includes('expire') || normalized.includes('inactive')) return 'expired';
  return 'active';
}

function normalizeDate(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.valueOf()) ? trimmed : parsed.toISOString().slice(0, 10);
}
