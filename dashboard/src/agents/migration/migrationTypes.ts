export type MemberState = 'active_app_user' | 'pending_app_user' | 'offline_non_app_member';

export type Severity = 'warning' | 'error' | 'review';

export type ValidationIssueType =
  | 'duplicate email'
  | 'duplicate phone'
  | 'missing name'
  | 'missing email'
  | 'invalid email'
  | 'invalid phone'
  | 'expired membership'
  | 'canceled membership'
  | 'frozen membership'
  | 'missing membership type'
  | 'invalid date'
  | 'possible existing Vyra user'
  | 'possible family account'
  | 'possible child account'
  | 'conflicting record';

export type MatchType = 'email' | 'phone' | 'existing_vyra_user' | 'pending_profile_required' | 'offline_member_required';

export interface MigrationBatch {
  gymName: string;
  organizationId: string;
  source: string;
  status: string;
  importedMembers: number;
  createdBy: string;
}

export interface ImportedMember {
  id: string;
  externalMemberId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  membershipStatus: 'active' | 'expired' | 'canceled' | 'frozen';
  membershipType?: string;
  membershipLevel?: string;
  membershipStartDate?: string;
  renewalDate?: string;
  billingStatus?: string;
  emergencyContact?: Record<string, string>;
  coachAssignment?: string;
  classEnrollments?: string[];
  attendanceHistory?: string[];
  notes?: string;
  familyAccountId?: string;
  wantsAppAccess?: boolean;
  knownOffline?: boolean;
  possibleExistingVyraUser?: boolean;
  possibleChildAccount?: boolean;
  rawPayload?: Record<string, unknown>;
}

export interface ExistingVyraUser {
  userId: string;
  displayName: string;
  email?: string;
  phone?: string;
}

export interface ValidationIssue {
  memberId: string;
  memberName: string;
  issue: ValidationIssueType;
  severity: Severity;
  recommendedAction: string;
  status: 'Open' | 'Needs Gym Review' | 'Ready';
}

export interface MemberMatch {
  memberId: string;
  importedMember: string;
  matchType: MatchType;
  memberState: MemberState;
  existingUser: string;
  organizationMembershipReady: boolean;
  notes: string;
}

export interface MigrationSummary {
  totalImported: number;
  ready: number;
  warnings: number;
  errors: number;
  existingUserMatches: number;
  pendingProfiles: number;
  offlineMembers: number;
  activeAppUsers: number;
  needsGymReview: number;
  readyForReview: number;
}

