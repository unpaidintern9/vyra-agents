import type { LocalReport } from '../../storage/reportExport';
import type {
  SalesOpportunity,
  SalesOpportunityFollowUpPlan,
  SalesOpportunityPipelineSummary,
  SalesOpportunityPriority,
  SalesOpportunityProposalStatus,
  SalesOpportunityScore,
  SalesOpportunityStage,
  SalesOpportunityTimelineEvent,
} from './salesTypes';

export const salesOpportunityStages: SalesOpportunityStage[] = [
  'prospect',
  'researching',
  'qualified',
  'contact_ready',
  'outreach_sent',
  'waiting',
  'follow_up',
  'discovery_scheduled',
  'proposal_preparation',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
  'archived',
];

export const salesOpportunityKanbanGroups = [
  { label: 'Prospect', stages: ['prospect'] as SalesOpportunityStage[] },
  { label: 'Research', stages: ['researching'] as SalesOpportunityStage[] },
  { label: 'Qualified', stages: ['qualified', 'contact_ready'] as SalesOpportunityStage[] },
  { label: 'Outreach', stages: ['outreach_sent', 'waiting', 'follow_up', 'discovery_scheduled'] as SalesOpportunityStage[] },
  { label: 'Proposal', stages: ['proposal_preparation', 'proposal_sent'] as SalesOpportunityStage[] },
  { label: 'Negotiation', stages: ['negotiation'] as SalesOpportunityStage[] },
  { label: 'Won', stages: ['won'] as SalesOpportunityStage[] },
  { label: 'Lost', stages: ['lost', 'archived'] as SalesOpportunityStage[] },
];

const createdAt = '2026-07-01T12:00:00.000Z';

export function createInitialSalesOpportunities(): SalesOpportunity[] {
  return [
    opportunity('opp-area-502-mma', 'Area 502 MMA', 'MMA / BJJ', 'Louisville', 'KY', 'https://area502mma.com/', 91, 'researching', ['mma-bjj', 'louisville', 'prime-target'], true),
    opportunity('opp-louisville-combat-academy', 'Louisville Combat Academy', 'MMA / BJJ', 'Louisville', 'KY', 'https://louisvillecombatacademy.com/', 90, 'qualified', ['mma-bjj', 'louisville', 'prime-target'], true),
    opportunity('opp-core-combat-sports', 'Core Combat Sports', 'MMA / BJJ', 'Louisville', 'KY', 'https://corelouisville.com/', 88, 'contact_ready', ['mma-bjj', 'louisville'], true),
    opportunity('opp-apex-martial-arts', 'Apex Martial Arts Academy', 'MMA / BJJ', 'Louisville / Mount Washington', 'KY', 'https://theapexmaa.com/', 86, 'proposal_preparation', ['mma-bjj', 'proposal'], true),
    opportunity('opp-butchertown-crossfit', 'Butchertown CrossFit', 'CrossFit', 'Louisville', 'KY', 'https://www.butchertowncrossfit.com/', 85, 'follow_up', ['crossfit', 'louisville'], true),
    opportunity('opp-full-moon-martial-arts', 'Full Moon Martial Arts', 'MMA / BJJ', 'Clarksville / Jeffersonville / New Albany', 'IN', 'https://www.fullmoonmartialarts.com/', 83, 'waiting', ['mma-bjj', 'southern-indiana'], false),
    opportunity('opp-crossfit-covalence', 'CrossFit Covalence', 'CrossFit', 'Louisville', 'KY', 'https://crossfitcovalence.com/', 81, 'outreach_sent', ['crossfit', 'louisville'], false),
    opportunity('opp-derby-city-mma', 'Derby City Mixed Martial Arts', 'MMA / BJJ', 'Louisville', 'KY', 'https://derbycitymartialarts.com/', 80, 'prospect', ['mma-bjj', 'needs-research'], false),
  ];
}

export function summarizeSalesOpportunities(opportunities: SalesOpportunity[]): SalesOpportunityPipelineSummary {
  const active = opportunities.filter((item) => item.status === 'active' && !item.archived);
  return {
    activeOpportunities: active.length,
    averageIcp: average(opportunities.map((item) => item.icpScore)),
    averageLeadScore: average(opportunities.map((item) => item.leadScore)),
    awaitingFollowUp: opportunities.filter((item) => ['waiting', 'follow_up'].includes(item.stage)).length,
    highPriority: opportunities.filter((item) => item.priority === 'Critical' || item.priority === 'High').length,
    lost: opportunities.filter((item) => item.status === 'lost' || item.stage === 'lost').length,
    proposalReady: opportunities.filter((item) => item.proposalPreparationStatus.readinessPercent >= 80 && item.stage !== 'proposal_sent').length,
    proposalSent: opportunities.filter((item) => item.stage === 'proposal_sent').length,
    totalOpportunities: opportunities.length,
    won: opportunities.filter((item) => item.status === 'won' || item.stage === 'won').length,
  };
}

