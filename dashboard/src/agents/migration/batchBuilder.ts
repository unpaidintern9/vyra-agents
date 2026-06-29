import { migrationBatch } from './migrationMockData';
import { memberName } from './migrationDisplay';
import { issuesForMember } from './importWizardValidation';
import type {
  BatchApprovalPacket,
  BatchBuilderInput,
  BatchMemberState,
  BatchReviewChecklistItem,
  ExistingUserMatchPreview,
  MigrationBatchPreview,
  OfflineMemberPreview,
  OrganizationMembershipPreview,
  PendingProfilePreview,
  StagedMemberPreview,
} from './batchBuilderTypes';
import type { ImportedMember, MemberMatch, ValidationIssue } from './migrationTypes';

const safetyNotes = [
  'Preview only. No production writes were performed.',
  'No pending profiles were created.',
  'No organization memberships were created.',
  'No invitations were sent.',
  'Existing Vyra users should be linked, not duplicated.',
];

export function buildMigrationBatchPreview(input: BatchBuilderInput): MigrationBatchPreview {
  const createdAt = new Date().toISOString();
  const batchId = `local_batch_${Date.now()}`;
  const members = input.importedMembers.map((member) => stagedMember(member, input.issues, input.matches));
  const skippedMembers = input.skippedRows.map<StagedMemberPreview>((row) => ({
    email: '',
    externalMemberId: `row-${row.rowNumber}`,
    id: `skipped-${row.rowNumber}`,
    memberState: 'skipped',
    membershipStatus: 'skipped',
    membershipType: '',
    name: `Skipped row ${row.rowNumber}`,
    organizationMembershipReady: false,
    phone: '',
    validation: row.reason,
  }));
  const allMembers = [...members, ...skippedMembers];
  const pendingProfiles = pendingProfilePreview(members);
  const offlineMembers = offlineMemberPreview(input.importedMembers, members);
  const existingUserMatches = existingUserMatchPreview(members, input.matches);
  const organizationMemberships = organizationMembershipPreview(members);
  const summary = {
    totalImported: allMembers.length,
    stagedMembers: members.filter((member) => member.memberState !== 'needs_review').length,
    pendingProfiles: pendingProfiles.length,
    offlineMembers: offlineMembers.length,
    existingUserMatches: existingUserMatches.length,
    organizationMembershipsReady: organizationMemberships.filter((membership) => membership.organizationMembershipReady).length,
    needsReview: members.filter((member) => member.memberState === 'needs_review').length,
    skipped: skippedMembers.length,
  };
  const warnings = buildWarnings(input.issues, skippedMembers.length);
  const reviewChecklist = buildChecklist(summary, warnings);
  const approvalPacket: BatchApprovalPacket = {
    batchId,
    checklist: reviewChecklist,
    existingUserMatches,
    offlineMembers,
    organizationMemberships,
    pendingProfiles,
    safetyNotes,
    stagedMembers: allMembers,
    summary,
    validationIssues: input.issues,
    warnings,
  };

  return {
    approvalPacket,
    batchId,
    createdAt,
    gymName: migrationBatch.gymName,
    members: allMembers,
    organizationId: migrationBatch.organizationId,
    reviewChecklist,
    sourceFileName: input.sourceFileName,
    status: 'preview',
    summary,
    warnings,
  };
}

function stagedMember(member: ImportedMember, issues: ValidationIssue[], matches: MemberMatch[]): StagedMemberPreview {
  const memberIssues = issuesForMember(issues, member.id);
  const match = matches.find((candidate) => candidate.memberId === member.id);
  const memberState = assignMemberState(member, memberIssues, match);

  return {
    email: member.email || 'No email',
    externalMemberId: member.externalMemberId,
    id: member.id,
    memberState,
    membershipStatus: member.membershipStatus,
    membershipType: member.membershipType || 'Unmapped',
    name: memberName(member),
    organizationMembershipReady: memberState !== 'needs_review' && memberState !== 'skipped',
    phone: member.phone || 'No phone',
    validation: validationLabel(memberIssues),
  };
}

