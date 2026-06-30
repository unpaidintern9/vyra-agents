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
export type SalesPriorityLabel = 'Hot' | 'Warm' | 'Nurture' | 'Needs Info' | 'At Risk';
export type LeadStatus = 'active' | 'won' | 'lost' | 'paused';
export type SalesActivityType = 'note' | 'follow_up' | 'contacted' | 'proposal' | 'status_change';
export type ProposalStatus = 'not_started' | 'needed' | 'drafted' | 'sent_mock' | 'paused';
export type SalesAction = 'follow_up_planned' | 'contacted' | 'proposal_needed' | 'paused';
export type SalesIntegrationMode = 'mock' | 'live_read_only';
export type SalesReadinessStatus = 'ready' | 'not_configured' | 'blocked';
export type SalesProspectSegment =
  | 'gym_prospect'
  | 'independent_coach'
  | 'gym_affiliated_coach'
  | 'white_label_prospect'
  | 'migration_prospect';
export type FollowUpQueueType = 'today' | 'overdue' | 'proposal_needed' | 'stalled' | 'missing_info';
export type SalesProposalTemplateType = 'independent_coach' | 'gym_os' | 'app_for_gyms' | 'white_label' | 'migration_data_import';
export type SalesProposalDraftStatus = 'draft_only' | 'ready_for_review' | 'needs_pricing' | 'risk_review';

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

export interface SalesGym {
  id: string;
  leadId: string;
  memberCount: number | null;
  migrationNeeded: boolean;
  name: string;
  productFit: string;
}

export interface SalesCoach {
  clientCount: number | null;
  id: string;
  leadId: string;
  name: string;
  niche: string;
  planFit: string;
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

export interface FollowUpPlan {
  dueDate: string | null;
  leadId: string;
  nextAction: string;
  status: 'due' | 'this_week' | 'overdue' | 'unscheduled' | 'planned';
}

export interface RevenueEstimate {
  leadId: string;
  monthlyRecurringRevenue: number;
  oneTimeRevenue: number;
  pipelineValue: number;
}

export interface LeadScoreFactor {
  detail: string;
  key: string;
  label: string;
  points: number;
}

export interface LeadScore {
  factors: LeadScoreFactor[];
  leadId: string;
  missingInfo: string[];
  priorityLabel: SalesPriorityLabel;
  recommendedAction: string;
  score: number;
  segment: SalesProspectSegment;
  stalled: boolean;
  weightedPipelineValue: number;
}

export interface FollowUpQueueItem {
  dueDate: string | null;
  leadId: string;
  leadName: string;
  nextAction: string;
  priorityLabel: SalesPriorityLabel;
  queue: FollowUpQueueType;
  reason: string;
  score: number;
}

export interface SalesScoringSummary {
  atRiskLeadCount: number;
  estimatedWeightedPipelineValue: number;
  followUpQueueCount: number;
  hotLeadCount: number;
  needsInfoCount: number;
  nurtureLeadCount: number;
  overdueFollowUpCount: number;
  proposalNeededCount: number;
  warmLeadCount: number;
}

export interface SalesProposalDraft {
  createdAt: string;
  draftId: string;
  estimatedValue: number;
  followUpDate: string | null;
  leadId: string;
  localOnly: true;
  monthlyPrice: number | null;
  nextStep: string;
  notInvoiced: true;
  notSent: true;
  painPoints: string[];
  previewMarkdown: string;
  prospectName: string;
  prospectType: string;
  recommendedPackage: string;
  riskFlags: string[];
  setupFee: number | null;
  status: SalesProposalDraftStatus;
  templateType: SalesProposalTemplateType;
  title: string;
  updatedAt: string;
}

export interface SalesProposalSummary {
  draftsCreated: number;
  missingPricing: number;
  readyForReview: number;
  riskCount: number;
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

export interface SalesIntegrationSummary {
  blockedExternalActionCount: number;
  crmReadinessStatus: SalesReadinessStatus;
  externalActionsEnabled: boolean;
  mode: SalesIntegrationMode;
  modeLabel: string;
  readOnly: boolean;
  safetyLabel: string;
}

export interface SalesImportResult {
  errors: string[];
  importedCount: number;
  skippedCount: number;
  status: 'idle' | 'success' | 'error';
  warnings: string[];
}

export interface SalesFilters {
  priority: string;
  scorePriority: string;
  source: string;
  stage: string;
  type: string;
}

export interface SalesPageProps {
  activities: SalesActivity[];
  followUpQueue: FollowUpQueueItem[];
  importResult: SalesImportResult;
  integration: SalesIntegrationSummary;
  leads: SalesLead[];
  onAction(_leadId: string, _action: SalesAction): void;
  onExport(
    _format: 'json' | 'markdown' | 'csv',
    _report: 'pipeline' | 'follow_up' | 'proposal' | 'lead_scoring' | 'follow_up_queue' | 'weighted_pipeline',
  ): void;
  onExportProposalDraft(_draftId: string, _format: 'json' | 'markdown'): void;
  onGenerateProposalDraft(_leadId: string, _templateType: SalesProposalTemplateType): void;
  onImportJson(_content: string): void;
  proposalDrafts: SalesProposalDraft[];
  proposalSummary: SalesProposalSummary;
  proposals: ProposalPrep[];
  scores: LeadScore[];
  scoringSummary: SalesScoringSummary;
}
