import type { ImportedMember, MemberMatch, MigrationSummary, ValidationIssue } from './migrationTypes';

export function summarizeMigration(
  members: ImportedMember[],
  issues: ValidationIssue[],
  matches: MemberMatch[],
): MigrationSummary {
  const errorMemberIds = new Set(issues.filter((issue) => issue.severity === 'error').map((issue) => issue.memberId));
  const reviewMemberIds = new Set(issues.map((issue) => issue.memberId));
  const ready = members.filter((member) => !errorMemberIds.has(member.id)).length;

  return {
    totalImported: members.length,
    ready,
    warnings: issues.filter((issue) => issue.severity === 'warning' || issue.severity === 'review').length,
    errors: issues.filter((issue) => issue.severity === 'error').length,
    existingUserMatches: matches.filter((match) => match.matchType === 'existing_vyra_user').length,
    pendingProfiles: matches.filter((match) => match.memberState === 'pending_app_user').length,
    offlineMembers: matches.filter((match) => match.memberState === 'offline_non_app_member').length,
    activeAppUsers: matches.filter((match) => match.memberState === 'active_app_user').length,
    needsGymReview: reviewMemberIds.size,
    readyForReview: Math.round((ready / members.length) * 100),
  };
}

