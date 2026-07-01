import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSharedMemoryStore } from './shared-memory-runtime.mjs';
import { listSharedTasks } from './shared-task-runtime.mjs';
import { getExecutivePlanningSummary } from './executive-planning-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const marketingRoot = path.join(repoRoot, 'codex-agent-threads/shared/marketing');
const reportsRoot = path.join(marketingRoot, 'reports');
const contentStudioRoot = path.join(marketingRoot, 'content-studio');
const contentStudioReportsRoot = path.join(contentStudioRoot, 'reports');
const files = {
  brand: path.join(marketingRoot, 'brand-intelligence.json'),
  products: path.join(marketingRoot, 'product-intelligence.json'),
  audiences: path.join(marketingRoot, 'audience-intelligence.json'),
  content: path.join(marketingRoot, 'content-library.json'),
  campaigns: path.join(marketingRoot, 'campaign-planner.json'),
  calendar: path.join(marketingRoot, 'marketing-calendar.json'),
  approvals: path.join(marketingRoot, 'approval-queue.json'),
  readiness: path.join(marketingRoot, 'marketing-readiness.json'),
  drafts: path.join(contentStudioRoot, 'drafts.json'),
  brandChecks: path.join(contentStudioRoot, 'brand-checks.json'),
  draftApprovals: path.join(contentStudioRoot, 'approvals.json'),
  draftAudit: path.join(contentStudioRoot, 'draft-audit-history.json'),
};

const safety = {
  localOnly: true,
  autonomousPublishing: false,
  autonomousSocialPosting: false,
  autonomousEmailing: false,
  paidAdExecution: false,
  externalCrmSync: false,
  automaticApproval: false,
  inventedBrandAssets: false,
  governmentContractingLogic: false,
  samGovLogic: false,
  federalProposalLogic: false,
  unsupportedClaims: false,
  healthFitnessClaimsWithoutReview: false,
};

export function getMarketingBrand() {
  const store = readMarketingStore();
  return { title: 'Marketing Brand Intelligence', generatedAt: stamp(), brand: store.brand, readiness: store.readiness.brandCompleteness, safety };
}

export function getMarketingProducts() {
  const store = readMarketingStore();
  return { title: 'Marketing Product Intelligence', generatedAt: stamp(), products: store.products, readiness: store.readiness.productMessagingReadiness, safety };
}

export function getMarketingAudiences() {
  const store = readMarketingStore();
  return { title: 'Marketing Audience Intelligence', generatedAt: stamp(), audiences: store.audiences, readiness: store.readiness.audienceCoverage, safety };
}

export function getMarketingContent() {
  const store = readMarketingStore();
  return { title: 'Marketing Content Library', generatedAt: stamp(), content: store.content, readiness: store.readiness.contentReadiness, safety };
}

export function getMarketingCampaigns() {
  const store = readMarketingStore();
  return { title: 'Marketing Campaign Planner', generatedAt: stamp(), campaigns: store.campaigns, readiness: store.readiness.campaignReadiness, safety };
}

export function getMarketingCalendar() {
  const store = readMarketingStore();
  return { title: 'Marketing Calendar', generatedAt: stamp(), calendar: store.calendar, readiness: store.readiness.launchReadiness, safety };
}

export function getMarketingDrafts() {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  return { title: 'Marketing Content Studio Drafts', generatedAt: stamp(), drafts: studio.drafts, summary: summarizeContentStudio(studio), safety };
}

export function createMarketingDraft(options = {}) {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  const type = process.env.MARKETING_DRAFT_TYPE ?? options.type ?? 'campaign brief';
  const campaign = store.campaigns.find((item) => item.campaignId === (process.env.MARKETING_CAMPAIGN_ID ?? options.campaignId)) ?? store.campaigns[0];
  const product = store.products.find((item) => item.id === (process.env.MARKETING_PRODUCT_ID ?? options.productId)) ?? store.products.find((item) => campaign.products.includes(item.id)) ?? store.products[0];
  const audience = store.audiences.find((item) => item.id === (process.env.MARKETING_AUDIENCE_ID ?? options.audienceId)) ?? store.audiences.find((item) => item.name === campaign.audience[0]) ?? store.audiences[0];
  const now = stamp();
  const draft = buildDraft({ type, campaign, product, audience, store, now, index: studio.drafts.length + 1 });
  const brandCheck = evaluateDraftBrandConsistency(draft, store);
  const next = {
    ...studio,
    drafts: [draft, ...studio.drafts.filter((item) => item.draftId !== draft.draftId)],
    brandChecks: [brandCheck, ...studio.brandChecks.filter((item) => item.draftId !== draft.draftId)],
    approvals: [approvalRecord(draft, 'pending', 'Created draft; approval required before any external use.', now), ...studio.approvals],
    auditHistory: [auditEvent(draft.draftId, null, draft.status, 'Marketing Content Studio', 'Draft generated locally.', 'draft_created', now), ...studio.auditHistory],
  };
  writeContentStudioStore(next);
  return { title: 'Marketing Draft Created', generatedAt: now, draft, brandCheck, safety };
}

export function getMarketingBrandCheck() {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  return { title: 'Marketing Brand Check Results', generatedAt: stamp(), brandChecks: studio.brandChecks, safety };
}

export function submitMarketingDraft() {
  return transitionDraft('needs_review', 'submitted_for_review', 'Draft submitted for local review.');
}

