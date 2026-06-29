import type { AuditLogEntry } from '../state/auditLogStore';

export function latestAuditForAgent(auditLogs: AuditLogEntry[], agentName: string): AuditLogEntry | undefined {
  return auditLogs.find((entry) => entry.agent === agentName);
}
