import { formatCurrency } from './salesPipeline';
import type {
  ProposalPrep,
  SalesLead,
  SalesProposalDraft,
  SalesProposalSummary,
  SalesProposalTemplateType,
} from './salesTypes';

export const salesProposalTemplateLabels: Record<SalesProposalTemplateType, string> = {
  app_for_gyms: 'App for Gyms',
  gym_os: 'Gym OS',
  independent_coach: 'Independent Coach',
  migration_data_import: 'Migration / Data Import',
  white_label: 'White Label',
};

interface ProposalTemplate {
  defaultMonthlyPrice: number;
  defaultSetupFee: number;
  packageName: string;
  title: string;
}

const templates: Record<SalesProposalTemplateType, ProposalTemplate> = {
  app_for_gyms: {
    defaultMonthlyPrice: 900,
    defaultSetupFee: 1200,
    packageName: 'Vyra App for Gyms',
    title: 'Member App Proposal',
  },
  gym_os: {
    defaultMonthlyPrice: 1200,
    defaultSetupFee: 1500,
    packageName: 'Vyra Gym OS',
    title: 'Gym Operating System Proposal',
  },
  independent_coach: {
    defaultMonthlyPrice: 300,
    defaultSetupFee: 250,
    packageName: 'Vyra Coach Pro',
    title: 'Independent Coach Proposal',
  },
  migration_data_import: {
    defaultMonthlyPrice: 1200,
    defaultSetupFee: 2400,
    packageName: 'Vyra Migration + Gym OS',
    title: 'Migration and Data Import Proposal',
  },
  white_label: {
    defaultMonthlyPrice: 2500,
    defaultSetupFee: 5000,
    packageName: 'Vyra White Label Platform',
    title: 'White Label Platform Proposal',
  },
};

export function inferProposalTemplate(lead: SalesLead, proposal?: ProposalPrep): SalesProposalTemplateType {
  const text = `${lead.leadType} ${lead.likelyProductFit ?? ''} ${lead.notes} ${proposal?.recommendedProduct ?? ''}`.toLowerCase();
  if (proposal?.migrationNeeded || text.includes('migration') || text.includes('data import')) return 'migration_data_import';
  if (lead.leadType === 'organization' || text.includes('white label') || text.includes('organization')) return 'white_label';
  if (lead.leadType === 'coach') return 'independent_coach';
  if (text.includes('member app') || text.includes('app for gyms')) return 'app_for_gyms';
  return 'gym_os';
}

export function generateSalesProposalDraft({
  existingDraft,
  lead,
  proposal,
  templateType,
}: {
  existingDraft?: SalesProposalDraft;
  lead: SalesLead;
  proposal?: ProposalPrep;
  templateType: SalesProposalTemplateType;
}): SalesProposalDraft {
  const now = new Date().toISOString();
  const template = templates[templateType];
  const monthlyPrice = proposal?.monthlyFee ?? template.defaultMonthlyPrice;
  const setupFee = proposal?.setupFee ?? template.defaultSetupFee;
  const migrationFee = proposal?.migrationFee ?? (templateType === 'migration_data_import' ? 900 : 0);
  const painPoints = buildPainPoints(lead, proposal, templateType);
  const riskFlags = buildRiskFlags(lead, monthlyPrice, setupFee, migrationFee);
  const status = !monthlyPrice || !setupFee ? 'needs_pricing' : riskFlags.length ? 'risk_review' : 'ready_for_review';
  const recommendedPackage = proposal?.recommendedProduct ?? template.packageName;
  const nextStep = lead.nextAction || 'Review the draft locally and confirm the next follow-up.';
  const draft: SalesProposalDraft = {
    createdAt: existingDraft?.createdAt ?? now,
    draftId: existingDraft?.draftId ?? `proposal_${lead.id}_${templateType}`,
    estimatedValue: lead.estimatedValue,
    followUpDate: lead.nextFollowUpDate,
    leadId: lead.id,
    localOnly: true,
    monthlyPrice,
    nextStep,
    notInvoiced: true,
    notSent: true,
    painPoints,
    previewMarkdown: '',
    prospectName: lead.name,
    prospectType: lead.leadType,
    recommendedPackage,
    riskFlags,
    setupFee: setupFee + migrationFee,
    status,
    templateType,
    title: `${template.title}: ${lead.name}`,
    updatedAt: now,
  };

  return {
    ...draft,
    previewMarkdown: buildProposalMarkdown(draft, lead),
  };
}

