import { Boxes, Download, FileCheck2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { clearLocalState, loadLocalState, saveLocalState } from '../../storage/localStorageStore';
import { localStorageKeys } from '../../storage/localStorageKeys';
import { buildMigrationBatchPreview } from './batchBuilder';
import { exportBatchApprovalPacket, type BatchPacketExportFormat } from './batchBuilderExports';
import type { MigrationBatchPreview } from './batchBuilderTypes';
import type { MigrationImportWizardState } from './importWizardTypes';
import { MigrationDataTable, MigrationFact, MigrationPanel } from './MigrationOperations';

const emptyWizardSnapshot: MigrationImportWizardState = {
  columns: [],
  fieldMappings: {},
  fileMetadata: null,
  parserErrors: [],
  parserWarnings: [],
  parsedRows: [],
  sanitizedCellCount: 0,
  step: 'select-file',
  validation: null,
};

export interface MigrationBatchBuilderProps {
  onBatchPreviewBuilt(_batch: MigrationBatchPreview): void;
  onBatchApprovalPacketExported(_format: BatchPacketExportFormat, _batch: MigrationBatchPreview): void;
}

export function MigrationBatchBuilder({ onBatchApprovalPacketExported, onBatchPreviewBuilt }: MigrationBatchBuilderProps) {
  const [wizardState, setWizardState] = useState(() => loadWizardState());
  const [batchPreview, setBatchPreview] = useState(() => loadBatchPreview());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setWizardState(loadWizardState());
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const canBuild = Boolean(wizardState.validation);
  const stateCounts = useMemo(() => memberStateCounts(batchPreview), [batchPreview]);

  const buildPreview = () => {
    const latestWizardState = loadWizardState();
    setWizardState(latestWizardState);
    if (!latestWizardState.validation) {
      setMessage('Run Migration Validation in the Import Wizard before building a batch preview.');
      return;
    }
    const preview = buildMigrationBatchPreview({
      importedMembers: latestWizardState.validation.importedMembers,
      issues: latestWizardState.validation.issues,
      matches: latestWizardState.validation.matches,
      skippedRows: latestWizardState.validation.skippedRows,
      sourceFileName: latestWizardState.fileMetadata?.filename ?? 'local import',
    });
    setBatchPreview(preview);
    saveLocalState(localStorageKeys.migrationBatchPreview, preview);
    setMessage(`Built local batch preview ${preview.batchId}. No production writes were performed.`);
    onBatchPreviewBuilt(preview);
  };

  const clearPreview = () => {
    setBatchPreview(null);
    clearLocalState(localStorageKeys.migrationBatchPreview);
    setMessage('Local batch preview cleared.');
  };

  const exportPacket = (format: BatchPacketExportFormat) => {
    if (!batchPreview) return;
    exportBatchApprovalPacket(batchPreview, format);
    onBatchApprovalPacketExported(format, batchPreview);
  };

  return (
    <MigrationPanel title="Migration Batch Builder" icon={<Boxes size={18} />} wide>
      <div className="batch-builder-stack">
        <div className="safety-strip">
          <StatusBadge value="Preview Only" tone="neutral" />
          <span>No Supabase writes, no pending profiles, no memberships, no invitations, and no production data changes.</span>
        </div>

        <div className="toolbar-row batch-builder-toolbar">
          <div>
            <p className="panel-copy">
              Build a local approval packet from the latest validated Import Wizard rows. The preview is stored only in browser
              local storage.
            </p>
            <small className="subtle-note">
              Source: {wizardState.fileMetadata?.filename ?? 'No validated import yet'} · validated rows:{' '}
              {wizardState.validation?.importedMembers.length ?? 0}
            </small>
          </div>
          <div className="button-row end-row">
            <button className="approval-button compact-button" onClick={buildPreview} type="button">
              <FileCheck2 size={15} />
              Build Batch Preview
            </button>
            <button className="report-button" disabled={!batchPreview} onClick={() => exportPacket('json')} type="button">
              <Download size={15} />
              Export Approval Packet JSON
            </button>
            <button className="report-button" disabled={!batchPreview} onClick={() => exportPacket('markdown')} type="button">
              <Download size={15} />
              Export Approval Packet Markdown
            </button>
            <button className="report-button" disabled={!batchPreview} onClick={() => exportPacket('csv')} type="button">
              <Download size={15} />
              Export Staged Members CSV
            </button>
            <button className="clear-button" disabled={!batchPreview} onClick={clearPreview} type="button">
              <Trash2 size={15} />
              Clear Batch Preview
            </button>
          </div>
        </div>

        {message ? <p className="batch-builder-message">{message}</p> : null}
        {!canBuild ? <p className="wizard-error">Run Migration Validation before creating a batch preview.</p> : null}

        {batchPreview ? (
          <>
            <div className="batch-grid batch-summary-grid">
              <MigrationFact label="Total Imported" value={String(batchPreview.summary.totalImported)} />
              <MigrationFact label="Staged Members" value={String(batchPreview.summary.stagedMembers)} />
              <MigrationFact label="Pending Profiles" value={String(batchPreview.summary.pendingProfiles)} />
              <MigrationFact label="Offline Members" value={String(batchPreview.summary.offlineMembers)} />
              <MigrationFact label="Existing Matches" value={String(batchPreview.summary.existingUserMatches)} />
              <MigrationFact label="Org Memberships Ready" value={String(batchPreview.summary.organizationMembershipsReady)} />
              <MigrationFact label="Needs Review" value={String(batchPreview.summary.needsReview)} />
              <MigrationFact label="Skipped" value={String(batchPreview.summary.skipped)} />
            </div>

            <div className="section-gap">
              <h3>Member State Summary</h3>
              <div className="button-row">
                <StatusBadge value={`${stateCounts.active_app_user} active app user`} tone="good" />
                <StatusBadge value={`${stateCounts.pending_app_user} pending app user`} tone="neutral" />
                <StatusBadge value={`${stateCounts.offline_non_app_member} offline member`} tone="neutral" />
                <StatusBadge value={`${stateCounts.needs_review} needs review`} tone={stateCounts.needs_review ? 'warn' : 'good'} />
                <StatusBadge value={`${stateCounts.skipped} skipped`} tone="neutral" />
              </div>
            </div>

            <BatchStagedMembers batch={batchPreview} />
            <BatchPendingProfiles batch={batchPreview} />
            <BatchOfflineMembers batch={batchPreview} />
            <BatchExistingMatches batch={batchPreview} />
            <BatchOrganizationMemberships batch={batchPreview} />
            <BatchReviewChecklist batch={batchPreview} />
            <BatchApprovalPacket batch={batchPreview} />
          </>
        ) : (
          <div className="batch-empty-state">
            <strong>No local batch preview yet.</strong>
            <span>Validate an import, then build the preview to see staged members and the approval packet.</span>
          </div>
        )}
      </div>
    </MigrationPanel>
  );
}

function BatchStagedMembers({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap">
      <h3>Staged Member Preview</h3>
      <MigrationDataTable
        columns={[
          'Name',
          'Email',
          'Phone',
          'External ID',
          'Membership Status',
          'Membership Type',
          'Member State',
          'Validation',
          'Organization Membership Ready',
        ]}
        rows={batch.members.map((member) => [
          member.name,
          member.email,
          member.phone,
          member.externalMemberId,
          member.membershipStatus,
          member.membershipType,
          <StatusBadge key={`${member.id}-state`} value={stateLabel(member.memberState)} tone={stateTone(member.memberState)} />,
          member.validation,
          member.organizationMembershipReady ? 'Preview ready' : 'Not ready',
        ])}
      />
    </div>
  );
}

function BatchPendingProfiles({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap">
      <h3>Pending Profile Preview</h3>
      <p className="subtle-note">Preview only. No pending profiles are created.</p>
      <MigrationDataTable
        columns={['Name', 'Email', 'Phone', 'External ID', 'Preview']}
        rows={batch.approvalPacket.pendingProfiles.map((profile) => [
          profile.name,
          profile.email,
          profile.phone,
          profile.externalMemberId,
          profile.previewOnly ? 'Local preview only' : 'No',
        ])}
      />
    </div>
  );
}

function BatchOfflineMembers({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap">
      <h3>Offline / Non-App Member Preview</h3>
      <p className="subtle-note">These members remain active gym members even without app activation.</p>
      <MigrationDataTable
        columns={['Name', 'External ID', 'Billing', 'Coach', 'Reason']}
        rows={batch.approvalPacket.offlineMembers.map((member) => [
          member.name,
          member.externalMemberId,
          member.billingStatus,
          member.coachAssignment,
          member.reason,
        ])}
      />
    </div>
  );
}

function BatchExistingMatches({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap">
      <h3>Existing User Match Preview</h3>
      <p className="subtle-note">Matched users are linked in preview only and should not be duplicated.</p>
      <MigrationDataTable
        columns={['Imported Member', 'Existing User', 'External ID', 'Reference']}
        rows={batch.approvalPacket.existingUserMatches.map((match) => [
          match.name,
          match.existingUser,
          match.externalMemberId,
          match.memberReference,
        ])}
      />
    </div>
  );
}

function BatchOrganizationMemberships({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap">
      <h3>Organization Membership Preview</h3>
      <p className="subtle-note">Preview only. No organization memberships are created.</p>
      <MigrationDataTable
        columns={['Member Reference', 'Organization', 'Role', 'Membership Status', 'Source', 'External ID', 'Ready']}
        rows={batch.approvalPacket.organizationMemberships.map((membership) => [
          membership.memberReference,
          membership.organizationId,
          membership.role,
          membership.membershipStatus,
          membership.source,
          membership.externalMemberId,
          membership.organizationMembershipReady ? 'Ready in preview' : 'Needs review',
        ])}
      />
    </div>
  );
}

function BatchReviewChecklist({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap">
      <h3>Review Checklist</h3>
      <div className="batch-checklist">
        {batch.reviewChecklist.map((item) => (
          <div className="batch-checklist-item" key={item.label}>
            <StatusBadge value={item.complete ? 'Complete' : 'Review'} tone={item.complete ? 'good' : 'warn'} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BatchApprovalPacket({ batch }: { batch: MigrationBatchPreview }) {
  return (
    <div className="section-gap approval-packet">
      <h3>Approval Packet</h3>
      <div className="batch-grid">
        <MigrationFact label="Packet Batch" value={batch.approvalPacket.batchId} />
        <MigrationFact label="Warnings" value={String(batch.approvalPacket.warnings.length)} />
        <MigrationFact label="Safety Notes" value={String(batch.approvalPacket.safetyNotes.length)} />
      </div>
      <div className="warning-list compact-warning-list">
        {batch.approvalPacket.safetyNotes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </div>
  );
}

function loadWizardState(): MigrationImportWizardState {
  const stored = loadLocalState<Partial<MigrationImportWizardState>>(localStorageKeys.migrationImportWizard, () => ({}));
  return {
    ...emptyWizardSnapshot,
    ...stored,
    columns: Array.isArray(stored.columns) ? stored.columns : [],
    fieldMappings: stored.fieldMappings && typeof stored.fieldMappings === 'object' ? stored.fieldMappings : {},
    parserErrors: Array.isArray(stored.parserErrors) ? stored.parserErrors : [],
    parserWarnings: Array.isArray(stored.parserWarnings) ? stored.parserWarnings : [],
    parsedRows: Array.isArray(stored.parsedRows) ? stored.parsedRows : [],
    sanitizedCellCount: typeof stored.sanitizedCellCount === 'number' ? stored.sanitizedCellCount : 0,
    validation: stored.validation ?? null,
  };
}

function loadBatchPreview(): MigrationBatchPreview | null {
  const stored = loadLocalState<MigrationBatchPreview | null>(localStorageKeys.migrationBatchPreview, () => null);
  if (!stored?.approvalPacket || !Array.isArray(stored.members) || !stored.summary) {
    return null;
  }
  return stored;
}

function memberStateCounts(batch: MigrationBatchPreview | null) {
  return {
    active_app_user: batch?.members.filter((member) => member.memberState === 'active_app_user').length ?? 0,
    pending_app_user: batch?.members.filter((member) => member.memberState === 'pending_app_user').length ?? 0,
    offline_non_app_member: batch?.members.filter((member) => member.memberState === 'offline_non_app_member').length ?? 0,
    needs_review: batch?.members.filter((member) => member.memberState === 'needs_review').length ?? 0,
    skipped: batch?.members.filter((member) => member.memberState === 'skipped').length ?? 0,
  };
}

function stateLabel(state: string): string {
  return state.replace(/_/g, ' ');
}

function stateTone(state: string): 'neutral' | 'good' | 'warn' {
  if (state === 'active_app_user' || state === 'pending_app_user' || state === 'offline_non_app_member') return 'good';
  if (state === 'needs_review') return 'warn';
  return 'neutral';
}
