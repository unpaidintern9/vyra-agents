import type { LocalReport } from '../../storage/reportExport';
import { formatCurrency, summarizeSalesPipeline } from './salesPipeline';
import type { ProposalPrep, SalesActivity, SalesLead } from './salesTypes';

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
