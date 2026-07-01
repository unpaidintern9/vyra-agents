import type { RiskLevel } from '../../components/RiskBadge';
import type { ConnectorReadinessSummary } from '../../runtime/connectorReadiness';
import type { CrossAgentCollaborationGraph, CrossAgentCollaborationSummary } from '../../runtime/crossAgentCollaboration';
import type { SharedTaskDashboardSummary } from '../../runtime/sharedTaskQueue';
import type { ExecutivePlanningSummary } from '../../runtime/executivePlanning';
import type { MarketingDashboardSummary } from '../../runtime/marketingIntelligence';
import type { AssetLibraryDashboardSummary } from '../../runtime/assetLibrary';
import type { CustomerSuccessDashboardSummary } from '../../runtime/customerSuccess';
import type { FinanceDashboardSummary } from '../../runtime/financeIntelligence';

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
export type SalesTeamAgentId =
  | 'head_sales'
  | 'prospect_discovery'
  | 'public_research'
  | 'data_organization'
  | 'icp_fit_scoring'
  | 'outreach_prep'
  | 'meeting_prep'
  | 'proposal_builder'
  | 'migration_planning'
  | 'crm_design'
  | 'follow_up'
  | 'sales_intelligence'
  | 'safety_approval';
export type SalesTeamAgentStatus = 'active_local' | 'planned' | 'blocked_external';
export type SalesProspectCategory = 'mma_bjj' | 'crossfit' | 'small_gym' | 'boutique_fitness' | 'sports_performance';
export type SalesProspectFitTier = 'prime_target' | 'good_fit' | 'research_needed' | 'low_fit';
export type SalesProspectSourceStatus = 'mock_seed' | 'needs_public_research' | 'public_research_ready';
export type SalesProspectBusinessType = SalesProspectCategory | 'independent_coach' | 'multi_location_gym' | 'unknown';
export type SalesMigrationComplexity = 'unknown' | 'low' | 'medium' | 'high';
export type SalesReportKind =
  | 'pipeline'
  | 'prospect_research'
  | 'company_dossier'
  | 'outreach_prep'
  | 'follow_up'
  | 'icp_fit'
  | 'proposal'
  | 'executive_summary'
  | 'lead_scoring'
  | 'follow_up_queue'
  | 'weighted_pipeline';
export type SalesExecutionStatusType = 'idle' | 'loading' | 'success' | 'error';
export type SalesOpportunityStage =
  | 'prospect'
  | 'researching'
  | 'qualified'
  | 'contact_ready'
  | 'outreach_sent'
  | 'waiting'
  | 'follow_up'
  | 'discovery_scheduled'
  | 'proposal_preparation'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'archived';
export type SalesOpportunityPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type SalesOpportunityRating = 'A' | 'B' | 'C' | 'D';
export type SalesOpportunityTimelineType =
  | 'created'
  | 'research_generated'
  | 'dossier_created'
  | 'report_generated'
  | 'outreach_drafted'
  | 'proposal_prepared'
  | 'note_added'
  | 'stage_changed'
  | 'follow_up_scheduled'
  | 'manual_action'
  | 'executive_review';
export type SalesResearchSourceCategory =
  | 'Manual Research'
  | 'Public Website'
  | 'Government'
  | 'Business Directory'
  | 'Chamber of Commerce'
  | 'LinkedIn (manual reference only)'
  | 'Industry Association'
  | 'State Registry'
  | 'Federal Registry'
  | 'Local File'
  | 'CSV Import'
  | 'Internal Notes'
  | 'Existing Reports'
  | 'User Generated';
export type SalesResearchSourceApprovalStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Disabled' | 'Archived';
export type SalesResearchSourceMode = 'Manual' | 'Semi-Automatic';
export type SalesResearchScope = 'Local' | 'External';
export type SalesResearchReviewStatus = 'pending_review' | 'reviewed' | 'approved' | 'rejected';
export type SalesResearchEvidenceLevel = 'low' | 'medium' | 'high';
export type SalesResearchRiskRating = 'low' | 'medium' | 'high';
export type SalesWorkflowType =
  | 'research_request'
  | 'verification_request'
  | 'duplicate_review'
  | 'missing_info_request'
  | 'follow_up_preparation'
  | 'proposal_prep_handoff'
  | 'executive_approval'
  | 'risky_source_review'
  | 'external_action_gate'
  | 'proposal_readiness_review'
  | 'stalled_opportunity_review'
  | 'lost_opportunity_review';
export type SalesWorkflowStatus = 'draft' | 'queued' | 'assigned' | 'in_review' | 'approved' | 'rejected' | 'blocked' | 'completed' | 'archived';
export type SalesWorkflowAgent = 'Sales' | 'Operator' | 'Executive' | 'Proposal Prep';
export type SalesWorkflowApprovalStatus = 'not_required' | 'required' | 'pending' | 'approved' | 'rejected' | 'blocked';
export type SalesIntelligenceScoreLabel = 'Hot' | 'Warm' | 'Cold' | 'Not Ready';
export type SalesIntelligenceConfidenceLevel = 'High' | 'Medium' | 'Low';
export type SalesPriorityQueueId = 'hot_prospects' | 'warm_prospects' | 'needs_research' | 'proposal_ready' | 'executive_review' | 'blocked';
export type SalesIntelligenceNodeType =
  | 'prospect'
  | 'organization'
  | 'coach'
  | 'proposal'
  | 'follow_up'
  | 'migration_plan'
  | 'research_dossier'
  | 'activity';
export type SalesIntelligenceRelationshipType =
  | 'owns'
  | 'employs'
  | 'manages'
  | 'interested_in'
  | 'migration_target'
  | 'proposal_for'
  | 'follow_up_for'
  | 'referred_by'
  | 'competitor_of';
export type SalesOrganizationTimelineType =
  | 'created'
  | 'updated'
  | 'contact_added'
  | 'research_imported'
  | 'opportunity_created'
  | 'proposal_prepared'
  | 'workflow_update'
  | 'archived'
  | 'intake_created'
  | 'research_completed'
  | 'proposal_drafted'
  | 'follow_up_scheduled'
  | 'migration_planned'
  | 'executive_review';
export type SalesContactTimelineType = 'created' | 'updated' | 'note' | 'interaction' | 'workflow' | 'proposal_involvement' | 'follow_up' | 'executive_review';
export type SalesBuyingCommitteeRole =
  | 'Owner'
  | 'CEO'
  | 'President'
  | 'Executive Sponsor'
  | 'Decision Maker'
  | 'Operations'
  | 'Procurement'
  | 'Finance'
  | 'Technical Reviewer'
  | 'Coach Director'
  | 'Gym Manager'
  | 'Influencer'
  | 'Champion'
  | 'Blocker';

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

export interface SalesOpportunityContact {
  email: string;
  name: string;
  phone: string;
  role: string;
}

export interface SalesOpportunityTimelineEvent {
  id: string;
  operator: string;
  previousStage?: SalesOpportunityStage;
  newStage?: SalesOpportunityStage;
  reason: string;
  timestamp: string;
  title: string;
  type: SalesOpportunityTimelineType;
}

export interface SalesOpportunityScore {
  confidence: number;
  leadScore: number;
  opportunityRating: SalesOpportunityRating;
  overallScore: number;
  priority: SalesOpportunityPriority;
  reasoning: string[];
}

export interface SalesOpportunityFollowUpPlan {
  estimatedCloseProbability: number;
  missingInformation: string[];
  proposalReadiness: number;
  recommendedNextAction: string;
  recommendedTimeframe: string;
  talkingPoints: string[];
  unansweredQuestions: string[];
}

