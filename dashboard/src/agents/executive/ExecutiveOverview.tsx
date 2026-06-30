import { Activity, Clock, GitBranch, ListChecks, ShieldCheck, Workflow } from 'lucide-react';
import { formatCurrency } from '../sales/salesPipeline';
import type { ExecutiveSummary } from './executiveTypes';

const metricIcons = [Activity, ListChecks, ShieldCheck, Workflow, GitBranch, Clock];

export function ExecutiveOverview({ summary }: { summary: ExecutiveSummary }) {
  const metrics = [
    { label: 'Overall Platform Health', value: summary.overallHealth, tone: summary.overallHealth === 'Healthy' ? 'good' : 'warn' },
    { label: 'Registered Agents', value: String(summary.registeredAgents) },
    { label: 'Healthy Agents', value: String(summary.healthyAgents), tone: 'good' },
    { label: 'Warning Agents', value: String(summary.warningAgents), tone: summary.warningAgents ? 'warn' : 'good' },
    { label: 'Critical Agents', value: String(summary.criticalAgents), tone: summary.criticalAgents ? 'warn' : 'good' },
    { label: 'Pending Approvals', value: String(summary.pendingApprovals), tone: summary.pendingApprovals ? 'warn' : 'good' },
    { label: 'Workflows Today', value: String(summary.workflowsToday) },
    { label: 'Sync Queue', value: String(summary.syncQueue), tone: summary.syncQueue ? 'warn' : 'good' },
    { label: 'Runtime Version', value: summary.runtimeVersion },
    { label: 'Engineering Backlog', value: String(summary.engineeringBacklog) },
    { label: 'Migration Batches', value: String(summary.migrationBatches) },
    { label: 'GitHub Drafts', value: String(summary.githubDrafts) },
    { label: 'Recent Runtime Events', value: String(summary.recentRuntimeEvents) },
    ...(summary.salesSummary
      ? [
          { label: 'Sales Follow-Ups Due', value: String(summary.salesSummary.followUpsDue), tone: summary.salesSummary.followUpsDue ? 'warn' : 'good' },
          { label: 'Sales Pipeline Value', value: formatCurrency(summary.salesSummary.estimatedPipelineValue) },
        ]
      : []),
    ...(summary.salesScoringSummary
      ? [
          { label: 'Sales Hot Leads', value: String(summary.salesScoringSummary.hotLeadCount), tone: summary.salesScoringSummary.hotLeadCount ? 'warn' : 'good' },
          {
            label: 'Overdue Sales Follow-Ups',
            value: String(summary.salesScoringSummary.overdueFollowUpCount),
            tone: summary.salesScoringSummary.overdueFollowUpCount ? 'warn' : 'good',
          },
          {
            label: 'Sales Proposal Needed',
            value: String(summary.salesScoringSummary.proposalNeededCount),
            tone: summary.salesScoringSummary.proposalNeededCount ? 'warn' : 'good',
          },
          {
            label: 'At-Risk Sales Leads',
            value: String(summary.salesScoringSummary.atRiskLeadCount),
            tone: summary.salesScoringSummary.atRiskLeadCount ? 'warn' : 'good',
          },
          { label: 'Weighted Sales Pipeline', value: formatCurrency(summary.salesScoringSummary.estimatedWeightedPipelineValue) },
        ]
      : []),
    ...(summary.salesProposalSummary
      ? [
          { label: 'Proposal Drafts Created', value: String(summary.salesProposalSummary.draftsCreated) },
          {
            label: 'Proposals Missing Pricing',
            value: String(summary.salesProposalSummary.missingPricing),
            tone: summary.salesProposalSummary.missingPricing ? 'warn' : 'good',
          },
          {
            label: 'Proposals Ready For Review',
            value: String(summary.salesProposalSummary.readyForReview),
            tone: summary.salesProposalSummary.readyForReview ? 'good' : 'neutral',
          },
          {
            label: 'Proposal Risk Count',
            value: String(summary.salesProposalSummary.riskCount),
            tone: summary.salesProposalSummary.riskCount ? 'warn' : 'good',
          },
        ]
      : []),
    ...(summary.salesIntegration
      ? [
          { label: 'Sales Integration Mode', value: summary.salesIntegration.modeLabel, tone: summary.salesIntegration.mode === 'live_read_only' ? 'warn' : 'good' },
          { label: 'CRM Readiness', value: summary.salesIntegration.crmReadinessStatus.replace(/_/g, ' ') },
          { label: 'Sales Read-Only', value: summary.salesIntegration.readOnly ? 'Yes' : 'No', tone: summary.salesIntegration.readOnly ? 'good' : 'warn' },
          { label: 'Blocked Sales Actions', value: String(summary.salesIntegration.blockedExternalActionCount), tone: 'warn' },
        ]
      : []),
    ...(summary.salesAgentTeamSummary
      ? [
          {
            label: 'Sales Agent Team',
            value: `${summary.salesAgentTeamSummary.activeAgents}/${summary.salesAgentTeamSummary.totalAgents}`,
            tone: 'good',
          },
          { label: 'Prospect Research Slots', value: String(summary.salesAgentTeamSummary.totalProspects) },
          {
            label: 'High-Fit Prospects',
            value: String(summary.salesAgentTeamSummary.highFitProspects),
            tone: summary.salesAgentTeamSummary.highFitProspects ? 'good' : 'neutral',
          },
          {
            label: 'Prospects Need Research',
            value: String(summary.salesAgentTeamSummary.needsResearch),
            tone: summary.salesAgentTeamSummary.needsResearch ? 'warn' : 'good',
          },
          { label: 'Average Prospect Fit', value: `${summary.salesAgentTeamSummary.averageFitScore}/100` },
        ]
      : []),
  ];

  return (
    <section className="summary-grid executive-summary-grid" aria-label="Executive summary">
      {metrics.map((metric, index) => {
        const Icon = metricIcons[index % metricIcons.length];
        return (
          <article className={`metric-card ${metric.tone ?? ''}`} key={metric.label}>
            <Icon size={20} />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        );
      })}
    </section>
  );
}
