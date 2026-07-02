import { Activity, AlertTriangle, Brain, CalendarClock, DollarSign, Download, FileClock, FileText, Flame, ListChecks, Network, Search, ShieldCheck, Target, Upload, Users, Workflow } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { RiskBadge } from '../../components/RiskBadge';
import { StatusBadge } from '../../components/StatusBadge';
import type { CrossAgentCollaborationGraph, CrossAgentCollaborationSummary } from '../../runtime/crossAgentCollaboration';
import { filterSalesLeads, formatCurrency, isFollowUpDue, isFollowUpThisWeek, isOverdue, pipelineStageLabels, summarizeSalesPipeline } from './salesPipeline';
import { generateSalesProposalDraft, inferProposalTemplate, salesProposalTemplateLabels } from './salesProposalBuilder';
import { emptyProspectIntakeDraft, labelBusinessType, missingInfoForIntake } from './salesProspectDossiers';
import { salesPriorityTone } from './salesScoring';
import { filterProspectsForSearch, salesRecommendedSearches } from './salesExecution';
import { salesOpportunityKanbanGroups, salesOpportunityStages } from './salesOpportunityEngine';
import type {
  FollowUpQueueItem,
  LeadScore,
  SalesAction,
  SalesFilters,
  SalesIntelligenceScoreLabel,
  SalesLead,
  SalesPageProps,
  SalesIntelligenceGraph,
  SalesProspectBusinessType,
  SalesProspectCategory,
  SalesProspectIntake,
  SalesProspectIntakeDraft,
  SalesProspectResearchRecord,
  SalesRecommendedSearchFilters,
  SalesOpportunity,
  SalesOpportunityStage,
  SalesOrganizationIntelligence,
  SalesOrganizationIntelligenceStore,
  SalesProposalDraft,
  SalesProposalTemplateType,
  SalesResearchDossier,
  SalesTeamAgentDefinition,
  SalesOrganizationProfile,
} from './salesTypes';

