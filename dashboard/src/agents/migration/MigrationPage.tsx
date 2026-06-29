import type { SupabaseTableCheck } from '../../integrations/supabase/supabaseTypes';
import type { ApprovalItem } from '../../state/approvalStore';
import type { ReportFormat } from '../../storage/reportExport';
import type { ApprovalHistoryEntry, MigrationDryRunRecord } from '../../types/localRecords';
import { MigrationApprovalGate } from './MigrationApprovalGate';
import { MigrationBatchDetail } from './MigrationBatchDetail';
import { MigrationInvitationPreview } from './MigrationInvitationPreview';
import MigrationImportWizard from './MigrationImportWizard';
import { MigrationMemberReview } from './MigrationMemberReview';
import { MigrationOfflineMembers } from './MigrationOfflineMembers';
import {
  MigrationApprovalQueuePanel,
  MigrationDryRunPanel,
  MigrationGymReviewChecklist,
  MigrationHistoryPanel,
  MigrationRulesPanel,
  MigrationSummaryCards,
  MigrationTableReadiness,
} from './MigrationOperations';
import { MigrationQueue, type MigrationQueueItem } from './MigrationQueue';
import { MigrationReportActions } from './MigrationReportActions';
import { MigrationValidationResolution } from './MigrationValidationResolution';
import { importedMembers, migrationBatch } from './migrationMockData';
import type { MemberMatch, MigrationSummary, ValidationIssue } from './migrationTypes';

export interface MigrationPageProps {
  approvalItems: ApprovalItem[];
  approvalHistory: ApprovalHistoryEntry[];
  approved: boolean;
  dryRuns: MigrationDryRunRecord[];
  expectedTables: SupabaseTableCheck[];
  issues: ValidationIssue[];
  lastDryRunAt: string | null;
  matches: MemberMatch[];
  onClearApprovalHistory(): void;
  onClearDryRuns(): void;
  onApprove: () => void;
  onApproveItem(_id: string): void;
  onDryRun: () => void;
  onExportApprovalHistory(_format: ReportFormat): void;
  onExportDryRun(_format: ReportFormat): void;
  summary: MigrationSummary;
}

export default function MigrationPage({
  approvalItems,
  approvalHistory,
  approved,
  dryRuns,
  expectedTables,
  issues,
  lastDryRunAt,
  matches,
  onClearApprovalHistory,
  onClearDryRuns,
  onApprove,
  onApproveItem,
  onDryRun,
  onExportApprovalHistory,
  onExportDryRun,
  summary,
}: MigrationPageProps) {
  const offlineMembers = importedMembers.filter((member) => member.knownOffline || member.wantsAppAccess === false || !member.email);
  const invitationCandidates = importedMembers.filter(
    (member) => member.email && member.wantsAppAccess !== false && member.membershipStatus === 'active',
  );
  const queueItems: MigrationQueueItem[] = [
    {
      detail: `${migrationBatch.importedMembers.toLocaleString()} members staged from ${migrationBatch.source}`,
      status: 'Complete',
      step: 'Import received',
    },
    {
      detail: `${summary.errors} errors · ${summary.warnings} warnings`,
      status: summary.errors ? 'Blocked' : summary.warnings ? 'Review' : 'Ready',
      step: 'Validation issue resolution',
    },
    {
      detail: `${summary.needsGymReview} records need gym review`,
      status: summary.needsGymReview ? 'Review' : 'Ready',
      step: 'Member review table',
    },
    {
      detail: `${summary.offlineMembers} offline/non-app members preserved`,
      status: 'Ready',
      step: 'Offline / non-app tracking',
    },
    {
      detail: `${invitationCandidates.length} draft invitations prepared locally`,
      status: approved ? 'Ready' : 'Gated',
      step: 'Invitation preview',
    },
    {
      detail: 'Gym review approval required before any future finalization',
      status: approved ? 'Approved' : 'Waiting',
      step: 'Approval gate',
    },
  ];

  return (
    <>
      <MigrationSummaryCards summary={summary} />
      <section className="dashboard-grid">
        <MigrationImportWizard />
        <MigrationQueue queueItems={queueItems} />
        <MigrationDryRunPanel lastDryRunAt={lastDryRunAt} onDryRun={onDryRun} />
        <MigrationReportActions disabled={!dryRuns.length} onClearDryRuns={onClearDryRuns} onExportDryRun={onExportDryRun} />
        <MigrationHistoryPanel dryRuns={dryRuns} />
        <MigrationBatchDetail />
        <MigrationRulesPanel />
        <MigrationOfflineMembers members={offlineMembers} />
        <MigrationValidationResolution issues={issues} />
        <MigrationMemberReview matches={matches} />
        <MigrationInvitationPreview approved={approved} members={invitationCandidates} />
        <MigrationTableReadiness expectedTables={expectedTables} />
        <MigrationApprovalQueuePanel
          history={approvalHistory}
          items={approvalItems}
          onApproveItem={onApproveItem}
          onClearHistory={onClearApprovalHistory}
          onExportHistory={onExportApprovalHistory}
        />
        <MigrationGymReviewChecklist />
        <MigrationApprovalGate approved={approved} onApprove={onApprove} />
      </section>
    </>
  );
}
