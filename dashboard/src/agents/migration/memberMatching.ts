import type { ExistingVyraUser, ImportedMember, MemberMatch, MemberState, MatchType } from './migrationTypes';
import { formatMemberName } from './migrationValidation';

export function matchMigrationMembers(members: ImportedMember[], existingUsers: ExistingVyraUser[]): MemberMatch[] {
  return members.map((member) => {
    const existingUser = findExistingUser(member, existingUsers);
    const memberState = resolveMemberState(member, Boolean(existingUser));
    const matchType = resolveMatchType(member, Boolean(existingUser));

    return {
      memberId: member.id,
      importedMember: formatMemberName(member),
      matchType,
      memberState,
      existingUser: existingUser ? `${existingUser.displayName} (${existingUser.userId})` : 'None',
      organizationMembershipReady: memberState !== 'offline_non_app_member' || member.membershipStatus === 'active',
      notes: buildMatchNotes(member, matchType, memberState),
    };
  });
}

function findExistingUser(member: ImportedMember, existingUsers: ExistingVyraUser[]): ExistingVyraUser | undefined {
  const email = member.email?.trim().toLowerCase();
  const phone = normalizePhone(member.phone);

  return existingUsers.find((user) => {
    const userEmail = user.email?.trim().toLowerCase();
    const userPhone = normalizePhone(user.phone);
    return Boolean((email && userEmail === email) || (phone && userPhone === phone));
  });
}

function resolveMatchType(member: ImportedMember, hasExistingUser: boolean): MatchType {
  if (hasExistingUser && member.email) {
    return 'existing_vyra_user';
  }

  if (member.knownOffline || member.wantsAppAccess === false || !member.email) {
    return 'offline_member_required';
  }

  if (member.phone && !member.email) {
    return 'phone';
  }

  if (member.email) {
    return 'pending_profile_required';
  }

  return 'phone';
}

function resolveMemberState(member: ImportedMember, hasExistingUser: boolean): MemberState {
  if (hasExistingUser && member.membershipStatus === 'active') {
    return 'active_app_user';
  }

  if (member.knownOffline || member.wantsAppAccess === false || !member.email) {
    return 'offline_non_app_member';
  }

  return 'pending_app_user';
}

function buildMatchNotes(member: ImportedMember, matchType: MatchType, memberState: MemberState): string {
  if (matchType === 'existing_vyra_user') {
    return 'Link existing Vyra account to organization membership. Do not duplicate.';
  }

  if (memberState === 'offline_non_app_member') {
    return 'Create gym-manageable offline member without requiring app activation.';
  }

  return 'Create pending profile and reserve gym relationship before first login.';
}

function normalizePhone(value?: string): string {
  return value?.replace(/[^\d+]/g, '') ?? '';
}

