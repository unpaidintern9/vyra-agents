import type {
  LeadScore,
  LeadScoreFactor,
  ProposalPrep,
  SalesActivity,
  SalesLead,
  SalesPriorityLabel,
  SalesProspectSegment,
  SalesScoringSummary,
} from './salesTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

export function scoreSalesLeads(leads: SalesLead[], proposals: ProposalPrep[], activities: SalesActivity[], now = new Date()): LeadScore[] {
  return leads.map((lead) => scoreSalesLead(lead, proposals.find((proposal) => proposal.leadId === lead.id), activities, now));
}

export function summarizeSalesScoring(scores: LeadScore[]): SalesScoringSummary {
  return {
    atRiskLeadCount: scores.filter((score) => score.priorityLabel === 'At Risk').length,
    estimatedWeightedPipelineValue: scores.reduce((total, score) => total + score.weightedPipelineValue, 0),
    followUpQueueCount: 0,
    hotLeadCount: scores.filter((score) => score.priorityLabel === 'Hot').length,
    needsInfoCount: scores.filter((score) => score.priorityLabel === 'Needs Info').length,
    nurtureLeadCount: scores.filter((score) => score.priorityLabel === 'Nurture').length,
    overdueFollowUpCount: 0,
    proposalNeededCount: scores.filter((score) => score.factors.some((factor) => factor.key === 'proposal_needed' && factor.points > 0)).length,
    warmLeadCount: scores.filter((score) => score.priorityLabel === 'Warm').length,
  };
}

export function mergeSalesScoringSummary(
  summary: SalesScoringSummary,
  followUpQueueCount: number,
  overdueFollowUpCount: number,
  proposalNeededCount: number,
): SalesScoringSummary {
  return {
    ...summary,
    followUpQueueCount,
    overdueFollowUpCount,
    proposalNeededCount,
  };
}

export function salesPriorityTone(priority: SalesPriorityLabel): 'good' | 'neutral' | 'warn' {
  if (priority === 'Hot' || priority === 'Warm') return 'good';
  if (priority === 'Nurture') return 'neutral';
  return 'warn';
}

