import type { ImportedMember, MemberMatch, ValidationIssue } from './migrationTypes';

export type ImportWizardStep = 'select-file' | 'detect-columns' | 'map-fields' | 'validate-data' | 'review-results' | 'ready-for-review';

export type ImportFieldKey =
  | 'ignore'
  | 'externalMemberId'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'dateOfBirth'
  | 'membershipStatus'
  | 'membershipType'
  | 'membershipLevel'
  | 'membershipStartDate'
  | 'renewalDate'
  | 'billingStatus'
  | 'coachAssignment'
  | 'notes'
  | 'emergencyContact';

export type ImportReviewFilter = 'all' | 'errors' | 'warnings' | 'ready' | 'skipped';

export interface ImportFileMetadata {
  filename: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface ParsedImportRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface SkippedImportRow {
  reason: string;
  rowNumber: number;
}

export interface ImportValidationResult {
  importedMembers: ImportedMember[];
  issues: ValidationIssue[];
  matches: MemberMatch[];
  readyMemberIds: string[];
  skippedRows: SkippedImportRow[];
  validatedAt: string;
}

export interface MigrationImportWizardState {
  columns: string[];
  fieldMappings: Record<string, ImportFieldKey>;
  fileMetadata: ImportFileMetadata | null;
  parsedRows: ParsedImportRow[];
  step: ImportWizardStep;
  validation: ImportValidationResult | null;
}

export interface ParsedMigrationFile {
  columns: string[];
  rows: ParsedImportRow[];
}