function assignMemberState(member: ImportedMember, issues: ValidationIssue[], match?: MemberMatch): BatchMemberState {
  if (issues.some((issue) => issue.severity === 'error')) return 'needs_review';
  if (match?.matchType === 'existing_vyra_user') return 'active_app_user';
  if (member.email || member.phone) return 'pending_app_user';
  if (member.membershipStatus === 'active') return 'offline_non_app_member';
  return 'needs_review';
}

function pendingProfilePreview(members: StagedMemberPreview[]): PendingProfilePreview[] {
  return members
    .filter((member) => member.memberState === 'pending_app_user')
    .map((member) => ({
      email: member.email,
      externalMemberId: member.externalMemberId,
      memberReference: member.id,
      name: member.name,
      phone: member.phone,
      previewOnly: true,
    }));
}

function offlineMemberPreview(importedMembers: ImportedMember[], members: StagedMemberPreview[]): OfflineMemberPreview[] {
  return members
    .filter((member) => member.memberState === 'offline_non_app_member')
    .map((member) => {
      const imported = importedMembers.find((candidate) => candidate.id === member.id);
      return {
        billingStatus: imported?.billingStatus || 'Unknown',
        coachAssignment: imported?.coachAssignment || 'Unassigned',
        externalMemberId: member.externalMemberId,
        memberReference: member.id,
        name: member.name,
        reason: 'Active gym member can remain staff-managed without app activation.',
      };
    });
}

function existingUserMatchPreview(members: StagedMemberPreview[], matches: MemberMatch[]): ExistingUserMatchPreview[] {
  return members
    .filter((member) => member.memberState === 'active_app_user')
    .map((member) => {
      const match = matches.find((candidate) => candidate.memberId === member.id);
      return {
        existingUser: match?.existingUser || 'Mock existing user',
        externalMemberId: member.externalMemberId,
        memberReference: member.id,
        name: member.name,
      };
    });
}

function organizationMembershipPreview(members: StagedMemberPreview[]): OrganizationMembershipPreview[] {
  return members
    .filter((member) => member.memberState !== 'skipped')
    .map((member) => ({
      externalMemberId: member.externalMemberId,
      memberReference: member.id,
      membershipStatus: member.membershipStatus,
      organizationId: migrationBatch.organizationId,
      organizationMembershipReady: member.organizationMembershipReady,
      role: 'member',
      source: 'migrated',
    }));
}

function buildWarnings(issues: ValidationIssue[], skipped: number): string[] {
  const warnings = issues.map((issue) => `${issue.memberName}: ${issue.issue} (${issue.severity})`);
  if (skipped) warnings.push(`${skipped} skipped row(s) are excluded from staging.`);
  return warnings;
}

function buildChecklist(summary: MigrationBatchPreview['summary'], warnings: string[]): BatchReviewChecklistItem[] {
  return [
    { complete: summary.totalImported > 0, label: 'Import rows validated' },
    { complete: summary.needsReview === 0, label: 'Blocking errors reviewed' },
    { complete: true, label: 'Duplicates reviewed' },
    { complete: true, label: 'Existing user matches reviewed' },
    { complete: true, label: 'Pending profiles reviewed' },
    { complete: true, label: 'Offline members reviewed' },
    { complete: summary.organizationMembershipsReady > 0, label: 'Organization membership preview reviewed' },
    { complete: true, label: 'Invitations not sent' },
    { complete: true, label: 'Production writes not performed' },
    { complete: warnings.length === 0, label: 'Validation warnings reviewed' },
  ];
}

function validationLabel(issues: ValidationIssue[]): string {
  if (!issues.length) return 'Ready';
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  if (errors) return `${errors} blocking error(s)`;
  return `${issues.length} warning/review item(s)`;
}
