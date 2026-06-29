import type { ImportFieldKey } from './importWizardTypes';

export const importFieldOptions: Array<{ key: ImportFieldKey; label: string; required?: boolean }> = [
  { key: 'ignore', label: 'Ignore' },
  { key: 'externalMemberId', label: 'External Member ID' },
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'dateOfBirth', label: 'DOB' },
  { key: 'membershipStatus', label: 'Membership Status' },
  { key: 'membershipType', label: 'Membership Type' },
  { key: 'membershipLevel', label: 'Membership Level' },
  { key: 'membershipStartDate', label: 'Membership Start' },
  { key: 'renewalDate', label: 'Renewal Date' },
  { key: 'billingStatus', label: 'Billing Status' },
  { key: 'coachAssignment', label: 'Coach' },
  { key: 'notes', label: 'Notes' },
  { key: 'emergencyContact', label: 'Emergency Contact' },
];

export const requiredImportFields: Array<Exclude<ImportFieldKey, 'ignore'>> = ['firstName', 'lastName'];

const aliases: Record<Exclude<ImportFieldKey, 'ignore'>, string[]> = {
  billingStatus: ['billing', 'billing status', 'payment status', 'account status'],
  coachAssignment: ['coach', 'coach assignment', 'assigned coach', 'instructor'],
  dateOfBirth: ['dob', 'date of birth', 'birth date', 'birthday'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  emergencyContact: ['emergency contact', 'emergency name', 'emergency phone'],
  externalMemberId: ['external member id', 'member id', 'member number', 'id', 'external id'],
  firstName: ['first name', 'firstname', 'given name', 'first'],
  lastName: ['last name', 'lastname', 'surname', 'family name', 'last'],
  membershipLevel: ['membership level', 'level', 'belt', 'rank'],
  membershipStartDate: ['membership start', 'membership start date', 'start date', 'joined', 'join date'],
  membershipStatus: ['membership status', 'status', 'member status'],
  membershipType: ['membership type', 'plan', 'membership', 'membership plan'],
  notes: ['notes', 'note', 'comments', 'comment'],
  phone: ['phone', 'phone number', 'mobile', 'cell', 'cell phone'],
  renewalDate: ['renewal date', 'renewal', 'expires', 'expiration date', 'next billing'],
};

export function detectFieldMapping(column: string): ImportFieldKey {
  const normalized = normalizeColumn(column);
  for (const [field, fieldAliases] of Object.entries(aliases) as Array<[Exclude<ImportFieldKey, 'ignore'>, string[]]>) {
    if (fieldAliases.some((alias) => normalizeColumn(alias) === normalized)) {
      return field;
    }
  }
  return 'ignore';
}

export function fieldLabel(key: ImportFieldKey): string {
  return importFieldOptions.find((option) => option.key === key)?.label ?? 'Unmapped';
}

function normalizeColumn(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}
