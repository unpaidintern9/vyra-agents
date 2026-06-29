import { CircleDot } from 'lucide-react';
import { MigrationDataTable, MigrationPanel } from './MigrationOperations';
import type { MemberMatch } from './migrationTypes';

export function MigrationMemberReview({ matches }: { matches: MemberMatch[] }) {
  return (
    <MigrationPanel title="Member Review Table" icon={<CircleDot size={18} />} wide>
      <MigrationDataTable
        columns={['Imported Member', 'Match Type', 'Member State', 'Existing User', 'Org Membership', 'Review Notes']}
        rows={matches.map((match) => [
          match.importedMember,
          match.matchType,
          match.memberState,
          match.existingUser,
          match.organizationMembershipReady ? 'Yes' : 'Review',
          match.notes,
        ])}
      />
    </MigrationPanel>
  );
}
