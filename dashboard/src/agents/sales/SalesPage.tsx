import { Brain, CalendarClock, Download, FileText, Flame, Search, ShieldCheck, Target, Upload, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { RiskBadge } from '../../components/RiskBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { filterSalesLeads, formatCurrency, isFollowUpDue, isFollowUpThisWeek, isOverdue, pipelineStageLabels, summarizeSalesPipeline } from './salesPipeline';
import { generateSalesProposalDraft, inferProposalTemplate, salesProposalTemplateLabels } from './salesProposalBuilder';
import { emptyProspectIntakeDraft, labelBusinessType, missingInfoForIntake } from './salesProspectDossiers';
import { salesPriorityTone } from './salesScoring';
import type {
  FollowUpQueueItem,
  LeadScore,
  SalesAction,
  SalesFilters,
  SalesLead,
  SalesPageProps,
  SalesProspectBusinessType,
  SalesProspectCategory,
  SalesProspectIntake,
  SalesProspectIntakeDraft,
  SalesProspectResearchRecord,
  SalesProposalDraft,
  SalesProposalTemplateType,
  SalesResearchDossier,
  SalesTeamAgentDefinition,
} from './salesTypes';

export default function SalesPage({
  activities,
  followUpQueue,
  importResult,
  integration,
  leads,
  onAction,
  onExport,
  onExportResearchDossier,
  onExportProposalDraft,
  onGenerateProposalDraft,
  onImportJson,
  onSaveProspectIntake,
  proposalDrafts,
  proposalSummary,
  proposals,
  prospectDossierSummary,
  prospectDossiers,
  prospectIntakes,
  prospectResearch,
  scores,
  teamAgents,
  teamSummary,
  scoringSummary,
}: SalesPageProps) {
  const [filters, setFilters] = useState<SalesFilters>({ priority: 'all', scorePriority: 'all', source: 'all', stage: 'all', type: 'all' });
  const [prospectMarketFilter, setProspectMarketFilter] = useState('all');
  const [prospectCategoryFilter, setProspectCategoryFilter] = useState('all');
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(scores[0]?.leadId ?? null);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(prospectDossiers[0]?.dossierId ?? null);
  const [intakeDraft, setIntakeDraft] = useState<SalesProspectIntakeDraft>(emptyProspectIntakeDraft);
  const [selectedProposalLeadId, setSelectedProposalLeadId] = useState<string>(leads[0]?.id ?? '');
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
  const filteredProspects = prospectResearch.filter((prospect) => {
    const market = `${prospect.city}, ${prospect.state}`;
    return (
      (prospectMarketFilter === 'all' || market === prospectMarketFilter) &&
      (prospectCategoryFilter === 'all' || prospect.category === prospectCategoryFilter)
    );
  });
  const selectedProposalLead = leads.find((lead) => lead.id === selectedProposalLeadId) ?? leads[0] ?? null;
  const selectedDossier = prospectDossiers.find((dossier) => dossier.dossierId === selectedDossierId) ?? prospectDossiers[0] ?? null;
  const selectedDossierIntake = selectedDossier ? prospectIntakes.find((intake) => intake.id === selectedDossier.intakeId) ?? null : null;
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
      </section>

      <section className="dashboard-grid">
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
            Local prospect slots for MMA gyms, CrossFit boxes, and small gyms in Louisville, Cincinnati, Los Angeles, and New York. Public research is planned, not automated.
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
            <button className="report-button" onClick={() => onExport('markdown', 'follow_up')} type="button">
              <Download size={16} />
              <span>Follow-Up Report Markdown</span>
              <small>Due and unscheduled follow-ups.</small>
            </button>
            <button className="report-button" onClick={() => onExport('markdown', 'proposal')} type="button">
              <Download size={16} />
              <span>Proposal Prep Report Markdown</span>
              <small>Quote prep without Stripe writes.</small>
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

function SalesMetric({ icon, label, tone, value }: { icon: ReactNode; label: string; tone?: 'good' | 'warn'; value: string }) {
  return (
    <article className={`metric-card ${tone ?? ''}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
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
