import { UsersRound } from 'lucide-react';
import { migrationBatch } from './migrationMockData';
import { MigrationFact, MigrationPanel } from './MigrationOperations';

export function MigrationBatchDetail() {
  return (
    <MigrationPanel title="Migration Batch Detail" icon={<UsersRound size={18} />}>
      <div className="batch-grid">
        <MigrationFact label="Gym" value={migrationBatch.gymName} />
        <MigrationFact label="Organization ID" value={migrationBatch.organizationId} />
        <MigrationFact label="Source" value={migrationBatch.source} />
        <MigrationFact label="Status" value={migrationBatch.status} />
        <MigrationFact label="Imported Members" value={migrationBatch.importedMembers.toLocaleString()} />
        <MigrationFact label="Created By" value={migrationBatch.createdBy} />
      </div>
    </MigrationPanel>
  );
}
