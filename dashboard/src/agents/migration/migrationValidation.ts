import type { ImportedMember, ValidationIssue } from './migrationTypes';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9]{10,15}$/;

export function validateMigrationMembers(members: ImportedMember[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const emailCounts = countValues(members.map((member) => normalize(member.email)));
  const phoneCounts = countValues(members.map((member) => normalizePhone(member.phone)));

  members.forEach((member) => {
    const memberName = formatMemberName(member);
    const normalizedEmail = normalize(member.email);
    const normalizedPhone = normalizePhone(member.phone);

    if (!member.firstName?.trim() || !member.lastName?.trim()) {
      issues.push(issue(member, memberName, 'missing name', 'error', 'Collect first and last name before approval.'));
    }

    if (!member.email?.trim()) {
      issues.push(issue(member, memberName, 'missing email', 'warning', 'Confirm whether this member is offline or add an email.'));
    } else if (!emailPattern.test(member.email)) {
      issues.push(issue(member, memberName, 'invalid email', 'error', 'Correct email formatting before invitations are prepared.'));
    }

    if (member.phone && !phonePattern.test(normalizedPhone)) {
      issues.push(issue(member, memberName, 'invalid phone', 'warning', 'Normalize phone number or mark phone as unavailable.'));
    }

    if (normalizedEmail && (emailCounts.get(normalizedEmail) ?? 0) > 1) {
      issues.push(issue(member, memberName, 'duplicate email', 'review', 'Review family account or duplicate member before finalizing.'));
    }

    if (normalizedPhone && (phoneCounts.get(normalizedPhone) ?? 0) > 1) {
      issues.push(issue(member, memberName, 'duplicate phone', 'review', 'Confirm shared household phone or duplicate import row.'));
    }

    if (member.membershipStatus === 'expired') {
      issues.push(issue(member, memberName, 'expired membership', 'warning', 'Ask the gym to confirm whether this member remains active.'));
    }

    if (member.membershipStatus === 'canceled') {
      issues.push(issue(member, memberName, 'canceled membership', 'review', 'Keep staged but require gym review before inviting.'));
    }

    if (member.membershipStatus === 'frozen') {
      issues.push(issue(member, memberName, 'frozen membership', 'review', 'Preserve membership but verify freeze handling with staff.'));
    }

    if (!member.membershipType?.trim()) {
      issues.push(issue(member, memberName, 'missing membership type', 'warning', 'Map membership type before final approval.'));
    }

    if (!isValidDate(member.dateOfBirth) || !isValidDate(member.membershipStartDate) || !isValidDate(member.renewalDate)) {
      issues.push(issue(member, memberName, 'invalid date', 'error', 'Correct invalid date fields before migration approval.'));
    }

    if (member.possibleExistingVyraUser) {
      issues.push(issue(member, memberName, 'possible existing Vyra user', 'review', 'Link existing user instead of creating a duplicate account.'));
    }

    if (member.familyAccountId) {
      issues.push(issue(member, memberName, 'possible family account', 'review', 'Confirm family relationship and shared billing owner.'));
    }

    if (member.possibleChildAccount) {
      issues.push(issue(member, memberName, 'possible child account', 'review', 'Confirm guardian relationship and app access rules.'));
    }

    if (member.membershipStatus === 'active' && member.billingStatus === 'past_due') {
      issues.push(issue(member, memberName, 'conflicting record', 'review', 'Confirm active membership with past-due billing status.'));
    }
  });

  return issues;
}

export function formatMemberName(member: ImportedMember): string {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return name || `External ${member.externalMemberId}`;
}

function issue(
  member: ImportedMember,
  memberName: string,
  issueType: ValidationIssue['issue'],
  severity: ValidationIssue['severity'],
  recommendedAction: string,
): ValidationIssue {
  return {
    memberId: member.id,
    memberName,
    issue: issueType,
    severity,
    recommendedAction,
    status: severity === 'error' ? 'Open' : 'Needs Gym Review',
  };
}

function countValues(values: string[]): Map<string, number> {
  return values.reduce((counts, value) => {
    if (!value) {
      return counts;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function normalizePhone(value?: string): string {
  return value?.replace(/[^\d+]/g, '') ?? '';
}

function isValidDate(value?: string): boolean {
  if (!value) {
    return true;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

