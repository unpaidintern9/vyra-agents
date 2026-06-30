import { salesMockActivities, salesMockLeads, salesMockProposals } from './salesMockData';
import { createInitialSalesProspectResearch } from './salesAgentTeam';
import type { ProposalPrep, SalesActivity, SalesLead, SalesProspectResearchRecord } from './salesTypes';

export const salesStorageKeys = {
  activities: 'vyra-agents:sales-activities',
  leads: 'vyra-agents:sales-leads',
  prospectResearch: 'vyra-agents:sales-prospect-research',
  proposals: 'vyra-agents:sales-proposals',
} as const;

export function createInitialSalesLeads(): SalesLead[] {
  return salesMockLeads;
}

export function createInitialSalesActivities(): SalesActivity[] {
  return salesMockActivities;
}

export function createInitialSalesProposals(): ProposalPrep[] {
  return salesMockProposals;
}

export function createInitialSalesProspects(): SalesProspectResearchRecord[] {
  return createInitialSalesProspectResearch();
}
