import type { LocalReport } from '../../storage/reportExport';
import { formatCurrency, summarizeSalesPipeline } from './salesPipeline';
import type { FollowUpQueueItem, LeadScore, ProposalPrep, SalesActivity, SalesLead } from './salesTypes';

export function buildSalesPipelineReport(leads: SalesLead[], activities: SalesActivity[], proposals: ProposalPrep[]): LocalReport {
  const summary = summarizeSalesPipeline(leads, proposals);
  return {
    title: 'Sales Pipeline Report',
    slug: 'sales-pipeline-report',
    summary: {
      totalLeads: summary.totalLeads,
      gymLeads: summary.gymLeads,
      coachLeads: summary.coachLeads,
      hotLeads: summary.hotLeads,
      followUpsDue: summary.followUpsDue,
      proposalNeeded: summary.proposalNeeded,
      estimatedPipelineValue: formatCurrency(summary.estimatedPipelineValue),
      noEmailsSent: 'Yes',
      noStripeWrites: 'Yes',
      productionWritesOccurred: 'No',
    },
    rows: leads,
    sections: [
      { title: 'Recent Sales Activity', rows: activities },
      { title: 'Proposal Prep', rows: proposals },
    ],
  };
}

export function buildFollowUpReport(leads: SalesLead[]): LocalReport {
  return {
    title: 'Sales Follow-Up Report',
    slug: 'sales-follow-up-report',
    summary: {
      dueOrUnscheduled: leads.filter((lead) => !lead.nextFollowUpDate || lead.status === 'active').length,
      noEmailsSent: 'Yes',
      productionWritesOccurred: 'No',
    },
    rows: leads
      .filter((lead) => lead.status === 'active')
      .map((lead) => ({
        lead: lead.name,
        priority: lead.priority,
        stage: lead.pipelineStage,
        nextAction: lead.nextAction,
        nextFollowUpDate: lead.nextFollowUpDate ?? 'Not scheduled',
      })),
  };
}

export function buildProposalReport(leads: SalesLead[], proposals: ProposalPrep[]): LocalReport {
  return {
    title: 'Sales Proposal Prep Report',
    slug: 'sales-proposal-prep-report',
    summary: {
      proposalsTracked: proposals.length,
      noStripeWrites: 'Yes',
      noInvoicesCreated: 'Yes',
      productionWritesOccurred: 'No',
    },
    rows: proposals.map((proposal) => {
      const lead = leads.find((item) => item.id === proposal.leadId);
      return {
        lead: lead?.name ?? proposal.leadId,
        recommendedProduct: proposal.recommendedProduct,
        pricingTier: proposal.pricingTier,
        setupFee: proposal.setupFee,
        monthlyFee: proposal.monthlyFee,
        migrationFee: proposal.migrationFee ?? 0,
        migrationNeeded: proposal.migrationNeeded ? 'Yes' : 'No',
        status: proposal.status,
        notes: proposal.notes,
      };
    }),
  };
}

export function buildLeadScoringReport(leads: SalesLead[], scores: LeadScore[]): LocalReport {
  return {
    title: 'Sales Lead Scoring Report',
    slug: 'sales-lead-scoring-report',
    summary: {
      hotLeads: scores.filter((score) => score.priorityLabel === 'Hot').length,
      warmLeads: scores.filter((score) => score.priorityLabel === 'Warm').length,
      nurtureLeads: scores.filter((score) => score.priorityLabel === 'Nurture').length,
      needsInfoLeads: scores.filter((score) => score.priorityLabel === 'Needs Info').length,
      atRiskLeads: scores.filter((score) => score.priorityLabel === 'At Risk').length,
      scoringMode: 'deterministic local rules',
      productionWritesOccurred: 'No',
    },
    rows: scores.map((score) => {
      const lead = leads.find((item) => item.id === score.leadId);
      return {
        lead: lead?.name ?? score.leadId,
        segment: score.segment,
        score: score.score,
        priority: score.priorityLabel,
        weightedPipelineValue: score.weightedPipelineValue,
        recommendedAction: score.recommendedAction,
        rationale: score.factors.map((factor) => `${factor.label}: ${factor.points} (${factor.detail})`).join('; '),
      };
    }),
  };
}

export function buildFollowUpQueueReport(queue: FollowUpQueueItem[]): LocalReport {
  return {
    title: 'Sales Follow-Up Queue',
    slug: 'sales-follow-up-queue',
    summary: {
      queueItems: queue.length,
      overdue: queue.filter((item) => item.queue === 'overdue').length,
      dueToday: queue.filter((item) => item.queue === 'today').length,
      proposalNeeded: queue.filter((item) => item.queue === 'proposal_needed').length,
      stalled: queue.filter((item) => item.queue === 'stalled').length,
      missingInfo: queue.filter((item) => item.queue === 'missing_info').length,
      noEmailsSent: 'Yes',
      productionWritesOccurred: 'No',
    },
    rows: queue.map((item) => ({
      lead: item.leadName,
      queue: item.queue,
      priority: item.priorityLabel,
      score: item.score,
      reason: item.reason,
      nextAction: item.nextAction,
      dueDate: item.dueDate ?? 'Not scheduled',
    })),
  };
}

export function buildWeightedPipelineReport(leads: SalesLead[], scores: LeadScore[]): LocalReport {
  return {
    title: 'Sales Weighted Pipeline',
    slug: 'sales-weighted-pipeline',
    summary: {
      leadCount: scores.length,
      estimatedPipelineValue: leads.reduce((total, lead) => total + lead.estimatedValue, 0),
      estimatedWeightedPipelineValue: scores.reduce((total, score) => total + score.weightedPipelineValue, 0),
      scoringMode: 'deterministic local rules',
      productionWritesOccurred: 'No',
    },
    rows: scores.map((score) => {
      const lead = leads.find((item) => item.id === score.leadId);
      return {
        leadId: score.leadId,
        lead: lead?.name ?? score.leadId,
        stage: lead?.pipelineStage ?? 'unknown',
        estimatedValue: lead?.estimatedValue ?? 0,
        score: score.score,
        priority: score.priorityLabel,
        weightedPipelineValue: score.weightedPipelineValue,
      };
    }),
  };
}

export function downloadSalesPipelineCsv(leads: SalesLead[]): void {
  const headers = ['Priority', 'Lead', 'Type', 'Stage', 'Source', 'Value', 'Next Action', 'Follow-Up Date', 'Status'];
  const rows = leads.map((lead) => [
    lead.priority,
    lead.name,
    lead.leadType,
    lead.pipelineStage,
    lead.source,
    String(lead.estimatedValue),
    lead.nextAction,
    lead.nextFollowUpDate ?? '',
    lead.status,
  ]);
  const content = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([`${content}\n`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sales-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}
