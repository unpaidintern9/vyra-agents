import type {
  SalesAgentTeamSummary,
  SalesProspectFitTier,
  SalesProspectResearchRecord,
  SalesTeamAgentDefinition,
  SalesTeamAgentId,
} from './salesTypes';

export const salesTargetMarkets = ['Louisville, KY', 'Cincinnati, OH', 'Los Angeles, CA', 'New York, NY'] as const;

const handoffs: Partial<Record<SalesTeamAgentId, SalesTeamAgentId[]>> = {
  crm_design: ['head_sales', 'data_organization'],
  data_organization: ['icp_fit_scoring', 'sales_intelligence'],
  follow_up: ['head_sales', 'outreach_prep'],
  head_sales: ['prospect_discovery', 'public_research', 'data_organization', 'icp_fit_scoring', 'safety_approval'],
  icp_fit_scoring: ['head_sales', 'outreach_prep', 'meeting_prep'],
  meeting_prep: ['proposal_builder', 'migration_planning'],
  migration_planning: ['meeting_prep'],
  outreach_prep: ['safety_approval'],
  proposal_builder: ['safety_approval'],
  prospect_discovery: ['public_research', 'data_organization'],
  public_research: ['data_organization', 'safety_approval'],
  safety_approval: ['head_sales'],
  sales_intelligence: ['head_sales'],
};

export const salesTeamAgents: SalesTeamAgentDefinition[] = [
  agent('head_sales', 'Head Sales Agent', 'Owns sales strategy, queue review, and sub-agent handoffs.', 'Weekly sales operating plan', [
    'Prioritize the pipeline and research backlog',
    'Route work to research, scoring, proposal, and meeting prep agents',
    'Keep every external action behind an approval gate',
  ]),
  agent('prospect_discovery', 'Prospect Discovery Agent', 'Builds local target lists for MMA, CrossFit, and small gyms.', 'Prospect target list', [
    'Suggest markets and gym categories to research',
    'Flag small multi-location targets before large chains',
    'Prepare prospects for public research review',
  ]),
  agent('public_research', 'Public Research Agent', 'Prepares public-web research tasks for websites and social profiles.', 'Public research brief', [
    'Collect public website and social profile fields when approved later',
    'Avoid logins, paywalls, private groups, or scraped personal data',
    'Mark records that still need source verification',
  ]),
  agent('data_organization', 'Data Organization Agent', 'Normalizes prospect records into clean local CRM-ready fields.', 'Cleaned prospect records', [
    'Deduplicate prospects by market, website, and name',
    'Standardize categories, fit reasons, and next research steps',
    'Keep records local until a future CRM approval path exists',
  ]),
  agent('icp_fit_scoring', 'ICP Fit Scoring Agent', 'Scores gyms against Vyra first-target criteria.', 'Explainable ICP score', [
    'Favor MMA, CrossFit, and small owner-operated gyms',
    'Reward visible migration, member management, and app-fit signals',
    'Penalize missing public context or likely large-chain complexity',
  ]),
  agent('outreach_prep', 'Outreach Prep Agent', 'Drafts local talking points without sending messages.', 'Draft-only outreach prep', [
    'Prepare owner-specific angle ideas',
    'Keep copy in draft-only state',
    'Require approval before any future email or DM action',
  ], 'planned'),
  agent('meeting_prep', 'Meeting Prep Agent', 'Builds local meeting briefs from lead and prospect context.', 'Meeting prep brief', [
    'Summarize likely pains and discovery questions',
    'Prepare migration and product-fit talking points',
    'Never join calendars or send invites automatically',
  ], 'planned'),
  agent('proposal_builder', 'Proposal Builder Agent', 'Turns reviewed lead data into local proposal drafts.', 'Draft proposal', [
    'Use the existing proposal builder',
    'Keep proposals not sent and not invoiced',
    'Flag pricing gaps for human review',
  ], 'active_local'),
  agent('migration_planning', 'Migration Planning Agent', 'Prepares local data migration questions for gym prospects.', 'Migration readiness checklist', [
    'Identify member import and billing-handoff questions',
    'Route real imports to the Migration Agent wizard',
    'Avoid production profile or membership creation',
  ], 'planned'),
  agent('crm_design', 'CRM Design Agent', 'Plans the custom Vyra CRM model before external integrations.', 'CRM design notes', [
    'Define local lead, account, activity, and proposal fields',
    'Prepare later Google Workspace handoffs',
    'Block production CRM writes until explicit approval exists',
  ], 'planned'),
  agent('follow_up', 'Follow-Up Agent', 'Uses the local follow-up queue to plan next steps.', 'Follow-up queue', [
    'Prioritize overdue and proposal-needed follow-ups',
    'Keep reminders local',
    'Never send emails automatically',
  ], 'active_local'),
  agent('sales_intelligence', 'Sales Intelligence Agent', 'Summarizes patterns across local prospects and leads.', 'Sales intelligence brief', [
    'Identify best target markets and categories',
    'Call out missing research data',
    'Report readiness to Executive',
  ], 'active_local'),
  agent('safety_approval', 'Safety / Approval Agent', 'Blocks external actions until future approval gates are built.', 'Safety status', [
    'Prevent email, Stripe, CRM, and production writes',
    'Label mock/local/read-only states clearly',
    'Require human approval for future external actions',
  ], 'active_local', [
    'Send email',
    'Create Stripe invoice',
    'Write CRM record',
    'Scrape private or login-gated sources',
  ]),
];

