export type StatusTone = 'neutral' | 'good' | 'warn';

export function StatusBadge({ value, tone = 'neutral' }: { value: string; tone?: StatusTone }) {
  return <span className={`badge ${tone}`}>{value}</span>;
}