export function approveMarketingDraft() {
  return transitionDraft('approved', 'draft_approved', 'Draft approved for internal use only. Publishing remains disabled.');
}

export function rejectMarketingDraft() {
  return transitionDraft('rejected', 'draft_rejected', 'Draft rejected locally; no external action created.');
}

export function archiveMarketingDraft() {
  return transitionDraft('archived', 'draft_archived', 'Draft archived locally.');
}

export function buildMarketingBrandReport() {
  return writeMarketingReport('brand-intelligence-report', {
    title: 'Brand Intelligence Report',
    generatedAt: stamp(),
    brand: readMarketingStore().brand,
    safety,
  });
}

export function buildMarketingCampaignReport() {
  const store = readMarketingStore();
  return writeMarketingReport('campaign-planning-report', {
    title: 'Campaign Planning Report',
    generatedAt: stamp(),
    campaigns: store.campaigns,
    calendar: store.calendar,
    readiness: store.readiness.campaignReadiness,
    safety,
  });
}

export function buildMarketingContentReport() {
  const store = readMarketingStore();
  return writeMarketingReport('content-library-report', {
    title: 'Content Library Report',
    generatedAt: stamp(),
    content: store.content,
    readiness: store.readiness.contentReadiness,
    safety,
  });
}

export function buildContentStudioReport() {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  return writeContentStudioReport('content-studio-report', {
    title: 'Content Studio Report',
    generatedAt: stamp(),
    summary: summarizeContentStudio(studio),
    workflows: contentStudioWorkflows(),
    drafts: studio.drafts,
    safety,
  });
}

export function buildMarketingDraftReport() {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  return writeContentStudioReport('draft-library-report', {
    title: 'Draft Library Report',
    generatedAt: stamp(),
    drafts: studio.drafts,
    brandChecks: studio.brandChecks,
    approvals: studio.approvals,
    safety,
  });
}

export function buildMarketingReports() {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  const reports = {
    'brand-intelligence-report': { title: 'Brand Intelligence Report', generatedAt: stamp(), brand: store.brand, safety },
    'product-messaging-report': { title: 'Product Messaging Report', generatedAt: stamp(), products: store.products, safety },
    'audience-intelligence-report': { title: 'Audience Intelligence Report', generatedAt: stamp(), audiences: store.audiences, safety },
    'content-library-report': { title: 'Content Library Report', generatedAt: stamp(), content: store.content, safety },
    'campaign-planning-report': { title: 'Campaign Planning Report', generatedAt: stamp(), campaigns: store.campaigns, safety },
    'marketing-calendar-report': { title: 'Marketing Calendar Report', generatedAt: stamp(), calendar: store.calendar, safety },
    'marketing-readiness-report': { title: 'Marketing Readiness Report', generatedAt: stamp(), readiness: store.readiness, safety },
    'executive-marketing-summary': { title: 'Executive Marketing Summary', generatedAt: stamp(), summary: summarizeMarketing(store), safety },
    'brand-consistency-report': { title: 'Brand Consistency Report', generatedAt: stamp(), consistency: brandConsistency(store), safety },
    'content-studio-report': { title: 'Content Studio Report', generatedAt: stamp(), summary: summarizeContentStudio(studio), workflows: contentStudioWorkflows(), safety },
    'draft-library-report': { title: 'Draft Library Report', generatedAt: stamp(), drafts: studio.drafts, safety },
    'draft-approval-report': { title: 'Draft Approval Report', generatedAt: stamp(), approvals: studio.approvals, safety },
    'campaign-content-report': { title: 'Campaign Content Report', generatedAt: stamp(), rows: campaignContentRows(studio), safety },
    'launch-content-report': { title: 'Launch Content Report', generatedAt: stamp(), rows: studio.drafts.filter((draft) => ['launch announcement', 'release note'].includes(draft.type)), safety },
    'sales-enablement-content-report': { title: 'Sales Enablement Content Report', generatedAt: stamp(), rows: studio.drafts.filter((draft) => ['product messaging draft', 'FAQ draft', 'case study outline'].includes(draft.type)), safety },
    'executive-marketing-draft-summary': { title: 'Executive Marketing Draft Summary', generatedAt: stamp(), summary: summarizeContentStudio(studio), brandRiskQueue: studio.brandChecks.filter((check) => check.risks.length || check.violations.length), safety },
  };
  return {
    title: 'Marketing Reports Generated',
    generatedAt: stamp(),
    written: Object.entries(reports).map(([slug, payload]) => writeMarketingReport(slug, payload)),
    safety,
  };
}

