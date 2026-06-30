import type { ProposalPrep, SalesFilters, SalesLead, SalesSummary } from './salesTypes';

export const pipelineStageLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  demo_scheduled: 'Demo Scheduled',
  proposal_needed: 'Proposal Needed',
  proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
  paused: 'Paused',
};

export function summarizeSalesPipeline(leads: SalesLead[], proposals: ProposalPrep[]): SalesSummary {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const activeLeads = leads.filter((lead) => lead.status !== 'lost');
  return {
    totalLeads: leads.length,
    gymLeads: leads.filter((lead) => lead.leadType === 'gym').length,
    coachLeads: leads.filter((lead) => lead.leadType === 'coach').length,
    hotLeads: activeLeads.filter((lead) => lead.priority === 'high').length,
    followUpsDue: leads.filter((lead) => isFollowUpDue(lead)).length,
    proposalNeeded: proposals.filter((proposal) => proposal.status === 'needed').length,
    estimatedPipelineValue: activeLeads.reduce((total, lead) => total + lead.estimatedValue, 0),
    wonThisMonth: leads.filter((lead) => {
      const updatedAt = new Date(lead.updatedAt);
      return lead.pipelineStage === 'won' && updatedAt.getMonth() === month && updatedAt.getFullYear() === year;
    }).length,
  };
}

export function filterSalesLeads(leads: SalesLead[], filters: SalesFilters): SalesLead[] {
  return leads.filter((lead) => {
    const typeMatch = filters.type === 'all' || lead.leadType === filters.type;
    const stageMatch = filters.stage === 'all' || lead.pipelineStage === filters.stage;
    const priorityMatch = filters.priority === 'all' || lead.priority === filters.priority;
    const sourceMatch = filters.source === 'all' || lead.source === filters.source;
    return typeMatch && stageMatch && priorityMatch && sourceMatch;
  });
}

export function isFollowUpDue(lead: SalesLead): boolean {
  if (!lead.nextFollowUpDate || lead.status === 'lost') return false;
  return startOfDay(new Date(lead.nextFollowUpDate)).getTime() <= startOfDay(new Date()).getTime();
}

export function isFollowUpThisWeek(lead: SalesLead): boolean {
  if (!lead.nextFollowUpDate || lead.status === 'lost') return false;
  const followUp = startOfDay(new Date(lead.nextFollowUpDate)).getTime();
  const now = startOfDay(new Date()).getTime();
  const weekOut = now + 7 * 24 * 60 * 60 * 1000;
  return followUp > now && followUp <= weekOut;
}

export function isOverdue(lead: SalesLead): boolean {
  if (!lead.nextFollowUpDate || lead.status === 'lost') return false;
  return startOfDay(new Date(lead.nextFollowUpDate)).getTime() < startOfDay(new Date()).getTime();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { currency: 'USD', maximumFractionDigits: 0, style: 'currency' }).format(value);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