function scoreSalesLead(lead: SalesLead, proposal: ProposalPrep | undefined, activities: SalesActivity[], now: Date): LeadScore {
  const factors: LeadScoreFactor[] = [];
  const segment = detectProspectSegment(lead, proposal);
  const monthlyValue = Math.round(lead.estimatedValue / 12);
  const missingInfo = missingContactInfo(lead);
  const lastActivityAge = daysSince(latestActivityAt(lead, activities), now);
  const followUpAge = lead.nextFollowUpDate ? daysBetween(new Date(lead.nextFollowUpDate), now) : null;
  const proposalNeeded = lead.pipelineStage === 'proposal_needed' || proposal?.status === 'needed';
  const stalled = isStalledLead(lead, lastActivityAge);

  factors.push(segmentFactor(segment));
  factors.push(monthlyValueFactor(monthlyValue));
  factors.push(urgencyFactor(lead, followUpAge));
  factors.push(followUpDueFactor(followUpAge, lead));
  factors.push(proposalFactor(proposalNeeded));
  factors.push(stalledFactor(stalled, lastActivityAge));
  factors.push(missingInfoFactor(missingInfo));
  factors.push(lastActivityFactor(lastActivityAge));
  factors.push(productFitFactor(lead, proposal, segment));

  const rawScore = factors.reduce((total, factor) => total + factor.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const priorityLabel = priorityForScore(score, missingInfo, stalled, lead);

  return {
    factors,
    leadId: lead.id,
    missingInfo,
    priorityLabel,
    recommendedAction: recommendedActionForLead(lead, priorityLabel, proposalNeeded, stalled, missingInfo),
    score,
    segment,
    stalled,
    weightedPipelineValue: Math.round(lead.estimatedValue * (score / 100)),
  };
}

function detectProspectSegment(lead: SalesLead, proposal?: ProposalPrep): SalesProspectSegment {
  const haystack = `${lead.leadType} ${lead.name} ${lead.businessName} ${lead.likelyProductFit ?? ''} ${lead.notes}`.toLowerCase();
  if (proposal?.migrationNeeded || haystack.includes('migration') || haystack.includes('member import')) return 'migration_prospect';
  if (haystack.includes('white label') || haystack.includes('organization platform') || lead.leadType === 'organization') return 'white_label_prospect';
  if (lead.leadType === 'coach' && /(gym|affiliate|studio|collective|performance)/.test(haystack)) return 'gym_affiliated_coach';
  if (lead.leadType === 'coach') return 'independent_coach';
  return 'gym_prospect';
}

function segmentFactor(segment: SalesProspectSegment): LeadScoreFactor {
  const points: Record<SalesProspectSegment, number> = {
    gym_prospect: 13,
    gym_affiliated_coach: 11,
    independent_coach: 9,
    migration_prospect: 16,
    white_label_prospect: 14,
  };
  return {
    detail: segment.replace(/_/g, ' '),
    key: 'prospect_type',
    label: 'Prospect type',
    points: points[segment],
  };
}

function monthlyValueFactor(monthlyValue: number): LeadScoreFactor {
  const points = monthlyValue >= 1200 ? 16 : monthlyValue >= 800 ? 12 : monthlyValue >= 300 ? 8 : 4;
  return {
    detail: `$${monthlyValue.toLocaleString()} estimated monthly value`,
    key: 'estimated_monthly_value',
    label: 'Estimated monthly value',
    points,
  };
}

function urgencyFactor(lead: SalesLead, followUpAge: number | null): LeadScoreFactor {
  const urgentStage = lead.pipelineStage === 'proposal_needed' || lead.pipelineStage === 'demo_scheduled' || lead.pipelineStage === 'negotiating';
  const dueSoon = followUpAge !== null && followUpAge <= 1;
  return {
    detail: urgentStage || dueSoon ? 'Near-term action is visible' : 'No urgent sales moment detected',
    key: 'urgency',
    label: 'Urgency',
    points: urgentStage || dueSoon ? 10 : 3,
  };
}

function followUpDueFactor(followUpAge: number | null, lead: SalesLead): LeadScoreFactor {
  if (lead.status === 'lost') {
    return { detail: 'Closed lost lead', key: 'follow_up_due_date', label: 'Follow-up due date', points: -8 };
  }
  if (followUpAge === null) {
    return { detail: 'No follow-up date scheduled', key: 'follow_up_due_date', label: 'Follow-up due date', points: -4 };
  }
  if (followUpAge > 0) {
    return { detail: `${followUpAge} day(s) overdue`, key: 'follow_up_due_date', label: 'Follow-up due date', points: 12 };
  }
  if (followUpAge === 0) {
    return { detail: 'Due today', key: 'follow_up_due_date', label: 'Follow-up due date', points: 10 };
  }
  if (followUpAge >= -7) {
    return { detail: 'Due this week', key: 'follow_up_due_date', label: 'Follow-up due date', points: 5 };
  }
  return { detail: 'Follow-up is scheduled later', key: 'follow_up_due_date', label: 'Follow-up due date', points: 1 };
}

function proposalFactor(proposalNeeded: boolean): LeadScoreFactor {
  return {
    detail: proposalNeeded ? 'Proposal or quote prep is needed' : 'No proposal required yet',
    key: 'proposal_needed',
    label: 'Proposal needed',
    points: proposalNeeded ? 12 : 0,
  };
}

function stalledFactor(stalled: boolean, lastActivityAge: number): LeadScoreFactor {
  return {
    detail: stalled ? `No material activity for ${lastActivityAge} day(s)` : 'Stage is not stale',
    key: 'stalled_stage',
    label: 'Stalled stage',
    points: stalled ? -10 : 4,
  };
}

function missingInfoFactor(missingInfo: string[]): LeadScoreFactor {
  return {
    detail: missingInfo.length ? `Missing ${missingInfo.join(', ')}` : 'Required contact information is present',
    key: 'missing_contact_info',
    label: 'Missing contact info',
    points: missingInfo.length ? -16 : 8,
  };
}

function lastActivityFactor(lastActivityAge: number): LeadScoreFactor {
  const points = lastActivityAge <= 2 ? 8 : lastActivityAge <= 7 ? 5 : lastActivityAge <= 14 ? 1 : -6;
  return {
    detail: `Last activity ${lastActivityAge} day(s) ago`,
    key: 'last_activity_age',
    label: 'Last activity age',
    points,
  };
}

function productFitFactor(lead: SalesLead, proposal: ProposalPrep | undefined, segment: SalesProspectSegment): LeadScoreFactor {
  const fitText = `${lead.likelyProductFit ?? ''} ${proposal?.recommendedProduct ?? ''}`.toLowerCase();
  const strongFit =
    fitText.includes('gym dashboard') ||
    fitText.includes('member app') ||
    fitText.includes('coach') ||
    fitText.includes('organization') ||
    segment === 'migration_prospect';
  return {
    detail: strongFit ? lead.likelyProductFit ?? proposal?.recommendedProduct ?? 'Strong product fit' : 'Product fit still needs discovery',
    key: 'vyra_product_fit',
    label: 'Vyra product fit',
    points: strongFit ? 10 : 3,
  };
}

function priorityForScore(score: number, missingInfo: string[], stalled: boolean, lead: SalesLead): SalesPriorityLabel {
  if (missingInfo.length > 0) return 'Needs Info';
  if (lead.status === 'paused' || lead.status === 'lost' || stalled || score < 35) return 'At Risk';
  if (score >= 75) return 'Hot';
  if (score >= 55) return 'Warm';
  return 'Nurture';
}

function recommendedActionForLead(
  lead: SalesLead,
  priorityLabel: SalesPriorityLabel,
  proposalNeeded: boolean,
  stalled: boolean,
  missingInfo: string[],
): string {
  if (missingInfo.length) return `Collect ${missingInfo.join(', ')} before advancing.`;
  if (proposalNeeded) return 'Prepare local proposal notes; do not create invoices or send emails.';
  if (stalled) return 'Review locally and decide whether to revive, pause, or nurture.';
  if (priorityLabel === 'Hot') return lead.nextAction || 'Prioritize next local follow-up.';
  if (priorityLabel === 'Warm') return 'Keep next follow-up on schedule.';
  return 'Nurture with local planning only.';
}

function missingContactInfo(lead: SalesLead): string[] {
  return [
    !lead.contactName ? 'contact name' : '',
    !lead.email ? 'email' : '',
    !lead.phone ? 'phone' : '',
    !lead.businessName ? 'business name' : '',
  ].filter(Boolean);
}

function latestActivityAt(lead: SalesLead, activities: SalesActivity[]): Date {
  const timestamps = activities.filter((activity) => activity.leadId === lead.id).map((activity) => new Date(activity.timestamp).getTime());
  timestamps.push(new Date(lead.updatedAt).getTime());
  return new Date(Math.max(...timestamps.filter((timestamp) => !Number.isNaN(timestamp))));
}

function isStalledLead(lead: SalesLead, lastActivityAge: number): boolean {
  const stalledStages = ['contacted', 'qualified', 'demo_scheduled', 'proposal_needed', 'proposal_sent', 'negotiating'];
  return lead.status === 'active' && stalledStages.includes(lead.pipelineStage) && lastActivityAge > 14;
}

function daysSince(date: Date, now: Date): number {
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS));
}

function daysBetween(date: Date, now: Date): number {
  return Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
