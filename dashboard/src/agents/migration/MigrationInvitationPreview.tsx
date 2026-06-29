import { UsersRound } from 'lucide-react';
import { migrationBatch } from './migrationMockData';
import { memberName } from './migrationDisplay';
import { MigrationDataTable, MigrationPanel } from './MigrationOperations';
import type { ImportedMember } from './migrationTypes';

export function MigrationInvitationPreview({ approved, members }: { approved: boolean; members: ImportedMember[] }) {
  return (
    <MigrationPanel title="Invitation Preview" icon={<UsersRound size={18} />} wide>
      <p className="panel-copy">Preview only. No invitation messages are sent from this dashboard.</p>
      <MigrationDataTable
        columns={['Member', 'Email', 'Membership', 'Invitation State', 'Preview']}
        rows={members.slice(0, 12).map((member) => [
          memberName(member),
          member.email || 'No email',
          member.membershipType || 'Unknown',
          approved ? 'Ready after approval' : 'Held behind approval gate',
          `Invite ${member.firstName || 'member'} to activate Vyra access for ${migrationBatch.gymName}.`,
        ])}
      />
    </MigrationPanel>
  );
}
