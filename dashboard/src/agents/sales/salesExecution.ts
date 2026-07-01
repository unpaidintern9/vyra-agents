import type { LocalReport } from '../../storage/reportExport';
import { formatCurrency, summarizeSalesPipeline } from './salesPipeline';
import type {
  FollowUpQueueItem,
  LeadScore,
  ProposalPrep,
  SalesActivity,
  SalesExecutionStatus,
  SalesLead,
  SalesProspectIntake,
  SalesProspectResearchRecord,
  SalesRecommendedSearch,
  SalesRecommendedSearchFilters,
  SalesReportKind,
  SalesResearchDossier,
} from './salesTypes';

export const salesRecommendedSearches: SalesRecommendedSearch[] = [
  {
    id: 'louisville-prime-combat',
    label: 'Louisville prime MMA/BJJ',
    description: 'High-fit Louisville combat-sports gyms ready for owner/contact verification.',
    filters: { category: 'mma_bjj', market: 'Louisville, KY', minimumFitScore: 80, sourceStatus: 'public_research_ready' },
  },
  {
    id: 'louisville-crossfit',
    label: 'Louisville CrossFit boxes',
    description: 'CrossFit targets around Louisville for trial, class, and retention workflow discovery.',
    filters: { category: 'crossfit', market: 'Louisville, KY', minimumFitScore: 75, sourceStatus: 'public_research_ready' },
  },
  {
    id: 'southern-indiana-adjacent',
    label: 'Southern Indiana adjacent',
    description: 'Nearby martial arts prospects that are close enough for Louisville-area first motion.',
    filters: { category: 'mma_bjj', market: 'IN', minimumFitScore: 75, sourceStatus: 'public_research_ready' },
  },
  {
    id: 'missing-info-prime',
    label: 'Prime targets missing info',
    description: 'High-fit prospects that need owner/contact/software details before outreach.',
    filters: { category: 'all', minimumFitScore: 82, sourceStatus: 'public_research_ready' },
  },
];