export function createInitialSalesProspectResearch(): SalesProspectResearchRecord[] {
  return [
    prospect({
      id: 'prospect_louisville_mma_owner_gym',
      prospectName: 'Louisville Combat Sports Candidate',
      category: 'mma_bjj',
      city: 'Louisville',
      state: 'KY',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Small independent gym',
      sourceStatus: 'needs_public_research',
      confidence: 'medium',
      notes: 'Seeded for Louisville MMA/BJJ research. Verify website, owner, programs, and current member workflows before outreach.',
      fitReasons: ['MMA/BJJ segment', 'single-location profile', 'likely class scheduling and member communication needs'],
      firstOutreachAngle: 'Ask about member onboarding, belt/program tracking, and whether their current tools feel patched together.',
      recommendedNextResearch: 'Find public website, Instagram, class schedule, and owner/operator contact path.',
    }),
    prospect({
      id: 'prospect_louisville_crossfit_box',
      prospectName: 'Louisville CrossFit Candidate',
      category: 'crossfit',
      city: 'Louisville',
      state: 'KY',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Owner-operated box',
      sourceStatus: 'needs_public_research',
      confidence: 'medium',
      notes: 'Seeded for CrossFit owner research; verify not a large chain or franchise group before qualification.',
      fitReasons: ['CrossFit segment', 'class-heavy business', 'good fit for scheduling and member engagement'],
      firstOutreachAngle: 'Lead with reducing admin drag around trials, class packs, and member retention.',
      recommendedNextResearch: 'Verify public schedule, offer types, trial flow, and whether app/member portal gaps are visible.',
    }),
    prospect({
      id: 'prospect_cincinnati_mma_owner_gym',
      prospectName: 'Cincinnati MMA / BJJ Candidate',
      category: 'mma_bjj',
      city: 'Cincinnati',
      state: 'OH',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Small combat sports gym',
      sourceStatus: 'needs_public_research',
      confidence: 'medium',
      notes: 'Seeded from Vyra first-target criteria for Cincinnati combat sports gyms.',
      fitReasons: ['MMA/BJJ segment', 'likely recurring memberships', 'migration/import discovery likely useful'],
      firstOutreachAngle: 'Ask how they manage trial students, recurring members, and class communication today.',
      recommendedNextResearch: 'Find website, public social profile, program list, and signs of current software stack.',
    }),
    prospect({
      id: 'prospect_cincinnati_crossfit_box',
      prospectName: 'Cincinnati CrossFit Candidate',
      category: 'crossfit',
      city: 'Cincinnati',
      state: 'OH',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Small gym or box',
      sourceStatus: 'needs_public_research',
      confidence: 'medium',
      notes: 'Seeded for Cincinnati CrossFit research. Keep as local planning until sources are verified.',
      fitReasons: ['CrossFit segment', 'member class attendance pattern', 'owner-operated ICP fit'],
      firstOutreachAngle: 'Position Vyra around member experience, simple operations, and future branded app readiness.',
      recommendedNextResearch: 'Verify public schedule, location count, owner contact, and current app/member portal clues.',
    }),
    prospect({
      id: 'prospect_los_angeles_small_gym',
      prospectName: 'Los Angeles Small Gym Candidate',
      category: 'small_gym',
      city: 'Los Angeles',
      state: 'CA',
      estimatedLocationCount: 2,
      estimatedSizeLabel: 'Small multi-location target',
      sourceStatus: 'needs_public_research',
      confidence: 'low',
      notes: 'LA market is broad; use this as a placeholder for a verified small gym with one to three locations.',
      fitReasons: ['large market', 'small-location target', 'possible app differentiation need'],
      firstOutreachAngle: 'Look for owner pain around retention, app experience, and scattered tools.',
      recommendedNextResearch: 'Narrow to neighborhoods, verify location count, and avoid large chains.',
    }),
    prospect({
      id: 'prospect_los_angeles_combat_sports',
      prospectName: 'Los Angeles Combat Sports Candidate',
      category: 'mma_bjj',
      city: 'Los Angeles',
      state: 'CA',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Independent academy',
      sourceStatus: 'needs_public_research',
      confidence: 'low',
      notes: 'Use for LA MMA/BJJ discovery once public-source research is approved.',
      fitReasons: ['combat sports segment', 'potential class/program complexity', 'member communication fit'],
      firstOutreachAngle: 'Focus discovery on trials, belt/program tracking, and member app expectations.',
      recommendedNextResearch: 'Collect public site, schedule, programs, social activity, and contact path.',
    }),
    prospect({
      id: 'prospect_new_york_boutique_gym',
      prospectName: 'New York Boutique Gym Candidate',
      category: 'boutique_fitness',
      city: 'New York',
      state: 'NY',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Boutique independent studio',
      sourceStatus: 'needs_public_research',
      confidence: 'low',
      notes: 'NY should be filtered carefully for independent operators rather than established studio groups.',
      fitReasons: ['high-density market', 'member experience differentiation', 'potential app fit'],
      firstOutreachAngle: 'Ask where their current tools fall short for member retention and onboarding.',
      recommendedNextResearch: 'Verify independence, owner/operator path, pricing model, and current booking software clues.',
    }),
    prospect({
      id: 'prospect_new_york_crossfit_box',
      prospectName: 'New York CrossFit Candidate',
      category: 'crossfit',
      city: 'New York',
      state: 'NY',
      estimatedLocationCount: 1,
      estimatedSizeLabel: 'Independent box',
      sourceStatus: 'needs_public_research',
      confidence: 'low',
      notes: 'Use as a target slot for a verified small CrossFit operator in NYC.',
      fitReasons: ['CrossFit segment', 'class and membership operations', 'owner-operated target profile'],
      firstOutreachAngle: 'Frame around less admin, stronger member lifecycle, and future branded app readiness.',
      recommendedNextResearch: 'Verify website, schedule, coaching roster, location count, and public contact channel.',
    }),
  ];
}

