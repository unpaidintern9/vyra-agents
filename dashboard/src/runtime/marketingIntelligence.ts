import type { ExecutivePlanningSummary } from './executivePlanning';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';
import type { SalesOpportunity, SharedMemoryStore } from '../agents/sales/salesTypes';

export interface MarketingEvaluation {
  score: number;
  label: string;
  confidence: number;
  risks: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface MarketingDashboardSummary {
  brand: {
    brandName: string;
    assetReferences: Array<{ name: string; type: string; status: string; localReference: string; notes: string }>;
    colors: Array<{ token: string; value: string; source: string }>;
    typography: Array<{ name: string; value: string; source: string }>;
    brandVoice: string[];
    approvedMessaging: string[];
    wordsToUse: string[];
    wordsToAvoid: string[];
    visualStyleNotes: string[];
  };
  products: Array<{ id: string; name: string; audience: string[]; features: string[]; pricing: string; positioning: string; launchStatus: string; linkedCampaigns: string[] }>;
  audiences: Array<{ id: string; name: string; goals: string[]; painPoints: string[]; objections: string[]; motivations: string[]; recommendedMessaging: string[]; preferredChannels: string[]; contentIdeas: string[] }>;
  content: Array<{ id: string; title: string; type: string; audience: string; product: string; status: string; owner: string; approvalStatus: string; linkedCampaign: string; linkedGoal: string; linkedTask: string; notes: string[] }>;
  campaigns: Array<{ campaignId: string; name: string; objective: string; audience: string[]; products: string[]; channels: string[]; status: string; risks: string[]; nextActions: string[] }>;
  calendar: Array<{ id: string; type: string; title: string; date: string; linkedCampaign: string; status: string; publishingEnabled: boolean }>;
  approvals: Array<{ id: string; item: string; owner: string; status: string; reason: string; linkedCampaign: string }>;
  readiness: Record<string, MarketingEvaluation>;
  executiveOverview: {
    brandHealth: number;
    campaignPipeline: number;
    contentProgress: number;
    upcomingLaunches: number;
    approvalsPending: number;
  };
  salesSupport: Array<{ asset: string; product: string; audience: string; message: string; status: string }>;
  contentStudio: {
    drafts: Array<{ draftId: string; title: string; type: string; audience: string; product: string; campaign: string; status: string; approvalStatus: string; brandConsistencyScore: number; readinessScore: number; body: string }>;
    brandChecks: Array<{ id: string; draftId: string; score: number; confidence: number; risks: string[]; violations: string[]; nextActions: string[] }>;
    approvals: Array<{ id: string; draftId: string; title: string; reviewer: string; status: string; reason: string }>;
    summary: { drafts: number; needsReview: number; brandRiskQueue: number; averageBrandConsistency: number; averageReadiness: number };
  };
  safety: {
    localOnly: boolean;
    publishing: boolean;
    socialPosting: boolean;
    emailing: boolean;
    adBuying: boolean;
    externalCrmSync: boolean;
    automaticApproval: boolean;
  };
}

export function buildDashboardMarketingSummary(input: {
  executivePlanning?: ExecutivePlanningSummary;
  opportunities: SalesOpportunity[];
  sharedMemory?: SharedMemoryStore;
  sharedTasks?: SharedTaskDashboardSummary;
}): MarketingDashboardSummary {
  const brand = {
    brandName: 'Vyra Performance',
    assetReferences: [
      { name: 'Dashboard V brand mark', type: 'logo mark', status: 'confirmed', localReference: 'dashboard/src/styles.css:.brand-mark', notes: 'Confirmed local V mark; no standalone logo file found.' },
      { name: 'Dashboard color tokens', type: 'colors', status: 'confirmed', localReference: 'dashboard/src/styles.css::root', notes: 'Confirmed local dark surface and green accent tokens.' },
      { name: 'Dashboard typography stack', type: 'typography', status: 'confirmed', localReference: 'dashboard/src/styles.css::root', notes: 'Inter/system sans stack is used.' },
      { name: 'Product screenshots', type: 'product screenshots', status: 'missing', localReference: '', notes: 'No local product screenshot image files found.' },
      { name: 'Standalone logo files', type: 'logos', status: 'missing', localReference: '', notes: 'No local logo image file found.' },
    ],
    colors: [
      { token: '--accent', value: '#8de0c2', source: 'dashboard/src/styles.css' },
      { token: '--surface', value: 'rgba(15, 21, 30, 0.82)', source: 'dashboard/src/styles.css' },
      { token: '--text-muted', value: '#9fb0c5', source: 'dashboard/src/styles.css' },
    ],
    typography: [{ name: 'Dashboard sans stack', value: 'Inter/system sans', source: 'dashboard/src/styles.css' }],
    brandVoice: ['clear', 'performance-focused', 'operator-friendly', 'practical'],
    approvedMessaging: ['Vyra Performance connects training, coaching, gym operations, and growth workflows.'],
    wordsToUse: ['performance', 'training', 'coach-led', 'athlete experience', 'gym operations'],
    wordsToAvoid: ['guaranteed results', 'instant transformation', 'autopublish', 'blast'],
    visualStyleNotes: ['Use dark operational surfaces, restrained green accents, compact cards, and real product imagery when available.'],
  };
  const products = [
    product('prod-athlete-app', 'Athlete App', ['athletes'], 'Athlete-facing performance companion for training accountability.', 'foundation'),
    product('prod-coach-platform', 'Coach Platform', ['independent coaches', 'strength coaches', 'nutrition coaches'], 'Coach workspace for athlete progress and training delivery.', 'foundation'),
    product('prod-gym-software', 'Gym Software', ['gym owners', 'gym managers'], 'Gym operations software for member experience and growth follow-through.', 'foundation'),
    product('prod-white-label', 'White Label Platform', ['sports organizations', 'enterprise gyms', 'schools'], 'Partner-branded performance experience planning.', 'planned'),
    product('prod-sales-crm-tools', 'Sales/CRM tools', ['gym owners', 'gym managers'], 'Local sales execution tooling for pipeline follow-through.', 'active_local'),
    product('prod-future-vyra', 'Future Vyra products', ['athletes', 'coaches', 'gyms'], 'Future product family records for planning without public claims.', 'future'),
  ];
  const audiences = audienceRows();
  const campaigns = [
    campaign('camp-athlete-app-foundation', 'Athlete App Foundation', 'Prepare launch-ready Athlete App messaging and asset gaps.', ['athletes', 'independent coaches'], ['prod-athlete-app', 'prod-coach-platform'], ['landing page', 'newsletter', 'social drafts']),
    campaign('camp-gym-growth-readiness', 'Gym Growth Readiness', 'Support Sales with gym owner messaging and local content assets.', ['gym owners', 'gym managers'], ['prod-gym-software', 'prod-sales-crm-tools'], ['sales enablement', 'blog', 'FAQ']),
    campaign('camp-white-label-positioning', 'White Label Positioning', 'Clarify white label audience and approval needs before public claims.', ['sports organizations', 'enterprise gyms', 'schools'], ['prod-white-label'], ['one-pager', 'case study outline']),
  ];
  const contentTypes = ['landing page', 'blog post', 'social post', 'email draft', 'newsletter', 'product announcement', 'release notes', 'video', 'podcast idea', 'FAQ', 'case study', 'testimonial'];
  const content = contentTypes.map((type, index) => ({
    id: `content-${type.replace(/\s+/g, '-')}`,
    title: `${titleCase(type)} for ${campaigns[index % campaigns.length].name}`,
    type,
    audience: campaigns[index % campaigns.length].audience[0],
    product: campaigns[index % campaigns.length].products[0],
    status: index < 3 ? 'draft' : 'planned',
    owner: 'Marketing',
    approvalStatus: 'pending',
    linkedCampaign: campaigns[index % campaigns.length].campaignId,
    linkedGoal: input.executivePlanning?.goals[index % Math.max(input.executivePlanning.goals.length, 1)]?.goalId ?? 'goal-marketing-foundation',
    linkedTask: input.sharedTasks?.universalQueues['Marketing Queue']?.[index]?.id ?? '',
    notes: ['Draft/planning only. No publishing, sending, posting, or paid promotion.'],
  }));
  const calendar = campaigns.map((campaignItem, index) => ({
    id: `mkt-calendar-${index + 1}`,
    type: index === 0 ? 'launch' : index === 1 ? 'campaign' : 'content schedule',
    title: campaignItem.name,
    date: new Date(Date.UTC(2026, 6, 8 + index * 7, 14)).toISOString(),
    linkedCampaign: campaignItem.campaignId,
    status: 'planned',
    publishingEnabled: false,
  }));
  const approvals = [
    { id: 'mkt-approval-brand-assets', item: 'Confirm official logo and product screenshots', owner: 'Marketing', status: 'pending', reason: 'Brand asset gaps must be reviewed before public use.', linkedCampaign: campaigns[0].campaignId },
    { id: 'mkt-approval-launch-messaging', item: 'Review Athlete App launch messaging', owner: 'Executive', status: 'pending', reason: 'Launch messaging requires human approval.', linkedCampaign: campaigns[0].campaignId },
  ];
  const readiness = {
    brandCompleteness: evaluation(54, 'Needs Review', ['Standalone logo files and product screenshots missing.']),
    productMessagingReadiness: evaluation(82, 'Ready for Internal Review', ['Pricing is not confirmed locally for several products.']),
    audienceCoverage: evaluation(90, 'Strong', []),
    contentReadiness: evaluation(36, 'Planning', ['Most content is planned, not approved.']),
    campaignReadiness: evaluation(66, 'Planning', ['Campaigns require approval before publishing.']),
    launchReadiness: evaluation(60, 'Needs Review', ['Launch dates are planning records only.']),
  };
  const drafts = contentStudioDrafts(campaigns, products, audiences);
  const brandChecks = drafts.map((draft) => brandCheckForDraft(draft, brand));
  const draftApprovals = drafts.map((draft) => ({
    id: `mkt-draft-approval-${draft.draftId}`,
    draftId: draft.draftId,
    title: draft.title,
    reviewer: draft.status === 'needs_review' ? 'Executive' : 'Marketing',
    status: draft.status === 'needs_review' ? 'pending_review' : 'pending',
    reason: 'Draft requires human review before any external use.',
  }));
  return {
    brand,
    products,
    audiences,
    content,
    campaigns,
    calendar,
    approvals,
    readiness,
    executiveOverview: {
      brandHealth: readiness.brandCompleteness.score,
      campaignPipeline: campaigns.length,
      contentProgress: content.filter((item) => item.status === 'draft').length,
      upcomingLaunches: calendar.length,
      approvalsPending: approvals.filter((item) => item.status === 'pending').length,
    },
    salesSupport: input.opportunities.slice(0, 5).map((opportunity) => ({
      asset: 'Gym owner messaging brief',
      product: 'Gym Software',
      audience: 'gym owners',
      message: `${opportunity.company}: lead with member experience, retention, and local operations clarity.`,
      status: 'draft',
    })),
    contentStudio: {
      drafts,
      brandChecks,
      approvals: draftApprovals,
      summary: {
        drafts: drafts.length,
        needsReview: drafts.filter((draft) => draft.status === 'needs_review').length,
        brandRiskQueue: brandChecks.filter((check) => check.risks.length || check.violations.length).length,
        averageBrandConsistency: average(brandChecks.map((check) => check.score)),
        averageReadiness: average(drafts.map((draft) => draft.readinessScore)),
      },
    },
    safety: {
      localOnly: true,
      publishing: false,
      socialPosting: false,
      emailing: false,
      adBuying: false,
      externalCrmSync: false,
      automaticApproval: false,
    },
  };
}

function contentStudioDrafts(campaigns: MarketingDashboardSummary['campaigns'], products: MarketingDashboardSummary['products'], audiences: MarketingDashboardSummary['audiences']) {
  const types = ['campaign brief', 'landing page draft', 'email draft', 'newsletter draft', 'social post set', 'blog outline', 'launch announcement', 'release note', 'product messaging draft', 'ad copy draft', 'video brief', 'podcast brief', 'case study outline', 'FAQ draft'];
  return types.map((type, index) => {
    const campaignItem = campaigns[index % campaigns.length];
    const productItem = products.find((product) => campaignItem.products.includes(product.id)) ?? products[index % products.length];
    const audienceItem = audiences.find((audience) => audience.name === campaignItem.audience[0]) ?? audiences[index % audiences.length];
    const body = `${campaignItem.name} helps ${audienceItem.name} understand how ${productItem.name} supports clearer performance workflows. Review this draft internally before any external use.`;
    return {
      draftId: `mkt-draft-${type.replace(/\s+/g, '-')}-${campaignItem.campaignId}`,
      title: `${titleCase(type)}: ${campaignItem.name}`,
      type,
      audience: audienceItem.name,
      product: productItem.name,
      campaign: campaignItem.name,
      status: index % 5 === 0 ? 'needs_review' : 'draft',
      approvalStatus: index % 5 === 0 ? 'pending_review' : 'pending',
      brandConsistencyScore: type === 'ad copy draft' ? 80 : 92,
      readinessScore: type === 'ad copy draft' ? 72 : 86,
      body,
    };
  });
}

function brandCheckForDraft(draft: MarketingDashboardSummary['contentStudio']['drafts'][number], brand: MarketingDashboardSummary['brand']) {
  const text = `${draft.title} ${draft.body}`.toLowerCase();
  const violations = brand.wordsToAvoid.filter((word) => text.includes(word.toLowerCase()));
  const risks = [
    violations.length ? 'Avoided brand wording present.' : null,
    draft.type === 'ad copy draft' ? 'Paid ad execution remains disabled and copy needs review.' : null,
    draft.type === 'email draft' ? 'Email sending is disabled; draft only.' : null,
  ].filter(Boolean) as string[];
  return {
    id: `brand-check-${draft.draftId}`,
    draftId: draft.draftId,
    score: Math.max(40, draft.brandConsistencyScore - violations.length * 15),
    confidence: risks.length ? 72 : 86,
    risks,
    violations,
    nextActions: risks.length ? ['Request edits before approval.'] : ['Submit for human review.'],
  };
}

function product(id: string, name: string, audience: string[], positioning: string, launchStatus: string) {
  return {
    id,
    name,
    audience,
    features: ['Audience workflow', 'Messaging support', 'Readiness planning'],
    pricing: launchStatus === 'active_local' ? 'internal/local tooling' : 'pricing not confirmed locally',
    positioning,
    launchStatus,
    linkedCampaigns: [],
  };
}

function campaign(campaignId: string, name: string, objective: string, audience: string[], products: string[], channels: string[]) {
  return {
    campaignId,
    name,
    objective,
    audience,
    products,
    channels,
    status: 'planning',
    risks: ['Official logo and screenshot assets are not confirmed locally.'],
    nextActions: ['Confirm brand assets.', 'Review messaging with Sales and Executive.', 'Prepare draft-only content.'],
  };
}

function audienceRows() {
  return ['athletes', 'independent coaches', 'gym owners', 'gym managers', 'personal trainers', 'strength coaches', 'nutrition coaches', 'sports organizations', 'schools', 'enterprise gyms'].map((name) => ({
    id: `aud-${name.replace(/\s+/g, '-')}`,
    name,
    goals: ['Improve performance workflow clarity'],
    painPoints: ['Scattered tools', 'Manual follow-through'],
    objections: ['Needs proof and clear setup path'],
    motivations: ['Better training and operational outcomes'],
    recommendedMessaging: [`Use practical ${name} language focused on performance and clarity.`],
    preferredChannels: ['landing page', 'newsletter', 'sales enablement'],
    contentIdeas: [`${name} readiness guide`, `${name} workflow checklist`],
  }));
}

function evaluation(score: number, label: string, risks: string[]): MarketingEvaluation {
  return {
    score,
    label,
    confidence: risks.length ? 72 : 84,
    risks,
    recommendations: risks.length ? ['Resolve missing inputs before publishing.'] : ['Continue internal review cadence.'],
    nextActions: risks.length ? ['Assign an owner for the highest-risk missing input.'] : ['Prepare next approval review.'],
  };
}

function average(values: number[]): number {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : 0;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (match) => match.toUpperCase());
}
