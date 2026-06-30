import type { RiskLevel } from '../../components/RiskBadge';

export type LeadType = 'gym' | 'coach' | 'organization' | 'referral';
export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'proposal_needed'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'paused';
export type LeadPriority = RiskLevel;
export type LeadStatus = 'active' | 'won' | 'lost' | 'paused';
export type SalesActivityType = 'note' | 'follow_up' | 'contacted' | 'proposal' | 'status_change';
export type ProposalStatus = 'not_started' | 'needed' | 'drafted' | 'sent_mock' | 'paused';
export type SalesAction = 'follow_up_planned' | 'contacted' | 'proposal_needed' | 'paused';

export interface SalesLead {
  businessName: string;
  contactName: string;
  createdAt: string;
  currentClients?: number;
  email: string;
  estimatedValue: number;
  id: string;
  leadType: LeadType;
  likelyProductFit?: string;
  location: string;
  memberCount?: number;
  name: string;
  nextAction: string;
  nextFollowUpDate: string | null;
  niche?: string;
  notes: string;
  phone: string;
  pipelineStage: PipelineStage;
  priority: LeadPriority;
  source: string;
  status: LeadStatus;
  updatedAt: string;
}

export interface SalesActivity {
  activityType: SalesActivityType;
  id: string;
  leadId: string;
  nextAction: string;
  outcome: string;
  summary: string;
  timestamp: string;
}

export interface ProposalPrep {
  leadId: string;
  migrationFee?: number;
  migrationNeeded: boolean;
  monthlyFee: number;
  notes: string;
  pricingTier: string;
  recommendedProduct: string;
  setupFee: number;
  status: ProposalStatus;
}

export interface SalesSummary {
  coachLeads: number;
  estimatedPipelineValue: number;
  followUpsDue: number;
  gymLeads: number;
  hotLeads: number;
  proposalNeeded: number;
  totalLeads: number;
  wonThisMonth: number;
}

export interface SalesFilters {
  priority: string;
  source: string;
  stage: string;
  type: string;
}

export interface SalesPageProps {
  activities: SalesActivity[];
  leads: SalesLead[];
  onAction(_leadId: string, _action: SalesAction): void;
  onExport(_format: 'json' | 'markdown', _report: 'pipeline' | 'follow_up' | 'proposal'): void;
  proposals: ProposalPrep[];
}
