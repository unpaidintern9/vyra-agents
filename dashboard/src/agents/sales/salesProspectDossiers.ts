import type { LocalReport } from '../../storage/reportExport';
import type {
  LeadScoreFactor,
  SalesMigrationComplexity,
  SalesProspectBusinessType,
  SalesProspectDossierSummary,
  SalesProspectFitTier,
  SalesProspectIntake,
  SalesProspectIntakeDraft,
  SalesResearchDossier,
} from './salesTypes';

export const emptyProspectIntakeDraft: SalesProspectIntakeDraft = {
  businessType: 'mma_bjj',
  city: '',
  contactEmail: '',
  contactName: '',
  contactPhone: '',
  currentSoftware: '',
  estimatedCoaches: null,
  estimatedMembers: null,
  gymName: '',
  instagramUrl: '',
  migrationComplexity: 'unknown',
  notes: '',
  painPoints: [],
  state: '',
  websiteUrl: '',
};

export function createSalesProspectIntake(draft: SalesProspectIntakeDraft, id: string, now = new Date().toISOString()): SalesProspectIntake {
  return {
    ...draft,
    city: draft.city.trim(),
    contactEmail: draft.contactEmail.trim(),
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone.trim(),
    currentSoftware: draft.currentSoftware.trim(),
    gymName: draft.gymName.trim(),
    id,
    instagramUrl: draft.instagramUrl.trim(),
    localOnly: true,
    notes: draft.notes.trim(),
    painPoints: draft.painPoints.map((point) => point.trim()).filter(Boolean),
    state: draft.state.trim().toUpperCase(),
    websiteUrl: draft.websiteUrl.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function generateResearchDossier(
  intake: SalesProspectIntake,
  existing?: SalesResearchDossier,
  now = new Date().toISOString(),
): SalesResearchDossier {
  const missingInfo = missingInfoForIntake(intake);
  const likelyPainPoints = inferPainPoints(intake);
  const recommendedVyraProduct = recommendedProduct(intake);
  const migrationOpportunity = migrationOpportunityFor(intake);
  const risks = risksForIntake(intake, missingInfo);
  const fitFactors = scoreFactorsForIntake(intake, missingInfo, likelyPainPoints);
  const fitScore = Math.max(0, Math.min(100, fitFactors.reduce((total, factor) => total + factor.points, 45)));
  const icpFit = fitTierForScore(fitScore, missingInfo.length > 0);

  return {
    businessOverview: businessOverviewFor(intake),
    createdAt: existing?.createdAt ?? now,
    dossierId: existing?.dossierId ?? `research_dossier_${intake.id}`,
    fitFactors,
    fitScore,
    highFit: fitScore >= 76 && missingInfo.length <= 3,
    icpFit,
    intakeId: intake.id,
    likelyPainPoints,
    localOnly: true,
    migrationOpportunity,
    missingInfo,
    nextSteps: nextStepsForIntake(intake, missingInfo),
    notBrowsedExternally: true,
    notSyncedToCrm: true,
    outreachAngle: outreachAngleFor(intake, recommendedVyraProduct),
    proposalAngle: proposalAngleFor(intake, recommendedVyraProduct),
    recommendedVyraProduct,
    risks,
    updatedAt: now,
  };
}

export function summarizeProspectDossiers(intakes: SalesProspectIntake[], dossiers: SalesResearchDossier[]): SalesProspectDossierSummary {
  return {
    dossiersCreated: dossiers.length,
    highFitDossiers: dossiers.filter((dossier) => dossier.highFit).length,
    migrationOpportunityProspects: dossiers.filter((dossier) => /medium|high|migration|import/i.test(dossier.migrationOpportunity)).length,
    missingInfoProspects: intakes.filter((intake) => missingInfoForIntake(intake).length > 0).length,
    savedProspects: intakes.length,
  };
}

export function buildResearchDossierReport(intake: SalesProspectIntake, dossier: SalesResearchDossier): LocalReport {
  return {
    title: `${intake.gymName} Research Dossier`,
    slug: `sales-research-dossier-${slugify(intake.gymName)}`,
    summary: {
      prospect: intake.gymName,
      market: `${intake.city}, ${intake.state}`,
      businessType: labelBusinessType(intake.businessType),
      fitScore: dossier.fitScore,
      icpFit: dossier.icpFit.replace(/_/g, ' '),
      recommendedVyraProduct: dossier.recommendedVyraProduct,
      localOnly: 'Yes',
      externalBrowsingOccurred: 'No',
      crmWriteOccurred: 'No',
    },
    sections: [
      {
        title: 'Dossier',
        rows: [
          {
            businessOverview: dossier.businessOverview,
            likelyPainPoints: dossier.likelyPainPoints.join('; '),
            migrationOpportunity: dossier.migrationOpportunity,
            outreachAngle: dossier.outreachAngle,
            proposalAngle: dossier.proposalAngle,
            risks: dossier.risks.join('; '),
            nextSteps: dossier.nextSteps.join('; '),
          },
        ],
      },
      {
        title: 'Fit Score Explanation',
        rows: dossier.fitFactors,
      },
      {
        title: 'Missing Info',
        rows: dossier.missingInfo.map((item) => ({ item })),
      },
    ],
  };
}

export function labelBusinessType(type: SalesProspectBusinessType): string {
  const labels: Record<SalesProspectBusinessType, string> = {
    boutique_fitness: 'Boutique fitness',
    crossfit: 'CrossFit',
    independent_coach: 'Independent coach',
    mma_bjj: 'MMA / BJJ',
    multi_location_gym: 'Multi-location gym',
    small_gym: 'Small gym',
    sports_performance: 'Sports performance',
    unknown: 'Unknown',
  };
  return labels[type];
}

export function missingInfoForIntake(intake: SalesProspectIntake): string[] {
  const missing = [];
  if (!intake.gymName) missing.push('gym name');
  if (!intake.city || !intake.state) missing.push('city/state');
  if (intake.businessType === 'unknown') missing.push('business type');
  if (!intake.websiteUrl) missing.push('website');
  if (!intake.instagramUrl) missing.push('Instagram/social link');
  if (!intake.contactName) missing.push('owner/contact name');
  if (!intake.contactEmail && !intake.contactPhone) missing.push('contact email or phone');
  if (!intake.currentSoftware) missing.push('current software');
  if (!intake.painPoints.length) missing.push('pain points');
  if (!intake.estimatedMembers) missing.push('estimated members');
  if (!intake.estimatedCoaches) missing.push('estimated coaches');
  if (intake.migrationComplexity === 'unknown') missing.push('migration complexity');
  return missing;
}

function businessOverviewFor(intake: SalesProspectIntake): string {
  const memberText = intake.estimatedMembers ? `${intake.estimatedMembers} estimated members` : 'unknown member count';
  const coachText = intake.estimatedCoaches ? `${intake.estimatedCoaches} estimated coaches` : 'unknown coach count';
  return `${intake.gymName} is a ${labelBusinessType(intake.businessType).toLowerCase()} prospect in ${intake.city || 'unknown city'}, ${intake.state || 'unknown state'} with ${memberText} and ${coachText}.`;
}

function inferPainPoints(intake: SalesProspectIntake): string[] {
  const points = new Set(intake.painPoints);
  const software = intake.currentSoftware.toLowerCase();
  if (!software || /spreadsheet|paper|manual|none|unknown/.test(software)) points.add('manual or fragmented member operations');
  if (intake.migrationComplexity === 'medium' || intake.migrationComplexity === 'high') points.add('member data migration risk');
  if (intake.estimatedMembers && intake.estimatedMembers >= 100) points.add('member retention and communication at scale');
  if (intake.businessType === 'mma_bjj') points.add('program, class, and rank progression visibility');
  if (intake.businessType === 'crossfit') points.add('class scheduling and trial-to-member conversion');
  return Array.from(points);
}

function recommendedProduct(intake: SalesProspectIntake): string {
  if (intake.businessType === 'independent_coach') return 'Independent Coach';
  if (intake.businessType === 'multi_location_gym') return 'Gym OS + App for Gyms';
  if (intake.migrationComplexity === 'high' || intake.migrationComplexity === 'medium') return 'Gym OS + Migration / Data Import';
  if (intake.estimatedMembers && intake.estimatedMembers >= 150) return 'App for Gyms';
  return 'Gym OS';
}

function migrationOpportunityFor(intake: SalesProspectIntake): string {
  const labels: Record<SalesMigrationComplexity, string> = {
    high: 'High migration opportunity: prepare import audit, member mapping, and owner review checklist.',
    low: 'Low migration opportunity: validate current tools and keep setup lightweight.',
    medium: 'Medium migration opportunity: review member exports, statuses, and current software gaps.',
    unknown: 'Unknown migration opportunity: collect current software and member export details.',
  };
  return labels[intake.migrationComplexity];
}

function risksForIntake(intake: SalesProspectIntake, missingInfo: string[]): string[] {
  const risks = [];
  if (missingInfo.length) risks.push(`${missingInfo.length} missing intake field(s) need review`);
  if (intake.businessType === 'multi_location_gym') risks.push('multi-location complexity may increase onboarding scope');
  if (!intake.contactEmail && !intake.contactPhone) risks.push('no direct contact path captured');
  if (intake.migrationComplexity === 'high') risks.push('migration complexity requires careful import planning');
  return risks.length ? risks : ['No major local planning risks detected'];
}

function scoreFactorsForIntake(intake: SalesProspectIntake, missingInfo: string[], likelyPainPoints: string[]): LeadScoreFactor[] {
  return [
    {
      key: 'business_type',
      label: 'Business Type',
      points: businessTypePoints(intake.businessType),
      detail: `${labelBusinessType(intake.businessType)} fit for Vyra first-target motion`,
    },
    {
      key: 'member_count',
      label: 'Estimated Members',
      points: intake.estimatedMembers ? memberPoints(intake.estimatedMembers) : -8,
      detail: intake.estimatedMembers ? `${intake.estimatedMembers} members suggests operational leverage` : 'Member count missing',
    },
    {
      key: 'migration_complexity',
      label: 'Migration Opportunity',
      points: migrationPoints(intake.migrationComplexity),
      detail: intake.migrationComplexity === 'unknown' ? 'Migration complexity missing' : `${intake.migrationComplexity} migration complexity`,
    },
    {
      key: 'pain_points',
      label: 'Pain Points',
      points: likelyPainPoints.length >= 3 ? 14 : likelyPainPoints.length > 0 ? 8 : -8,
      detail: likelyPainPoints.length ? `${likelyPainPoints.length} likely pain point(s) captured` : 'Pain points missing',
    },
    {
      key: 'contact_path',
      label: 'Contact Path',
      points: intake.contactEmail || intake.contactPhone ? 8 : -12,
      detail: intake.contactEmail || intake.contactPhone ? 'Direct contact path captured' : 'No direct contact path captured',
    },
    {
      key: 'missing_info',
      label: 'Missing Info',
      points: missingInfo.length ? Math.max(-18, missingInfo.length * -3) : 10,
      detail: missingInfo.length ? `${missingInfo.length} field(s) missing` : 'Core intake fields are complete',
    },
  ];
}

function nextStepsForIntake(intake: SalesProspectIntake, missingInfo: string[]): string[] {
  const steps = [];
  if (missingInfo.length) steps.push(`Fill missing info: ${missingInfo.join(', ')}`);
  steps.push('Review public website and social profile manually before outreach.');
  steps.push('Prepare a local discovery agenda around operations, member experience, and migration readiness.');
  if (intake.migrationComplexity === 'medium' || intake.migrationComplexity === 'high') {
    steps.push('Route future import details to the Migration Agent wizard before any production work.');
  }
  return steps;
}

function outreachAngleFor(intake: SalesProspectIntake, product: string): string {
  if (intake.businessType === 'mma_bjj') return `Lead with simplifying member onboarding, program visibility, and class communication for ${intake.gymName}.`;
  if (intake.businessType === 'crossfit') return `Lead with reducing admin drag around class scheduling, trials, and member retention for ${intake.gymName}.`;
  return `Lead with a ${product} conversation focused on cleaner operations and a better member experience.`;
}

function proposalAngleFor(intake: SalesProspectIntake, product: string): string {
  const migration = intake.migrationComplexity === 'medium' || intake.migrationComplexity === 'high' ? ' Include a migration audit and import readiness step.' : '';
  return `Position ${product} as a phased local operations upgrade for ${intake.gymName}.${migration}`;
}

function businessTypePoints(type: SalesProspectBusinessType): number {
  if (type === 'mma_bjj') return 22;
  if (type === 'crossfit') return 20;
  if (type === 'small_gym') return 16;
  if (type === 'sports_performance') return 12;
  if (type === 'boutique_fitness') return 10;
  if (type === 'multi_location_gym') return 6;
  if (type === 'independent_coach') return 4;
  return -6;
}

function memberPoints(members: number): number {
  if (members >= 80 && members <= 300) return 14;
  if (members > 300) return 8;
  if (members >= 25) return 8;
  return 2;
}

function migrationPoints(complexity: SalesMigrationComplexity): number {
  if (complexity === 'high') return 14;
  if (complexity === 'medium') return 10;
  if (complexity === 'low') return 4;
  return -6;
}

function fitTierForScore(score: number, hasMissingInfo: boolean): SalesProspectFitTier {
  if (score >= 82 && !hasMissingInfo) return 'prime_target';
  if (score >= 70) return 'good_fit';
  if (score >= 48) return 'research_needed';
  return 'low_fit';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