export interface SalesOpportunityProposalStatus {
  missing: string[];
  readinessPercent: number;
  status: 'not_ready' | 'needs_review' | 'ready' | 'sent';
}

export interface SalesOpportunity {
  activityTimeline: SalesOpportunityTimelineEvent[];
  archived: boolean;
  assignedOwner: string;
  attachments: string[];
  city: string;
  company: string;
  companySizeEstimate: string;
  contacts: SalesOpportunityContact[];
  createdAt: string;
  draftOutreach: string[];
  email: string;
  executiveVisibility: boolean;
  generatedReports: string[];
  id: string;
  icpScore: number;
  industry: string;
  leadScore: number;
  location: string;
  naics: string;
  notes: string[];
  phone: string;
  pinned: boolean;
  priority: SalesOpportunityPriority;
  proposalPreparationStatus: SalesOpportunityProposalStatus;
  score: SalesOpportunityScore;
  source: string;
  stage: SalesOpportunityStage;
  state: string;
  status: 'active' | 'won' | 'lost' | 'archived';
  tags: string[];
  updatedAt: string;
  website: string;
  favorite: boolean;
  followUpPlan: SalesOpportunityFollowUpPlan;
}

export interface SalesOpportunityPipelineSummary {
  activeOpportunities: number;
  averageIcp: number;
  averageLeadScore: number;
  awaitingFollowUp: number;
  highPriority: number;
  lost: number;
  proposalReady: number;
  proposalSent: number;
  totalOpportunities: number;
  won: number;
}

export interface SalesResearchSource {
  approvalStatus: SalesResearchSourceApprovalStatus;
  authenticationRequired: boolean;
  category: SalesResearchSourceCategory;
  confidenceScore: number;
  createdAt: string;
  description: string;
  enabled: boolean;
  id: string;
  lastUsedAt: string | null;
  mode: SalesResearchSourceMode;
  name: string;
  notes: string[];
  scope: SalesResearchScope;
  status: 'active' | 'inactive' | 'needs_review';
  trustScore: number;
  updatedAt: string;
}

export interface SalesResearchIntakeItem {
  analyst: string;
  company: string;
  completeness: number;
  confidence: number;
  date: string;
  duplicateDetection: SalesDuplicateCandidate[];
  evidenceLevel: SalesResearchEvidenceLevel;
  humanReviewRequired: boolean;
  id: string;
  missingInformation: string[];
  opportunityId: string;
  rawNotes: string;
  researchType: string;
  reviewStatus: SalesResearchReviewStatus;
  riskRating: SalesResearchRiskRating;
  sourceId: string;
  suggestedActions: string[];
  summary: string;
  verificationStatus: 'unverified' | 'partially_verified' | 'verified';
}

export interface SalesDuplicateCandidate {
  confidence: number;
  detectedAt: string;
  fields: string[];
  id: string;
  reason: string;
  suggestedMergeAction: string;
  targetId: string;
  targetType: 'company' | 'contact' | 'website' | 'phone' | 'email' | 'opportunity';
}

export interface SalesEnrichmentHistoryItem {
  confidence: number;
  field: string;
  id: string;
  newValue: string;
  operator: string;
  opportunityId: string;
  previousValue: string;
  reason: string;
  sourceId: string;
  timestamp: string;
}

export interface SalesResearchIntelligenceSummary {
  approvedSources: number;
  confidenceTrend: number;
  duplicateAlerts: number;
  enrichmentProgress: number;
  pendingReviews: number;
  rejectedSources: number;
  researchBacklog: number;
  verificationQueue: number;
}

export interface SalesWorkflowAuditItem {
  affectedArtifacts: string[];
  confidenceImpact: number;
  id: string;
  newStatus: SalesWorkflowStatus;
  nextAction: string;
  operator: string;
  previousStatus: SalesWorkflowStatus;
  reason: string;
  timestamp: string;
}

