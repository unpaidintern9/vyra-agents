import { UsersRound } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { memberName, offlineReason } from './migrationDisplay';
import { MigrationDataTable, MigrationPanel } from './MigrationOperations';
import type { ImportedMember } from './migrationTypes';

export function MigrationOfflineMembers({ members }: { members: ImportedMember[] }) {
  return (
    <MigrationPanel title="Offline / Non-App Member Tracking" icon={<UsersRound size={18} />} wide>
      <p className="panel-copy">
        These members can still attend the gym, be checked in, appear on rosters, keep billing status, receive coach
        assignments, and be managed by staff without downloading the app.
      </p>
      <div className="offline-support-grid">
        <StatusBadge value="Attendance allowed" tone="good" />
        <StatusBadge value="Rosters preserved" tone="good" />
        <StatusBadge value="Staff manageable" tone="good" />
        <StatusBadge value="App optional" tone="good" />
      </div>
      <MigrationDataTable
        columns={['Member', 'External ID', 'Reason', 'Billing', 'Coach', 'Staff Handling']}
        rows={members.map((member) => [
          memberName(member),
          member.externalMemberId,
          offlineReason(member),
          member.billingStatus || 'Unknown',
          member.coachAssignment || 'Unassigned',
          'Keep roster/check-in access without app user requirement',
        ])}
      />
    </MigrationPanel>
  );
}
