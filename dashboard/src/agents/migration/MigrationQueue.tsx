import { Workflow } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { MigrationDataTable, MigrationPanel } from './MigrationOperations';

export interface MigrationQueueItem {
  detail: string;
  status: string;
  step: string;
}

export function MigrationQueue({ queueItems }: { queueItems: MigrationQueueItem[] }) {
  return (
    <MigrationPanel title="Migration Queue" icon={<Workflow size={18} />} wide>
      <MigrationDataTable
        columns={['Step', 'Status', 'Detail']}
        rows={queueItems.map(({ step, status, detail }) => [
          step,
          <StatusBadge key={step} value={status} tone={queueTone(status)} />,
          detail,
        ])}
      />
    </MigrationPanel>
  );
}

function queueTone(status: string): 'neutral' | 'good' | 'warn' {
  if (status === 'Blocked' || status === 'Gated' || status === 'Waiting') return 'warn';
  if (status === 'Complete' || status === 'Ready' || status === 'Approved') return 'good';
  return 'neutral';
}
