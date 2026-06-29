import type { RiskLevel } from '../components/RiskBadge';

export interface ApprovalItem {
  id: string;
  title: string;
  requestedBy: string;
  riskLevel: RiskLevel;
  status: 'pending' | 'mock approved' | 'blocked';
  requiredApprover: string;
  reason: string;
}

export function createInitialApprovals(): ApprovalItem[] {
  return [
    {
      id: 'approve_migration_review',
      title: 'Approve Migration Review',
      requestedBy: 'Migration Agent',
      riskLevel: 'medium',
      status: 'pending',
      requiredApprover: 'Robert',
      reason: 'Gym review must be accepted before any future finalization.',
    },
    {
      id: 'send_member_invitations',
      title: 'Send Member Invitations',
      requestedBy: 'Migration Agent',
      riskLevel: 'high',
      status: 'blocked',
      requiredApprover: 'Robert',
      reason: 'Customer communication is high risk and not enabled in Phase 5.',
    },
    {
      id: 'apply_production_migration',
      title: 'Apply Production Migration',
      requestedBy: 'Engineering Agent',
      riskLevel: 'high',
      status: 'blocked',
      requiredApprover: 'Robert',
      reason: 'Database migrations require explicit approval and are not part of this phase.',
    },
    {
      id: 'deploy_workflow',
      title: 'Deploy Workflow',
      requestedBy: 'Operations Agent',
      riskLevel: 'high',
      status: 'blocked',
      requiredApprover: 'Robert',
      reason: 'Workflow deployment is a future production-write capability.',
    },
    {
      id: 'send_customer_email',
      title: 'Send Customer Email',
      requestedBy: 'Support Agent',
      riskLevel: 'high',
      status: 'blocked',
      requiredApprover: 'Robert',
      reason: 'Customer messaging must remain disabled until approvals and logging are production-ready.',
    },
  ];
}

