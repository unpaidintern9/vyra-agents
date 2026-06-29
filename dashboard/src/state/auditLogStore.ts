import type { RiskLevel } from '../components/RiskBadge';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  agent: string;
  action: string;
  target: string;
  result: string;
  riskLevel: RiskLevel;
  approvalRequired?: boolean;
}

export function createInitialAuditLogs(): AuditLogEntry[] {
  return [
    {
      id: 'audit_refresh',
      timestamp: '2026-06-28T21:55:00-04:00',
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'integration status refreshed',
      target: 'GitHub and Supabase',
      result: 'completed locally',
      riskLevel: 'low',
    },
    {
      id: 'audit_dry_run',
      timestamp: '2026-06-28T21:40:08-04:00',
      actor: 'Robert',
      agent: 'Migration Agent',
      action: 'migration dry run completed',
      target: 'Derby City Martial Arts mock import',
      result: 'warnings surfaced',
      riskLevel: 'low',
    },
    {
      id: 'audit_approval',
      timestamp: '2026-06-28T21:42:00-04:00',
      actor: 'Robert',
      agent: 'Operations Agent',
      action: 'approval mock approved',
      target: 'Migration review',
      result: 'local state updated',
      riskLevel: 'medium',
      approvalRequired: true,
    },
    {
      id: 'audit_warning',
      timestamp: '2026-06-28T21:58:00-04:00',
      actor: 'System',
      agent: 'Operations Agent',
      action: 'warning reviewed',
      target: 'Missing live credentials',
      result: 'mock fallback retained',
      riskLevel: 'low',
    },
    {
      id: 'audit_tables',
      timestamp: '2026-06-28T22:02:00-04:00',
      actor: 'System',
      agent: 'Migration Agent',
      action: 'table readiness checked',
      target: 'Agent memory and gym migration tables',
      result: 'prepared',
      riskLevel: 'low',
    },
  ];
}