export default function SalesPage({
  activities,
  crossAgentGraph,
  crossAgentSummary,
  followUpQueue,
  importResult,
  integration,
  lastSalesExecutionStatus,
  leads,
  onAction,
  onCreateSalesExecutionTasks,
  onMoveOpportunityStage,
  onExport,
  onExportCrossAgent,
  onExportResearchDossier,
  onExportSalesIntelligence,
  onExportProposalDraft,
  onGenerateProposalDraft,
  onGenerateSalesEmailDrafts,
  onImportJson,
  onRunProspectSearch,
  onRunSalesResearch,
  onSaveProspectIntake,
  proposalDrafts,
  proposalSummary,
  proposals,
  opportunities,
  opportunitySummary,
  prospectDossierSummary,
  prospectDossiers,
  prospectIntakes,
  prospectResearch,
  researchEnrichmentHistory,
  researchIntake,
  researchIntelligenceSummary,
  researchSources,
  salesProposalPrepQueue,
  salesPipelineAnalytics,
  salesPriorityQueues,
  salesRelatedOpportunityCandidates,
  salesWorkflowSummary,
  salesWorkflows,
  scores,
  salesIntelligenceScores,
  salesIntelligenceGraph,
  salesIntelligenceSummary,
  organizationIntelligence,
  sharedMemory,
  connectorReadiness,
  assetLibrary,
  customerSuccess,
  finance,
  executivePlanning,
  marketing,
  sharedTaskSummary,
  teamAgents,
  teamSummary,
  scoringSummary,
}: SalesPageProps) {
  const [filters, setFilters] = useState<SalesFilters>({ priority: 'all', scorePriority: 'all', source: 'all', stage: 'all', type: 'all' });
  const [prospectMarketFilter, setProspectMarketFilter] = useState('all');
  const [prospectCategoryFilter, setProspectCategoryFilter] = useState('all');
  const [prospectMinimumFitScore, setProspectMinimumFitScore] = useState('0');
  const [prospectSourceStatusFilter, setProspectSourceStatusFilter] = useState('all');
  const [searchStatus, setSearchStatus] = useState(lastSalesExecutionStatus);
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(scores[0]?.leadId ?? null);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(prospectDossiers[0]?.dossierId ?? null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(salesIntelligenceGraph.organizationProfiles[0]?.id ?? null);
  const [intakeDraft, setIntakeDraft] = useState<SalesProspectIntakeDraft>(emptyProspectIntakeDraft);
  const [selectedProposalLeadId, setSelectedProposalLeadId] = useState<string>(leads[0]?.id ?? '');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(opportunities[0]?.id ?? '');
  const [opportunitySort, setOpportunitySort] = useState('score');
  const [selectedProposalType, setSelectedProposalType] = useState<SalesProposalTemplateType>(
    leads[0] ? inferProposalTemplate(leads[0], proposals.find((proposal) => proposal.leadId === leads[0].id)) : 'gym_os',
  );
  const summary = useMemo(() => summarizeSalesPipeline(leads, proposals), [leads, proposals]);
  const filteredLeads = useMemo(
    () =>
      filterSalesLeads(leads, filters).filter((lead) => {
        const score = scores.find((item) => item.leadId === lead.id);
        return filters.scorePriority === 'all' || score?.priorityLabel === filters.scorePriority;
      }),
    [filters, leads, scores],
  );
  const selectedScore = scores.find((score) => score.leadId === selectedScoreId) ?? scores[0] ?? null;
  const selectedLead = selectedScore ? leads.find((lead) => lead.id === selectedScore.leadId) ?? null : null;
  const sources = Array.from(new Set(leads.map((lead) => lead.source))).sort();
  const gymLeads = leads.filter((lead) => lead.leadType === 'gym');
  const coachLeads = leads.filter((lead) => lead.leadType === 'coach');
  const proposalRows = proposals
    .map((proposal) => ({ lead: leads.find((item) => item.id === proposal.leadId), proposal }))
    .filter((row) => row.lead);
  const activeLeads = leads.filter((lead) => lead.status === 'active');
  const prospectMarkets = Array.from(new Set(prospectResearch.map((prospect) => `${prospect.city}, ${prospect.state}`))).sort();
  const currentProspectSearchFilters: SalesRecommendedSearchFilters = {
    category: prospectCategoryFilter as SalesRecommendedSearchFilters['category'],
    market: prospectMarketFilter === 'all' ? undefined : prospectMarketFilter,
    minimumFitScore: Number(prospectMinimumFitScore) || undefined,
    sourceStatus: prospectSourceStatusFilter as SalesRecommendedSearchFilters['sourceStatus'],
  };
  const filteredProspects = prospectResearch.filter((prospect) => {
    const market = `${prospect.city}, ${prospect.state}`;
    return (
      (prospectMarketFilter === 'all' || market === prospectMarketFilter) &&
      (prospectCategoryFilter === 'all' || prospect.category === prospectCategoryFilter) &&
      (prospectSourceStatusFilter === 'all' || prospect.sourceStatus === prospectSourceStatusFilter) &&
      prospect.fitScore >= (Number(prospectMinimumFitScore) || 0)
    );
  });
  const searchedProspects = filterProspectsForSearch(prospectResearch, currentProspectSearchFilters);
  const selectedProposalLead = leads.find((lead) => lead.id === selectedProposalLeadId) ?? leads[0] ?? null;
  const selectedOpportunity = opportunities.find((item) => item.id === selectedOpportunityId) ?? opportunities[0] ?? null;
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    if (opportunitySort === 'company') return a.company.localeCompare(b.company);
    if (opportunitySort === 'city') return a.city.localeCompare(b.city);
    if (opportunitySort === 'state') return a.state.localeCompare(b.state);
    if (opportunitySort === 'stage') return a.stage.localeCompare(b.stage);
    if (opportunitySort === 'priority') return a.priority.localeCompare(b.priority);
    if (opportunitySort === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
    if (opportunitySort === 'owner') return a.assignedOwner.localeCompare(b.assignedOwner);
    return b.score.overallScore - a.score.overallScore;
  });
  const selectedDossier = prospectDossiers.find((dossier) => dossier.dossierId === selectedDossierId) ?? prospectDossiers[0] ?? null;
  const duplicateCandidates = researchIntake.flatMap((item) =>
    item.duplicateDetection.map((candidate) => ({
      ...candidate,
      company: item.company,
      intakeId: item.id,
    })),
  );
  const recentResearch = [...researchIntake].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const activeWorkflows = salesWorkflows.filter((workflow) => !['completed', 'archived', 'rejected'].includes(workflow.status));
  const blockedWorkflows = salesWorkflows.filter((workflow) => workflow.status === 'blocked');
  const executiveApprovalWorkflows = salesWorkflows.filter((workflow) => workflow.targetAgent === 'Executive' || workflow.approvalRequirement);
  const recentWorkflowActivity = salesWorkflows.flatMap((workflow) => workflow.auditTrail.map((audit) => ({ ...audit, company: workflow.company, workflowId: workflow.id }))).slice(0, 6);
  const pipelineActionBreakdown = Object.entries(salesPipelineAnalytics.nextActionBreakdown).sort((a, b) => b[1] - a[1]);
  const selectedDossierIntake = selectedDossier ? prospectIntakes.find((intake) => intake.id === selectedDossier.intakeId) ?? null : null;
  const selectedOrganization =
    salesIntelligenceGraph.organizationProfiles.find((profile) => profile.id === selectedOrganizationId) ??
    salesIntelligenceGraph.organizationProfiles[0] ??
    null;
  const selectedRichOrganization =
    organizationIntelligence.organizations.find((organization) => organization.organizationId === (selectedOrganizationId ?? '').replace(/^organization:/, '')) ??
    organizationIntelligence.organizations[0] ??
    null;
  const selectedProposalPrep = selectedProposalLead ? proposalForLead(proposals, selectedProposalLead.id) : undefined;
  const savedProposalDraft = proposalDrafts.find((draft) => draft.leadId === selectedProposalLead?.id && draft.templateType === selectedProposalType);
  const previewProposalDraft = selectedProposalLead
    ? generateSalesProposalDraft({
        existingDraft: savedProposalDraft,
        lead: selectedProposalLead,
        proposal: selectedProposalPrep,
        templateType: selectedProposalType,
      })
    : null;
  const runCurrentProspectSearch = () => {
    setSearchStatus({
      detail: 'Searching local prospect slots...',
      generatedAt: new Date().toISOString(),
      resultCount: 0,
      status: 'loading',
      title: 'Prospect search running',
    });
    onRunProspectSearch(currentProspectSearchFilters);
    setSearchStatus({
      detail: searchedProspects.length
        ? `Found ${searchedProspects.length} local prospect(s). Top result: ${searchedProspects[0].prospectName}.`
        : 'No prospects matched. Try lowering the fit score or selecting all markets/categories.',
      generatedAt: new Date().toISOString(),
      resultCount: searchedProspects.length,
      status: searchedProspects.length ? 'success' : 'error',
      title: 'Prospect search complete',
    });
  };
  const runRecommendedSearch = (filters: SalesRecommendedSearchFilters) => {
    setProspectMarketFilter(filters.market ?? 'all');
    setProspectCategoryFilter(filters.category ?? 'all');
    setProspectMinimumFitScore(String(filters.minimumFitScore ?? 0));
    setProspectSourceStatusFilter(filters.sourceStatus ?? 'all');
    const results = filterProspectsForSearch(prospectResearch, filters);
    onRunProspectSearch(filters);
    setSearchStatus({
      detail: results.length
        ? `Found ${results.length} local prospect(s). Top result: ${results[0].prospectName}.`
        : 'Recommended search returned no local matches.',
      generatedAt: new Date().toISOString(),
      resultCount: results.length,
      status: results.length ? 'success' : 'error',
      title: 'Recommended search complete',
    });
  };

  return (
    <>
      <section className="summary-grid sales-summary" aria-label="Sales summary">
        <SalesMetric icon={<Users size={20} />} label="Total Leads" value={String(summary.totalLeads)} />
        <SalesMetric icon={<Users size={20} />} label="Gym Leads" value={String(summary.gymLeads)} />
        <SalesMetric icon={<Users size={20} />} label="Coach Leads" value={String(summary.coachLeads)} />
        <SalesMetric icon={<Flame size={20} />} label="Hot Scored Leads" value={String(scoringSummary.hotLeadCount)} tone={scoringSummary.hotLeadCount ? 'warn' : 'good'} />
        <SalesMetric icon={<CalendarClock size={20} />} label="Overdue Follow-Ups" value={String(scoringSummary.overdueFollowUpCount)} tone={scoringSummary.overdueFollowUpCount ? 'warn' : 'good'} />
        <SalesMetric icon={<FileText size={20} />} label="Proposal Needed" value={String(scoringSummary.proposalNeededCount)} tone={scoringSummary.proposalNeededCount ? 'warn' : 'good'} />
        <SalesMetric icon={<Target size={20} />} label="At Risk" value={String(scoringSummary.atRiskLeadCount)} tone={scoringSummary.atRiskLeadCount ? 'warn' : 'good'} />
        <SalesMetric icon={<FileText size={20} />} label="Weighted Pipeline" value={formatCurrency(scoringSummary.estimatedWeightedPipelineValue)} />
        <SalesMetric icon={<FileText size={20} />} label="Proposal Drafts" value={String(proposalSummary.draftsCreated)} />
        <SalesMetric icon={<ShieldCheck size={20} />} label="Ready For Review" value={String(proposalSummary.readyForReview)} tone={proposalSummary.readyForReview ? 'good' : undefined} />
        <SalesMetric icon={<Brain size={20} />} label="Sales Sub-Agents" value={`${teamSummary.activeAgents}/${teamSummary.totalAgents}`} tone="good" />
        <SalesMetric icon={<Search size={20} />} label="High-Fit Prospects" value={String(teamSummary.highFitProspects)} tone={teamSummary.highFitProspects ? 'good' : undefined} />
        <SalesMetric icon={<Target size={20} />} label="Needs Research" value={String(teamSummary.needsResearch)} tone={teamSummary.needsResearch ? 'warn' : 'good'} />
        <SalesMetric icon={<FileText size={20} />} label="Saved Prospects" value={String(prospectDossierSummary.savedProspects)} />
        <SalesMetric icon={<FileText size={20} />} label="Research Dossiers" value={String(prospectDossierSummary.dossiersCreated)} />
        <SalesMetric icon={<Target size={20} />} label="Migration Opportunities" value={String(prospectDossierSummary.migrationOpportunityProspects)} tone={prospectDossierSummary.migrationOpportunityProspects ? 'warn' : 'good'} />
        <SalesMetric icon={<Brain size={20} />} label="Organizations Tracked" value={String(salesIntelligenceSummary.organizationsTracked)} />
        <SalesMetric icon={<Target size={20} />} label="Intel Completeness" value={`${salesIntelligenceSummary.intelligenceCompletenessScore}/100`} />
        <SalesMetric icon={<ShieldCheck size={20} />} label="Approved Sources" value={String(researchIntelligenceSummary.approvedSources)} tone="good" />
        <SalesMetric icon={<FileClock size={20} />} label="Research Reviews" value={String(researchIntelligenceSummary.pendingReviews)} tone={researchIntelligenceSummary.pendingReviews ? 'warn' : 'good'} />
        <SalesMetric icon={<Search size={20} />} label="Verification Queue" value={String(researchIntelligenceSummary.verificationQueue)} tone={researchIntelligenceSummary.verificationQueue ? 'warn' : 'good'} />
        <SalesMetric icon={<Network size={20} />} label="Duplicate Alerts" value={String(researchIntelligenceSummary.duplicateAlerts)} tone={researchIntelligenceSummary.duplicateAlerts ? 'warn' : 'good'} />
        <SalesMetric icon={<Workflow size={20} />} label="Active Handoffs" value={String(salesWorkflowSummary.activeHandoffs)} tone={salesWorkflowSummary.activeHandoffs ? 'warn' : 'good'} />
        <SalesMetric icon={<ShieldCheck size={20} />} label="Approval Queue" value={String(salesWorkflowSummary.approvalQueue)} tone={salesWorkflowSummary.approvalQueue ? 'warn' : 'good'} />
        <SalesMetric icon={<FileText size={20} />} label="Proposal Prep Queue" value={String(salesWorkflowSummary.proposalPrepItems)} />
        <SalesMetric icon={<AlertTriangle size={20} />} label="Blocked Workflows" value={String(salesWorkflowSummary.blockedWorkflows)} tone={salesWorkflowSummary.blockedWorkflows ? 'warn' : 'good'} />
        <SalesMetric icon={<Flame size={20} />} label="Hot Opportunities" value={String(salesPipelineAnalytics.hotCount)} tone={salesPipelineAnalytics.hotCount ? 'warn' : 'good'} />
        <SalesMetric icon={<Target size={20} />} label="Warm Opportunities" value={String(salesPipelineAnalytics.warmCount)} />
        <SalesMetric icon={<FileText size={20} />} label="Pipeline Forecast" value={formatCurrency(salesPipelineAnalytics.estimatedPipelineValue)} />
        <SalesMetric icon={<ShieldCheck size={20} />} label="Average Confidence" value={`${salesPipelineAnalytics.averageConfidence}%`} tone={salesPipelineAnalytics.averageConfidence >= 70 ? 'good' : 'warn'} />
        <SalesMetric icon={<Workflow size={20} />} label="Cross-Agent Signals" value={String(crossAgentSummary.activeSignals)} tone={crossAgentSummary.activeSignals ? 'warn' : 'good'} />
        {connectorReadiness ? (
          <SalesMetric icon={<Network size={20} />} label="Connector Writes Blocked" value={String(connectorReadiness.blockedWriteActionCount)} tone="warn" />
        ) : null}
        {sharedTaskSummary ? (
          <>
            <SalesMetric icon={<ListChecks size={20} />} label="Linked Tasks" value={String(sharedTaskSummary.openTasks)} tone={sharedTaskSummary.openTasks ? 'warn' : 'good'} />
            <SalesMetric icon={<ShieldCheck size={20} />} label="Task Review" value={String(sharedTaskSummary.tasksRequiringExecutiveReview)} tone={sharedTaskSummary.tasksRequiringExecutiveReview ? 'warn' : 'good'} />
          </>
        ) : null}
      </section>

      <section className="dashboard-grid">
        {finance ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <DollarSign size={18} />
              <h2>Sales Revenue Pipeline</h2>
              </div>
              <StatusBadge value="local estimate" tone="good" />
            </div>
            <p className="panel-description">
              Estimated opportunity value, expansion revenue, and customer revenue health for sales planning only. No billing, Stripe, invoices, CRM sync, or customer messaging happens here.
            </p>
            <div className="batch-grid">
              <Fact label="Estimated Opportunity Value" value={formatCurrency(finance.summary.pipelineRevenue)} />
              <Fact label="Expansion Revenue" value={formatCurrency(finance.summary.expansionRevenue)} />
              <Fact label="Estimated MRR" value={formatCurrency(finance.summary.totalEstimatedMrr)} />
              <Fact label="Estimated ARR" value={formatCurrency(finance.summary.totalEstimatedArr)} />
              <Fact label="Revenue Risks" value={String(finance.summary.revenueRisks)} />
              <Fact label="Forecast Revenue" value={formatCurrency(finance.summary.forecastRevenue)} />
            </div>
            <DataTable
              compact
              columns={['Revenue Account', 'Expansion', 'Renewal', 'Next Action']}
              rows={finance.health.map((item) => [item.organization, formatCurrency(item.expansionOpportunity), `${item.renewalReadiness}%`, item.nextActions[0]])}
              emptyMessage="No revenue health records yet."
            />
            <p className="subtle-note">Customer Revenue Health is review-only and intended for manual prioritization.</p>
          </section>
        ) : null}

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Users size={18} />
              <h2>Organization & Contact Intelligence</h2>
            </div>
            <StatusBadge value="Local relationship engine" tone="good" />
          </div>
          <p className="panel-description">
            Structured local account records, contacts, buying committees, relationship health, timelines, and review-only duplicate candidates. No browsing, outreach, CRM sync, proposal submission, or automatic merge.
          </p>
          <div className="batch-grid">
            <Fact label="Organizations" value={String(organizationIntelligence.summary.organizationsTracked)} />
            <Fact label="Contacts" value={String(organizationIntelligence.summary.totalContacts)} />
            <Fact label="Decision Maker Coverage" value={`${organizationIntelligence.summary.decisionMakerCoverage}%`} />
            <Fact label="Relationship Health" value={`${organizationIntelligence.summary.averageRelationshipHealth}%`} />
            <Fact label="Committee Completeness" value={`${organizationIntelligence.summary.averageBuyingCommitteeCompleteness}%`} />
            <Fact label="Missing Decision Makers" value={String(organizationIntelligence.summary.missingDecisionMakers)} />
            <Fact label="Contact Maintenance" value={String(organizationIntelligence.summary.contactMaintenanceQueue)} />
            <Fact label="Duplicate Reviews" value={String(organizationIntelligence.summary.duplicateOrganizationCandidates + organizationIntelligence.summary.duplicateContactCandidates)} />
          </div>
          <OrganizationIntelligenceWorkspace store={organizationIntelligence} selectedOrganization={selectedRichOrganization} onSelectOrganization={(id) => setSelectedOrganizationId(id)} />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Brain size={18} />
              <h2>Shared Memory View</h2>
            </div>
            <StatusBadge value="Local knowledge graph" tone="good" />
          </div>
          <p className="panel-description">
            Cross-agent memory for Sales, Executive, Operator, Proposal Prep, Contract Intelligence, and future Marketing workflows. Facts are source-backed where possible, conflict-reviewed, and never silently overwritten.
          </p>
          <div className="batch-grid">
            <Fact label="Entities" value={String(sharedMemory.summary.entityCount)} />
            <Fact label="Facts" value={String(sharedMemory.summary.factCount)} />
            <Fact label="Relationships" value={String(sharedMemory.summary.relationshipCount)} />
            <Fact label="Open Conflicts" value={String(sharedMemory.summary.conflictCount)} />
            <Fact label="Risky Facts" value={String(sharedMemory.summary.riskyFacts)} />
            <Fact label="Avg Confidence" value={`${sharedMemory.summary.averageEntityConfidence}%`} />
          </div>
          <DataTable
            compact
            columns={['Entity', 'Type', 'Confidence', 'Status']}
            rows={sharedMemory.agentViews.Sales.topEntities.map((entity) => [
              entity.displayName,
              entity.entityType,
              `${entity.confidence}%`,
              entity.status.replace(/_/g, ' '),
            ])}
            emptyMessage="No shared Sales memory entities yet."
          />
          <DataTable
            compact
            columns={['Source-Backed Fact', 'Value', 'Confidence']}
            rows={sharedMemory.agentViews.Sales.sourceBackedFacts.slice(0, 8).map((fact) => [
              fact.factType,
              String(fact.value),
              `${fact.confidence}% · ${fact.verificationStatus.replace(/_/g, ' ')}`,
            ])}
            emptyMessage="No source-backed Sales facts yet."
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <Network size={18} />
              <h2>Relationship Graph</h2>
            </div>
          </div>
          <DataTable
            compact
            columns={['From', 'Relationship', 'To']}
            rows={sharedMemory.agentViews.Sales.relationshipGraph.slice(0, 8).map((edge) => [
              edge.fromEntity,
              `${edge.relationshipType.replace(/_/g, ' ')} · ${edge.confidence}%`,
              edge.toEntity,
            ])}
            emptyMessage="No shared relationships yet."
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <AlertTriangle size={18} />
              <h2>Conflict Queue</h2>
            </div>
            <StatusBadge value="Review only" tone="warn" />
          </div>
          <DataTable
            compact
            columns={['Conflict', 'Affected', 'Action']}
            rows={sharedMemory.agentViews.Sales.conflictQueue.slice(0, 8).map((conflict) => [
              conflict.conflictType,
              conflict.entityIds.join(', '),
              conflict.recommendedReviewAction,
            ])}
            emptyMessage="No memory conflicts for Sales."
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Brain size={18} />
              <h2>Sales Intelligence Command Center</h2>
            </div>
            <StatusBadge value="Local deterministic scoring" tone="good" />
          </div>
          <p className="panel-description">
            Opportunity scoring blends fit, size, geography, buying signals, relationships, confidence, workflow urgency, and proposal readiness. It creates priorities only; no browsing, email, CRM sync, proposal submission, or approval occurs.
          </p>
          <div className="batch-grid">
            <Fact label="Total Opportunities" value={String(salesPipelineAnalytics.totalOpportunities)} />
            <Fact label="Hot / Warm / Cold" value={`${salesPipelineAnalytics.hotCount}/${salesPipelineAnalytics.warmCount}/${salesPipelineAnalytics.coldCount}`} />
            <Fact label="Not Ready" value={String(salesPipelineAnalytics.notReadyCount)} />
            <Fact label="Estimated Pipeline" value={formatCurrency(salesPipelineAnalytics.estimatedPipelineValue)} />
            <Fact label="Proposal Ready" value={String(salesPipelineAnalytics.proposalReadyCount)} />
            <Fact label="Executive Review" value={String(salesPipelineAnalytics.executiveReviewCount)} />
            <Fact label="Blocked" value={String(salesPipelineAnalytics.blockedCount)} />
            <Fact label="Average Confidence" value={`${salesPipelineAnalytics.averageConfidence}%`} />
          </div>
          <DataTable
            columns={['Next Action', 'Count']}
            rows={pipelineActionBreakdown.map(([action, count]) => [action, String(count)])}
            emptyMessage="No next-action breakdown yet. Add a local opportunity to generate intelligence."
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Flame size={18} />
              <h2>Priority Queues</h2>
            </div>
            <StatusBadge value="Manual action required" tone="neutral" />
          </div>
          <div className="priority-queue-grid">
            {salesPriorityQueues.map((queue) => (
              <article className="priority-queue-card" key={queue.id}>
                <div>
                  <strong>{queue.label}</strong>
                  <StatusBadge value={`${queue.items.length} item(s)`} tone={queue.items.length ? 'warn' : 'good'} />
                </div>
                {queue.items.length ? (
                  <div className="activity-list compact-activity-list">
                    {queue.items.slice(0, 4).map((item) => (
                      <p key={`${queue.id}-${item.opportunityId}`}>
                        <strong>{item.company}</strong>
                        <span>{item.explanation}</span>
                        <small>{item.nextAction}</small>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="empty-note">No records in this queue.</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Network size={18} />
              <h2>Duplicate / Related Opportunity Review</h2>
            </div>
            <StatusBadge value="No auto-merge" tone="good" />
          </div>
          <DataTable
            columns={['Opportunity', 'Related Opportunity', 'Signals', 'Confidence', 'Action']}
            rows={salesRelatedOpportunityCandidates.map((candidate) => [
              candidate.company,
              candidate.relatedCompany,
              candidate.fields.join(', '),
              `${candidate.confidence}%`,
              <button className="clear-button small" disabled key={candidate.id} type="button">
                {candidate.reviewAction}
              </button>,
            ])}
            emptyMessage="No related opportunity candidates. If candidates appear, review them manually; nothing merges automatically."
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Workflow size={18} />
              <h2>Workflow Overview</h2>
            </div>
            <StatusBadge value={`${salesWorkflowSummary.workflowHealth}% health`} tone={salesWorkflowSummary.blockedWorkflows ? 'warn' : 'good'} />
          </div>
          <p className="panel-description">
            Local orchestration layer for Sales handoffs into Operator, Executive, and Proposal Prep. External actions stay gated and manual.
          </p>
          <div className="batch-grid">
            <Fact label="Total Workflows" value={String(salesWorkflowSummary.totalWorkflows)} />
            <Fact label="Active Handoffs" value={String(salesWorkflowSummary.activeHandoffs)} />
            <Fact label="Operator Handoffs" value={String(salesWorkflowSummary.assignedToOperator)} />
            <Fact label="Executive Approvals" value={String(salesWorkflowSummary.assignedToExecutive)} />
            <Fact label="Proposal Prep" value={String(salesWorkflowSummary.assignedToProposalPrep)} />
            <Fact label="External Gates" value={String(salesWorkflowSummary.externalActionGates)} />
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <ListChecks size={18} />
              <h2>Active Handoffs</h2>
            </div>
          </div>
          <DataTable
            columns={['Company', 'Type', 'Target', 'Status', 'Priority', 'Due', 'Next Action']}
            rows={activeWorkflows.map((workflow) => [
              workflow.company,
              workflow.type.replace(/_/g, ' '),
              workflow.targetAgent,
              <StatusBadge key={`${workflow.id}-status`} value={workflow.status.replace(/_/g, ' ')} tone={workflow.status === 'blocked' ? 'warn' : workflow.status === 'approved' ? 'good' : 'neutral'} />,
              <StatusBadge key={`${workflow.id}-priority`} value={workflow.priority} tone={workflow.priority === 'Critical' || workflow.priority === 'High' ? 'warn' : 'neutral'} />,
              dueLabel(workflow.dueAt),
              workflow.requestedAction,
            ])}
            emptyMessage="No active handoffs."
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <FileText size={18} />
              <h2>Proposal Prep Queue</h2>
            </div>
          </div>
          <DataTable
            columns={['Company', 'Score', 'Readiness', 'Missing Info', 'Source Confidence', 'Verification', 'Executive Approval', 'Next Action']}
            rows={salesProposalPrepQueue.map((item) => [
              item.company,
              (() => {
                const score = salesIntelligenceScores.find((score) => score.opportunityId === item.opportunityId);
                return score ? <StatusBadge key={`${item.opportunityId}-score`} value={`${score.scoreLabel} ${score.totalScore}`} tone={scoreLabelTone(score.scoreLabel)} /> : 'Not scored';
              })(),
              `${item.readinessPercent}%`,
              item.missingInfo.join(', ') || 'Complete',
              `${item.sourceConfidence}%`,
              <StatusBadge key={`${item.opportunityId}-verification`} value={item.verificationStatus.replace(/_/g, ' ')} tone={item.verificationStatus === 'verified' ? 'good' : 'warn'} />,
              <StatusBadge key={`${item.opportunityId}-approval`} value={item.executiveApprovalStatus.replace(/_/g, ' ')} tone={item.executiveApprovalStatus === 'approved' ? 'good' : item.executiveApprovalStatus === 'pending' ? 'warn' : 'neutral'} />,
              item.nextAction,
            ])}
            emptyMessage="No proposal prep queue items."
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <ShieldCheck size={18} />
              <h2>Executive Approval Queue</h2>
            </div>
          </div>
          <DataTable
            columns={['Company', 'Type', 'Approval', 'Priority', 'Due', 'Reason']}
            rows={executiveApprovalWorkflows.map((workflow) => [
              workflow.company,
              workflow.type.replace(/_/g, ' '),
              <StatusBadge key={`${workflow.id}-approval`} value={workflow.approvalStatus.replace(/_/g, ' ')} tone={workflow.approvalStatus === 'approved' ? 'good' : workflow.approvalStatus === 'pending' || workflow.approvalStatus === 'required' ? 'warn' : 'neutral'} />,
              <StatusBadge key={`${workflow.id}-approval-priority`} value={workflow.priority} tone={workflow.priority === 'Critical' || workflow.priority === 'High' ? 'warn' : 'neutral'} />,
              dueLabel(workflow.dueAt),
              workflow.reason,
            ])}
            emptyMessage="No Executive approvals queued."
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <AlertTriangle size={18} />
              <h2>Blocked Workflows</h2>
            </div>
          </div>
          <DataTable
            columns={['Company', 'Type', 'Owner', 'Risk', 'Next Action']}
            rows={blockedWorkflows.map((workflow) => [
              workflow.company,
              workflow.type.replace(/_/g, ' '),
              workflow.owner,
              <StatusBadge key={`${workflow.id}-blocked`} value="blocked" tone="warn" />,
              workflow.requestedAction,
            ])}
            emptyMessage="No blocked workflows."
          />
        </section>

        <section className="panel compact-sales-panel">
          <div className="panel-header">
            <div>
              <Activity size={18} />
              <h2>Recent Workflow Activity</h2>
            </div>
          </div>
          <DataTable
            columns={['Company', 'Transition', 'Operator', 'Next Action']}
            rows={recentWorkflowActivity.map((activity) => [
              activity.company,
              `${activity.previousStatus} -> ${activity.newStatus}`,
              activity.operator,
              activity.nextAction,
            ])}
            emptyMessage="No workflow activity yet."
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Search size={18} />
              <h2>Research Queue</h2>
            </div>
            <StatusBadge value={`${researchIntelligenceSummary.researchBacklog} backlog`} tone={researchIntelligenceSummary.researchBacklog ? 'warn' : 'good'} />
          </div>
          <p className="panel-description">
            Local-only intake queue for opportunity research. Items are not used for scoring until their source is approved and the intake is reviewed.
          </p>
          <DataTable
            columns={['Company', 'Type', 'Source', 'Confidence', 'Review', 'Suggested Action']}
            rows={researchIntake.map((item) => {
              const source = researchSources.find((source) => source.id === item.sourceId);
              return [
                item.company,
                item.researchType,
                source?.name ?? item.sourceId,
                `${item.confidence}%`,
                item.reviewStatus.replace(/_/g, ' '),
                item.suggestedActions[0] ?? 'Review manually',
              ];
            })}
            emptyMessage="No research intake yet. Add a source, paste manual research, then run the local intake workflow."
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <ShieldCheck size={18} />
              <h2>Sources</h2>
            </div>
            <StatusBadge value="approval required" tone="neutral" />
          </div>
          <DataTable
            columns={['Source', 'Category', 'Mode', 'Scope', 'Approval', 'Trust', 'Confidence']}
            rows={researchSources.map((source) => [
              source.name,
              source.category,
              source.mode,
              source.scope,
              `${source.enabled ? 'Enabled' : 'Disabled'} / ${source.approvalStatus}`,
              `${source.trustScore}%`,
              `${source.confidenceScore}%`,
            ])}
            emptyMessage="No research sources configured. Create a draft source, review it, then approve it before use."
          />
        </section>

        <section className="panel compact-sales-panel">
          <div className="panel-header">
            <div>
              <ListChecks size={18} />
              <h2>Verification</h2>
            </div>
          </div>
          <DataTable
            compact
            columns={['Company', 'Evidence', 'Status']}
            rows={researchIntake.map((item) => [
              item.company,
              <StatusBadge key={`${item.id}-evidence`} value={item.evidenceLevel} tone={item.evidenceLevel === 'high' ? 'good' : item.evidenceLevel === 'medium' ? 'neutral' : 'warn'} />,
              `${item.completeness}% · ${item.riskRating}${item.missingInformation.length ? ` · ${item.missingInformation.length} missing` : ''}`,
            ])}
            emptyMessage="Verification queue is empty."
          />
        </section>

        <section className="panel compact-sales-panel">
          <div className="panel-header">
            <div>
              <Network size={18} />
              <h2>Duplicate Review</h2>
            </div>
          </div>
          <DataTable
            compact
            columns={['Company', 'Signals', 'Action']}
            rows={duplicateCandidates.map((candidate) => [
              candidate.company,
              `${candidate.targetType} · ${candidate.confidence}% · ${candidate.fields.join(', ')}`,
              <button className="clear-button small" disabled key={`${candidate.intakeId}-${candidate.company}`} type="button">
                Review
              </button>,
            ])}
            emptyMessage="No duplicate candidates. The agent never merges automatically."
          />
        </section>

        <section className="panel compact-sales-panel">
          <div className="panel-header">
            <div>
              <Workflow size={18} />
              <h2>Enrichment Status</h2>
            </div>
            <StatusBadge value={`${researchIntelligenceSummary.enrichmentProgress}%`} tone="good" />
          </div>
          <DataTable
            compact
            columns={['Opportunity', 'Update', 'Confidence']}
            rows={researchEnrichmentHistory.map((item) => [
              opportunities.find((opportunity) => opportunity.id === item.opportunityId)?.company ?? item.opportunityId,
              `${item.field}: ${item.previousValue || 'blank'} -> ${item.newValue}`,
              `${item.confidence}%`,
            ])}
            emptyMessage="No enrichment changes have been recorded."
          />
        </section>

        <section className="panel compact-sales-panel wide-panel">
          <div className="panel-header">
            <div>
              <FileText size={18} />
              <h2>Recent Research</h2>
            </div>
          </div>
          <DataTable
            columns={['Company', 'Summary', 'Human Review']}
            rows={recentResearch.map((item) => [item.company, item.summary, item.humanReviewRequired ? 'Required' : 'Not required'])}
            emptyMessage="No recent research intake."
          />
        </section>
      </section>

      <section className="dashboard-grid">
        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Workflow size={18} />
              <h2>Sales Agent Execution Dashboard</h2>
            </div>
            <StatusBadge
              value={lastSalesExecutionStatus.status}
              tone={lastSalesExecutionStatus.status === 'error' ? 'warn' : lastSalesExecutionStatus.status === 'success' ? 'good' : 'neutral'}
            />
          </div>
          <p className="panel-description">{lastSalesExecutionStatus.detail}</p>
          <div className="batch-grid">
            <Fact label="Active Prospects" value={String(prospectResearch.length)} />
            <Fact label="Research Status" value={prospectDossiers.length ? `${prospectDossiers.length} dossier(s)` : 'Manual research needed'} />
            <Fact label="Report Status" value={lastSalesExecutionStatus.title} />
            <Fact label="Outreach Plans" value={String(prospectResearch.filter((prospect) => prospect.fitScore >= 80).length)} />
            <Fact label="Follow-Up Plans" value={String(followUpQueue.length)} />
            <Fact label="Missing Info" value={String(prospectDossiers.reduce((count, dossier) => count + dossier.missingInfo.length, 0) || teamSummary.needsResearch)} />
          </div>
          <div className="button-row sales-action-row">
            <button className="report-button" onClick={onRunSalesResearch} type="button">
              Run Research
            </button>
            <button className="report-button" onClick={onCreateSalesExecutionTasks} type="button">
              Create Sales Tasks
            </button>
            <button className="report-button" onClick={onGenerateSalesEmailDrafts} type="button">
              Create Email Drafts
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'executive_summary')} type="button">
              Executive Summary
            </button>
          </div>
          <p className="subtle-note">
            Next recommended sales action: verify owner/contact/software fields for the highest-fit Louisville-area prospect before any manual outreach.
          </p>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Workflow size={18} />
              <h2>Local CRM Pipeline Overview</h2>
            </div>
            <StatusBadge value="Local only" tone="good" />
          </div>
          <p className="panel-description">
            Complete local opportunity system for prospect discovery through proposal prep. It does not read from or sync to vyraapp.fit Sales CRM.
          </p>
          <div className="batch-grid">
            <Fact label="Total Opportunities" value={String(opportunitySummary.totalOpportunities)} />
            <Fact label="Active" value={String(opportunitySummary.activeOpportunities)} />
            <Fact label="Won" value={String(opportunitySummary.won)} />
            <Fact label="Lost" value={String(opportunitySummary.lost)} />
            <Fact label="High Priority" value={String(opportunitySummary.highPriority)} />
            <Fact label="Awaiting Follow-Up" value={String(opportunitySummary.awaitingFollowUp)} />
            <Fact label="Proposal Ready" value={String(opportunitySummary.proposalReady)} />
            <Fact label="Proposal Sent" value={String(opportunitySummary.proposalSent)} />
            <Fact label="Average ICP" value={String(opportunitySummary.averageIcp)} />
            <Fact label="Average Lead Score" value={String(opportunitySummary.averageLeadScore)} />
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <ListChecks size={18} />
              <h2>Opportunity Kanban</h2>
            </div>
            <span>Validated local transitions</span>
          </div>
          <div className="opportunity-kanban">
            {salesOpportunityKanbanGroups.map((group) => (
              <article className="opportunity-column" key={group.label}>
                <strong>{group.label}</strong>
                {opportunities.filter((opportunity) => group.stages.includes(opportunity.stage)).map((opportunity) => (
                  <button className="opportunity-card" key={opportunity.id} onClick={() => setSelectedOpportunityId(opportunity.id)} type="button">
                    <span>{opportunity.company}</span>
                    <small>{opportunity.city}, {opportunity.state} · {opportunity.score.overallScore}/100 · {opportunity.priority}</small>
                  </button>
                ))}
              </article>
            ))}
          </div>
          {selectedOpportunity ? (
            <div className="button-row sales-action-row">
              <SalesSelect label="Move Selected Opportunity" value={selectedOpportunity.stage} onChange={(value) => onMoveOpportunityStage(selectedOpportunity.id, value as SalesOpportunityStage, 'Dashboard local Kanban transition')}>
                {salesOpportunityStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace(/_/g, ' ')}
                  </option>
                ))}
              </SalesSelect>
            </div>
          ) : null}
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <FileText size={18} />
              <h2>Opportunity Table</h2>
            </div>
            <span>{sortedOpportunities.length} local record(s)</span>
          </div>
          <SalesSelect label="Sort By" value={opportunitySort} onChange={setOpportunitySort}>
            {['score', 'company', 'city', 'state', 'stage', 'priority', 'updated', 'owner'].map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </SalesSelect>
          <DataTable
            columns={['Company', 'City', 'State', 'Stage', 'Priority', 'Intelligence', 'Score', 'Owner', 'Updated']}
            rows={sortedOpportunities.map((opportunity) => [
              <button className="clear-button small" key={opportunity.id} onClick={() => setSelectedOpportunityId(opportunity.id)} type="button">
                {opportunity.company}
              </button>,
              opportunity.city,
              opportunity.state,
              opportunity.stage.replace(/_/g, ' '),
              <StatusBadge key={`${opportunity.id}-priority`} value={opportunity.priority} tone={opportunity.priority === 'Critical' || opportunity.priority === 'High' ? 'warn' : 'neutral'} />,
              (() => {
                const score = salesIntelligenceScores.find((score) => score.opportunityId === opportunity.id);
                return score ? <StatusBadge key={`${opportunity.id}-intel`} value={`${score.scoreLabel} ${score.totalScore}`} tone={scoreLabelTone(score.scoreLabel)} /> : 'Not scored';
              })(),
              String(opportunity.score.overallScore),
              opportunity.assignedOwner,
              formatDate(opportunity.updatedAt),
            ])}
          />
        </section>

        {selectedOpportunity ? <OpportunityDetail opportunity={selectedOpportunity} /> : null}

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <ShieldCheck size={18} />
              <h2>Sales Integration Readiness</h2>
            </div>
            <StatusBadge value={integration.modeLabel} tone={integration.mode === 'live_read_only' ? 'warn' : 'good'} />
          </div>
          <p className="panel-description">{integration.safetyLabel}</p>
          <div className="batch-grid">
            <Fact label="CRM Readiness" value={integration.crmReadinessStatus.replace(/_/g, ' ')} />
            <Fact label="Read-Only" value={integration.readOnly ? 'Yes' : 'No'} />
            <Fact label="External Actions" value={integration.externalActionsEnabled ? 'Enabled' : 'Blocked'} />
            <Fact label="Blocked Actions" value={String(integration.blockedExternalActionCount)} />
          </div>
          <div className="button-row sales-action-row">
            <button className="clear-button small" disabled type="button">
              Send Email
            </button>
            <button className="clear-button small" disabled type="button">
              Create Stripe Invoice
            </button>
            <button className="clear-button small" disabled type="button">
              Write CRM Record
            </button>
          </div>
          <p className="subtle-note">Future write actions require an explicit approval gate and are disabled in mock and live read-only modes.</p>
        </section>

        {connectorReadiness ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <Network size={18} />
                <h2>Connector Action Placeholders</h2>
              </div>
              <StatusBadge value="Approval-gated / disabled" tone="warn" />
            </div>
            <p className="panel-description">
              Future Sales actions can map to GitHub, Gmail, Calendar, Stripe, Supabase, Twilio/SMS, and Google Drive, but every write/send/create/export action is disabled until Robert explicitly approves a later live integration.
            </p>
            <div className="batch-grid">
              <Fact label="Connector Templates" value={String(connectorReadiness.connectorCount)} />
              <Fact label="Approval Mappings" value={String(connectorReadiness.approvalMappedActionCount)} />
              <Fact label="Blocked Writes" value={String(connectorReadiness.blockedWriteActionCount)} />
              <Fact label="External Calls" value={connectorReadiness.externalCallsEnabled ? 'Enabled' : 'Blocked'} />
            </div>
            <DataTable
              columns={['Sales Task', 'Connector', 'Future Action', 'Approval']}
              rows={connectorReadiness.approvalMappings.map((mapping) => [
                mapping.taskType,
                mapping.connector,
                mapping.futureAction,
                mapping.defaultStatus.replace(/_/g, ' '),
              ])}
            />
            <div className="button-row sales-action-row">
              {['Create GitHub Issue', 'Send Gmail', 'Create Calendar Event', 'Create Stripe Link', 'Send SMS', 'Export Drive Doc'].map((label) => (
                <button className="clear-button small" disabled key={label} type="button">
                  {label}
                </button>
              ))}
            </div>
            <p className="subtle-note">Disabled placeholders only. No connector clients are created and no external service calls occur.</p>
          </section>
        ) : null}

        {executivePlanning ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <Workflow size={18} />
                <h2>Sales Goals</h2>
              </div>
              <StatusBadge value="Executive aligned" tone="good" />
            </div>
            <div className="batch-grid">
              <Fact label="Revenue/KPI Alignment" value={`${executivePlanning.salesGoalAlignment.length} goal(s)`} />
              <Fact label="Opportunity Contribution to Goals" value={executivePlanning.salesGoalAlignment.map((item) => item.opportunityContribution).join(', ') || 'None'} />
              <Fact label="At-Risk Sales Goals" value={String(executivePlanning.goals.filter((goal) => goal.ownerAgent === 'Sales' && goal.attentionLabel !== 'Normal').length)} />
            </div>
            <DataTable
              columns={['Sales Goals', 'Revenue/KPI Alignment', 'Opportunity Contribution to Goals', 'Status']}
              rows={executivePlanning.salesGoalAlignment.map((item) => [item.goal, item.revenueKpi, item.opportunityContribution, item.status])}
              emptyMessage="No Sales goals are linked to Executive planning."
            />
          </section>
        ) : null}

        {customerSuccess ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <Users size={18} />
                <h2>Customer Handoff Status</h2>
              </div>
              <StatusBadge value="Local CS handoff" tone="good" />
            </div>
            <DataTable
              columns={['Customer Handoff Status', 'Status', 'Plan', 'Owner', 'Next Action']}
              rows={customerSuccess.customers.map((customer) => [
                customer.organization,
                customer.status,
                customer.plan,
                customer.owner,
                customer.status === 'Onboarding' ? 'Confirm onboarding owner and first success milestone.' : 'Review expansion or renewal notes.',
              ])}
            />
            <div className="dashboard-subsection">
              <h3>Onboarding Progress</h3>
              <DataTable
                columns={['Customer', 'Template', 'Progress', 'Training']}
                rows={customerSuccess.onboarding.map((item) => [item.organization, item.template, `${item.progress}%`, `${item.trainingCompletion}%`])}
              />
            </div>
            <div className="dashboard-subsection">
              <h3>Expansion Opportunities</h3>
              <DataTable
                columns={['Customer', 'Opportunity', 'Score', 'Recommended Action']}
                rows={customerSuccess.expansion.map((item) => [item.organization, item.opportunity, `${item.score}%`, item.recommendedAction])}
              />
            </div>
            <div className="dashboard-subsection">
              <h3>Customer Success Notes</h3>
              <DataTable
                columns={['Customer', 'Health', 'Risk', 'Note']}
                rows={customerSuccess.health.map((item) => [item.organization, `${item.healthScore}%`, `${item.riskScore}%`, item.recommendations[0]])}
              />
            </div>
            <p className="subtle-note">Sales can review Customer Success handoff context locally, but no customer messages, CRM sync, account updates, or renewals are automatic.</p>
          </section>
        ) : null}

        {assetLibrary ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <FileText size={18} />
                <h2>Sales Resources</h2>
              </div>
              <StatusBadge value="Local references" tone="good" />
            </div>
            <div className="batch-grid">
              <Fact label="Sales Resources" value={String(assetLibrary.assets.filter((asset) => asset.category === 'Sales' || asset.usageReferences.includes('Sales')).length)} />
              <Fact label="Product Assets" value={String(assetLibrary.assets.filter((asset) => asset.products.length).length)} />
              <Fact label="Pricing Resources" value={String(assetLibrary.assets.filter((asset) => asset.tags.includes('pricing') || asset.keywords.includes('pricing')).length)} />
              <Fact label="Presentation Library" value={String(assetLibrary.assets.filter((asset) => asset.assetType.includes('presentation') || asset.assetType.includes('playbook')).length)} />
            </div>
            <DataTable
              columns={['Sales Resources', 'Type', 'Products', 'Approval', 'Reference']}
              rows={assetLibrary.assets
                .filter((asset) => asset.category === 'Sales' || asset.usageReferences.includes('Sales'))
                .map((asset) => [asset.title, asset.assetType, asset.products.join(', ') || 'General', asset.approvalStatus, asset.localFileReference])}
            />
            <DataTable
              columns={['Product Assets', 'Audience', 'Usage', 'Status']}
              rows={assetLibrary.assets
                .filter((asset) => asset.products.length)
                .map((asset) => [asset.title, asset.audiences.join(', '), asset.usageReferences.join(', '), asset.approvalStatus])}
            />
            <DataTable
              columns={['Pricing Resources', 'Owner', 'Reference', 'Next Step']}
              rows={assetLibrary.assets
                .filter((asset) => asset.tags.includes('pricing') || asset.keywords.includes('pricing'))
                .map((asset) => [asset.title, asset.owner, asset.localFileReference, 'Review before customer use'])}
              emptyMessage="No pricing resources are approved in the shared library yet."
            />
            <DataTable
              columns={['Presentation Library', 'Type', 'Owner', 'Approval']}
              rows={assetLibrary.assets
                .filter((asset) => asset.assetType.includes('presentation') || asset.assetType.includes('playbook'))
                .map((asset) => [asset.title, asset.assetType, asset.owner, asset.approvalStatus])}
            />
            <p className="subtle-note">Sales resource references are local and approval-aware. They do not send emails, sync CRM data, publish assets, or replace files automatically.</p>
          </section>
        ) : null}

        {marketing ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <FileText size={18} />
                <h2>Sales Marketing Assets</h2>
              </div>
              <StatusBadge value="Draft-only" tone="warn" />
            </div>
            <div className="batch-grid">
              <Fact label="Marketing Assets" value={String(marketing.content.length)} />
              <Fact label="Product Messaging" value={String(marketing.products.length)} />
              <Fact label="Audience Messaging" value={String(marketing.audiences.length)} />
              <Fact label="Campaign Support" value={String(marketing.campaigns.length)} />
            </div>
            <DataTable
              columns={['Marketing Asset', 'Product', 'Audience', 'Message', 'Status']}
              rows={marketing.salesSupport.map((asset) => [asset.asset, asset.product, asset.audience, asset.message, asset.status])}
              emptyMessage="No Sales marketing assets."
            />
            <DataTable
              columns={['Product Messaging', 'Audience', 'Launch Status', 'Positioning']}
              rows={marketing.products.slice(0, 6).map((product) => [product.name, product.audience.join(', '), product.launchStatus, product.positioning])}
            />
            <DataTable
              columns={['Audience Messaging', 'Preferred Channels', 'Content Ideas']}
              rows={marketing.audiences.slice(0, 6).map((audience) => [audience.name, audience.preferredChannels.join(', '), audience.contentIdeas.join('; ')])}
            />
            <div className="dashboard-subsection">
              <h3>Sales Enablement Drafts</h3>
              <DataTable
                columns={['Draft', 'Product', 'Audience', 'Approval']}
                rows={marketing.contentStudio.drafts
                  .filter((draft) => ['product messaging draft', 'FAQ draft', 'case study outline'].includes(draft.type))
                  .map((draft) => [draft.title, draft.product, draft.audience, draft.approvalStatus])}
                emptyMessage="No Sales enablement drafts."
              />
            </div>
            <div className="dashboard-subsection">
              <h3>Campaign Support Drafts</h3>
              <DataTable
                columns={['Draft', 'Campaign', 'Type', 'Readiness']}
                rows={marketing.contentStudio.drafts
                  .filter((draft) => draft.type === 'campaign brief' || draft.type === 'landing page draft')
                  .map((draft) => [draft.title, draft.campaign, draft.type, `${draft.readinessScore}%`])}
              />
            </div>
            <div className="dashboard-subsection">
              <h3>Product Messaging Drafts</h3>
              <DataTable
                columns={['Draft', 'Status', 'Brand Check']}
                rows={marketing.contentStudio.drafts
                  .filter((draft) => draft.type === 'product messaging draft')
                  .map((draft) => [draft.title, draft.status, `${draft.brandConsistencyScore}%`])}
              />
            </div>
            <div className="dashboard-subsection">
              <h3>Audience-Specific Copy</h3>
              <DataTable
                columns={['Draft', 'Audience', 'Draft Type', 'Safety']}
                rows={marketing.contentStudio.drafts
                  .slice(0, 6)
                  .map((draft) => [draft.title, draft.audience, draft.type, 'Draft only'])}
              />
            </div>
            <p className="subtle-note">Sales marketing support is local enablement only. It does not publish, email, post to social, buy ads, sync CRM data, or approve assets automatically.</p>
          </section>
        ) : null}

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Brain size={18} />
              <h2>Sales Agent Team</h2>
            </div>
            <StatusBadge value="Local / mock only" tone="good" />
          </div>
          <p className="panel-description">
            Head Sales coordinates the sub-agents below. They currently produce local plans, prospect lists, research briefs, and safety checks only.
          </p>
          <div className="safety-badge-row">
            <StatusBadge value={`${teamSummary.localOnlyAgents} local-only agents`} tone="good" />
            <StatusBadge value={`${teamSummary.blockedExternalActions} external actions blocked`} tone="warn" />
            <StatusBadge value="No email" tone="good" />
            <StatusBadge value="No CRM writes" tone="good" />
            <StatusBadge value="No scraping jobs" tone="neutral" />
          </div>
          <SalesAgentTeamGrid agents={teamAgents} />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Search size={18} />
              <h2>Prospect Research Command Center</h2>
            </div>
            <span>{prospectResearch.length} local prospect slot(s)</span>
          </div>
          <p className="panel-description">
            Main local prospect search is first; recommended searches below populate filters and run immediately. Live web research is config-gated, so paste public website/social/contact notes into manual research mode when needed.
          </p>
          <div className="filter-grid compact-filter-grid sales-filter-grid">
            <SalesSelect label="Market" value={prospectMarketFilter} onChange={setProspectMarketFilter}>
              <option value="all">All markets</option>
              {prospectMarkets.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </SalesSelect>
            <SalesSelect label="Category" value={prospectCategoryFilter} onChange={setProspectCategoryFilter}>
              <option value="all">All categories</option>
              <option value="mma_bjj">MMA / BJJ</option>
              <option value="crossfit">CrossFit</option>
              <option value="small_gym">Small gym</option>
              <option value="boutique_fitness">Boutique fitness</option>
              <option value="sports_performance">Sports performance</option>
            </SalesSelect>
            <SalesSelect label="Research Status" value={prospectSourceStatusFilter} onChange={setProspectSourceStatusFilter}>
              <option value="all">All statuses</option>
              <option value="public_research_ready">Public research ready</option>
              <option value="manual_research_needed">Manual research needed</option>
              <option value="blocked">Blocked</option>
            </SalesSelect>
            <label className="sales-field-label">
              Minimum Fit Score
              <input min="0" max="100" type="number" value={prospectMinimumFitScore} onChange={(event) => setProspectMinimumFitScore(event.target.value)} />
            </label>
          </div>
          <div className="button-row sales-action-row">
            <button className="report-button" onClick={runCurrentProspectSearch} type="button">
              Run Search
            </button>
            <button className="clear-button small" onClick={() => {
              setProspectMarketFilter('all');
              setProspectCategoryFilter('all');
              setProspectMinimumFitScore('0');
              setProspectSourceStatusFilter('all');
              runRecommendedSearch({ category: 'all', sourceStatus: 'all' });
            }} type="button">
              Reset Search
            </button>
          </div>
          <div className="safety-badge-row">
            <StatusBadge value={searchStatus.title} tone={searchStatus.status === 'error' ? 'warn' : searchStatus.status === 'success' ? 'good' : 'neutral'} />
            <StatusBadge value={`${searchStatus.resultCount} result(s)`} tone={searchStatus.resultCount ? 'good' : 'neutral'} />
          </div>
          <p className="subtle-note">{searchStatus.detail}</p>
          <div className="recommended-search-grid">
            {salesRecommendedSearches.map((search) => (
              <button className="report-button small" key={search.id} onClick={() => runRecommendedSearch(search.filters)} type="button">
                {search.label}
              </button>
            ))}
          </div>
          <div className="batch-grid">
            <Fact label="Manual Research Mode" value="Paste public website/social/contact fields only" />
            <Fact label="Safe Web Adapter" value="Config-gated; no scraping by default" />
            <Fact label="Top Search Result" value={searchedProspects[0]?.prospectName ?? 'No matching prospect yet'} />
          </div>
          <ProspectResearchTable prospects={filteredProspects} />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Target size={18} />
              <h2>Sales Intelligence Brief</h2>
            </div>
            <span>{teamSummary.targetMarkets} target market(s)</span>
          </div>
          <SalesIntelligenceBrief prospects={prospectResearch} summary={teamSummary} />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <FileText size={18} />
              <h2>Prospect Intake + Research Dossiers</h2>
            </div>
            <StatusBadge value="Local dossier generator" tone="good" />
          </div>
          <p className="panel-description">
            Save gym prospect details locally and generate deterministic research dossiers. No external browsing, email, Stripe, CRM, or production writes occur.
          </p>
          <ProspectIntakeForm
            draft={intakeDraft}
            onChange={setIntakeDraft}
            onSubmit={() => {
              onSaveProspectIntake(intakeDraft);
              setIntakeDraft(emptyProspectIntakeDraft);
            }}
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Workflow size={18} />
              <h2>Cross-Agent Collaboration</h2>
            </div>
            <StatusBadge value="Local shared graph" tone="good" />
          </div>
          <p className="panel-description">
            Sales, Migration, Engineering, and Executive signals are linked locally for review. No agent sends, invoices, browses, or writes production records.
          </p>
          <CrossAgentCollaborationPanel graph={crossAgentGraph} onExport={onExportCrossAgent} summary={crossAgentSummary} />
        </section>

        {sharedTaskSummary ? (
          <section className="panel wide-panel">
            <div className="panel-header">
              <div>
                <ListChecks size={18} />
              <h2>Sales Work Queue</h2>
              </div>
              <StatusBadge value={`${sharedTaskSummary.queueHealth} · local only`} tone={sharedTaskSummary.blockedTasks ? 'warn' : 'good'} />
            </div>
            <p className="panel-description">Sales work, follow-ups, proposal prep, blockers, and due-soon tasks are coordinated through local shared task records only.</p>
            <div className="batch-grid">
              <Fact label="Sales Queue" value={String(sharedTaskSummary.salesQueue.length)} />
              <Fact label="Sales Follow-Up Tasks" value={String(sharedTaskSummary.followUpTasks)} />
              <Fact label="Sales Proposal Tasks" value={String(sharedTaskSummary.proposalQueue.length)} />
              <Fact label="Sales Blocked Work" value={String(sharedTaskSummary.blockedWork.length)} />
              <Fact label="Sales Due Soon" value={String(sharedTaskSummary.dueSoon.length)} />
              <Fact label="Executive Queue" value={String(sharedTaskSummary.executiveQueue.length)} />
            </div>
            <DataTable
              columns={['Sales Work Queue', 'Why It Matters', 'Status', 'Next Action']}
              rows={sharedTaskSummary.salesQueue.map((task) => [
                task.title,
                task.queueReasons[0] ?? task.organization,
                <StatusBadge key={`${task.id}-status`} value={`${task.priority} · ${task.status}`} tone={task.priority === 'Critical' || task.priority === 'High' ? 'warn' : 'neutral'} />,
                task.recommendedNextAction,
              ])}
              emptyMessage="No Sales work queue items are ready."
            />
            <DataTable
              columns={['Sales Follow-Up Tasks', 'Due', 'Risk', 'Action']}
              rows={sharedTaskSummary.salesQueue
                .filter((task) => task.taskType === 'follow-up')
                .map((task) => [task.title, formatDate(task.dueDate), task.slaRisk, task.recommendedNextAction])}
              emptyMessage="No Sales follow-up tasks are due."
            />
            <DataTable
              columns={['Sales Proposal Tasks', 'Company', 'Blockers', 'Action']}
              rows={sharedTaskSummary.proposalQueue.map((task) => [
                task.title,
                task.organization,
                task.blockers.join('; ') || 'Ready for local prep',
                task.recommendedNextAction,
              ])}
              emptyMessage="No Sales proposal tasks are queued."
            />
            <DataTable
              columns={['Sales Blocked Work', 'Blocker', 'Owner', 'Action']}
              rows={sharedTaskSummary.blockedWork.map((task) => [
                task.title,
                task.blockers.join('; ') || task.slaRisk,
                task.assignedAgent,
                task.recommendedNextAction,
              ])}
              emptyMessage="No blocked Sales work."
            />
            <DataTable
              columns={['Sales Due Soon', 'Due', 'Urgency', 'Reason']}
              rows={sharedTaskSummary.dueSoon.map((task) => [
                task.title,
                formatDate(task.dueDate),
                <StatusBadge key={`${task.id}-urgency`} value={task.urgencyLabel} tone={task.urgencyLabel === 'Critical' ? 'warn' : 'neutral'} />,
                task.queueReasons[1] ?? task.recommendedNextAction,
              ])}
              emptyMessage="No Sales tasks are due soon."
            />
          </section>
        ) : null}

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Search size={18} />
              <h2>Saved Prospect Dossiers</h2>
            </div>
            <span>{prospectDossiers.length} dossier(s)</span>
          </div>
          <div className="dossier-layout">
            <SavedProspectList
              dossiers={prospectDossiers}
              intakes={prospectIntakes}
              onSelect={setSelectedDossierId}
              selectedDossierId={selectedDossier?.dossierId ?? null}
            />
            <DossierPreview
              dossier={selectedDossier}
              intake={selectedDossierIntake}
              onExport={(format) => selectedDossier && onExportResearchDossier(selectedDossier.dossierId, format)}
            />
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Brain size={18} />
              <h2>Unified Sales Intelligence</h2>
            </div>
            <StatusBadge value="Local graph" tone="good" />
          </div>
          <p className="panel-description">
            Internal organization graph linking prospects, organizations, coaches, proposals, follow-ups, migration plans, dossiers, and activity. Relationships are deterministic and local only.
          </p>
          <SalesIntelligenceDashboard
            graph={salesIntelligenceGraph}
            onExport={onExportSalesIntelligence}
            onSelectOrganization={setSelectedOrganizationId}
            selectedOrganization={selectedOrganization}
          />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Upload size={18} />
              <h2>Sales Lead Import</h2>
            </div>
            <span>JSON validation before save</span>
          </div>
          <p className="panel-description">
            Import accepts a JSON array of leads or an object with a <code>leads</code> array. Invalid rows are rejected before local persistence.
          </p>
          <label className="import-file-control">
            <Upload size={16} />
            <span>Choose JSON File</span>
            <input
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                file.text().then(onImportJson);
                event.currentTarget.value = '';
              }}
              type="file"
            />
          </label>
          {importResult.status !== 'idle' ? (
            <div className={`parser-message ${importResult.status === 'success' ? 'success' : 'error'}`}>
              <strong>{importResult.status === 'success' ? `${importResult.importedCount} lead(s) imported locally` : 'Import rejected'}</strong>
              {importResult.errors.map((error) => (
                <span key={error}>{error}</span>
              ))}
              {importResult.warnings.map((warning) => (
                <small key={warning}>{warning}</small>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Users size={18} />
              <h2>Lead Queue</h2>
            </div>
            <span>Local/mock only</span>
          </div>
          <p className="panel-description">
            Sales records stay in browser localStorage. Actions below only update local state, audit logs, and agent-memory events.
          </p>
          <div className="filter-grid compact-filter-grid sales-filter-grid">
            <SalesSelect label="Type" value={filters.type} onChange={(value) => setFilters((current) => ({ ...current, type: value }))}>
              <option value="all">All types</option>
              <option value="gym">Gym</option>
              <option value="coach">Coach</option>
              <option value="organization">Organization</option>
              <option value="referral">Referral</option>
            </SalesSelect>
            <SalesSelect label="Stage" value={filters.stage} onChange={(value) => setFilters((current) => ({ ...current, stage: value }))}>
              <option value="all">All stages</option>
              {Object.entries(pipelineStageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SalesSelect>
            <SalesSelect label="Priority" value={filters.priority} onChange={(value) => setFilters((current) => ({ ...current, priority: value }))}>
              <option value="all">All risk flags</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </SalesSelect>
            <SalesSelect
              label="Lead Priority"
              value={filters.scorePriority}
              onChange={(value) => setFilters((current) => ({ ...current, scorePriority: value }))}
            >
              <option value="all">All scored priorities</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Nurture">Nurture</option>
              <option value="Needs Info">Needs Info</option>
              <option value="At Risk">At Risk</option>
            </SalesSelect>
            <SalesSelect label="Source" value={filters.source} onChange={(value) => setFilters((current) => ({ ...current, source: value }))}>
              <option value="all">All sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </SalesSelect>
          </div>
          <SalesLeadTable leads={filteredLeads} onSelectScore={setSelectedScoreId} scores={scores} selectedScoreId={selectedScore?.leadId ?? null} />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Target size={18} />
              <h2>Why This Score?</h2>
            </div>
            {selectedScore ? <StatusBadge value={selectedScore.priorityLabel} tone={salesPriorityTone(selectedScore.priorityLabel)} /> : null}
          </div>
          <p className="panel-description">
            Scores are deterministic local rules. They explain priority only and do not trigger email, Stripe, CRM, or production writes.
          </p>
          {selectedScore && selectedLead ? <ScoreDetailPanel lead={selectedLead} score={selectedScore} /> : <p className="empty-note">Select a lead to review scoring rationale.</p>}
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <CalendarClock size={18} />
              <h2>Follow-Up Queue</h2>
            </div>
            <span>{followUpQueue.length} local reminder(s)</span>
          </div>
          <p className="panel-description">Prioritized reminders are local planning artifacts only. No messages are sent from this queue.</p>
          <FollowUpQueueTable items={followUpQueue} />
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Users size={18} />
              <h2>Gym Prospect Tracker</h2>
            </div>
            <span>{gymLeads.length} gym lead(s)</span>
          </div>
          <div className="prospect-grid">
            {gymLeads.map((lead) => (
              <article className="prospect-card" key={lead.id}>
                <div>
                  <strong>{lead.businessName}</strong>
                  <span>{lead.location}</span>
                </div>
                <div className="fact-list compact-facts">
                  <Fact label="Members" value={lead.memberCount ? String(lead.memberCount) : 'Unknown'} />
                  <Fact label="Migration" value={proposalForLead(proposals, lead.id)?.migrationNeeded ? 'Yes' : 'No'} />
                  <Fact label="Fit" value={lead.likelyProductFit ?? 'Needs discovery'} />
                </div>
                <p>{lead.nextAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <Users size={18} />
              <h2>Coach Prospect Tracker</h2>
            </div>
            <span>{coachLeads.length} coach lead(s)</span>
          </div>
          <div className="prospect-grid">
            {coachLeads.map((lead) => (
              <article className="prospect-card" key={lead.id}>
                <div>
                  <strong>{lead.contactName}</strong>
                  <span>{lead.niche ?? 'Coaching'}</span>
                </div>
                <div className="fact-list compact-facts">
                  <Fact label="Clients" value={lead.currentClients ? String(lead.currentClients) : 'Unknown'} />
                  <Fact label="Likely Plan" value={lead.likelyProductFit ?? 'Needs discovery'} />
                  <Fact label="Stage" value={pipelineStageLabels[lead.pipelineStage]} />
                </div>
                <p>{lead.nextAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <FileText size={18} />
              <h2>Quote / Proposal Prep</h2>
            </div>
            <span>No Stripe or invoice creation</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Recommended Product</th>
                  <th>Setup Fee</th>
                  <th>Monthly Fee</th>
                  <th>Migration Fee</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {proposalRows.map(({ lead, proposal }) => (
                  <tr key={proposal.leadId}>
                    <td>{lead?.name}</td>
                    <td>{proposal.recommendedProduct}</td>
                    <td>{formatCurrency(proposal.setupFee)}</td>
                    <td>{formatCurrency(proposal.monthlyFee)}</td>
                    <td>{formatCurrency(proposal.migrationFee ?? 0)}</td>
                    <td>{proposal.notes}</td>
                    <td>
                      <StatusBadge value={proposal.status.replace(/_/g, ' ')} tone={proposal.status === 'needed' ? 'warn' : 'neutral'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <FileText size={18} />
              <h2>Proposal Builder</h2>
            </div>
            <span>Draft only</span>
          </div>
          <p className="panel-description">
            Generate deterministic local proposal drafts from lead data and proposal prep. Drafts are not sent, not invoiced, and not written to CRM.
          </p>
          <div className="safety-badge-row">
            <StatusBadge value="Draft only" tone="neutral" />
            <StatusBadge value="Not sent" tone="good" />
            <StatusBadge value="Not invoiced" tone="good" />
            <StatusBadge value="Local only" tone="good" />
          </div>
          <div className="filter-grid compact-filter-grid sales-filter-grid">
            <SalesSelect
              label="Lead"
              value={selectedProposalLead?.id ?? ''}
              onChange={(value) => {
                const nextLead = leads.find((lead) => lead.id === value);
                setSelectedProposalLeadId(value);
                if (nextLead) {
                  setSelectedProposalType(inferProposalTemplate(nextLead, proposalForLead(proposals, nextLead.id)));
                }
              }}
            >
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </SalesSelect>
            <SalesSelect label="Proposal Type" value={selectedProposalType} onChange={(value) => setSelectedProposalType(value as SalesProposalTemplateType)}>
              {Object.entries(salesProposalTemplateLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SalesSelect>
          </div>
          {previewProposalDraft ? (
            <ProposalBuilderPreview
              draft={previewProposalDraft}
              isSaved={Boolean(savedProposalDraft)}
              onExport={(format) => savedProposalDraft && onExportProposalDraft(savedProposalDraft.draftId, format)}
              onGenerate={() => onGenerateProposalDraft(previewProposalDraft.leadId, previewProposalDraft.templateType)}
            />
          ) : (
            <p className="empty-note">Add or import a local lead before creating a proposal draft.</p>
          )}
        </section>

        <section className="panel wide-panel">
          <div className="panel-header">
            <div>
              <CalendarClock size={18} />
              <h2>Follow-Up Planner</h2>
            </div>
            <span>Local actions only</span>
          </div>
          <div className="follow-up-grid">
            <FollowUpColumn action="contacted" label="Due Today" leads={activeLeads.filter(isFollowUpDue)} onAction={onAction} />
            <FollowUpColumn action="follow_up_planned" label="Due This Week" leads={activeLeads.filter(isFollowUpThisWeek)} onAction={onAction} />
            <FollowUpColumn action="contacted" label="Overdue" leads={activeLeads.filter(isOverdue)} onAction={onAction} />
            <FollowUpColumn action="follow_up_planned" label="No Follow-Up Scheduled" leads={activeLeads.filter((lead) => !lead.nextFollowUpDate)} onAction={onAction} />
          </div>
          <div className="button-row sales-action-row">
            {activeLeads.slice(0, 4).map((lead) => (
              <div className="button-group" key={lead.id}>
                <span>{lead.name}</span>
                <button className="report-button small" onClick={() => onAction(lead.id, 'follow_up_planned')} type="button">
                  Mark Follow-Up Planned
                </button>
                <button className="report-button small" onClick={() => onAction(lead.id, 'contacted')} type="button">
                  Mark Contacted
                </button>
                <button className="report-button small" onClick={() => onAction(lead.id, 'proposal_needed')} type="button">
                  Mark Proposal Needed
                </button>
                <button className="clear-button small" onClick={() => onAction(lead.id, 'paused')} type="button">
                  Mark Paused
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <CalendarClock size={18} />
              <h2>Sales Activity Timeline</h2>
            </div>
            <span>{activities.length} event(s)</span>
          </div>
          <div className="history-list">
            {activities.slice(0, 8).map((activity) => (
              <article className="history-item" key={activity.id}>
                <div>
                  <strong>{activity.summary}</strong>
                  <span>{activity.outcome}</span>
                </div>
                <small>{formatDate(activity.timestamp)}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <Download size={18} />
              <h2>Sales Reports</h2>
            </div>
            <span>Local export only</span>
          </div>
          <div className="report-grid executive-report-grid">
            <button className="report-button" onClick={() => onExport('json', 'pipeline')} type="button">
              <Download size={16} />
              <span>Sales Pipeline JSON</span>
              <small>Pipeline, activity, and proposal snapshot.</small>
            </button>
            <button className="report-button" onClick={() => onExport('csv', 'pipeline')} type="button">
              <Download size={16} />
              <span>Sales Pipeline CSV</span>
              <small>Spreadsheet-safe pipeline export.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'pipeline')} type="button">
              <Download size={16} />
              <span>Sales Pipeline Markdown</span>
              <small>Readable pipeline summary.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'prospect_research')} type="button">
              <Download size={16} />
              <span>Prospect Research Markdown</span>
              <small>Research status, missing fields, and next actions.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'company_dossier')} type="button">
              <Download size={16} />
              <span>Company Dossier Markdown</span>
              <small>Fit, pain points, product recommendation, and outreach angle.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'outreach_prep')} type="button">
              <Download size={16} />
              <span>Outreach Prep Markdown</span>
              <small>Draft-only outreach prep and suggested asks.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'follow_up')} type="button">
              <Download size={16} />
              <span>Follow-Up Report Markdown</span>
              <small>Due and unscheduled follow-ups.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'icp_fit')} type="button">
              <Download size={16} />
              <span>ICP Fit Markdown</span>
              <small>Fit tiers and Louisville-area ICP reasoning.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'proposal')} type="button">
              <Download size={16} />
              <span>Proposal Prep Report Markdown</span>
              <small>Quote prep without Stripe writes.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'executive_summary')} type="button">
              <Download size={16} />
              <span>Executive Sales Summary</span>
              <small>Current pipeline, research, and next recommended action.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'lead_scoring')} type="button">
              <Download size={16} />
              <span>Lead Scoring Report Markdown</span>
              <small>Explainable scores and priority labels.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'follow_up_queue')} type="button">
              <Download size={16} />
              <span>Follow-Up Queue Markdown</span>
              <small>Today, overdue, proposal, stalled, and missing-info reminders.</small>
            </button>
            <button className="report-button" onClick={() => onExport('json', 'weighted_pipeline')} type="button">
              <Download size={16} />
              <span>Weighted Pipeline JSON</span>
              <small>Score-weighted local pipeline snapshot.</small>
            </button>
          </div>
        </section>
      </section>
    </>
  );
}

function scoreLabelTone(label: SalesIntelligenceScoreLabel) {
  if (label === 'Hot') return 'warn';
  if (label === 'Not Ready') return 'neutral';
  return 'good';
}

function dueLabel(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (Number.isNaN(diffDays)) return 'No due date';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  return `${diffDays}d left`;
}

function SalesMetric({ icon, label, tone, value }: { icon: ReactNode; label: string; tone?: 'good' | 'warn'; value: string }) {
  return (
    <article className={`metric-card ${tone ?? ''}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function OpportunityDetail({ opportunity }: { opportunity: SalesOpportunity }) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Target size={18} />
          <h2>Opportunity Detail</h2>
        </div>
        <StatusBadge value={opportunity.stage.replace(/_/g, ' ')} tone={opportunity.priority === 'High' || opportunity.priority === 'Critical' ? 'warn' : 'neutral'} />
      </div>
      <div className="batch-grid">
        <Fact label="Company" value={opportunity.company} />
        <Fact label="Industry" value={opportunity.industry} />
        <Fact label="Location" value={opportunity.location} />
        <Fact label="NAICS" value={opportunity.naics} />
        <Fact label="Website" value={opportunity.website} />
        <Fact label="Company Size" value={opportunity.companySizeEstimate} />
        <Fact label="ICP / Lead Score" value={`${opportunity.icpScore}/${opportunity.leadScore}`} />
        <Fact label="Executive Visibility" value={opportunity.executiveVisibility ? 'Visible' : 'Standard'} />
      </div>
      <DataTable
        columns={['Contact', 'Role', 'Email', 'Phone']}
        rows={opportunity.contacts.map((contact) => [contact.name, contact.role, contact.email || 'Missing', contact.phone || 'Missing'])}
      />
      <div className="batch-grid">
        <Fact label="Proposal Readiness" value={`${opportunity.proposalPreparationStatus.readinessPercent}%`} />
        <Fact label="Proposal Status" value={opportunity.proposalPreparationStatus.status.replace(/_/g, ' ')} />
        <Fact label="Missing Proposal Info" value={opportunity.proposalPreparationStatus.missing.join(', ') || 'None'} />
        <Fact label="Close Probability" value={`${opportunity.followUpPlan.estimatedCloseProbability}%`} />
        <Fact label="Recommended Next Action" value={opportunity.followUpPlan.recommendedNextAction} />
        <Fact label="Recommended Timeframe" value={opportunity.followUpPlan.recommendedTimeframe} />
      </div>
      <DataTable columns={['Timeline', 'Reason', 'Operator']} rows={opportunity.activityTimeline.map((event) => [formatDate(event.timestamp), `${event.title}: ${event.reason}`, event.operator])} />
      <DataTable columns={['Notes']} rows={opportunity.notes.map((note) => [note])} />
      <DataTable columns={['Generated Reports']} rows={opportunity.generatedReports.map((report) => [report])} />
      <DataTable columns={['Draft Outreach']} rows={opportunity.draftOutreach.map((draft) => [draft])} />
      <DataTable columns={['Follow-Up Talking Point']} rows={opportunity.followUpPlan.talkingPoints.map((point) => [point])} />
      <p className="subtle-note">Executive summary: {opportunity.company} is a {opportunity.score.opportunityRating}-rated local CRM opportunity with {opportunity.score.confidence}% confidence. No external CRM, email, or proposal send occurred.</p>
    </section>
  );
}

function SalesAgentTeamGrid({ agents }: { agents: SalesTeamAgentDefinition[] }) {
  return (
    <div className="sales-agent-grid">
      {agents.map((agent) => (
        <article className="sales-agent-card" key={agent.id}>
          <div>
            <strong>{agent.name}</strong>
            <StatusBadge value={agent.status.replace(/_/g, ' ')} tone={agent.status === 'active_local' ? 'good' : 'neutral'} />
          </div>
          <p>{agent.description}</p>
          <small>{agent.output}</small>
        </article>
      ))}
    </div>
  );
}

function ProspectResearchTable({ prospects }: { prospects: SalesProspectResearchRecord[] }) {
  if (!prospects.length) {
    return <p className="empty-note">No prospects match the current filters.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fit</th>
            <th>Prospect</th>
            <th>Category</th>
            <th>Market</th>
            <th>Locations</th>
            <th>Why Fit</th>
            <th>Next Research</th>
            <th>Source Status</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((prospect) => (
            <tr key={prospect.id}>
              <td>
                <button className="score-button" disabled type="button">
                  {prospect.fitScore}
                </button>
              </td>
              <td>
                <strong>{prospect.prospectName}</strong>
                <span className="table-subtext">{prospect.estimatedSizeLabel}</span>
              </td>
              <td>{formatProspectCategory(prospect.category)}</td>
              <td>{`${prospect.city}, ${prospect.state}`}</td>
              <td>{prospect.estimatedLocationCount ?? 'Verify'}</td>
              <td>{prospect.fitReasons.join('; ')}</td>
              <td>{prospect.recommendedNextResearch}</td>
              <td>
                <StatusBadge value={prospect.sourceStatus.replace(/_/g, ' ')} tone={prospect.sourceStatus === 'needs_public_research' ? 'warn' : 'good'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesIntelligenceBrief({
  prospects,
  summary,
}: {
  prospects: SalesProspectResearchRecord[];
  summary: SalesPageProps['teamSummary'];
}) {
  const strongestProspect = [...prospects].sort((a, b) => b.fitScore - a.fitScore)[0];
  const strongestMarket = bestMarket(prospects);
  return (
    <div className="score-detail-grid">
      <div className="fact-list compact-facts">
        <Fact label="Best Market" value={strongestMarket} />
        <Fact label="Top Prospect Slot" value={strongestProspect?.prospectName ?? 'None'} />
        <Fact label="Average Fit" value={`${summary.averageFitScore}/100`} />
        <Fact label="Ready Prospects" value={String(summary.readyProspects)} />
        <Fact label="Needs Research" value={String(summary.needsResearch)} />
      </div>
      <div className="score-factor-list">
        <article className="score-factor">
          <div>
            <strong>Recommended Next Move</strong>
            <span>Verify public websites and social profiles for the highest-fit Louisville and Cincinnati slots before expanding broad LA/NY research.</span>
          </div>
          <b>Local</b>
        </article>
        <article className="score-factor">
          <div>
            <strong>Safety Boundary</strong>
            <span>No automated scraping, emails, invoices, CRM writes, or production business writes are enabled from this page.</span>
          </div>
          <b>Blocked</b>
        </article>
      </div>
    </div>
  );
}

function formatProspectCategory(category: SalesProspectCategory): string {
  const labels: Record<SalesProspectCategory, string> = {
    boutique_fitness: 'Boutique fitness',
    crossfit: 'CrossFit',
    mma_bjj: 'MMA / BJJ',
    small_gym: 'Small gym',
    sports_performance: 'Sports performance',
  };
  return labels[category];
}

function bestMarket(prospects: SalesProspectResearchRecord[]): string {
  const marketScores = prospects.reduce<Record<string, { count: number; score: number }>>((result, prospect) => {
    const market = `${prospect.city}, ${prospect.state}`;
    const current = result[market] ?? { count: 0, score: 0 };
    result[market] = { count: current.count + 1, score: current.score + prospect.fitScore };
    return result;
  }, {});
  const [market] =
    Object.entries(marketScores).sort(([, first], [, second]) => second.score / second.count - first.score / first.count)[0] ?? [];
  return market ?? 'No prospects';
}

function ProspectIntakeForm({
  draft,
  onChange,
  onSubmit,
}: {
  draft: SalesProspectIntakeDraft;
  onChange(_draft: SalesProspectIntakeDraft): void;
  onSubmit(): void;
}) {
  const missing = draftMissingFields(draft);
  const update = <Key extends keyof SalesProspectIntakeDraft>(key: Key, value: SalesProspectIntakeDraft[Key]) => onChange({ ...draft, [key]: value });

  return (
    <div className="prospect-intake-grid">
      <div className="prospect-intake-form">
        <TextInput label="Gym Name" value={draft.gymName} onChange={(value) => update('gymName', value)} />
        <div className="intake-two-column">
          <TextInput label="City" value={draft.city} onChange={(value) => update('city', value)} />
          <TextInput label="State" value={draft.state} onChange={(value) => update('state', value)} />
        </div>
        <SalesSelect label="Business Type" value={draft.businessType} onChange={(value) => update('businessType', value as SalesProspectBusinessType)}>
          <option value="mma_bjj">MMA / BJJ</option>
          <option value="crossfit">CrossFit</option>
          <option value="small_gym">Small gym</option>
          <option value="boutique_fitness">Boutique fitness</option>
          <option value="sports_performance">Sports performance</option>
          <option value="independent_coach">Independent coach</option>
          <option value="multi_location_gym">Multi-location gym</option>
          <option value="unknown">Unknown</option>
        </SalesSelect>
        <div className="intake-two-column">
          <TextInput label="Website" value={draft.websiteUrl} onChange={(value) => update('websiteUrl', value)} />
          <TextInput label="Instagram / Social" value={draft.instagramUrl} onChange={(value) => update('instagramUrl', value)} />
        </div>
        <div className="intake-two-column">
          <TextInput label="Owner / Contact" value={draft.contactName} onChange={(value) => update('contactName', value)} />
          <TextInput label="Current Software" value={draft.currentSoftware} onChange={(value) => update('currentSoftware', value)} />
        </div>
        <div className="intake-two-column">
          <TextInput label="Contact Email" value={draft.contactEmail} onChange={(value) => update('contactEmail', value)} />
          <TextInput label="Contact Phone" value={draft.contactPhone} onChange={(value) => update('contactPhone', value)} />
        </div>
        <div className="intake-three-column">
          <NumberInput label="Estimated Members" value={draft.estimatedMembers} onChange={(value) => update('estimatedMembers', value)} />
          <NumberInput label="Estimated Coaches" value={draft.estimatedCoaches} onChange={(value) => update('estimatedCoaches', value)} />
          <SalesSelect label="Migration Complexity" value={draft.migrationComplexity} onChange={(value) => update('migrationComplexity', value as SalesProspectIntakeDraft['migrationComplexity'])}>
            <option value="unknown">Unknown</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </SalesSelect>
        </div>
        <TextareaInput
          label="Pain Points"
          value={draft.painPoints.join('\n')}
          onChange={(value) =>
            update(
              'painPoints',
              value
                .split(/\n|,/)
                .map((item) => item.trim())
                .filter(Boolean),
            )
          }
        />
        <TextareaInput label="Notes" value={draft.notes} onChange={(value) => update('notes', value)} />
        <div className="button-row sales-action-row">
          <button className="report-button" disabled={!draft.gymName.trim()} onClick={onSubmit} type="button">
            Generate Local Dossier
          </button>
          <button className="clear-button" onClick={() => onChange(emptyProspectIntakeDraft)} type="button">
            Clear Intake
          </button>
        </div>
      </div>
      <div className="proposal-preview-card">
        <h3>Missing Info Checklist</h3>
        {missing.length ? (
          <ul className="checklist">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">Core intake fields are ready for a stronger local dossier.</p>
        )}
        <div className="safety-badge-row">
          <StatusBadge value="Local only" tone="good" />
          <StatusBadge value="No browsing" tone="good" />
          <StatusBadge value="No CRM write" tone="good" />
        </div>
      </div>
    </div>
  );
}

function SavedProspectList({
  dossiers,
  intakes,
  onSelect,
  selectedDossierId,
}: {
  dossiers: SalesResearchDossier[];
  intakes: SalesProspectIntake[];
  onSelect(_dossierId: string): void;
  selectedDossierId: string | null;
}) {
  if (!dossiers.length) {
    return <p className="empty-note">No saved prospect dossiers yet.</p>;
  }

  return (
    <div className="history-list">
      {dossiers.map((dossier) => {
        const intake = intakes.find((item) => item.id === dossier.intakeId);
        return (
          <button
            className={`dossier-list-item ${selectedDossierId === dossier.dossierId ? 'selected' : ''}`}
            key={dossier.dossierId}
            onClick={() => onSelect(dossier.dossierId)}
            type="button"
          >
            <strong>{intake?.gymName ?? 'Unknown prospect'}</strong>
            <span>{intake ? `${intake.city}, ${intake.state} · ${labelBusinessType(intake.businessType)}` : 'Missing intake'}</span>
            <small>{dossier.fitScore}/100 · {dossier.icpFit.replace(/_/g, ' ')}</small>
          </button>
        );
      })}
    </div>
  );
}

function DossierPreview({
  dossier,
  intake,
  onExport,
}: {
  dossier: SalesResearchDossier | null;
  intake: SalesProspectIntake | null;
  onExport(_format: 'json' | 'markdown'): void;
}) {
  if (!dossier || !intake) {
    return <p className="empty-note">Save a prospect intake to preview a deterministic research dossier.</p>;
  }

  return (
    <div className="dossier-preview">
      <div className="fact-list compact-facts">
        <Fact label="Prospect" value={intake.gymName} />
        <Fact label="Market" value={`${intake.city}, ${intake.state}`} />
        <Fact label="Business Type" value={labelBusinessType(intake.businessType)} />
        <Fact label="Fit Score" value={`${dossier.fitScore}/100`} />
        <Fact label="ICP Fit" value={dossier.icpFit.replace(/_/g, ' ')} />
        <Fact label="Product" value={dossier.recommendedVyraProduct} />
      </div>
      <div className="score-factor-list">
        <DossierBlock title="Business Overview" value={dossier.businessOverview} />
        <DossierBlock title="Migration Opportunity" value={dossier.migrationOpportunity} />
        <DossierBlock title="Outreach Angle" value={dossier.outreachAngle} />
        <DossierBlock title="Proposal Angle" value={dossier.proposalAngle} />
      </div>
      <div className="score-factor-list">
        {dossier.fitFactors.map((factor) => (
          <article className="score-factor" key={factor.key}>
            <div>
              <strong>{factor.label}</strong>
              <span>{factor.detail}</span>
            </div>
            <b>{factor.points > 0 ? `+${factor.points}` : factor.points}</b>
          </article>
        ))}
      </div>
      <div className="intake-two-column">
        <Checklist title="Missing Info" items={dossier.missingInfo} empty="No missing info detected." />
        <Checklist title="Next Steps" items={dossier.nextSteps} empty="No next steps queued." />
      </div>
      <div className="button-row sales-action-row">
        <button className="report-button small" onClick={() => onExport('markdown')} type="button">
          Export Dossier Markdown
        </button>
        <button className="report-button small" onClick={() => onExport('json')} type="button">
          Export Dossier JSON
        </button>
      </div>
    </div>
  );
}

function CrossAgentCollaborationPanel({
  graph,
  onExport,
  summary,
}: {
  graph: CrossAgentCollaborationGraph;
  onExport(_report: 'collaboration' | 'graph' | 'priority_queue'): void;
  summary: CrossAgentCollaborationSummary;
}) {
  const engineeringBlockers = graph.entities.filter((item) => item.type === 'engineering_blocker');
  const migrationPlans = graph.entities.filter((item) => item.type === 'migration_plan');
  const executivePriorities = graph.entities.filter((item) => item.type === 'executive_priority');
  const featureRequests = graph.entities.filter((item) => item.type === 'feature_request');
  const approvalItems = graph.relationships.filter((item) => item.relationship === 'needs_approval' || item.relationship === 'ready_for_review');

  return (
    <div className="cross-agent-grid">
      <div className="fact-list compact-facts">
        <Fact label="Active Signals" value={String(summary.activeSignals)} />
        <Fact label="Relationships" value={String(summary.relationshipCount)} />
        <Fact label="Blocked Opportunities" value={String(summary.highValueOpportunitiesBlockedByEngineering)} />
        <Fact label="Migration Links" value={String(summary.migrationsTiedToActiveSalesOpportunities)} />
        <Fact label="Approval Needed" value={String(summary.approvalNeededItems)} />
        <Fact label="Feature Requests" value={String(summary.featureRequestsTiedToProspects)} />
      </div>
      <div className="cross-agent-panel-grid">
        <CrossAgentSignalList empty="No engineering blockers linked to sales opportunities." items={engineeringBlockers} title="Linked Engineering Blockers" />
        <CrossAgentSignalList empty="No migration readiness signals linked yet." items={migrationPlans} title="Linked Migration Readiness" />
        <CrossAgentSignalList empty="No executive priority signals linked yet." items={executivePriorities} title="Linked Executive Priorities" />
        <CrossAgentSignalList empty="No requested feature signals linked yet." items={featureRequests} title="Requested Features" />
      </div>
      <div className="proposal-preview-card">
        <h3>Approval-Needed Items</h3>
        {approvalItems.length ? (
          <div className="relationship-list">
            {approvalItems.slice(0, 6).map((item) => (
              <article className="relationship-item" key={item.id}>
                <strong>{item.relationship.replace(/_/g, ' ')}</strong>
                <span>{item.from} {'->'} {item.to}</span>
                <small>{item.explanation}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No local approvals are currently linked.</p>
        )}
      </div>
      <div className="button-row sales-action-row">
        <button className="report-button small" onClick={() => onExport('collaboration')} type="button">
          Cross-Agent Collaboration Report
        </button>
        <button className="report-button small" onClick={() => onExport('graph')} type="button">
          Cross-Agent Graph JSON
        </button>
        <button className="report-button small" onClick={() => onExport('priority_queue')} type="button">
          Executive Priority Queue
        </button>
      </div>
    </div>
  );
}

function CrossAgentSignalList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: CrossAgentCollaborationGraph['entities'];
  title: string;
}) {
  return (
    <div className="proposal-preview-card">
      <h3>{title}</h3>
      {items.length ? (
        <div className="relationship-list">
          {items.slice(0, 5).map((item) => (
            <article className="relationship-item" key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.agent} - {item.type.replace(/_/g, ' ')}</span>
              <small>Local/mock only - no external action</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">{empty}</p>
      )}
    </div>
  );
}

function SalesIntelligenceDashboard({
  graph,
  onExport,
  onSelectOrganization,
  selectedOrganization,
}: {
  graph: SalesIntelligenceGraph;
  onExport(_report: 'organization_intelligence' | 'graph' | 'timeline', _organizationId: string | null): void;
  onSelectOrganization(_organizationId: string): void;
  selectedOrganization: SalesOrganizationProfile | null;
}) {
  if (!graph.organizationProfiles.length) {
    return <p className="empty-note">No organization intelligence is available yet. Save a prospect intake or add a local lead to build the graph.</p>;
  }

  const relationshipEdges = selectedOrganization
    ? graph.edges.filter((edge) => edge.from === selectedOrganization.id || edge.to === selectedOrganization.id)
    : [];
  const connectedNodes = relationshipEdges
    .flatMap((edge) => [edge.from, edge.to])
    .filter((id) => id !== selectedOrganization?.id)
    .map((id) => graph.nodes.find((node) => node.id === id))
    .filter(Boolean);

  return (
    <div className="sales-intelligence-layout">
      <div className="history-list">
        {graph.organizationProfiles.map((profile) => (
          <button
            className={`dossier-list-item ${selectedOrganization?.id === profile.id ? 'selected' : ''}`}
            key={profile.id}
            onClick={() => onSelectOrganization(profile.id)}
            type="button"
          >
            <strong>{profile.label}</strong>
            <span>{profile.profileSummary}</span>
            <small>{profile.completenessScore}/100 complete · {profile.migrationReadiness.replace(/_/g, ' ')}</small>
          </button>
        ))}
      </div>
      <div className="dossier-preview">
        {selectedOrganization ? (
          <>
            <div className="fact-list compact-facts">
              <Fact label="Organization" value={selectedOrganization.label} />
              <Fact label="Relationship Depth" value={String(selectedOrganization.relationshipDepth)} />
              <Fact label="Completeness" value={`${selectedOrganization.completenessScore}/100`} />
              <Fact label="Migration Readiness" value={selectedOrganization.migrationReadiness.replace(/_/g, ' ')} />
              <Fact label="Connected Proposals" value={String(selectedOrganization.connectedProposalIds.length)} />
              <Fact label="Connected Dossiers" value={String(selectedOrganization.connectedDossierIds.length)} />
            </div>
            <div className="intake-two-column">
              <RelationshipList graph={graph} relationships={relationshipEdges} />
              <ConnectedNodeList nodes={connectedNodes as SalesIntelligenceGraph['nodes']} />
            </div>
            <TimelineList timeline={selectedOrganization.timeline} />
            <div className="button-row sales-action-row">
              <button className="report-button small" onClick={() => onExport('organization_intelligence', selectedOrganization.id)} type="button">
                Organization Intelligence Report
              </button>
              <button className="report-button small" onClick={() => onExport('timeline', selectedOrganization.id)} type="button">
                Organization Timeline
              </button>
              <button className="report-button small" onClick={() => onExport('graph', selectedOrganization.id)} type="button">
                Sales Intelligence Graph JSON
              </button>
            </div>
          </>
        ) : (
          <p className="empty-note">Select an organization to review intelligence.</p>
        )}
      </div>
    </div>
  );
}

function OrganizationIntelligenceWorkspace({
  onSelectOrganization,
  selectedOrganization,
  store,
}: {
  onSelectOrganization(_organizationId: string): void;
  selectedOrganization: SalesOrganizationIntelligence | null;
  store: SalesOrganizationIntelligenceStore;
}) {
  const committee = selectedOrganization ? store.buyingCommittees.find((item) => item.organizationId === selectedOrganization.organizationId) : null;
  const relationships = selectedOrganization ? store.relationshipEdges.filter((edge) => edge.from === selectedOrganization.organizationId || edge.to === selectedOrganization.organizationId) : [];
  const duplicates = selectedOrganization
    ? store.organizationDuplicateCandidates.filter((candidate) => candidate.leftId === selectedOrganization.organizationId || candidate.rightId === selectedOrganization.organizationId)
    : [];

  return (
    <div className="organization-intelligence-layout">
      <div className="organization-list-panel">
        {store.organizations.map((organization) => (
          <button
            className={`dossier-list-item ${selectedOrganization?.organizationId === organization.organizationId ? 'selected' : ''}`}
            key={organization.organizationId}
            onClick={() => onSelectOrganization(organization.organizationId)}
            type="button"
          >
            <strong>{organization.legalName}</strong>
            <span>{organization.headquarters} · {organization.industry}</span>
            <small>{organization.evaluations.organizationHealth.score}/100 health · {organization.contacts.length} contact(s)</small>
          </button>
        ))}
      </div>
      {selectedOrganization ? (
        <div className="organization-detail-grid">
          <article className="proposal-preview-card org-overview-card">
            <h3>Organization Overview</h3>
            <div className="fact-list compact-facts">
              <Fact label="Company" value={selectedOrganization.legalName} />
              <Fact label="Domain" value={selectedOrganization.primaryDomain || 'Manual'} />
              <Fact label="Headquarters" value={selectedOrganization.headquarters} />
              <Fact label="Stage" value={selectedOrganization.currentSalesStage.replace(/_/g, ' ')} />
              <Fact label="Priority" value={selectedOrganization.priority} />
              <Fact label="Risk" value={selectedOrganization.riskRating} />
            </div>
            <p className="subtle-note">{selectedOrganization.description}</p>
          </article>

          <article className="proposal-preview-card">
            <h3>Relationship Health</h3>
            <div className="score-factor-grid">
              <ScorePill label="Org Health" evaluation={selectedOrganization.evaluations.organizationHealth} />
              <ScorePill label="Relationship" evaluation={selectedOrganization.evaluations.relationshipHealth} />
              <ScorePill label="Decision Maker" evaluation={selectedOrganization.evaluations.decisionMakerCoverage} />
              <ScorePill label="Sales Ready" evaluation={selectedOrganization.evaluations.salesReadiness} />
            </div>
          </article>

          <article className="proposal-preview-card">
            <h3>Contacts</h3>
            <div className="relationship-list">
              {selectedOrganization.contacts.map((contact) => (
                <article className="relationship-item" key={contact.contactId}>
                  <strong>{contact.preferredName || `${contact.firstName} ${contact.lastName}`}</strong>
                  <span>{contact.title || 'Role needed'} · {contact.decisionAuthority}</span>
                  <small>{contact.email || 'email needed'} · {contact.phone || 'phone needed'} · relationship {contact.relationshipStrength}%</small>
                </article>
              ))}
            </div>
          </article>

          <article className="proposal-preview-card">
            <h3>Buying Committee</h3>
            <div className="fact-list compact-facts">
              <Fact label="Completeness" value={`${committee?.completenessScore ?? 0}%`} />
              <Fact label="Missing Roles" value={committee?.missingRoles.join(', ') || 'None'} />
            </div>
            <div className="relationship-list">
              {(committee?.roles ?? []).map((role) => (
                <article className="relationship-item" key={`${role.contactId}-${role.role}`}>
                  <strong>{role.role}</strong>
                  <span>{selectedOrganization.contacts.find((contact) => contact.contactId === role.contactId)?.preferredName ?? role.contactId}</span>
                  <small>{role.confidence}% confidence · {role.evidence}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="proposal-preview-card">
            <h3>Relationship Map</h3>
            <div className="relationship-list">
              {relationships.slice(0, 8).map((edge) => (
                <article className="relationship-item" key={edge.id}>
                  <strong>{edge.relationship.replace(/_/g, ' ')}</strong>
                  <span>{edge.from} → {edge.to}</span>
                  <small>{edge.explanation}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="proposal-preview-card">
            <h3>Open Opportunities & Research</h3>
            <div className="fact-list compact-facts">
              <Fact label="Opportunities" value={String(selectedOrganization.opportunityIds.length)} />
              <Fact label="Reports" value={String(selectedOrganization.reports.length)} />
              <Fact label="Readiness" value={`${selectedOrganization.evaluations.proposalReadiness.score}%`} />
              <Fact label="Duplicate Reviews" value={String(duplicates.length)} />
            </div>
            <p className="subtle-note">{selectedOrganization.evaluations.salesReadiness.recommendations[0]}</p>
          </article>

          <article className="proposal-preview-card">
            <h3>Organization Timeline</h3>
            <TimelineList timeline={selectedOrganization.timeline} />
          </article>

          <article className="proposal-preview-card">
            <h3>Contact Timeline</h3>
            <div className="relationship-list">
              {selectedOrganization.contacts.flatMap((contact) => contact.timeline).map((item, index) => (
                <article className="relationship-item" key={`${item.id}-${index}`}>
                  <strong>{item.title}</strong>
                  <span>{formatDate(item.timestamp)}</span>
                  <small>{item.detail}</small>
                </article>
              ))}
            </div>
          </article>
        </div>
      ) : (
        <p className="empty-note">No organization records available yet.</p>
      )}
    </div>
  );
}

function ScorePill({ evaluation, label }: { evaluation: SalesOrganizationIntelligence['evaluations']['organizationHealth']; label: string }) {
  return (
    <article className="score-factor">
      <div>
        <strong>{label}</strong>
        <span>{evaluation.confidence}% confidence</span>
      </div>
      <b>{evaluation.score}</b>
    </article>
  );
}

function RelationshipList({ graph, relationships }: { graph: SalesIntelligenceGraph; relationships: SalesIntelligenceGraph['edges'] }) {
  return (
    <div className="proposal-preview-card">
      <h3>Relationship Graph</h3>
      {relationships.length ? (
        <div className="relationship-list">
          {relationships.map((edge, index) => {
            const from = graph.nodes.find((node) => node.id === edge.from);
            const to = graph.nodes.find((node) => node.id === edge.to);
            return (
              <article className="relationship-item" key={`${edge.id}-${index}`}>
                <strong>{from?.label ?? edge.from} → {to?.label ?? edge.to}</strong>
                <span>{edge.relationship.replace(/_/g, ' ')}</span>
                <small>{edge.explanation}</small>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-note">No relationships linked yet.</p>
      )}
    </div>
  );
}

function ConnectedNodeList({ nodes }: { nodes: SalesIntelligenceGraph['nodes'] }) {
  return (
    <div className="proposal-preview-card">
      <h3>Connected Records</h3>
      {nodes.length ? (
        <div className="relationship-list">
          {nodes.map((node, index) => (
            <article className="relationship-item" key={`${node.id}-${index}`}>
              <strong>{node.label}</strong>
              <span>{node.type.replace(/_/g, ' ')}</span>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">No connected records yet.</p>
      )}
    </div>
  );
}

function TimelineList({ timeline }: { timeline: SalesOrganizationProfile['timeline'] }) {
  return (
    <div className="proposal-preview-card">
      <h3>Organization Timeline</h3>
      {timeline.length ? (
        <div className="relationship-list">
          {timeline.map((item, index) => (
            <article className="relationship-item" key={`${item.id}-${index}`}>
              <strong>{item.title}</strong>
              <span>{formatDate(item.timestamp)}</span>
              <small>{item.detail}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">No timeline items yet.</p>
      )}
    </div>
  );
}

function DossierBlock({ title, value }: { title: string; value: string }) {
  return (
    <article className="score-factor">
      <div>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
    </article>
  );
}

function Checklist({ empty, items, title }: { empty: string; items: string[]; title: string }) {
  return (
    <div className="proposal-preview-card">
      <h3>{title}</h3>
      {items.length ? (
        <ul className="checklist">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">{empty}</p>
      )}
    </div>
  );
}

function SalesLeadTable({
  leads,
  onSelectScore,
  scores,
  selectedScoreId,
}: {
  leads: SalesLead[];
  onSelectScore(_leadId: string): void;
  scores: LeadScore[];
  selectedScoreId: string | null;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Score</th>
            <th>Lead Priority</th>
            <th>Priority</th>
            <th>Lead</th>
            <th>Type</th>
            <th>Stage</th>
            <th>Source</th>
            <th>Value</th>
            <th>Next Action</th>
            <th>Follow-Up Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const score = scores.find((item) => item.leadId === lead.id);
            return (
              <tr className={selectedScoreId === lead.id ? 'selected-row' : ''} key={lead.id}>
                <td>
                  <button className="score-button" onClick={() => onSelectScore(lead.id)} type="button">
                    {score?.score ?? 0}
                  </button>
                </td>
                <td>{score ? <StatusBadge value={score.priorityLabel} tone={salesPriorityTone(score.priorityLabel)} /> : 'Not scored'}</td>
                <td>
                  <RiskBadge risk={lead.priority} />
                </td>
                <td>
                  <strong>{lead.name}</strong>
                  <span className="table-subtext">{lead.contactName}</span>
                </td>
                <td>{lead.leadType}</td>
                <td>{pipelineStageLabels[lead.pipelineStage]}</td>
                <td>{lead.source}</td>
                <td>{formatCurrency(lead.estimatedValue)}</td>
                <td>{lead.nextAction}</td>
                <td>{lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : 'Not scheduled'}</td>
                <td>
                  <StatusBadge value={lead.status} tone={lead.status === 'active' || lead.status === 'won' ? 'good' : 'neutral'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScoreDetailPanel({ lead, score }: { lead: SalesLead; score: LeadScore }) {
  return (
    <div className="score-detail-grid">
      <div className="fact-list compact-facts">
        <Fact label="Lead" value={lead.name} />
        <Fact label="Segment" value={score.segment.replace(/_/g, ' ')} />
        <Fact label="Score" value={`${score.score}/100`} />
        <Fact label="Weighted Value" value={formatCurrency(score.weightedPipelineValue)} />
        <Fact label="Recommended Action" value={score.recommendedAction} />
      </div>
      <div className="score-factor-list">
        {score.factors.map((factor) => (
          <article className="score-factor" key={factor.key}>
            <div>
              <strong>{factor.label}</strong>
              <span>{factor.detail}</span>
            </div>
            <b>{factor.points > 0 ? `+${factor.points}` : factor.points}</b>
          </article>
        ))}
      </div>
    </div>
  );
}

function FollowUpQueueTable({ items }: { items: FollowUpQueueItem[] }) {
  if (!items.length) {
    return <p className="empty-note">No local follow-up reminders are currently queued.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Queue</th>
            <th>Lead</th>
            <th>Priority</th>
            <th>Score</th>
            <th>Reason</th>
            <th>Next Action</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.leadId}-${item.queue}`}>
              <td>{item.queue.replace(/_/g, ' ')}</td>
              <td>{item.leadName}</td>
              <td>
                <StatusBadge value={item.priorityLabel} tone={salesPriorityTone(item.priorityLabel)} />
              </td>
              <td>{item.score}</td>
              <td>{item.reason}</td>
              <td>{item.nextAction}</td>
              <td>{item.dueDate ? formatDate(item.dueDate) : 'Not scheduled'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProposalBuilderPreview({
  draft,
  isSaved,
  onExport,
  onGenerate,
}: {
  draft: SalesProposalDraft;
  isSaved: boolean;
  onExport(_format: 'json' | 'markdown'): void;
  onGenerate(): void;
}) {
  return (
    <div className="proposal-builder-grid">
      <div className="proposal-preview-card">
        <div className="fact-list compact-facts">
          <Fact label="Prospect" value={draft.prospectName} />
          <Fact label="Template" value={salesProposalTemplateLabels[draft.templateType]} />
          <Fact label="Package" value={draft.recommendedPackage} />
          <Fact label="Estimated Value" value={formatCurrency(draft.estimatedValue)} />
          <Fact label="Setup / Migration Fee" value={draft.setupFee === null ? 'Missing' : formatCurrency(draft.setupFee)} />
          <Fact label="Monthly Price" value={draft.monthlyPrice === null ? 'Missing' : formatCurrency(draft.monthlyPrice)} />
          <Fact label="Follow-Up Date" value={draft.followUpDate ? formatDate(draft.followUpDate) : 'Not scheduled'} />
          <Fact label="Status" value={draft.status.replace(/_/g, ' ')} />
        </div>
        <div className="button-row sales-action-row">
          <button className="report-button small" onClick={onGenerate} type="button">
            Regenerate Locally
          </button>
          <button className="report-button small" disabled={!isSaved} onClick={() => onExport('markdown')} type="button">
            Export Markdown
          </button>
          <button className="report-button small" disabled={!isSaved} onClick={() => onExport('json')} type="button">
            Export JSON
          </button>
        </div>
        {!isSaved ? <p className="subtle-note">Regenerate locally once to save this draft before exporting.</p> : null}
      </div>
      <div className="proposal-markdown-preview">
        <pre>{draft.previewMarkdown}</pre>
      </div>
    </div>
  );
}

function FollowUpColumn({
  action,
  label,
  leads,
  onAction,
}: {
  action: SalesAction;
  label: string;
  leads: SalesLead[];
  onAction(_leadId: string, _action: SalesAction): void;
}) {
  return (
    <article className="follow-up-column">
      <div>
        <strong>{label}</strong>
        <span>{leads.length} lead(s)</span>
      </div>
      {leads.slice(0, 4).map((lead) => (
        <button className="follow-up-item" key={`${label}-${lead.id}`} onClick={() => onAction(lead.id, action)} type="button">
          <span>{lead.name}</span>
          <small>{lead.nextAction}</small>
        </button>
      ))}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataTable({
  columns,
  compact = false,
  emptyMessage = 'No records available.',
  rows,
}: {
  columns: string[];
  compact?: boolean;
  emptyMessage?: string;
  rows: ReactNode[][];
}) {
  if (rows.length === 0) return <p className="empty-table-message">{emptyMessage}</p>;
  return (
    <div className={compact ? 'table-shell compact-table-shell' : 'table-shell'}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${columns.join('-')}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${columns[cellIndex]}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange(_value: string): void;
  value: string;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function TextInput({ label, onChange, value }: { label: string; onChange(_value: string): void; value: string }) {
  return (
    <label className="input-control">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberInput({ label, onChange, value }: { label: string; onChange(_value: number | null): void; value: number | null }) {
  return (
    <label className="input-control">
      <span>{label}</span>
      <input
        min="0"
        type="number"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      />
    </label>
  );
}

function TextareaInput({ label, onChange, value }: { label: string; onChange(_value: string): void; value: string }) {
  return (
    <label className="input-control">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function proposalForLead(proposals: SalesPageProps['proposals'], leadId: string) {
  return proposals.find((proposal) => proposal.leadId === leadId);
}

function draftMissingFields(draft: SalesProspectIntakeDraft): string[] {
  return missingInfoForIntake({
    ...draft,
    createdAt: '',
    id: 'draft',
    localOnly: true,
    updatedAt: '',
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}