export function moveSalesOpportunityStage(
  opportunity: SalesOpportunity,
  newStage: SalesOpportunityStage,
  reason: string,
  operator = 'Robert',
): SalesOpportunity {
  const timestamp = new Date().toISOString();
  const event = timelineEvent('stage_changed', 'Stage changed', reason, operator, timestamp, opportunity.stage, newStage);
  const nextStatus = newStage === 'won' ? 'won' : newStage === 'lost' ? 'lost' : newStage === 'archived' ? 'archived' : 'active';
  return {
    ...opportunity,
    archived: newStage === 'archived',
    activityTimeline: [event, ...opportunity.activityTimeline],
    stage: newStage,
    status: nextStatus,
    updatedAt: timestamp,
  };
}

export function buildSalesOpportunityReports(opportunities: SalesOpportunity[]): Record<string, LocalReport> {
  return {
    dashboard: report('Local CRM Dashboard', opportunities),
    forecast: report('Forecast Report', opportunities.filter((item) => item.status === 'active').map((item) => ({ ...row(item), closeProbability: item.followUpPlan.estimatedCloseProbability }))),
    followup: report('Follow-up Report', opportunities.filter((item) => item.stage === 'follow_up' || item.stage === 'waiting')),
    health: report('Opportunity Health Report', opportunities.map((item) => ({ ...row(item), confidence: item.score.confidence, missing: item.proposalPreparationStatus.missing.join('; ') }))),
    lost: report('Lost Opportunity Analysis', opportunities.filter((item) => item.status === 'lost')),
    pipeline: report('Pipeline Report', opportunities),
    proposal: report('Proposal Queue', opportunities.filter((item) => item.stage === 'proposal_preparation' || item.proposalPreparationStatus.readinessPercent >= 70)),
    stageAging: report('Stage Aging Report', opportunities.map((item) => ({ ...row(item), updatedAt: item.updatedAt }))),
    summary: report('Executive Sales Summary', opportunities.filter((item) => item.executiveVisibility)),
    wins: report('Win Summary', opportunities.filter((item) => item.status === 'won')),
  };
}

export function scoreSalesOpportunity(baseScore: number, industry: string, location: string): SalesOpportunityScore {
  const fitness = /MMA|BJJ|CrossFit|Gym/i.test(industry) ? 12 : 4;
  const locationFit = /Louisville|Jeffersonville|New Albany|Clarksville/i.test(location) ? 10 : 5;
  const technologyFit = baseScore >= 84 ? 12 : 8;
  const decisionMaker = baseScore >= 86 ? 10 : 5;
  const budget = baseScore >= 85 ? 10 : 7;
  const government = 1;
  const historical = baseScore >= 85 ? 8 : 4;
  const companySize = baseScore >= 80 ? 8 : 5;
  const overallScore = clamp(Math.round((baseScore + fitness + locationFit + technologyFit + decisionMaker + budget + government + historical + companySize) / 1.75));
  const priority: SalesOpportunityPriority = overallScore >= 88 ? 'High' : overallScore >= 78 ? 'Medium' : 'Low';
  return {
    confidence: clamp(baseScore - 5),
    leadScore: clamp(overallScore - 3),
    opportunityRating: overallScore >= 88 ? 'A' : overallScore >= 78 ? 'B' : overallScore >= 65 ? 'C' : 'D',
    overallScore,
    priority,
    reasoning: [
      `${industry} matches Vyra's first target segments.`,
      `${location} is inside the Louisville-area first-motion territory.`,
      'Budget, software need, and decision-maker availability are estimated until manually verified.',
    ],
  };
}

