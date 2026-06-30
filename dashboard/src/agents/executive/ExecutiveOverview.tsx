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
          { label: 'Sales Hot Leads', value: String(summary.salesSummary.hotLeads), tone: summary.salesSummary.hotLeads ? 'warn' : 'good' },
          { label: 'Sales Follow-Ups Due', value: String(summary.salesSummary.followUpsDue), tone: summary.salesSummary.followUpsDue ? 'warn' : 'good' },
          { label: 'Sales Proposal Needed', value: String(summary.salesSummary.proposalNeeded), tone: summary.salesSummary.proposalNeeded ? 'warn' : 'good' },
          { label: 'Sales Pipeline Value', value: formatCurrency(summary.salesSummary.estimatedPipelineValue) },
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
