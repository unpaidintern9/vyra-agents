import { salesMockActivities, salesMockLeads, salesMockProposals } from './salesMockData';
import type { ProposalPrep, SalesActivity, SalesLead } from './salesTypes';

export const salesStorageKeys = {
  activities: 'vyra-agents:sales-activities',
  leads: 'vyra-agents:sales-leads',
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
