export type RiskLevel = 'low' | 'medium' | 'high';

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const tone = risk === 'low' ? 'good' : 'warn';
  return <span className={`badge ${tone}`}>{risk}</span>;
}