export interface SalesWorkflowRecord {
  approvalRequirement: boolean;
  approvalStatus: SalesWorkflowApprovalStatus;
  auditTrail: SalesWorkflowAuditItem[];
  company: string;
  completedAt: string | null;
  createdAt: string;
  dueAt: string;
  id: string;
  missingInformation: string[];
  opportunityId: string;
  owner: string;
  priority: SalesOpportunityPriority;
  reason: string;
  relatedDraftIds: string[];
  relatedIntakeIds: string[];
  relatedReportIds: string[];
  relatedSourceIds: string[];
  requestedAction: string;
  requiredInputs: string[];
  sourceAgent: SalesWorkflowAgent;
  status: SalesWorkflowStatus;
  targetAgent: SalesWorkflowAgent;
  type: SalesWorkflowType;
  updatedAt: string;
}

export interface SalesProposalPrepQueueItem {
  company: string;
  executiveApprovalStatus: SalesWorkflowApprovalStatus;
  missingInfo: string[];
  nextAction: string;
  opportunityId: string;
  proposalStatus: SalesOpportunityProposalStatus['status'];
  readinessPercent: number;
  sourceConfidence: number;
  verificationStatus: SalesResearchIntakeItem['verificationStatus'];
  workflowId: string;
}

export interface SalesWorkflowSummary {
  activeHandoffs: number;
  approvalQueue: number;
  assignedToExecutive: number;
  assignedToOperator: number;
  assignedToProposalPrep: number;
  blockedWorkflows: number;
  completedWorkflows: number;
  externalActionGates: number;
  proposalPrepItems: number;
  totalWorkflows: number;
  workflowHealth: number;
}

export interface SalesIntelligenceScore {
  buyingSignals: number;
  companyFit: number;
  confidence: number;
  confidenceLevel: SalesIntelligenceConfidenceLevel;
  estimatedRevenuePotential: number;
  existingRelationship: number;
  geographicFit: number;
  industryFit: number;
  opportunityId: string;
  organizationSize: number;
  proposalReadiness: number;
  recommendedNextAction: string;
  risks: string[];
  scoreLabel: SalesIntelligenceScoreLabel;
  topReasons: string[];
  totalScore: number;
  workflowUrgency: number;
}

export interface SalesPriorityQueueItem {
  company: string;
  explanation: string;
  nextAction: string;
  opportunityId: string;
  priority: SalesOpportunityPriority;
  queueId: SalesPriorityQueueId;
  risks: string[];
  scoreLabel: SalesIntelligenceScoreLabel;
  totalScore: number;
}

export interface SalesPriorityQueue {
  id: SalesPriorityQueueId;
  label: string;
  items: SalesPriorityQueueItem[];
}

export interface SalesRelatedOpportunityCandidate {
  company: string;
  confidence: number;
  fields: string[];
  id: string;
  opportunityId: string;
  reason: string;
  relatedCompany: string;
  relatedOpportunityId: string;
  reviewAction: string;
}

