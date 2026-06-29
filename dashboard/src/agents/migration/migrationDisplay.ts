import type { ImportedMember } from './migrationTypes';

export function memberName(member: ImportedMember): string {
  return [member.firstName, member.lastName].filter(Boolean).join(' ') || member.externalMemberId;
}

export function offlineReason(member: ImportedMember): string {
  if (member.knownOffline) return 'Known offline member';
  if (member.wantsAppAccess === false) return 'Non-app member';
  if (!member.email) return 'No email for app invite';
  return 'Staff-managed access';
}

export function formatHealth(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function tableTone(status: string): 'neutral' | 'good' | 'warn' {
  if (status === 'prepared' || status === 'reachable') {
    return 'good';
  }
  if (status === 'protected' || status === 'missing') {
    return 'warn';
  }
  return 'neutral';
}