export function summarizeSalesProposalDrafts(drafts: SalesProposalDraft[]): SalesProposalSummary {
  return {
    draftsCreated: drafts.length,
    missingPricing: drafts.filter((draft) => draft.status === 'needs_pricing').length,
    readyForReview: drafts.filter((draft) => draft.status === 'ready_for_review').length,
    riskCount: drafts.filter((draft) => draft.status === 'risk_review' || draft.riskFlags.length > 0).length,
  };
}

export function buildProposalDraftReport(draft: SalesProposalDraft) {
  return {
    title: draft.title,
    slug: draft.draftId,
    summary: {
      prospectName: draft.prospectName,
      template: salesProposalTemplateLabels[draft.templateType],
      status: draft.status,
      draftOnly: 'Yes',
      notSent: 'Yes',
      notInvoiced: 'Yes',
      localOnly: 'Yes',
      productionWritesOccurred: 'No',
    },
    rows: [
      {
        estimatedValue: draft.estimatedValue,
        followUpDate: draft.followUpDate ?? 'Not scheduled',
        monthlyPrice: draft.monthlyPrice ?? 'Missing',
        nextStep: draft.nextStep,
        recommendedPackage: draft.recommendedPackage,
        setupFee: draft.setupFee ?? 'Missing',
      },
    ],
    sections: [
      { title: 'Pain Points', rows: draft.painPoints.map((painPoint) => ({ painPoint })) },
      { title: 'Risk Flags', rows: draft.riskFlags.length ? draft.riskFlags.map((riskFlag) => ({ riskFlag })) : [{ riskFlag: 'None' }] },
      { title: 'Proposal Draft Markdown', rows: [{ markdown: draft.previewMarkdown }] },
    ],
  };
}

function buildPainPoints(lead: SalesLead, proposal: ProposalPrep | undefined, templateType: SalesProposalTemplateType): string[] {
  const base = [
    lead.notes || 'Discovery notes need to be confirmed.',
    lead.memberCount ? `${lead.memberCount} member record(s) or customer workflows need clean operational support.` : '',
    lead.currentClients ? `${lead.currentClients} client(s) need consistent coaching visibility.` : '',
    proposal?.migrationNeeded ? 'Migration/import work needs owner review before any production move.' : '',
  ].filter(Boolean);

  const templatePoint =
    templateType === 'white_label'
      ? 'Needs a partner-branded experience without custom production commitments in this draft.'
      : templateType === 'migration_data_import'
        ? 'Needs a safe import plan before member or customer data is promoted.'
        : templateType === 'independent_coach'
          ? 'Needs a lightweight client operating system without extra admin overhead.'
          : 'Needs clearer member experience and operator workflow visibility.';

  return [...base, templatePoint].slice(0, 4);
}

function buildRiskFlags(lead: SalesLead, monthlyPrice: number | null, setupFee: number | null, migrationFee: number): string[] {
  return [
    !lead.email ? 'Missing email for future approved send path.' : '',
    !lead.phone ? 'Missing phone for future approved contact path.' : '',
    !monthlyPrice || !setupFee ? 'Pricing needs review before external use.' : '',
    lead.status === 'paused' ? 'Lead is paused; review before advancing.' : '',
    migrationFee > 0 ? 'Migration pricing included; confirm import scope before review.' : '',
  ].filter(Boolean);
}

function buildProposalMarkdown(draft: SalesProposalDraft, lead: SalesLead): string {
  return [
    `# ${draft.title}`,
    '',
    '**Safety status:** Draft only. Not sent. Not invoiced. Local only.',
    '',
    `## Prospect`,
    `- Name: ${draft.prospectName}`,
    `- Type: ${draft.prospectType}`,
    `- Location: ${lead.location}`,
    '',
    `## Recommended Vyra Package`,
    `- Package: ${draft.recommendedPackage}`,
    `- Estimated value: ${formatCurrency(draft.estimatedValue)}`,
    `- Setup / migration fee: ${draft.setupFee === null ? 'Missing pricing' : formatCurrency(draft.setupFee)}`,
    `- Monthly price: ${draft.monthlyPrice === null ? 'Missing pricing' : formatCurrency(draft.monthlyPrice)}`,
    '',
    `## Pain Points`,
    ...draft.painPoints.map((painPoint) => `- ${painPoint}`),
    '',
    `## Proposed Next Step`,
    draft.nextStep,
    '',
    `## Follow-Up`,
    draft.followUpDate ? new Date(draft.followUpDate).toLocaleDateString() : 'Not scheduled',
    '',
    `## Review Flags`,
    ...(draft.riskFlags.length ? draft.riskFlags.map((riskFlag) => `- ${riskFlag}`) : ['- None']),
  ].join('\n');
}