export function buildFollowUpPlan(opportunity: Pick<SalesOpportunity, 'company' | 'industry' | 'proposalPreparationStatus' | 'stage'>): SalesOpportunityFollowUpPlan {
  return {
    estimatedCloseProbability: opportunity.stage === 'proposal_preparation' ? 48 : opportunity.stage === 'contact_ready' ? 34 : 22,
    missingInformation: opportunity.proposalPreparationStatus.missing,
    proposalReadiness: opportunity.proposalPreparationStatus.readinessPercent,
    recommendedNextAction: `Verify owner/contact path and current software for ${opportunity.company}.`,
    recommendedTimeframe: opportunity.stage === 'follow_up' ? 'Today' : 'Within 2 business days',
    talkingPoints: ['member onboarding', 'class communication', 'retention workflow', 'trial-to-member conversion'],
    unansweredQuestions: ['Who owns software decisions?', 'What system do they use now?', 'How many active members do they serve?'],
  };
}

export function buildProposalStatus(score: number, stage: SalesOpportunityStage): SalesOpportunityProposalStatus {
  const missing = [
    score < 90 ? 'pricing' : null,
    'contacts',
    'requirements',
    'discovery notes',
    score < 84 ? 'company profile' : null,
    'executive approval',
    stage === 'prospect' ? 'research' : null,
  ].filter(Boolean) as string[];
  const readinessPercent = clamp(100 - missing.length * 14);
  return {
    missing,
    readinessPercent,
    status: stage === 'proposal_sent' ? 'sent' : readinessPercent >= 80 ? 'ready' : readinessPercent >= 55 ? 'needs_review' : 'not_ready',
  };
}

function opportunity(
  id: string,
  company: string,
  industry: string,
  city: string,
  state: string,
  website: string,
  icpScore: number,
  stage: SalesOpportunityStage,
  tags: string[],
  executiveVisibility: boolean,
): SalesOpportunity {
  const location = `${city}, ${state}`;
  const score = scoreSalesOpportunity(icpScore, industry, location);
  const proposalPreparationStatus = buildProposalStatus(score.overallScore, stage);
  const partial = { company, industry, proposalPreparationStatus, stage };
  return {
    activityTimeline: [
      timelineEvent('created', 'Opportunity created', 'Seeded from local Louisville ICP research.', 'Sales Agent', createdAt),
      timelineEvent('research_generated', 'Research generated', 'Local public/manual-field research record prepared.', 'Sales Agent', createdAt),
    ],
    archived: false,
    assignedOwner: 'Sales Agent',
    attachments: [`reports/agents/sales/${id}.md`],
    city,
    company,
    companySizeEstimate: 'Small independent gym',
    contacts: [{ email: '', name: 'Owner/operator TBD', phone: '', role: 'Decision maker' }],
    createdAt,
    draftOutreach: [`Draft local outreach around ${industry} member onboarding and retention.`],
    email: '',
    executiveVisibility,
    favorite: executiveVisibility,
    followUpPlan: buildFollowUpPlan(partial),
    generatedReports: ['Company Research Dossier', 'Outreach Prep Report'],
    icpScore,
    id,
    industry,
    leadScore: score.leadScore,
    location,
    naics: industry.includes('CrossFit') ? '713940' : '611620',
    notes: ['Local CRM only. Verify contacts and requirements before outreach.'],
    phone: '',
    pinned: executiveVisibility,
    priority: score.priority,
    proposalPreparationStatus,
    score,
    source: 'Louisville ICP local research',
    stage,
    state,
    status: 'active',
    tags,
    updatedAt: createdAt,
    website,
  };
}

function timelineEvent(
  type: SalesOpportunityTimelineEvent['type'],
  title: string,
  reason: string,
  operator: string,
  timestamp: string,
  previousStage?: SalesOpportunityStage,
  newStage?: SalesOpportunityStage,
): SalesOpportunityTimelineEvent {
  return { id: `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`, newStage, operator, previousStage, reason, timestamp, title, type };
}

function report(title: string, opportunities: Partial<SalesOpportunity>[]): LocalReport {
  return {
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    summary: {
      localOnly: true,
      opportunities: opportunities.length,
      safety: 'Local CRM report only. No vyraapp.fit CRM sync or external write.',
    },
    rows: opportunities.map((item) => ('company' in item ? row(item as SalesOpportunity) : item)),
  };
}

function row(item: SalesOpportunity) {
  return {
    company: item.company,
    city: item.city,
    state: item.state,
    stage: item.stage,
    priority: item.priority,
    icpScore: item.icpScore,
    leadScore: item.leadScore,
    owner: item.assignedOwner,
    nextAction: item.followUpPlan.recommendedNextAction,
    proposalReadiness: `${item.proposalPreparationStatus.readinessPercent}%`,
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}