export interface SalesPipelineAnalytics {
  averageConfidence: number;
  blockedCount: number;
  coldCount: number;
  estimatedPipelineValue: number;
  executiveReviewCount: number;
  hotCount: number;
  nextActionBreakdown: Record<string, number>;
  notReadyCount: number;
  proposalReadyCount: number;
  totalOpportunities: number;
  warmCount: number;
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

export interface SalesTeamAgentDefinition {
  blockedActions: string[];
  description: string;
  handoffTo: SalesTeamAgentId[];
  id: SalesTeamAgentId;
  localOnly: true;
  name: string;
  output: string;
  responsibilities: string[];
  status: SalesTeamAgentStatus;
}

export interface SalesProspectResearchRecord {
  category: SalesProspectCategory;
  city: string;
  confidence: 'high' | 'medium' | 'low';
  estimatedLocationCount: number | null;
  estimatedSizeLabel: string;
  firstOutreachAngle: string;
  fitReasons: string[];
  fitScore: number;
  fitTier: SalesProspectFitTier;
  id: string;
  lastReviewedAt: string;
  localOnly: true;
  notes: string;
  prospectName: string;
  publicSocialUrl?: string;
  recommendedNextResearch: string;
  sourceStatus: SalesProspectSourceStatus;
  state: string;
  websiteUrl?: string;
}

export interface SalesAgentTeamSummary {
  activeAgents: number;
  averageFitScore: number;
  blockedExternalActions: number;
  highFitProspects: number;
  localOnlyAgents: number;
  needsResearch: number;
  readyProspects: number;
  targetMarkets: number;
  totalAgents: number;
  totalProspects: number;
}

export interface SalesProspectIntake {
  businessType: SalesProspectBusinessType;
  city: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  currentSoftware: string;
  estimatedCoaches: number | null;
  estimatedMembers: number | null;
  gymName: string;
  id: string;
  instagramUrl: string;
  localOnly: true;
  migrationComplexity: SalesMigrationComplexity;
  notes: string;
  painPoints: string[];
  state: string;
  updatedAt: string;
  websiteUrl: string;
}

export interface SalesResearchDossier {
  businessOverview: string;
  createdAt: string;
  dossierId: string;
  fitFactors: LeadScoreFactor[];
  fitScore: number;
  highFit: boolean;
  icpFit: SalesProspectFitTier;
  intakeId: string;
  likelyPainPoints: string[];
  localOnly: true;
  migrationOpportunity: string;
  missingInfo: string[];
  nextSteps: string[];
  notBrowsedExternally: true;
  notSyncedToCrm: true;
  outreachAngle: string;
  proposalAngle: string;
  recommendedVyraProduct: string;
  risks: string[];
  updatedAt: string;
}

export interface SalesProspectDossierSummary {
  dossiersCreated: number;
  highFitDossiers: number;
  migrationOpportunityProspects: number;
  missingInfoProspects: number;
  savedProspects: number;
}

export interface SalesIntelligenceNode {
  id: string;
  label: string;
  localOnly: true;
  metadata: Record<string, string | number | boolean | null>;
  type: SalesIntelligenceNodeType;
}

export interface SalesIntelligenceEdge {
  explanation: string;
  from: string;
  id: string;
  relationship: SalesIntelligenceRelationshipType;
  to: string;
}

export interface SalesOrganizationTimelineItem {
  detail: string;
  id: string;
  organizationId: string;
  timestamp: string;
  title: string;
  type: SalesOrganizationTimelineType;
}

export interface SalesOrganizationProfile {
  activeOpportunity: boolean;
  completenessScore: number;
  connectedDossierIds: string[];
  connectedFollowUpIds: string[];
  connectedProposalIds: string[];
  id: string;
  label: string;
  localOnly: true;
  migrationReadiness: 'ready' | 'planned' | 'needs_info' | 'not_applicable';
  profileSummary: string;
  relationshipDepth: number;
  timeline: SalesOrganizationTimelineItem[];
}

export interface SalesContactTimelineItem {
  contactId: string;
  detail: string;
  id: string;
  timestamp: string;
  title: string;
  type: SalesContactTimelineType;
}

export interface SalesContactIntelligence {
  buyingInfluence: number;
  championScore: number;
  confidence: number;
  contactId: string;
  decisionAuthority: 'high' | 'medium' | 'low' | 'unknown';
  department: string;
  email: string;
  firstName: string;
  lastInteraction: string | null;
  lastName: string;
  linkedin: string;
  nextFollowUp: string | null;
  notes: string[];
  organizationId: string;
  phone: string;
  preferredCommunication: 'email' | 'phone' | 'linkedin_manual' | 'unknown';
  preferredName: string;
  relationshipStrength: number;
  riskScore: number;
  timeline: SalesContactTimelineItem[];
  title: string;
}

export interface SalesBuyingCommitteeMember {
  contactId: string;
  confidence: number;
  evidence: string;
  role: SalesBuyingCommitteeRole;
}

export interface SalesBuyingCommittee {
  completenessScore: number;
  missingRoles: SalesBuyingCommitteeRole[];
  organizationId: string;
  roles: SalesBuyingCommitteeMember[];
}

export interface SalesExplainableEvaluation {
  confidence: number;
  nextActions: string[];
  recommendations: string[];
  reasons: string[];
  risks: string[];
  score: number;
}

export interface SalesOrganizationIntelligence {
  additionalLocations: string[];
  buyingReadiness: number;
  businessType: string;
  confidence: number;
  contacts: SalesContactIntelligence[];
  currentSalesStage: SalesOpportunityStage;
  dbaNames: string[];
  description: string;
  duplicateCandidateIds: string[];
  estimatedEmployeeRange: string;
  estimatedRevenueRange: string;
  evaluations: {
    buyingCommitteeCompleteness: SalesExplainableEvaluation;
    decisionMakerCoverage: SalesExplainableEvaluation;
    organizationHealth: SalesExplainableEvaluation;
    proposalReadiness: SalesExplainableEvaluation;
    relationshipHealth: SalesExplainableEvaluation;
    salesReadiness: SalesExplainableEvaluation;
  };
  foundedYear: number | null;
  headquarters: string;
  icpScore: number;
  industry: string;
  internalNotes: string[];
  legalName: string;
  naics: string;
  opportunityIds: string[];
  opportunityScore: number;
  organizationId: string;
  ownershipType: string;
  primaryDomain: string;
  priority: SalesOpportunityPriority;
  relationshipGraphNodeIds: string[];
  relationshipHealth: number;
  reports: string[];
  riskRating: 'low' | 'medium' | 'high';
  serviceAreas: string[];
  sic: string;
  subIndustry: string;
  technologyProfile: Record<string, string>;
  timeline: SalesOrganizationTimelineItem[];
  website: string;
}

export interface SalesRelationshipEdge {
  explanation: string;
  from: string;
  id: string;
  relationship: string;
  to: string;
}

export interface SalesOrganizationDuplicateCandidate {
  confidence: number;
  fields: string[];
  id: string;
  leftId: string;
  leftLabel: string;
  reason: string;
  reviewAction: 'Review Duplicate';
  rightId: string;
  rightLabel: string;
  type: 'organization' | 'contact';
}

export interface SalesOrganizationIntelligenceSummary {
  averageBuyingCommitteeCompleteness: number;
  averageRelationshipHealth: number;
  contactMaintenanceQueue: number;
  decisionMakerCoverage: number;
  duplicateContactCandidates: number;
  duplicateOrganizationCandidates: number;
  executiveRelationshipRisks: number;
  highValueOrganizations: number;
  incompleteBuyingCommittees: number;
  largestOpportunityValue: number;
  missingDecisionMakers: number;
  organizationsMissingContacts: number;
  organizationsTracked: number;
  relationshipFollowUps: number;
  totalContacts: number;
}

export interface SalesOrganizationIntelligenceStore {
  buyingCommittees: SalesBuyingCommittee[];
  contactDuplicateCandidates: SalesOrganizationDuplicateCandidate[];
  contacts: SalesContactIntelligence[];
  generatedAt: string;
  localOnly: true;
  organizationDuplicateCandidates: SalesOrganizationDuplicateCandidate[];
  organizations: SalesOrganizationIntelligence[];
  relationshipEdges: SalesRelationshipEdge[];
  summary: SalesOrganizationIntelligenceSummary;
}

export type SharedMemoryEntityType =
  | 'organization'
  | 'contact'
  | 'opportunity'
  | 'workflow'
  | 'proposal'
  | 'research source'
  | 'research intake'
  | 'report'
  | 'task'
  | 'approval'
  | 'contract'
  | 'market segment'
  | 'brand asset'
  | 'note'
  | 'artifact';

export interface SharedMemoryEntity {
  aliases: string[];
  archivedDate: string | null;
  auditHistory: string[];
  confidence: number;
  createdDate: string;
  displayName: string;
  entityId: string;
  entityType: SharedMemoryEntityType;
  owningAgent: string;
  relatedAgents: string[];
  riskRating: string;
  sourceReferences: string[];
  status: string;
  tags: string[];
  updatedDate: string;
}

export interface SharedMemoryFact {
  auditTrail: string[];
  confidence: number;
  createdBy: string;
  createdDate: string;
  entityId: string;
  evidenceLevel: string;
  factId: string;
  factType: string;
  source: string;
  supersededBy: string | null;
  updatedDate: string;
  value: string | number;
  verificationStatus: string;
  verifiedBy: string | null;
}

export interface SharedMemoryRelationship {
  auditTrail: string[];
  confidence: number;
  createdBy: string;
  createdDate: string;
  direction: 'directed' | 'bidirectional';
  fromEntity: string;
  relationshipId: string;
  relationshipType: string;
  source: string;
  toEntity: string;
  updatedDate: string;
}

export interface SharedMemoryConflict {
  autoResolved: false;
  conflictId: string;
  conflictType: string;
  createdDate: string;
  description: string;
  entityIds: string[];
  factIds: string[];
  recommendedReviewAction: string;
  relationshipIds: string[];
  reviewedAt: string | null;
  reviewedBy: string | null;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'reviewed';
}

export interface SharedMemoryAgentView {
  agent: string;
  conflictCount: number;
  conflictQueue: SharedMemoryConflict[];
  entityCount: number;
  factCount: number;
  maintenanceQueue: Array<{ action: string; detail: string; label: string; type: string }>;
  relationshipCount: number;
  relationshipGraph: SharedMemoryRelationship[];
  riskyFactCount: number;
  sourceBackedFacts: SharedMemoryFact[];
  staleFactCount: number;
  topEntities: SharedMemoryEntity[];
}

export interface SharedMemorySummary {
  averageEntityConfidence: number;
  averageFactConfidence: number;
  conflictCount: number;
  duplicateEntityQueue: number;
  entityCount: number;
  factCount: number;
  recommendedReviewAction: string;
  relationshipCount: number;
  riskyFacts: number;
  staleFacts: number;
}

export interface SharedMemoryStore {
  agentViews: Record<string, SharedMemoryAgentView>;
  conflicts: SharedMemoryConflict[];
  entities: SharedMemoryEntity[];
  facts: SharedMemoryFact[];
  generatedAt: string;
  localOnly: true;
  relationships: SharedMemoryRelationship[];
  safety: {
    automaticApprovals: false;
    automaticMerge: false;
    autonomousBrowsing: false;
    autonomousEmailing: false;
    externalSync: false;
    hiddenFactOverwrite: false;
    localOnly: true;
    proposalSubmission: false;
  };
  summary: SharedMemorySummary;
}

export interface SalesIntelligenceGraph {
  edges: SalesIntelligenceEdge[];
  generatedAt: string;
  localOnly: true;
  nodes: SalesIntelligenceNode[];
  organizationProfiles: SalesOrganizationProfile[];
}

export interface SalesIntelligenceSummary {
  activeOpportunities: number;
  averageRelationshipDepth: number;
  intelligenceCompletenessScore: number;
  migrationReadyOrganizations: number;
  organizationsTracked: number;
  proposalCoverage: number;
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
  crossAgentGraph: CrossAgentCollaborationGraph;
  crossAgentSummary: CrossAgentCollaborationSummary;
  followUpQueue: FollowUpQueueItem[];
  importResult: SalesImportResult;
  integration: SalesIntegrationSummary;
  lastSalesExecutionStatus: SalesExecutionStatus;
  leads: SalesLead[];
  onAction(_leadId: string, _action: SalesAction): void;
  onCreateSalesExecutionTasks(): void;
  onMoveOpportunityStage(_opportunityId: string, _stage: SalesOpportunityStage, _reason: string): void;
  onExport(
    _format: 'json' | 'markdown' | 'csv',
    _report: SalesReportKind,
  ): void;
  onExportResearchDossier(_dossierId: string, _format: 'json' | 'markdown'): void;
  onExportSalesIntelligence(_report: 'organization_intelligence' | 'graph' | 'timeline', _organizationId: string | null): void;
  onExportCrossAgent(_report: 'collaboration' | 'graph' | 'priority_queue'): void;
  onExportProposalDraft(_draftId: string, _format: 'json' | 'markdown'): void;
  onGenerateProposalDraft(_leadId: string, _templateType: SalesProposalTemplateType): void;
  onGenerateSalesEmailDrafts(): void;
  onSaveProspectIntake(_draft: SalesProspectIntakeDraft): void;
  onImportJson(_content: string): void;
  onRunProspectSearch(_filters: SalesRecommendedSearchFilters): void;
  onRunSalesResearch(): void;
  proposalDrafts: SalesProposalDraft[];
  proposalSummary: SalesProposalSummary;
  proposals: ProposalPrep[];
  opportunities: SalesOpportunity[];
  opportunitySummary: SalesOpportunityPipelineSummary;
  prospectDossierSummary: SalesProspectDossierSummary;
  prospectDossiers: SalesResearchDossier[];
  prospectIntakes: SalesProspectIntake[];
  prospectResearch: SalesProspectResearchRecord[];
  researchEnrichmentHistory: SalesEnrichmentHistoryItem[];
  researchIntake: SalesResearchIntakeItem[];
  researchIntelligenceSummary: SalesResearchIntelligenceSummary;
  researchSources: SalesResearchSource[];
  salesProposalPrepQueue: SalesProposalPrepQueueItem[];
  salesPriorityQueues: SalesPriorityQueue[];
  salesRelatedOpportunityCandidates: SalesRelatedOpportunityCandidate[];
  salesPipelineAnalytics: SalesPipelineAnalytics;
  salesIntelligenceScores: SalesIntelligenceScore[];
  salesWorkflowSummary: SalesWorkflowSummary;
  salesWorkflows: SalesWorkflowRecord[];
  scores: LeadScore[];
  salesIntelligenceGraph: SalesIntelligenceGraph;
  salesIntelligenceSummary: SalesIntelligenceSummary;
  organizationIntelligence: SalesOrganizationIntelligenceStore;
  sharedMemory: SharedMemoryStore;
  connectorReadiness?: ConnectorReadinessSummary;
  assetLibrary?: AssetLibraryDashboardSummary;
  customerSuccess?: CustomerSuccessDashboardSummary;
  finance?: FinanceDashboardSummary;
  marketing?: MarketingDashboardSummary;
  sharedTaskSummary?: SharedTaskDashboardSummary;
  executivePlanning?: ExecutivePlanningSummary;
  teamAgents: SalesTeamAgentDefinition[];
  teamSummary: SalesAgentTeamSummary;
  scoringSummary: SalesScoringSummary;
}

export type SalesProspectIntakeDraft = Omit<SalesProspectIntake, 'createdAt' | 'id' | 'localOnly' | 'updatedAt'>;

export interface SalesRecommendedSearchFilters {
  category?: SalesProspectCategory | 'all';
  market?: string;
  minimumFitScore?: number;
  sourceStatus?: SalesProspectSourceStatus | 'all';
}

export interface SalesRecommendedSearch {
  description: string;
  filters: SalesRecommendedSearchFilters;
  id: string;
  label: string;
}

export interface SalesExecutionStatus {
  detail: string;
  generatedAt: string | null;
  resultCount: number;
  status: SalesExecutionStatusType;
  title: string;
}