export function validateMarketing() {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  const errors = [];
  if (!store.brand?.brandName) errors.push('brand intelligence missing');
  if (!Array.isArray(store.products) || store.products.length < 6) errors.push('product intelligence incomplete');
  if (!Array.isArray(store.audiences) || store.audiences.length < 10) errors.push('audience intelligence incomplete');
  if (!Array.isArray(store.content) || store.content.length < 10) errors.push('content library incomplete');
  if (!Array.isArray(store.campaigns) || !store.campaigns.length) errors.push('campaign planner missing');
  if (!Array.isArray(store.calendar) || !store.calendar.length) errors.push('marketing calendar missing');
  if (!Array.isArray(store.approvals)) errors.push('approval queue missing');
  if (!Array.isArray(studio.drafts) || studio.drafts.length < 10) errors.push('content studio drafts incomplete');
  if (!Array.isArray(studio.brandChecks) || studio.brandChecks.length !== studio.drafts.length) errors.push('brand checks incomplete');
  if (!Array.isArray(studio.approvals)) errors.push('draft approvals missing');
  if (!Array.isArray(studio.auditHistory) || !studio.auditHistory.length) errors.push('draft audit history missing');
  for (const draft of studio.drafts) {
    ['draftId', 'title', 'type', 'audience', 'product', 'campaign', 'owner', 'status', 'approvalStatus', 'brandConsistencyScore', 'readinessScore', 'linkedCampaign', 'linkedContentItem', 'createdAt', 'updatedAt'].forEach((field) => {
      if (draft[field] === undefined || draft[field] === '') errors.push(`${draft.draftId ?? 'draft'} missing ${field}`);
    });
    if (draft.status === 'approved' && draft.publishingEnabled) errors.push(`${draft.draftId} approved draft enables publishing`);
  }
  for (const asset of store.brand.assetReferences) {
    if (asset.status === 'confirmed' && !asset.localReference) errors.push(`${asset.name} confirmed without local reference`);
  }
  const prohibited = JSON.stringify(store).toLowerCase();
  ['valor', 'sam.gov', 'sam gov', 'federal proposal', 'government contract'].forEach((term) => {
    if (prohibited.includes(term)) errors.push(`prohibited term present: ${term}`);
  });
  const reports = buildMarketingReports();
  return {
    title: 'Marketing Agent Validation',
    generatedAt: stamp(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands: marketingCommands,
    storageRoot: path.relative(repoRoot, marketingRoot),
    reportCount: reports.written.length,
    summary: summarizeMarketing(store),
    contentStudioSummary: summarizeContentStudio(studio),
    safety,
  };
}

export function readMarketingStore() {
  ensureMarketingStorage();
  return {
    brand: readJson(files.brand, null),
    products: readJson(files.products, []),
    audiences: readJson(files.audiences, []),
    content: readJson(files.content, []),
    campaigns: readJson(files.campaigns, []),
    calendar: readJson(files.calendar, []),
    approvals: readJson(files.approvals, []),
    readiness: readJson(files.readiness, {}),
    contentStudio: readContentStudioStore({}),
  };
}

export const marketingCommands = [
  'marketing:brand',
  'marketing:products',
  'marketing:audiences',
  'marketing:content',
  'marketing:campaigns',
  'marketing:calendar',
  'marketing:brand-report',
  'marketing:campaign-report',
  'marketing:content-report',
  'marketing:drafts',
  'marketing:create-draft',
  'marketing:brand-check',
  'marketing:submit-draft',
  'marketing:approve-draft',
  'marketing:reject-draft',
  'marketing:archive-draft',
  'marketing:content-studio-report',
  'marketing:draft-report',
  'marketing:validate',
];

function ensureMarketingStorage() {
  mkdirSync(marketingRoot, { recursive: true });
  mkdirSync(reportsRoot, { recursive: true });
  mkdirSync(contentStudioRoot, { recursive: true });
  mkdirSync(contentStudioReportsRoot, { recursive: true });
  if (existsSync(files.brand)) return;
  const now = '2026-07-01T14:00:00.000Z';
  const store = seedMarketingStore(now);
  writeJson(files.brand, store.brand);
  writeJson(files.products, store.products);
  writeJson(files.audiences, store.audiences);
  writeJson(files.content, store.content);
  writeJson(files.campaigns, store.campaigns);
  writeJson(files.calendar, store.calendar);
  writeJson(files.approvals, store.approvals);
  writeJson(files.readiness, store.readiness);
  writeContentStudioStore(seedContentStudioStore(store, now));
}

function seedMarketingStore(now) {
  const memory = buildSharedMemoryStore();
  const planning = getExecutivePlanningSummary();
  const tasks = listSharedTasks().map((item) => item.parsed);
  const brand = {
    id: 'brand-vyra-performance',
    brandName: 'Vyra Performance',
    description: 'Performance platform for athletes, coaches, gyms, and fitness organizations.',
    assetReferences: [
      { name: 'Dashboard V brand mark', type: 'logo mark', status: 'confirmed', localReference: 'dashboard/src/styles.css:.brand-mark', notes: 'Local app uses a V mark. No standalone logo file found.' },
      { name: 'Dashboard color tokens', type: 'colors', status: 'confirmed', localReference: 'dashboard/src/styles.css::root', notes: 'Confirmed local tokens include dark surface colors and green accent.' },
      { name: 'Dashboard typography stack', type: 'typography', status: 'confirmed', localReference: 'dashboard/src/styles.css::root font-family', notes: 'Inter/system sans stack is used in the local dashboard.' },
      { name: 'Product screenshots', type: 'product screenshots', status: 'missing', localReference: '', notes: 'No product screenshot image files found locally.' },
      { name: 'Standalone logo files', type: 'logos', status: 'missing', localReference: '', notes: 'No local logo image file found.' },
    ],
    colors: [
      { token: '--accent', value: '#8de0c2', source: 'dashboard/src/styles.css' },
      { token: '--surface', value: 'rgba(15, 21, 30, 0.82)', source: 'dashboard/src/styles.css' },
      { token: '--text-muted', value: '#9fb0c5', source: 'dashboard/src/styles.css' },
      { token: 'brand mark background', value: '#10251f', source: 'dashboard/src/styles.css' },
    ],
    typography: [{ name: 'Dashboard sans stack', value: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', source: 'dashboard/src/styles.css' }],
    brandVoice: ['clear', 'performance-focused', 'operator-friendly', 'practical', 'confident without hype'],
    approvedMessaging: [
      'Built for athletes, coaches, and gyms that need clearer performance workflows.',
      'Local planning records only until a human approves publishing.',
      'Vyra Performance connects training, coaching, gym operations, and growth workflows.',
    ],
    wordsToUse: ['performance', 'training', 'coach-led', 'athlete experience', 'gym operations', 'readiness', 'local-first'],
    wordsToAvoid: ['guaranteed results', 'instant transformation', 'set it and forget it', 'autopublish', 'blast'],
    visualStyleNotes: ['Use dark operational surfaces, restrained green accents, compact cards, clear status badges, and real product imagery when available.'],
    createdAt: now,
    updatedAt: now,
  };
  const products = productSeeds(planning.goals.map((goal) => goal.goalId ?? goal.id).filter(Boolean));
  const audiences = audienceSeeds();
  const campaigns = campaignSeeds(now, tasks);
  const content = contentSeeds(campaigns, planning.goals);
  const calendar = calendarSeeds(campaigns, content);
  const approvals = [
    { id: 'mkt-approval-brand-assets', item: 'Confirm official logo and product screenshots', owner: 'Marketing', status: 'pending', reason: 'Brand asset gaps must be reviewed before public use.', linkedCampaign: campaigns[0].campaignId },
    { id: 'mkt-approval-launch-messaging', item: 'Review Athlete App launch messaging', owner: 'Executive', status: 'pending', reason: 'Launch messaging requires human approval.', linkedCampaign: campaigns[0].campaignId },
  ];
  const readiness = readinessScores({ brand, products, audiences, content, campaigns, calendar });
  return { brand, products, audiences, content, campaigns, calendar, approvals, readiness, memoryEntityCount: memory.summary.entityCount };
}

function productSeeds(goalIds) {
  return [
    product('prod-athlete-app', 'Athlete App', ['athletes'], ['Training plan view', 'Progress tracking', 'Coach communication', 'Performance history'], 'Athlete-facing performance companion for training accountability.', ['Connects athletes to coach-led training workflows.'], 'pricing not confirmed locally', 'foundation', goalIds),
    product('prod-coach-platform', 'Coach Platform', ['independent coaches', 'strength coaches', 'nutrition coaches'], ['Client roster', 'Programming workflow', 'Progress review', 'Messaging prep'], 'Coach workspace for managing athlete progress and training delivery.', ['Supports coach-led operations without generic admin clutter.'], 'pricing not confirmed locally', 'foundation', goalIds),
    product('prod-gym-software', 'Gym Software', ['gym owners', 'gym managers', 'enterprise gyms'], ['Member operations', 'Class/program support', 'Retention workflows', 'Local CRM handoff'], 'Gym operations software for member experience and growth follow-through.', ['Bridges Sales/CRM signals with gym operations planning.'], 'pricing not confirmed locally', 'foundation', goalIds),
    product('prod-white-label', 'White Label Platform', ['sports organizations', 'enterprise gyms', 'schools'], ['Partner-branded experience', 'Configurable product surface', 'Organization-level workflows'], 'White label platform for organizations that need branded performance experiences.', ['Positioned for partner-branded rollout planning.'], 'pricing not confirmed locally', 'planned', goalIds),
    product('prod-sales-crm-tools', 'Sales/CRM tools', ['gym owners', 'gym managers'], ['Local opportunity tracking', 'Research intake', 'Follow-up planning', 'Task handoffs'], 'Local sales execution tooling for pipeline and prospect follow-through.', ['Already tied to local Sales Agent workflows.'], 'internal/local tooling', 'active_local', goalIds),
    product('prod-future-vyra', 'Future Vyra products', ['athletes', 'coaches', 'gyms'], ['Roadmap placeholder', 'Market feedback intake', 'Launch readiness planning'], 'Future product family records for marketing planning without public claims.', ['Keeps future messaging separate from approved product claims.'], 'not applicable', 'future', goalIds),
  ];
}

function product(id, name, audience, features, positioning, differentiators, pricing, launchStatus, linkedGoals) {
  return {
    id,
    name,
    audience,
    features,
    pricing,
    positioning,
    differentiators,
    faqs: [
      { question: `Who is ${name} for?`, answer: `${name} is planned for ${audience.join(', ')}.` },
      { question: 'Is pricing public?', answer: pricing.includes('not confirmed') ? 'No confirmed local pricing record is available yet.' : pricing },
    ],
    launchStatus,
    linkedAssets: ['brand-vyra-performance'],
    linkedGoals,
    linkedCampaigns: [],
  };
}

function audienceSeeds() {
  return [
    audience('aud-athletes', 'athletes', ['Train consistently', 'Understand progress'], ['Scattered plans', 'Low visibility'], ['Will this fit my training?'], ['Progress clarity', 'Coach connection'], ['Show progress and accountability.'], ['app', 'coach', 'newsletter']),
    audience('aud-independent-coaches', 'independent coaches', ['Manage clients', 'Save admin time'], ['Manual tracking', 'Follow-up drift'], ['Will this add work?'], ['Professional delivery'], ['Less admin, clearer athlete follow-through.'], ['email draft', 'landing page', 'demo']),
    audience('aud-gym-owners', 'gym owners', ['Grow retention', 'Improve operations'], ['Disconnected tools', 'Member churn'], ['Will staff use it?'], ['Operational clarity'], ['Member experience plus growth workflows.'], ['landing page', 'case study', 'sales enablement']),
    audience('aud-gym-managers', 'gym managers', ['Run daily operations', 'Coordinate staff'], ['Too many spreadsheets', 'Unclear handoffs'], ['Is setup hard?'], ['Cleaner daily workflow'], ['Make recurring work easier to see and own.'], ['checklist', 'video', 'FAQ']),
    audience('aud-personal-trainers', 'personal trainers', ['Keep clients engaged', 'Show outcomes'], ['Client accountability', 'Programming overhead'], ['Will clients adopt it?'], ['Better client experience'], ['A simple performance loop for trainer and client.'], ['social post', 'blog', 'email draft']),
    audience('aud-strength-coaches', 'strength coaches', ['Track athlete development', 'Scale programming'], ['Team visibility', 'Data scattered'], ['Can it handle groups?'], ['Performance credibility'], ['Organized training delivery for athletes and groups.'], ['video', 'landing page', 'FAQ']),
    audience('aud-nutrition-coaches', 'nutrition coaches', ['Support behavior change', 'Coordinate with training'], ['Low adherence', 'Fragmented notes'], ['Is nutrition core?'], ['Client progress'], ['Connect nutrition support to performance routines.'], ['blog', 'newsletter', 'FAQ']),
    audience('aud-sports-organizations', 'sports organizations', ['Standardize athlete support', 'Improve visibility'], ['Program inconsistency', 'Reporting gaps'], ['Can it fit our brand?'], ['Organization-level clarity'], ['Branded performance workflows for teams and programs.'], ['deck', 'case study', 'landing page']),
    audience('aud-schools', 'schools', ['Support student athletes', 'Coordinate programs'], ['Resource limits', 'Approval complexity'], ['Is it simple and safe?'], ['Better program structure'], ['Planning-focused messaging for school performance programs.'], ['FAQ', 'one-pager', 'webinar']),
    audience('aud-enterprise-gyms', 'enterprise gyms', ['Standardize multi-site operations', 'Protect brand experience'], ['Location variance', 'Reporting gaps'], ['Can it scale?'], ['Brand consistency'], ['Operational visibility across branded fitness locations.'], ['white paper', 'case study', 'demo']),
  ];
}

function audience(id, name, goals, painPoints, objections, motivations, recommendedMessaging, preferredChannels) {
  return {
    id,
    name,
    goals,
    painPoints,
    objections,
    motivations,
    recommendedMessaging,
    preferredChannels,
    contentIdeas: [`${name} workflow checklist`, `${name} readiness guide`, `${name} product FAQ`],
  };
}

function campaignSeeds(now, tasks) {
  return [
    campaign('camp-athlete-app-foundation', 'Athlete App Foundation', 'Prepare launch-ready Athlete App messaging and asset gaps.', ['athletes', 'independent coaches'], ['prod-athlete-app', 'prod-coach-platform'], ['landing page', 'newsletter', 'social drafts'], now, tasks),
    campaign('camp-gym-growth-readiness', 'Gym Growth Readiness', 'Support Sales with gym owner messaging and local content assets.', ['gym owners', 'gym managers'], ['prod-gym-software', 'prod-sales-crm-tools'], ['sales enablement', 'blog', 'FAQ'], now, tasks),
    campaign('camp-white-label-positioning', 'White Label Positioning', 'Clarify white label audience and approval needs before public claims.', ['sports organizations', 'enterprise gyms', 'schools'], ['prod-white-label'], ['one-pager', 'case study outline'], now, tasks),
  ];
}

function campaign(id, name, objective, audience, products, channels, now, tasks) {
  return {
    campaignId: id,
    name,
    objective,
    audience,
    products,
    channels,
    timeline: { start: now, target: new Date(Date.parse(now) + 21 * 86400000).toISOString() },
    messaging: [`${name} messaging stays draft-only until approved.`, 'Use confirmed Vyra Performance positioning and avoid unsupported claims.'],
    tasks: tasks.filter((task) => task.assignedAgent === 'Marketing' || task.category === 'Marketing').map((task) => task.id),
    approvals: ['Marketing approval required before publishing.'],
    kpis: ['content readiness', 'approval completion', 'audience coverage'],
    status: 'planning',
    risks: ['Official logo and screenshot assets are not confirmed locally.'],
    nextActions: ['Confirm brand assets.', 'Review messaging with Sales and Executive.', 'Prepare draft-only content.'],
  };
}

function contentSeeds(campaigns, goals) {
  const types = ['landing page', 'blog post', 'social post', 'email draft', 'newsletter', 'product announcement', 'release notes', 'video', 'podcast idea', 'FAQ', 'case study', 'testimonial'];
  return types.map((type, index) => ({
    id: `content-${slugify(type)}`,
    title: `${titleCase(type)} for ${campaigns[index % campaigns.length].name}`,
    type,
    audience: campaigns[index % campaigns.length].audience[0],
    product: campaigns[index % campaigns.length].products[0],
    status: index < 3 ? 'draft' : 'planned',
    owner: 'Marketing',
    approvalStatus: 'pending',
    linkedCampaign: campaigns[index % campaigns.length].campaignId,
    linkedGoal: goals[index % Math.max(goals.length, 1)]?.goalId ?? goals[index % Math.max(goals.length, 1)]?.id ?? 'goal-marketing-foundation',
    linkedTask: '',
    notes: ['Draft/planning record only. No publishing, sending, posting, or paid promotion.'],
  }));
}

function calendarSeeds(campaigns, content) {
  return campaigns.map((campaign, index) => ({
    id: `mkt-calendar-${index + 1}`,
    type: index === 0 ? 'launch' : index === 1 ? 'campaign' : 'content schedule',
    title: campaign.name,
    date: campaign.timeline.target,
    linkedCampaign: campaign.campaignId,
    linkedContent: content.filter((item) => item.linkedCampaign === campaign.campaignId).map((item) => item.id),
    status: 'planned',
    publishingEnabled: false,
  }));
}

function readinessScores({ brand, products, audiences, content, campaigns, calendar }) {
  const brandScore = brand.assetReferences.filter((asset) => asset.status === 'confirmed').length * 18;
  return {
    brandCompleteness: evaluation(Math.min(100, brandScore), 'Needs Review', 72, ['Standalone logo files and product screenshots missing.']),
    productMessagingReadiness: evaluation(82, 'Ready for Internal Review', 78, ['Pricing is not confirmed locally for several products.']),
    audienceCoverage: evaluation(audiences.length >= 10 ? 90 : 60, 'Strong', 82, []),
    contentReadiness: evaluation(content.filter((item) => item.status === 'draft').length * 12, 'Planning', 70, ['Most content is planned, not approved.']),
    campaignReadiness: evaluation(campaigns.length * 22, 'Planning', 74, ['Campaigns require approval before publishing.']),
    launchReadiness: evaluation(calendar.length * 20, 'Needs Review', 68, ['Launch dates are planning records only.']),
  };
}

function evaluation(score, label, confidence, risks) {
  return {
    score: Math.min(100, Math.round(score)),
    label,
    confidence,
    risks,
    recommendations: risks.length ? ['Resolve missing brand inputs.', 'Keep content in draft until approved.'] : ['Continue internal review cadence.'],
    nextActions: risks.length ? ['Assign owner for highest-risk missing input.'] : ['Prepare next approval review.'],
  };
}

function summarizeMarketing(store) {
  return {
    brandAssetsConfirmed: store.brand.assetReferences.filter((asset) => asset.status === 'confirmed').length,
    brandAssetsMissing: store.brand.assetReferences.filter((asset) => asset.status === 'missing').length,
    products: store.products.length,
    audiences: store.audiences.length,
    contentItems: store.content.length,
    campaigns: store.campaigns.length,
    calendarItems: store.calendar.length,
    approvalsPending: store.approvals.filter((item) => item.status === 'pending').length,
    averageReadiness: average(Object.values(store.readiness).map((item) => item.score)),
  };
}

function brandConsistency(store) {
  return {
    confirmedReferences: store.brand.assetReferences.filter((asset) => asset.status === 'confirmed'),
    missingReferences: store.brand.assetReferences.filter((asset) => asset.status === 'missing'),
    wordsToUse: store.brand.wordsToUse,
    wordsToAvoid: store.brand.wordsToAvoid,
    consistencyRisk: store.brand.assetReferences.some((asset) => asset.status === 'missing') ? 'needs_review' : 'low',
  };
}

function readContentStudioStore(store) {
  mkdirSync(contentStudioRoot, { recursive: true });
  mkdirSync(contentStudioReportsRoot, { recursive: true });
  if (!existsSync(files.drafts) && store?.brand) writeContentStudioStore(seedContentStudioStore(store, '2026-07-01T15:00:00.000Z'));
  return {
    drafts: readJson(files.drafts, []),
    brandChecks: readJson(files.brandChecks, []),
    approvals: readJson(files.draftApprovals, []),
    auditHistory: readJson(files.draftAudit, []),
  };
}

function writeContentStudioStore(studio) {
  mkdirSync(contentStudioRoot, { recursive: true });
  mkdirSync(contentStudioReportsRoot, { recursive: true });
  writeJson(files.drafts, studio.drafts);
  writeJson(files.brandChecks, studio.brandChecks);
  writeJson(files.draftApprovals, studio.approvals);
  writeJson(files.draftAudit, studio.auditHistory);
}

function seedContentStudioStore(store, now) {
  const types = ['campaign brief', 'landing page draft', 'email draft', 'newsletter draft', 'social post set', 'blog outline', 'launch announcement', 'release note', 'product messaging draft', 'ad copy draft', 'video brief', 'podcast brief', 'case study outline', 'FAQ draft'];
  const drafts = types.map((type, index) => {
    const campaign = store.campaigns[index % store.campaigns.length];
    const product = store.products.find((item) => campaign.products.includes(item.id)) ?? store.products[index % store.products.length];
    const audience = store.audiences.find((item) => item.name === campaign.audience[0]) ?? store.audiences[index % store.audiences.length];
    return buildDraft({ type, campaign, product, audience, store, now, index: index + 1 });
  });
  const brandChecks = drafts.map((draft) => evaluateDraftBrandConsistency(draft, store));
  const approvals = drafts.map((draft) => approvalRecord(draft, draft.status === 'needs_review' ? 'pending_review' : 'pending', 'Draft requires human review before any external use.', now));
  const auditHistory = drafts.map((draft) => auditEvent(draft.draftId, null, draft.status, 'Marketing Content Studio', 'Seeded draft-only content studio record.', 'draft_seeded', now));
  return { drafts, brandChecks, approvals, auditHistory };
}

function buildDraft({ type, campaign, product, audience, store, now, index }) {
  const content = store.content.find((item) => item.linkedCampaign === campaign.campaignId && item.product === product.id) ?? store.content[index % store.content.length];
  const title = `${titleCase(type)}: ${campaign.name}`;
  const body = draftBody(type, campaign, product, audience);
  const brandCheckPreview = lightweightBrandScore(body, store);
  return {
    draftId: `mkt-draft-${slugify(type)}-${slugify(campaign.name)}`,
    title,
    type,
    audience: audience.name,
    product: product.name,
    campaign: campaign.name,
    owner: 'Marketing',
    status: index % 5 === 0 ? 'needs_review' : 'draft',
    approvalStatus: index % 5 === 0 ? 'pending_review' : 'pending',
    brandConsistencyScore: brandCheckPreview.score,
    readinessScore: Math.max(45, Math.min(90, brandCheckPreview.score - (type.includes('ad') ? 12 : 4))),
    linkedTasks: campaign.tasks ?? [],
    linkedGoals: product.linkedGoals ?? [],
    linkedCampaign: campaign.campaignId,
    linkedContentItem: content?.id ?? '',
    brandRecord: store.brand.id,
    productRecord: product.id,
    audienceProfile: audience.id,
    operator: 'Marketing Content Studio',
    sourceInputs: [store.brand.id, product.id, audience.id, campaign.campaignId, content?.id ?? 'content-library'],
    body,
    publishingEnabled: false,
    createdAt: now,
    updatedAt: now,
    auditHistory: [auditEvent(`mkt-draft-${slugify(type)}-${slugify(campaign.name)}`, null, index % 5 === 0 ? 'needs_review' : 'draft', 'Marketing Content Studio', 'Draft generated locally.', 'draft_generated', now)],
  };
}

function draftBody(type, campaign, product, audience) {
  const cta = 'Review this draft internally before any external use.';
  const base = `${campaign.name} helps ${audience.name} understand how ${product.name} supports clearer performance workflows.`;
  const details = [
    `Audience goal: ${audience.goals[0]}`,
    `Product positioning: ${product.positioning}`,
    `Campaign objective: ${campaign.objective}`,
    `Call to action: ${cta}`,
  ];
  if (type === 'social post set') return [`Post 1: ${base}`, `Post 2: Focus on ${audience.painPoints[0].toLowerCase()}.`, `Post 3: ${cta}`].join('\n');
  if (type === 'FAQ draft') return [`Q: Who is this for?`, `A: ${audience.name} who need ${audience.goals[0].toLowerCase()}.`, `Q: Can this be published now?`, 'A: No. This is a local draft pending review.'].join('\n');
  if (type === 'ad copy draft') return [`Headline: Clearer performance workflows for ${audience.name}`, `Body: ${base}`, `CTA: ${cta}`, 'Note: Paid ad execution is disabled.'].join('\n');
  return [base, ...details].join('\n');
}

function evaluateDraftBrandConsistency(draft, store) {
  const text = `${draft.title}\n${draft.body}`.toLowerCase();
  const violations = store.brand.wordsToAvoid.filter((word) => text.includes(word.toLowerCase()));
  const pricingRisk = /free|discount|price|pricing|\$\d/.test(text) && String(store.products.find((product) => product.name === draft.product)?.pricing ?? '').includes('not confirmed');
  const claimRisk = /(guarantee|cure|medical|injury-free|lose weight fast|transform overnight)/.test(text);
  const ctaClear = text.includes('review') || text.includes('call to action') || text.includes('cta');
  const risks = [
    violations.length ? 'Avoided or prohibited brand wording present.' : null,
    pricingRisk ? 'Pricing language needs review because pricing is not confirmed locally.' : null,
    claimRisk ? 'Health/fitness or outcome claim requires review.' : null,
    !ctaClear ? 'Call to action is unclear.' : null,
  ].filter(Boolean);
  const score = Math.max(35, 92 - violations.length * 18 - (pricingRisk ? 12 : 0) - (claimRisk ? 18 : 0) - (!ctaClear ? 8 : 0));
  return {
    id: `brand-check-${draft.draftId}`,
    draftId: draft.draftId,
    score,
    confidence: risks.length ? 72 : 86,
    risks,
    violations,
    checks: {
      brandVoice: true,
      approvedMessaging: text.includes('performance') || text.includes('workflow'),
      productPositioning: text.includes(draft.product.toLowerCase()) || text.includes('product positioning'),
      audienceFit: text.includes(draft.audience.toLowerCase()),
      claimSafety: !claimRisk,
      pricingConsistency: !pricingRisk,
      callToActionClarity: ctaClear,
    },
    recommendations: risks.length ? ['Revise flagged language and resubmit for review.', 'Keep draft local until a human approves it.'] : ['Ready for local review.'],
    nextActions: risks.length ? ['Request edits before approval.'] : ['Submit for human review.'],
    generatedAt: stamp(),
  };
}

function lightweightBrandScore(body, store) {
  const text = body.toLowerCase();
  const violations = store.brand.wordsToAvoid.filter((word) => text.includes(word.toLowerCase()));
  return { score: Math.max(40, 90 - violations.length * 15) };
}

function transitionDraft(newStatus, auditEventName, defaultReason) {
  const store = readMarketingStore();
  const studio = readContentStudioStore(store);
  const id = process.env.MARKETING_DRAFT_ID ?? studio.drafts[0]?.draftId;
  const reviewer = process.env.MARKETING_REVIEWER ?? 'Marketing Reviewer';
  const reason = process.env.MARKETING_DRAFT_REASON ?? defaultReason;
  const now = stamp();
  let changed = null;
  const drafts = studio.drafts.map((draft) => {
    if (draft.draftId !== id) return draft;
    changed = draft;
    return {
      ...draft,
      status: newStatus,
      approvalStatus: newStatus === 'approved' ? 'approved_internal_only' : newStatus === 'rejected' ? 'rejected' : newStatus === 'archived' ? 'archived' : 'pending_review',
      publishingEnabled: false,
      updatedAt: now,
      auditHistory: [auditEvent(draft.draftId, draft.status, newStatus, reviewer, reason, auditEventName, now), ...(draft.auditHistory ?? [])],
    };
  });
  if (!changed) return { title: 'Marketing Draft Transition Failed', generatedAt: now, status: 'fail', errors: [`Draft not found: ${id}`], safety };
  const approval = approvalRecord({ ...changed, status: newStatus }, newStatus === 'approved' ? 'approved_internal_only' : newStatus, reason, now, reviewer);
  const next = {
    ...studio,
    drafts,
    approvals: [approval, ...studio.approvals],
    auditHistory: [auditEvent(id, changed.status, newStatus, reviewer, reason, auditEventName, now), ...studio.auditHistory],
  };
  writeContentStudioStore(next);
  return { title: 'Marketing Draft Updated', generatedAt: now, draft: drafts.find((draft) => draft.draftId === id), approval, safety };
}

function approvalRecord(draft, status, reason, timestamp, reviewer = 'Marketing Content Studio') {
  return {
    id: `mkt-draft-approval-${draft.draftId}-${compactStamp(timestamp)}`,
    draftId: draft.draftId,
    title: draft.title,
    reviewer,
    status,
    reason,
    publishingEnabled: false,
    timestamp,
  };
}

function auditEvent(draftId, previousStatus, newStatus, operator, reason, event, timestamp) {
  return { id: `audit-${draftId}-${compactStamp(timestamp)}-${event}`, draftId, previousStatus, newStatus, operator, reason, auditEvent: event, timestamp, publishingActionCreated: false };
}

function contentStudioWorkflows() {
  return ['create campaign brief', 'create landing page draft', 'create email draft', 'create social post set', 'create blog outline', 'create launch announcement', 'create release note', 'create video brief', 'create FAQ draft'];
}

function summarizeContentStudio(studio) {
  return {
    drafts: studio.drafts.length,
    needsReview: studio.drafts.filter((draft) => draft.status === 'needs_review').length,
    approved: studio.drafts.filter((draft) => draft.status === 'approved').length,
    rejected: studio.drafts.filter((draft) => draft.status === 'rejected').length,
    brandRiskQueue: studio.brandChecks.filter((check) => check.risks.length || check.violations.length).length,
    averageBrandConsistency: average(studio.brandChecks.map((check) => check.score)),
    averageReadiness: average(studio.drafts.map((draft) => draft.readinessScore)),
    approvals: studio.approvals.length,
  };
}

function campaignContentRows(studio) {
  return studio.drafts.map((draft) => ({ campaign: draft.campaign, draft: draft.title, type: draft.type, status: draft.status, brandConsistencyScore: draft.brandConsistencyScore, readinessScore: draft.readinessScore }));
}

function writeMarketingReport(slug, payload) {
  mkdirSync(reportsRoot, { recursive: true });
  const jsonPath = path.join(reportsRoot, `${slug}.json`);
  const mdPath = path.join(reportsRoot, `${slug}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return { json: path.relative(repoRoot, jsonPath), markdown: path.relative(repoRoot, mdPath) };
}

function writeContentStudioReport(slug, payload) {
  mkdirSync(contentStudioReportsRoot, { recursive: true });
  const jsonPath = path.join(contentStudioReportsRoot, `${slug}.json`);
  const mdPath = path.join(contentStudioReportsRoot, `${slug}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return { json: path.relative(repoRoot, jsonPath), markdown: path.relative(repoRoot, mdPath) };
}

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJson(file, payload) {
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

function toMarkdown(payload) {
  return `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nLocal-only marketing safety: no publishing, posting, emailing, ad buying, CRM sync, automatic approval, or unsupported brand assets.\n`;
}

function stamp() {
  return new Date().toISOString();
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : 0;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function compactStamp(value) {
  return String(value).replace(/[^0-9]/g, '').slice(0, 14);
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, (match) => match.toUpperCase());
}
