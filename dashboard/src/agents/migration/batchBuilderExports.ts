import { escapeMarkdownCell, escapeSpreadsheetFormula } from './importWizardSanitize';
import type { MigrationBatchPreview, StagedMemberPreview } from './batchBuilderTypes';

export type BatchPacketExportFormat = 'json' | 'markdown' | 'csv';

export function exportBatchApprovalPacket(batch: MigrationBatchPreview, format: BatchPacketExportFormat): void {
  if (format === 'json') {
    downloadBlob(`vyra-migration-approval-packet-${batch.batchId}.json`, JSON.stringify(batch.approvalPacket, null, 2), 'application/json');
    return;
  }

  if (format === 'markdown') {
    downloadBlob(`vyra-migration-approval-packet-${batch.batchId}.md`, approvalPacketMarkdown(batch), 'text/markdown');
    return;
  }

  downloadBlob(`vyra-migration-staged-members-${batch.batchId}.csv`, stagedMembersCsv(batch.members), 'text/csv');
}

function approvalPacketMarkdown(batch: MigrationBatchPreview): string {
  const packet = batch.approvalPacket;
  return [
    '# Migration Approval Packet',
    '',
    `Batch: ${escapeMarkdownCell(batch.batchId)}`,
    `Gym: ${escapeMarkdownCell(batch.gymName)}`,
    `Organization: ${escapeMarkdownCell(batch.organizationId)}`,
    `Source file: ${escapeMarkdownCell(batch.sourceFileName)}`,
    '',
    '## Safety Notes',
    ...packet.safetyNotes.map((note) => `- ${escapeMarkdownCell(note)}`),
    '',
    '## Batch Summary',
    ...Object.entries(packet.summary).map(([key, value]) => `- ${escapeMarkdownCell(labelize(key))}: ${escapeMarkdownCell(String(value))}`),
    '',
    '## Validation Warnings And Errors',
    ...(packet.validationIssues.length
      ? packet.validationIssues.map((issue) => `- ${escapeMarkdownCell(issue.memberName)}: ${escapeMarkdownCell(issue.issue)} (${escapeMarkdownCell(issue.severity)})`)
      : ['- None']),
    '',
    '## Member State Counts',
    ...Object.entries(memberStateCounts(batch.members)).map(([key, value]) => `- ${escapeMarkdownCell(labelize(key))}: ${value}`),
    '',
    '## Review Checklist',
    ...packet.checklist.map((item) => `- [${item.complete ? 'x' : ' '}] ${escapeMarkdownCell(item.label)}`),
    '',
  ].join('\n');
}

function stagedMembersCsv(members: StagedMemberPreview[]): string {
  const headers = ['Name', 'Email', 'Phone', 'External ID', 'Membership Status', 'Membership Type', 'Member State', 'Validation', 'Organization Membership Ready'];
  const rows = members.map((member) => [
    member.name,
    member.email,
    member.phone,
    member.externalMemberId,
    member.membershipStatus,
    member.membershipType,
    member.memberState,
    member.validation,
    member.organizationMembershipReady ? 'Yes' : 'No',
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function memberStateCounts(members: StagedMemberPreview[]): Record<string, number> {
  return members.reduce<Record<string, number>>((counts, member) => {
    counts[member.memberState] = (counts[member.memberState] ?? 0) + 1;
    return counts;
  }, {});
}

function csvEscape(value: string): string {
  return `"${escapeSpreadsheetFormula(value).replace(/"/g, '""')}"`;
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function labelize(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}