export function summarizeSalesAgentTeam(
  agents: SalesTeamAgentDefinition[],
  prospects: SalesProspectResearchRecord[],
): SalesAgentTeamSummary {
  const targetMarkets = new Set(prospects.map((prospect) => `${prospect.city}, ${prospect.state}`));
  const highFitProspects = prospects.filter((prospect) => prospect.fitTier === 'prime_target' || prospect.fitTier === 'good_fit').length;
  const needsResearch = prospects.filter((prospect) => prospect.sourceStatus === 'needs_public_research').length;
  const fitScoreTotal = prospects.reduce((total, prospect) => total + prospect.fitScore, 0);

  return {
    activeAgents: agents.filter((agent) => agent.status === 'active_local').length,
    averageFitScore: prospects.length ? Math.round(fitScoreTotal / prospects.length) : 0,
    blockedExternalActions: agents.reduce((total, agent) => total + agent.blockedActions.length, 0),
    highFitProspects,
    localOnlyAgents: agents.filter((agent) => agent.localOnly).length,
    needsResearch,
    readyProspects: prospects.filter((prospect) => prospect.sourceStatus === 'public_research_ready').length,
    targetMarkets: targetMarkets.size,
    totalAgents: agents.length,
    totalProspects: prospects.length,
  };
}

export function scoreProspectFit(prospect: Omit<SalesProspectResearchRecord, 'fitScore' | 'fitTier'>): {
  fitScore: number;
  fitTier: SalesProspectFitTier;
} {
  let score = 40;
  if (prospect.category === 'mma_bjj') score += 22;
  if (prospect.category === 'crossfit') score += 20;
  if (prospect.category === 'small_gym') score += 14;
  if (prospect.category === 'boutique_fitness') score += 10;
  if (prospect.estimatedLocationCount && prospect.estimatedLocationCount <= 3) score += 18;
  if (prospect.estimatedLocationCount && prospect.estimatedLocationCount > 3) score -= 18;
  if (prospect.fitReasons.some((reason) => /migration|import|member|schedule|app|communication/i.test(reason))) score += 12;
  if (prospect.sourceStatus === 'needs_public_research') score -= 6;
  if (prospect.confidence === 'low') score -= 6;

  const fitScore = Math.max(0, Math.min(100, score));
  return {
    fitScore,
    fitTier: fitTierForScore(fitScore, prospect.sourceStatus === 'needs_public_research'),
  };
}

function agent(
  id: SalesTeamAgentId,
  name: string,
  description: string,
  output: string,
  responsibilities: string[],
  status: SalesTeamAgentDefinition['status'] = 'active_local',
  blockedActions: string[] = [],
): SalesTeamAgentDefinition {
  return {
    blockedActions,
    description,
    handoffTo: handoffs[id] ?? [],
    id,
    localOnly: true,
    name,
    output,
    responsibilities,
    status,
  };
}

function prospect(input: Omit<SalesProspectResearchRecord, 'fitScore' | 'fitTier' | 'lastReviewedAt' | 'localOnly'>): SalesProspectResearchRecord {
  const scored = scoreProspectFit({ ...input, lastReviewedAt: '2026-06-30T00:00:00.000Z', localOnly: true });
  return {
    ...input,
    ...scored,
    lastReviewedAt: '2026-06-30T00:00:00.000Z',
    localOnly: true,
  };
}

function fitTierForScore(score: number, needsResearch: boolean): SalesProspectFitTier {
  if (needsResearch && score < 76) return 'research_needed';
  if (score >= 82) return 'prime_target';
  if (score >= 66) return 'good_fit';
  if (score >= 46) return 'research_needed';
  return 'low_fit';
}