export function filterProspectsForSearch(
  prospects: SalesProspectResearchRecord[],
  filters: SalesRecommendedSearchFilters,
): SalesProspectResearchRecord[] {
  return prospects
    .filter((prospect) => {
      const market = `${prospect.city}, ${prospect.state}`;
      const marketMatch = !filters.market || market === filters.market || market.includes(filters.market) || prospect.city.includes(filters.market);
      return (
        (filters.category === undefined || filters.category === 'all' || prospect.category === filters.category) &&
        (filters.sourceStatus === undefined || filters.sourceStatus === 'all' || prospect.sourceStatus === filters.sourceStatus) &&
        (filters.minimumFitScore === undefined || prospect.fitScore >= filters.minimumFitScore) &&
        marketMatch
      );
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

export function createSalesStatus(title: string, detail: string, resultCount: number, status: SalesExecutionStatus['status'] = 'success'): SalesExecutionStatus {
  return {
    detail,
    generatedAt: new Date().toISOString(),
    resultCount,
    status,
    title,
  };
}

export function buildSalesExecutionReports(input: {
  activities: SalesActivity[];
  dossiers: SalesResearchDossier[];
  followUpQueue: FollowUpQueueItem[];
  intakes: SalesProspectIntake[];
  leads: SalesLead[];
  proposals: ProposalPrep[];
  prospects: SalesProspectResearchRecord[];
  scores: LeadScore[];
}): Record<SalesReportKind, LocalReport> {
  return {
    company_dossier: buildCompanyResearchDossierReport(input.prospects, input.intakes, input.dossiers),
    executive_summary: buildExecutiveSalesSummaryReport(input.leads, input.prospects, input.scores, input.followUpQueue, input.dossiers),
    follow_up: buildFollowUpPlanReport(input.leads, input.followUpQueue),
    follow_up_queue: buildFollowUpPlanReport(input.leads, input.followUpQueue),
    icp_fit: buildIcpFitReport(input.prospects),
    lead_scoring: buildIcpFitReport(input.prospects),
    outreach_prep: buildOutreachPrepReport(input.prospects, input.dossiers, input.intakes),
    pipeline: buildPipelineReport(input.leads, input.activities, input.proposals),
    proposal: buildProposalPrepReport(input.leads, input.proposals),
    prospect_research: buildProspectResearchReport(input.prospects),
    weighted_pipeline: buildExecutiveSalesSummaryReport(input.leads, input.prospects, input.scores, input.followUpQueue, input.dossiers),
  };
}

export function buildPipelineReport(leads: SalesLead[], activities: SalesActivity[], proposals: ProposalPrep[]): LocalReport {
  const summary = summarizeSalesPipeline(leads, proposals);
  return {
    title: 'Sales Pipeline Report',
    slug: 'sales-pipeline-report',
    summary: {
      totalLeads: summary.totalLeads,
      gymLeads: summary.gymLeads,
      coachLeads: summary.coachLeads,
      estimatedPipelineValue: formatCurrency(summary.estimatedPipelineValue),
      safety: 'Local report only. No CRM, email, Stripe, or Supabase writes.',
    },
    rows: leads.map((lead) => ({
      lead: lead.name,
      type: lead.leadType,
      stage: lead.pipelineStage,
      priority: lead.priority,
      value: lead.estimatedValue,
      nextAction: lead.nextAction,
      followUp: lead.nextFollowUpDate ?? 'Not scheduled',
    })),
    sections: [
      { title: 'Recent Activity', rows: activities.slice(0, 20) },
      { title: 'Proposal Prep', rows: proposals },
    ],
  };
}

export function buildProspectResearchReport(prospects: SalesProspectResearchRecord[]): LocalReport {
  return {
    title: 'Prospect Research Report',
    slug: 'sales-prospect-research-report',
    summary: {
      prospects: prospects.length,
      primeTargets: prospects.filter((item) => item.fitTier === 'prime_target').length,
      publicResearchReady: prospects.filter((item) => item.sourceStatus === 'public_research_ready').length,
      needsManualResearch: prospects.filter((item) => item.sourceStatus !== 'public_research_ready').length,
    },
    rows: prospects.map((prospect) => ({
      prospect: prospect.prospectName,
      category: prospect.category,
      market: `${prospect.city}, ${prospect.state}`,
      fitScore: prospect.fitScore,
      fitTier: prospect.fitTier,
      website: prospect.websiteUrl ?? '',
      outreachAngle: prospect.firstOutreachAngle,
      missingNextResearch: prospect.recommendedNextResearch,
    })),
  };
}

export function buildCompanyResearchDossierReport(
  prospects: SalesProspectResearchRecord[],
  intakes: SalesProspectIntake[],
  dossiers: SalesResearchDossier[],
): LocalReport {
  const dossierRows = dossiers.map((dossier) => {
    const intake = intakes.find((item) => item.id === dossier.intakeId);
    return {
      company: intake?.gymName ?? dossier.intakeId,
      market: intake ? `${intake.city}, ${intake.state}` : 'Unknown',
      fitScore: dossier.fitScore,
      product: dossier.recommendedVyraProduct,
      outreachAngle: dossier.outreachAngle,
      missingInfo: dossier.missingInfo.join('; '),
      nextSteps: dossier.nextSteps.join('; '),
    };
  });
  return {
    title: 'Company Research Dossier',
    slug: 'sales-company-research-dossier',
    summary: {
      dossiers: dossiers.length,
      highFitDossiers: dossiers.filter((item) => item.highFit).length,
      prospectSlotsAvailable: prospects.length,
      mode: 'Manual/public-field enrichment. No private scraping.',
    },
    rows: dossierRows.length ? dossierRows : prospects.slice(0, 12).map((prospect) => ({
      company: prospect.prospectName,
      market: `${prospect.city}, ${prospect.state}`,
      fitScore: prospect.fitScore,
      product: recommendedProductForProspect(prospect),
      outreachAngle: prospect.firstOutreachAngle,
      missingInfo: 'owner/contact; current software; member count; social profile',
      nextSteps: prospect.recommendedNextResearch,
    })),
  };
}

export function buildOutreachPrepReport(
  prospects: SalesProspectResearchRecord[],
  dossiers: SalesResearchDossier[],
  intakes: SalesProspectIntake[],
): LocalReport {
  const targets = prospects.filter((prospect) => prospect.fitScore >= 80).slice(0, 10);
  return {
    title: 'Outreach Prep Report',
    slug: 'sales-outreach-prep-report',
    summary: {
      draftReadyTargets: targets.length,
      safety: 'Draft prep only. No customer emails sent automatically.',
      internalDraftsAllowed: 'Only through the approved internal Gmail workflow when configured.',
    },
    rows: targets.map((prospect) => {
      const intake = intakes.find((item) => item.gymName === prospect.prospectName);
      const dossier = intake ? dossiers.find((item) => item.intakeId === intake.id) : null;
      return {
        prospect: prospect.prospectName,
        website: prospect.websiteUrl ?? '',
        openingAngle: prospect.firstOutreachAngle,
        likelyPainPoints: dossier?.likelyPainPoints.join('; ') ?? likelyPainPointsForProspect(prospect).join('; '),
        suggestedAsk: 'Ask who owns member onboarding, class communication, and software decisions.',
        nextAction: prospect.recommendedNextResearch,
      };
    }),
  };
}

export function buildFollowUpPlanReport(leads: SalesLead[], queue: FollowUpQueueItem[]): LocalReport {
  return {
    title: 'Follow-Up Plan',
    slug: 'sales-follow-up-plan',
    summary: {
      items: queue.length,
      overdue: queue.filter((item) => item.queue === 'overdue').length,
      dueToday: queue.filter((item) => item.queue === 'today').length,
      noMessagesSent: 'Yes',
    },
    rows: queue.map((item) => ({
      lead: item.leadName,
      queue: item.queue,
      priority: item.priorityLabel,
      dueDate: item.dueDate ?? 'Not scheduled',
      nextAction: item.nextAction,
      reason: item.reason,
      contactPath: leads.find((lead) => lead.id === item.leadId)?.email || 'Missing email',
    })),
  };
}

export function buildIcpFitReport(prospects: SalesProspectResearchRecord[]): LocalReport {
  return {
    title: 'ICP Fit Report',
    slug: 'sales-icp-fit-report',
    summary: {
      averageFit: Math.round(prospects.reduce((sum, item) => sum + item.fitScore, 0) / Math.max(1, prospects.length)),
      primeTargets: prospects.filter((item) => item.fitTier === 'prime_target').length,
      goodFit: prospects.filter((item) => item.fitTier === 'good_fit').length,
      scoringMode: 'Deterministic local fit scoring',
    },
    rows: prospects
      .slice()
      .sort((a, b) => b.fitScore - a.fitScore)
      .map((prospect) => ({
        prospect: prospect.prospectName,
        segment: prospect.category,
        market: `${prospect.city}, ${prospect.state}`,
        score: prospect.fitScore,
        tier: prospect.fitTier,
        reasons: prospect.fitReasons.join('; '),
        gaps: prospect.recommendedNextResearch,
      })),
  };
}

export function buildProposalPrepReport(leads: SalesLead[], proposals: ProposalPrep[]): LocalReport {
  return {
    title: 'Proposal Prep Report',
    slug: 'sales-proposal-prep-report',
    summary: {
      proposals: proposals.length,
      proposalNeeded: proposals.filter((item) => item.status === 'needed').length,
      noInvoicesCreated: 'Yes',
      noStripeWrites: 'Yes',
    },
    rows: proposals.map((proposal) => {
      const lead = leads.find((item) => item.id === proposal.leadId);
      return {
        prospect: lead?.name ?? proposal.leadId,
        product: proposal.recommendedProduct,
        tier: proposal.pricingTier,
        setupFee: proposal.setupFee,
        monthlyFee: proposal.monthlyFee,
        migrationFee: proposal.migrationFee ?? 0,
        migrationNeeded: proposal.migrationNeeded ? 'Yes' : 'No',
        nextAction: lead?.nextAction ?? 'Review proposal scope',
      };
    }),
  };
}

export function buildExecutiveSalesSummaryReport(
  leads: SalesLead[],
  prospects: SalesProspectResearchRecord[],
  scores: LeadScore[],
  queue: FollowUpQueueItem[],
  dossiers: SalesResearchDossier[],
): LocalReport {
  const topProspects = prospects.slice().sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);
  return {
    title: 'Executive Sales Summary',
    slug: 'sales-executive-summary',
    summary: {
      activeLeads: leads.filter((lead) => lead.status === 'active').length,
      highFitProspects: prospects.filter((prospect) => prospect.fitScore >= 80).length,
      researchDossiers: dossiers.length,
      followUpItems: queue.length,
      weightedPipeline: formatCurrency(scores.reduce((sum, score) => sum + score.weightedPipelineValue, 0)),
      recommendedNextAction: topProspects[0]
        ? `Verify owner/contact path for ${topProspects[0].prospectName} and draft local outreach prep.`
        : 'Add prospects or leads before outreach prep.',
    },
    sections: [
      { title: 'Top Prospect Targets', rows: topProspects },
      { title: 'Follow-Up Attention', rows: queue.slice(0, 8) },
      { title: 'Safety', rows: [{ rule: 'No external customer email, CRM, Stripe, Supabase, or production writes from Sales Agent execution.' }] },
    ],
  };
}

export function buildProspectIntakeDraftFromResearch(prospect: SalesProspectResearchRecord) {
  return {
    businessType: prospect.category === 'crossfit' ? 'crossfit' : prospect.category === 'small_gym' ? 'small_gym' : 'mma_bjj',
    city: prospect.city,
    contactEmail: '',
    contactName: '',
    contactPhone: '',
    currentSoftware: '',
    estimatedCoaches: null,
    estimatedMembers: null,
    gymName: prospect.prospectName,
    instagramUrl: prospect.publicSocialUrl ?? '',
    migrationComplexity: 'unknown',
    notes: `${prospect.notes} ${prospect.recommendedNextResearch}`,
    painPoints: likelyPainPointsForProspect(prospect),
    state: prospect.state,
    websiteUrl: prospect.websiteUrl ?? '',
  } as const;
}

function recommendedProductForProspect(prospect: SalesProspectResearchRecord): string {
  if (prospect.category === 'crossfit') return 'Gym OS + App for Gyms';
  if (prospect.category === 'small_gym') return 'Gym OS';
  return 'Gym OS + member app';
}

function likelyPainPointsForProspect(prospect: SalesProspectResearchRecord): string[] {
  if (prospect.category === 'crossfit') return ['trial onboarding', 'class scheduling', 'member retention', 'coach-led habit tracking'];
  if (prospect.category === 'small_gym') return ['fragmented member operations', 'digital programming delivery', 'member communication'];
  return ['student progression visibility', 'youth/adult program retention', 'class communication', 'member onboarding'];
}
