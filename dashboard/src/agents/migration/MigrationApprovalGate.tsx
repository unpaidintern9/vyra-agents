import { ShieldCheck } from 'lucide-react';
import { MigrationPanel } from './MigrationOperations';

export function MigrationApprovalGate({ approved, onApprove }: { approved: boolean; onApprove: () => void }) {
  return (
    <MigrationPanel title="Approval Gate" icon={<ShieldCheck size={18} />}>
      <p className="panel-copy">
        This mock approval only updates local UI state. No production data, customer messaging, or database migration is
        connected.
      </p>
      <button className="approval-button" disabled={approved} onClick={onApprove} type="button">
        {approved ? 'Review Approved' : 'Approve Migration Review'}
      </button>
    </MigrationPanel>
  );
}
