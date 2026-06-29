import type { ApprovalItem } from '../state/approvalStore';
import type { ApprovalHistoryEntry } from '../types/localRecords';
import type { RuntimeApproval } from './runtimeTypes';

export function buildRuntimeApprovals(items: ApprovalItem[], history: ApprovalHistoryEntry[]): RuntimeApproval[] {
  return items.map((item) => {
    const latestHistory = history.find((entry) => entry.approvalId === item.id);
    return {
      agent: item.requestedBy,
      approvalId: item.id,
      completed: latestHistory?.decidedAt ?? null,
      created: latestHistory?.decidedAt ?? 'local seed',
      requiredBy: item.requiredApprover,
      risk: item.riskLevel,
      status: item.status,
      title: item.title,
      workflow: item.title.toLowerCase().replace(/\s+/g, '-'),
    };
  });
}
