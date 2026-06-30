import { CalendarClock, Download, FileText, Flame, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { RiskBadge } from '../../components/RiskBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { filterSalesLeads, formatCurrency, isFollowUpDue, isFollowUpThisWeek, isOverdue, pipelineStageLabels, summarizeSalesPipeline } from './salesPipeline';
import type { SalesAction, SalesFilters, SalesLead, SalesPageProps } from './salesTypes';

export default function SalesPage({ activities, leads, onAction, onExport, proposals }: SalesPageProps) {
  const [filters, setFilters] = useState<SalesFilters>({ priority: 'all', source: 'all', stage: 'all', type: 'all' });
  const summary = useMemo(() => summarizeSalesPipeline(leads, proposals), [leads, proposals]);
  const filteredLeads = useMemo(() => filterSalesLeads(leads, filters), [filters, leads]);
  const sources = Array.from(new Set(leads.map((lead) => lead.source))).sort();
  const gymLeads = leads.filter((lead) => lead.leadType === 'gym');
  const coachLeads = leads.filter((lead) => lead.leadType === 'coach');
  const proposalRows = proposals
    .map((proposal) => ({ lead: leads.find((item) => item.id === proposal.leadId), proposal }))
    .filter((row) => row.lead);
  const activeLeads = leads.filter((lead) => lead.status === 'active');

  return (
    <>
      <section className="summary-grid sales-summary" aria-label="Sales summary">
        <SalesMetric icon={<Users size={20} />} label="Total Leads" value={String(summary.totalLeads)} />
        <SalesMetric icon={<Users size={20} />} label="Gym Leads" value={String(summary.gymLeads)} />
        <SalesMetric icon={<Users size={20} />} label="Coach Leads" value={String(summary.coachLeads)} />
        <SalesMetric icon={<Flame size={20} />} label="Hot Leads" value={String(summary.hotLeads)} tone={summary.hotLeads ? 'warn' : 'good'} />
        <SalesMetric icon={<CalendarClock size={20} />} label="Follow-Ups Due" value={String(summary.followUpsDue)} tone={summary.followUpsDue ? 'warn' : 'good'} />
        <SalesMetric icon={<FileText size={20} />} label="Proposal Needed" value={String(summary.proposalNeeded)} tone={summary.proposalNeeded ? 'warn' : 'good'} />
        <SalesMetric icon={<FileText size={20} />} label="Estimated Pipeline Value" value={formatCurrency(summary.estimatedPipelineValue)} />
        <SalesMetric icon={<Flame size={20} />} label="Won This Month" value={String(summary.wonThisMonth)} tone="good" />
      </section>

      <section className="dashboard-grid">
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
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
          <SalesLeadTable leads={filteredLeads} />
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

function SalesLeadTable({ leads }: { leads: SalesLead[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
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
          {leads.map((lead) => (
            <tr key={lead.id}>
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
          ))}
        </tbody>
      </table>
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

function proposalForLead(proposals: SalesPageProps['proposals'], leadId: string) {
  return proposals.find((proposal) => proposal.leadId === leadId);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}
