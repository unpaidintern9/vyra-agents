import { Activity } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import type { ExecutiveTimelineItem } from './executiveTypes';

export function ExecutiveTimeline({ timeline }: { timeline: ExecutiveTimelineItem[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Activity size={18} />
          <h2>Executive Timeline</h2>
        </div>
        <span>Runtime activity</span>
      </div>
      {timeline.length ? (
        <div className="history-list executive-timeline">
          {timeline.map((item) => (
            <article className="history-item" key={item.id}>
              <div>
                <strong>{item.agent}</strong>
                <span>{item.detail}</span>
              </div>
              <div>
                <StatusBadge value={item.title} tone={item.type === 'failed' || item.type === 'warning' ? 'warn' : 'neutral'} />
                <small>{formatDate(item.timestamp)}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="No runtime activity has been recorded yet." />
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
