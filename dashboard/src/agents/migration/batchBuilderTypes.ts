import type { ImportedMember, MemberMatch, ValidationIssue } from './migrationTypes';

export type BatchMemberState = 'active_app_user' | 'pending_app_user' | 'offline_non_app_member' | 'skipped' | 'needs_review';

export interface BatchBuilderSummary {
  totalImported: number;
  stagedMembers: number;
  pendingProfiles: number;
  offlineMembers: number;
  existingUserMatches: number;
  organizationMembershipsReady: number;
  needsReview: number;
  skipped: number;
}

export interface StagedMemberPreview {
  email: string;
  externalMemberId: string;
  id: string;
  memberState: BatchMemberState;
  membershipStatus: string;
  membershipType: string;
  name: string;
  organizationMembershipReady: boolean;
  phone: string;
  validation: string;
}

export interface PendingProfilePreview {
  email: string;
  externalMemberId: string;
  memberReference: string;
  name: string;
  phone: string;
  previewOnly: true;
}

export interface OfflineMemberPreview {
  billingStatus: string;
  coachAssignment: string;
  externalMemberId: string;
  memberReference: string;
  name: string;
  reason: string;
}

export interface ExistingUserMatchPreview {
  existingUser: string;
  externalMemberId: string;
  memberReference: string;
  name: string;
}

export interface OrganizationMembershipPreview {
  externalMemberId: string;
  memberReference: string;
  membershipStatus: string;
  organizationId: string;
  organizationMembershipReady: boolean;
  role: 'member';
  source: 'migrated';
}

export interface BatchReviewChecklistItem {
  complete: boolean;
  label: string;
}

export interface BatchApprovalPacket {
  batchId: string;
  checklist: BatchReviewChecklistItem[];
  existingUserMatches: ExistingUserMatchPreview[];
  offlineMembers: OfflineMemberPreview[];
  organizationMemberships: OrganizationMembershipPreview[];
  pendingProfiles: PendingProfilePreview[];
  safetyNotes: string[];
  stagedMembers: StagedMemberPreview[];
  summary: BatchBuilderSummary;
  validationIssues: ValidationIssue[];
  warnings: string[];
}

export interface MigrationBatchPreview {
  approvalPacket: BatchApprovalPacket;
  batchId: string;
  createdAt: string;
  gymName: string;
  members: StagedMemberPreview[];
  organizationId: string;
  reviewChecklist: BatchReviewChecklistItem[];
  sourceFileName: string;
  status: 'preview';
  summary: BatchBuilderSummary;
  warnings: string[];
}

export interface BatchBuilderInput {
  importedMembers: ImportedMember[];
  issues: ValidationIssue[];
  matches: MemberMatch[];
  skippedRows: Array<{ reason: string; rowNumber: number }>;
  sourceFileName: string;
}
