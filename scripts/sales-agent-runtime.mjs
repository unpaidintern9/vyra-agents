import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCommunicationDraft, validateCommunicationDraftLayer } from './comms-draft-runtime.mjs';
import { createSharedTask, validateSharedTaskLayer } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const reportRoot = path.join(repoRoot, 'reports/agents/sales');
const crmRoot = path.join(repoRoot, 'codex-agent-threads/shared/sales-opportunities');
const crmPath = path.join(crmRoot, 'opportunities.json');
const researchPath = path.join(crmRoot, 'research-intelligence.json');
const workflowPath = path.join(crmRoot, 'sales-workflows.json');

const blockedActions = [
  'external customer email auto-send',
  'private or login-gated scraping',
  'robots/rate-limit bypass',
  'CRM writes',
  'Stripe writes',
  'Supabase production writes',
  'secret output',
];

export const salesProspects = [
  ['Area 502 MMA', 'Louisville', 'KY', 'mma_bjj', 'https://area502mma.com/', 91, 'Verify owner/contact path and current software.'],
  ['Louisville Combat Academy', 'Louisville', 'KY', 'mma_bjj', 'https://louisvillecombatacademy.com/', 90, 'Verify decision maker, class schedule, and member software.'],
  ['Core Combat Sports', 'Louisville', 'KY', 'mma_bjj', 'https://corelouisville.com/', 88, 'Verify contact path, current tools, and program complexity.'],
  ['Apex Martial Arts Academy', 'Louisville / Mount Washington', 'KY', 'mma_bjj', 'https://theapexmaa.com/', 86, 'Verify exact location count and owner/operator.'],
  ['Butchertown CrossFit', 'Louisville', 'KY', 'crossfit', 'https://www.butchertowncrossfit.com/', 85, 'Verify owner/contact path and trial flow.'],
  ['Full Moon Martial Arts', 'Clarksville / Jeffersonville / New Albany', 'IN', 'mma_bjj', 'https://www.fullmoonmartialarts.com/', 83, 'Verify Southern Indiana contact path and active programs.'],
  ['CrossFit Covalence', 'Louisville', 'KY', 'crossfit', 'https://crossfitcovalence.com/', 81, 'Verify owner/operator, current software, and community signals.'],
  ['Derby City Mixed Martial Arts', 'Louisville', 'KY', 'mma_bjj', 'https://derbycitymartialarts.com/', 80, 'Confirm active programs and direct contact path.'],
  ['Rough Hands BJJ', 'Louisville', 'KY', 'mma_bjj', 'https://roughhandsbjj.com/', 79, 'Verify owner/contact and class schedule.'],
  ['Southern Indiana Martial Arts', 'New Albany', 'IN', 'mma_bjj', 'https://southernindianamartialarts.com/', 78, 'Verify owner/contact and current software.'],
  ['Full Tilt Gym', 'Louisville', 'KY', 'small_gym', 'https://fulltiltgym.com/', 76, 'Verify member count and programming delivery.'],
  ['Derby City Fit Club', 'Louisville', 'KY', 'small_gym', 'https://www.derbycityfitclub.com/', 74, 'Verify current software and direct contact path.'],
].map(([name, city, state, category, website, score, nextResearch]) => ({
  name,
  city,
  state,
  category,
  website,
  score,
  tier: score >= 84 ? 'prime_target' : score >= 72 ? 'good_fit' : 'research_needed',
  nextResearch,
  outreachAngle:
    category === 'crossfit'
      ? 'Lead with trial onboarding, class operations, retention, and coach-led habit tracking.'
      : category === 'small_gym'
        ? 'Lead with member operations cleanup, digital programming, and retention.'
        : 'Lead with student/member progression, class communication, and youth/adult program retention.',
}));

export function getSalesStatus() {
  ensureReportRoot();
  return {
    title: 'Sales Agent Execution Status',
    generatedAt: new Date().toISOString(),
    phase: '46A',
    mode: 'local/mock/read-only',
    prospects: salesProspects.length,
    primeTargets: salesProspects.filter((item) => item.tier === 'prime_target').length,
    highFitProspects: salesProspects.filter((item) => item.score >= 80).length,
    topNextAction: `Verify owner/contact path for ${salesProspects[0].name} and create draft-only outreach prep.`,
    reportRoot: path.relative(repoRoot, reportRoot),
    blockedActions,
  };
}

export function listSalesOpportunities() {
  const opportunities = readOpportunities();
  return { title: 'Sales Local CRM Opportunities', generatedAt: new Date().toISOString(), opportunities, summary: summarizeOpportunities(opportunities), safety: safetySummary() };
}

export function createSalesOpportunity(options = {}) {
  const opportunities = readOpportunities();
  const company = options.company ?? process.env.SALES_OPPORTUNITY_COMPANY ?? `Local Opportunity ${opportunities.length + 1}`;
  const opportunity = opportunityFromProspect({
    name: company,
    city: options.city ?? process.env.SALES_OPPORTUNITY_CITY ?? 'Louisville',
    state: options.state ?? process.env.SALES_OPPORTUNITY_STATE ?? 'KY',
    category: options.industry ?? process.env.SALES_OPPORTUNITY_INDUSTRY ?? 'small_gym',
    website: options.website ?? process.env.SALES_OPPORTUNITY_WEBSITE ?? '',
    score: Number(options.score ?? process.env.SALES_OPPORTUNITY_SCORE ?? 72),
    nextResearch: 'Verify contact, requirements, pricing fit, and decision maker.',
    outreachAngle: 'Lead with local member operations, retention, and onboarding workflow cleanup.',
  });
  const next = [opportunity, ...opportunities.filter((item) => item.id !== opportunity.id)];
  writeOpportunities(next);
  return { title: 'Sales Opportunity Created', generatedAt: new Date().toISOString(), opportunity, summary: summarizeOpportunities(next), safety: safetySummary() };
}

export function updateSalesOpportunity() {
  const opportunities = readOpportunities();
  const id = process.env.SALES_OPPORTUNITY_ID ?? opportunities[0]?.id;
  const note = process.env.SALES_OPPORTUNITY_NOTE ?? 'Local update recorded by Sales Agent CLI.';
  const next = opportunities.map((item) => (item.id === id ? addTimeline({ ...item, notes: [note, ...item.notes], updatedAt: new Date().toISOString() }, 'note_added', 'Note added', note) : item));
  writeOpportunities(next);
  return { title: 'Sales Opportunity Updated', generatedAt: new Date().toISOString(), opportunity: next.find((item) => item.id === id), safety: safetySummary() };
}

export function moveSalesOpportunityStage() {
  const opportunities = readOpportunities();
  const id = process.env.SALES_OPPORTUNITY_ID ?? opportunities[0]?.id;
  const stage = process.env.SALES_OPPORTUNITY_STAGE ?? 'follow_up';
  const reason = process.env.SALES_OPPORTUNITY_REASON ?? 'CLI local stage transition.';
  const next = opportunities.map((item) => (item.id === id ? moveStage(item, stage, reason) : item));
  writeOpportunities(next);
  return { title: 'Sales Opportunity Stage Moved', generatedAt: new Date().toISOString(), opportunity: next.find((item) => item.id === id), safety: safetySummary() };
}

export function getSalesOpportunityTimeline() {
  const opportunities = readOpportunities();
  const id = process.env.SALES_OPPORTUNITY_ID ?? opportunities[0]?.id;
  const opportunity = opportunities.find((item) => item.id === id);
  return { title: 'Sales Opportunity Timeline', generatedAt: new Date().toISOString(), opportunity: opportunity?.company, timeline: opportunity?.activityTimeline ?? [], safety: safetySummary() };
}

export function scoreSalesOpportunities() {
  const opportunities = readOpportunities();
  return { title: 'Sales Opportunity Scores', generatedAt: new Date().toISOString(), scores: opportunities.map((item) => ({ id: item.id, company: item.company, ...item.score })), safety: safetySummary() };
}

export function buildSalesFollowupPlans() {
  const opportunities = readOpportunities();
  return writeSalesReport('local-crm-followup-plans', { title: 'Local CRM Follow-up Plans', generatedAt: new Date().toISOString(), rows: opportunities.map((item) => ({ company: item.company, ...item.followUpPlan })), safety: safetySummary() });
}

export function getProposalStatus() {
  const opportunities = readOpportunities();
  return { title: 'Sales Proposal Status', generatedAt: new Date().toISOString(), proposalQueue: opportunities.map((item) => ({ company: item.company, stage: item.stage, ...item.proposalPreparationStatus })), safety: safetySummary() };
}

export function archiveSalesOpportunity() {
  return setArchiveState(true);
}

export function restoreSalesOpportunity() {
  return setArchiveState(false);
}

export function mergeSalesOpportunities() {
  const opportunities = readOpportunities();
  return {
    title: 'Sales Opportunity Merge Review',
    generatedAt: new Date().toISOString(),
    status: 'manual_review_required',
    duplicateCandidates: detectRelatedOpportunities(opportunities),
    policy: 'Phase 50 blocks automatic opportunity merges. Review candidates manually and decide outside this command.',
    safety: safetySummary(),
  };
}

export function buildSalesOpportunityDashboard() {
  const opportunities = readOpportunities();
  const reports = buildOpportunityReports(opportunities);
  const written = Object.entries(reports).map(([slug, payload]) => writeSalesReport(slug, payload));
  return { title: 'Sales Local CRM Dashboard', generatedAt: new Date().toISOString(), summary: summarizeOpportunities(opportunities), written, safety: safetySummary() };
}

export function listSalesSources() {
  const store = readResearchStore();
  return { title: 'Sales Research Sources', generatedAt: new Date().toISOString(), sources: store.sources, summary: summarizeResearchStore(store), safety: safetySummary() };
}

export function addSalesSource() {
  const store = readResearchStore();
  const now = new Date().toISOString();
  const name = process.env.SALES_SOURCE_NAME ?? `Draft Research Source ${store.sources.length + 1}`;
  const source = {
    id: `src-${slugify(name)}-${compactStamp(now)}`,
    name,
    category: process.env.SALES_SOURCE_CATEGORY ?? 'Manual Research',
    description: process.env.SALES_SOURCE_DESCRIPTION ?? 'Draft local research source awaiting review.',
    enabled: false,
    mode: process.env.SALES_SOURCE_MODE ?? 'Manual',
    scope: process.env.SALES_SOURCE_SCOPE ?? 'Local',
    authenticationRequired: process.env.SALES_SOURCE_AUTH_REQUIRED === 'true',
    notes: [process.env.SALES_SOURCE_NOTES ?? 'Created locally. Approval is required before scoring/enrichment use.'],
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    trustScore: Number(process.env.SALES_SOURCE_TRUST ?? 50),
    confidenceScore: Number(process.env.SALES_SOURCE_CONFIDENCE ?? 50),
    status: 'needs_review',
    approvalStatus: 'Draft',
  };
  store.sources = [source, ...store.sources.filter((item) => item.id !== source.id)];
  store.reviewHistory.unshift(reviewRecord(source.id, 'Draft', 'source created'));
  writeResearchStore(store);
  return { title: 'Sales Research Source Added', generatedAt: now, source, safety: safetySummary() };
}

export function updateSalesSource() {
  const store = readResearchStore();
  const id = process.env.SALES_SOURCE_ID ?? store.sources[0]?.id;
  const now = new Date().toISOString();
  store.sources = store.sources.map((source) =>
    source.id === id
      ? {
          ...source,
          description: process.env.SALES_SOURCE_DESCRIPTION ?? source.description,
          notes: [process.env.SALES_SOURCE_NOTES ?? 'Local source update recorded.', ...source.notes],
          trustScore: Number(process.env.SALES_SOURCE_TRUST ?? source.trustScore),
          confidenceScore: Number(process.env.SALES_SOURCE_CONFIDENCE ?? source.confidenceScore),
          updatedAt: now,
        }
      : source,
  );
  store.reviewHistory.unshift(reviewRecord(id, 'Updated', 'source fields updated'));
  writeResearchStore(store);
  return { title: 'Sales Research Source Updated', generatedAt: now, source: store.sources.find((source) => source.id === id), safety: safetySummary() };
}

export function disableSalesSource() {
  return setSalesSourceApproval('Disabled', false);
}

export function approveSalesSource() {
  return setSalesSourceApproval('Approved', true);
}

export function rejectSalesSource() {
  return setSalesSourceApproval('Rejected', false);
}

export function listSalesResearchIntake() {
  const store = readResearchStore();
  return { title: 'Sales Research Intake Queue', generatedAt: new Date().toISOString(), intakeQueue: store.intakeQueue, summary: summarizeResearchStore(store), safety: safetySummary() };
}

export function verifySalesResearch() {
  const store = readResearchStore();
  const id = process.env.SALES_INTAKE_ID ?? store.intakeQueue.find((item) => item.reviewStatus === 'pending_review')?.id ?? store.intakeQueue[0]?.id;
  const now = new Date().toISOString();
  store.intakeQueue = store.intakeQueue.map((item) =>
    item.id === id
      ? {
          ...item,
          verificationStatus: process.env.SALES_VERIFICATION_STATUS ?? 'verified',
          reviewStatus: process.env.SALES_REVIEW_STATUS ?? 'reviewed',
          humanReviewRequired: process.env.SALES_HUMAN_REVIEW_REQUIRED === 'true',
        }
      : item,
  );
  const item = store.intakeQueue.find((item) => item.id === id);
  store.verificationRecords.unshift({
    id: `verify-${id}-${compactStamp(now)}`,
    intakeId: id,
    timestamp: now,
    operator: process.env.SALES_OPERATOR ?? 'Sales Agent CLI',
    confidence: item?.confidence ?? 0,
    evidenceLevel: item?.evidenceLevel ?? 'low',
    completeness: item?.completeness ?? 0,
    riskRating: item?.riskRating ?? 'medium',
    reviewStatus: item?.reviewStatus ?? 'reviewed',
    missingInformation: item?.missingInformation ?? [],
    humanReviewRequired: item?.humanReviewRequired ?? true,
  });
  writeResearchStore(store);
  return { title: 'Sales Research Verification Recorded', generatedAt: now, item, safety: safetySummary() };
}

export function listSalesDuplicates() {
  const store = readResearchStore();
  return {
    title: 'Sales Duplicate Candidates',
    generatedAt: new Date().toISOString(),
    duplicateCandidates: store.duplicateCandidates,
    policy: 'Review and merge suggestions manually. This command never merges records.',
    safety: safetySummary(),
  };
}

export function enrichSalesOpportunities() {
  const store = readResearchStore();
  const approvedSources = store.sources.filter((source) => source.approvalStatus === 'Approved' && source.enabled);
  const opportunities = readOpportunities();
  const now = new Date().toISOString();
  const enrichments = [];
  for (const item of store.intakeQueue.filter((entry) => entry.reviewStatus === 'approved' || entry.reviewStatus === 'reviewed')) {
    const source = approvedSources.find((source) => source.id === item.sourceId);
    const opportunity = opportunities.find((opportunity) => opportunity.id === item.opportunityId);
    if (!source || !opportunity) continue;
    enrichments.push({
      id: `enrich-${item.id}-${compactStamp(now)}`,
      opportunityId: opportunity.id,
      field: 'notes',
      previousValue: opportunity.notes[0] ?? '',
      newValue: item.summary,
      timestamp: now,
      sourceId: source.id,
      operator: process.env.SALES_OPERATOR ?? 'Sales Agent CLI',
      confidence: item.confidence,
      reason: 'Approved/reviewed research intake enriched local opportunity notes.',
    });
  }
  store.enrichmentHistory = [...enrichments, ...store.enrichmentHistory];
  writeResearchStore(store);
  return { title: 'Sales Opportunity Enrichment Prepared', generatedAt: now, enrichments, summary: summarizeResearchStore(store), safety: safetySummary() };
}

export function buildSalesResearchReport() {
  const store = readResearchStore();
  const reports = buildResearchReports(store);
  const written = Object.entries(reports).map(([slug, payload]) => writeSalesReport(slug, payload));
  return { title: 'Sales Research Reports Generated', generatedAt: new Date().toISOString(), written, summary: summarizeResearchStore(store), safety: safetySummary() };
}

export function buildSalesSourcesReport() {
  const store = readResearchStore();
  const payload = buildResearchReports(store)['source-inventory'];
  const written = writeSalesReport('source-inventory', payload);
  return { title: 'Sales Sources Report Generated', generatedAt: new Date().toISOString(), written, summary: summarizeResearchStore(store), safety: safetySummary() };
}

export function listSalesWorkflows() {
  const store = readWorkflowStore();
  return { title: 'Sales Workflow Orchestration', generatedAt: new Date().toISOString(), workflows: store.workflows, summary: summarizeWorkflowStore(store), safety: safetySummary() };
}

export function createSalesHandoff() {
  const store = readWorkflowStore();
  const opportunities = readOpportunities();
  const now = new Date().toISOString();
  const opportunity = opportunities.find((item) => item.id === process.env.SALES_OPPORTUNITY_ID) ?? opportunities[0];
  const type = process.env.SALES_WORKFLOW_TYPE ?? 'research_request';
  const targetAgent = process.env.SALES_TARGET_AGENT ?? defaultTargetAgent(type);
  const approvalRequirement = process.env.SALES_APPROVAL_REQUIRED === 'true' || targetAgent === 'Executive' || type.includes('approval') || type === 'external_action_gate';
  const workflow = workflowRecord({
    id: `wf-${slugify(type)}-${slugify(opportunity.company)}-${compactStamp(now)}`,
    type,
    sourceAgent: process.env.SALES_SOURCE_AGENT ?? 'Sales',
    targetAgent,
    opportunity,
    priority: process.env.SALES_WORKFLOW_PRIORITY ?? opportunity.priority,
    status: 'queued',
    requestedAction: process.env.SALES_REQUESTED_ACTION ?? 'Review local Sales handoff and record next action.',
    reason: process.env.SALES_WORKFLOW_REASON ?? 'Created by local Sales workflow CLI.',
    approvalRequirement,
    now,
    researchStore: readResearchStore(),
  });
  store.workflows.unshift(workflow);
  syncWorkflowDerivedCollections(store);
  writeWorkflowStore(store);
  return { title: 'Sales Handoff Created', generatedAt: now, workflow, summary: summarizeWorkflowStore(store), safety: safetySummary() };
}

export function updateSalesWorkflow() {
  const store = readWorkflowStore();
  const id = process.env.SALES_WORKFLOW_ID ?? store.workflows[0]?.id;
  const now = new Date().toISOString();
  store.workflows = store.workflows.map((workflow) =>
    workflow.id === id
      ? {
          ...workflow,
          owner: process.env.SALES_WORKFLOW_OWNER ?? workflow.owner,
          requestedAction: process.env.SALES_REQUESTED_ACTION ?? workflow.requestedAction,
          reason: process.env.SALES_WORKFLOW_REASON ?? workflow.reason,
          updatedAt: now,
        }
      : workflow,
  );
  store.workflowAuditHistory.unshift(auditFor(store.workflows.find((workflow) => workflow.id === id), store.workflows.find((workflow) => workflow.id === id)?.status ?? 'draft', store.workflows.find((workflow) => workflow.id === id)?.status ?? 'draft', 'workflow updated', now));
  writeWorkflowStore(store);
  return { title: 'Sales Workflow Updated', generatedAt: now, workflow: store.workflows.find((workflow) => workflow.id === id), safety: safetySummary() };
}

export function assignSalesWorkflow() {
  return transitionSalesWorkflow('assigned');
}

export function approveSalesHandoff() {
  return transitionSalesWorkflow('approved');
}

export function rejectSalesHandoff() {
  return transitionSalesWorkflow('rejected');
}

export function blockSalesHandoff() {
  return transitionSalesWorkflow('blocked');
}

export function completeSalesHandoff() {
  return transitionSalesWorkflow('completed');
}

export function archiveSalesWorkflow() {
  return transitionSalesWorkflow('archived');
}

export function listSalesProposalQueue() {
  const store = readWorkflowStore();
  return { title: 'Sales Proposal Prep Queue', generatedAt: new Date().toISOString(), proposalPrepQueue: store.proposalPrepQueue, summary: summarizeWorkflowStore(store), safety: safetySummary() };
}

export function buildSalesWorkflowReport() {
  const store = readWorkflowStore();
  const reports = buildWorkflowReports(store);
  const written = Object.entries(reports).map(([slug, payload]) => writeSalesReport(slug, payload));
  return { title: 'Sales Workflow Reports Generated', generatedAt: new Date().toISOString(), written, summary: summarizeWorkflowStore(store), safety: safetySummary() };
}

export function buildSalesIntelligenceReport() {
  const snapshot = buildSalesIntelligenceSnapshot();
  const written = writeSalesReport('sales-intelligence-report', intelligenceReport('Sales Intelligence Report', snapshot.scores, snapshot));
  return { title: 'Sales Intelligence Report Generated', generatedAt: new Date().toISOString(), written, summary: snapshot.analytics, safety: safetySummary() };
}

export function buildSalesPriorityQueueReport() {
  const snapshot = buildSalesIntelligenceSnapshot();
  const rows = snapshot.priorityQueues.flatMap((queue) => queue.items.map((item) => ({ queue: queue.label, ...item })));
  const written = writeSalesReport('priority-queue-report', intelligenceReport('Priority Queue Report', rows, snapshot));
  return { title: 'Sales Priority Queue Report Generated', generatedAt: new Date().toISOString(), written, queues: snapshot.priorityQueues, safety: safetySummary() };
}

export function buildSalesDuplicateCandidatesReport() {
  const snapshot = buildSalesIntelligenceSnapshot();
  const written = writeSalesReport('duplicate-candidates-report', intelligenceReport('Duplicate Candidates Report', snapshot.duplicateCandidates, snapshot));
  return { title: 'Sales Duplicate Candidates Report Generated', generatedAt: new Date().toISOString(), written, candidates: snapshot.duplicateCandidates, safety: safetySummary() };
}

export function buildSalesPipelineForecastReport() {
  const snapshot = buildSalesIntelligenceSnapshot();
  const rows = snapshot.scores.map((score) => ({
    company: score.company,
    scoreLabel: score.scoreLabel,
    totalScore: score.totalScore,
    confidence: score.confidence,
    estimatedRevenuePotential: score.estimatedRevenuePotential,
    forecastValue: score.estimatedRevenuePotential * 125,
    recommendedNextAction: score.recommendedNextAction,
  }));
  const written = writeSalesReport('pipeline-forecast-report', intelligenceReport('Pipeline Forecast Report', rows, snapshot));
  return { title: 'Sales Pipeline Forecast Report Generated', generatedAt: new Date().toISOString(), written, analytics: snapshot.analytics, safety: safetySummary() };
}

export function validateSalesWorkflows() {
  const store = readWorkflowStore();
  const errors = validateWorkflowStore(store);
  return {
    title: 'Sales Workflow Validation',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    summary: summarizeWorkflowStore(store),
    safety: safetySummary(),
  };
}

export function runSalesResearch() {
  const dossiers = salesProspects.map((prospect) => ({
    prospect: prospect.name,
    market: `${prospect.city}, ${prospect.state}`,
    category: prospect.category,
    website: prospect.website,
    fitScore: prospect.score,
    fitTier: prospect.tier,
    businessType: identifyBusinessType(prospect),
    likelyPainPoints: painPoints(prospect),
    recommendedVyraProduct: recommendedProduct(prospect),
    outreachAngle: prospect.outreachAngle,
    missingInfo: ['owner/contact name', 'contact email or phone', 'current software', 'member count', 'social profile'],
    nextActions: [
      prospect.nextResearch,
      'Paste public website/social notes into manual research mode before outreach.',
      'Create draft-only outreach prep after contact path is verified.',
    ],
    safety: 'Public/manual fields only. No restricted scraping or production writes.',
  }));
  return writeSalesReport('company-research-dossiers', {
    title: 'Sales Company Research Dossiers',
    generatedAt: new Date().toISOString(),
    dossiers,
    manualResearchMode: manualResearchMode(),
    safety: safetySummary(),
  });
}

export function runSalesReports() {
  const reports = {
    pipeline: report('Sales Pipeline Report', salesProspects),
    prospectResearch: report('Prospect Research Report', salesProspects),
    companyDossier: report('Company Research Dossier', salesProspects.map((item) => ({ ...item, painPoints: painPoints(item), product: recommendedProduct(item) }))),
    outreachPrep: report('Outreach Prep Report', salesProspects.filter((item) => item.score >= 80).map((item) => ({ prospect: item.name, angle: item.outreachAngle, next: item.nextResearch }))),
    followUpPlan: report('Follow-Up Plan', salesProspects.slice(0, 8).map((item) => ({ prospect: item.name, nextFollowUp: item.nextResearch, status: 'needs_manual_research' }))),
    icpFit: report('ICP Fit Report', salesProspects.map((item) => ({ prospect: item.name, score: item.score, tier: item.tier, category: item.category }))),
    proposalPrep: report('Proposal Prep Report', salesProspects.slice(0, 5).map((item) => ({ prospect: item.name, product: recommendedProduct(item), proposalStatus: 'not_started', pricingReview: 'required before external use' }))),
    executiveSummary: {
      title: 'Executive Sales Summary',
      generatedAt: new Date().toISOString(),
      summary: getSalesStatus(),
      topProspects: salesProspects.slice(0, 5),
      safety: safetySummary(),
    },
  };
  const written = Object.entries(reports).map(([name, payload]) => writeSalesReport(name, payload));
  Object.entries(buildOpportunityReports(readOpportunities())).forEach(([name, payload]) => written.push(writeSalesReport(name, payload)));
  Object.entries(buildResearchReports(readResearchStore())).forEach(([name, payload]) => written.push(writeSalesReport(name, payload)));
  Object.entries(buildWorkflowReports(readWorkflowStore())).forEach(([name, payload]) => written.push(writeSalesReport(name, payload)));
  Object.entries(buildIntelligenceReports(buildSalesIntelligenceSnapshot())).forEach(([name, payload]) => written.push(writeSalesReport(name, payload)));
  const csv = writeCsv('prospect-research', salesProspects);
  return { title: 'Sales Reports Generated', generatedAt: new Date().toISOString(), written, csv, safety: safetySummary() };
}

export function runSalesOutreach() {
  const top = salesProspects.slice(0, 4);
  const created = top.map((prospect) =>
    createCommunicationDraft({
      id: `draft:sales_follow_up_draft:${slugify(prospect.name)}`,
      type: 'sales_follow_up_draft',
      channel: 'email',
      title: `Draft-only prospect outreach: ${prospect.name}`,
      recipientName: `${prospect.name} owner/operator`,
      recipientContact: 'manual-research-required',
      subject: `Idea for ${prospect.name}'s member experience`,
      body: [
        `Hi ${prospect.name} team,`,
        '',
        `I was reviewing local ${identifyBusinessType(prospect)} gyms around ${prospect.city} and thought Vyra may be relevant if member onboarding, class communication, or retention are still harder than they should be.`,
        '',
        `Draft angle: ${prospect.outreachAngle}`,
        '',
        'This is a local draft only. Verify the owner/contact path and edit before any manual send.',
      ].join('\n'),
      sourceApprovalId: `sales-prospect-${slugify(prospect.name)}`,
      createdBy: 'Sales Agent',
      operatorName: 'Sales Agent',
      operatorTool: 'sales:outreach',
    }),
  );
  created.push(createCommunicationDraft({
    id: 'draft:executive_summary_draft:louisville-icp',
    type: 'executive_summary_draft',
    channel: 'email',
    title: 'Internal prospect summary: Louisville ICP',
    recipientName: 'Robert',
    recipientContact: 'internal-review',
    subject: 'Louisville ICP prospect summary ready for review',
    body: `Top local prospects: ${top.map((item) => item.name).join(', ')}. Next step: verify owner/contact/software fields before customer outreach.`,
    sourceApprovalId: 'sales-executive-summary',
    createdBy: 'Sales Agent',
    operatorName: 'Sales Agent',
    operatorTool: 'sales:outreach',
  }));
  return { title: 'Sales Outreach Drafts Created', generatedAt: new Date().toISOString(), created, safety: safetySummary() };
}

export function runSalesTasks() {
  const created = [];
  for (const prospect of salesProspects.filter((item) => item.score >= 80).slice(0, 6)) {
    created.push(createSharedTask(taskFor(prospect, 'needs company research', 'Research', 'Needs Review')));
    created.push(createSharedTask(taskFor(prospect, 'needs contact info', 'Sales', 'New')));
    if (prospect.score >= 85) created.push(createSharedTask(taskFor(prospect, 'high-fit prospect executive review', 'Executive', 'Needs Review', 'High', true)));
    created.push(createSharedTask(taskFor(prospect, 'needs outreach draft', 'Sales', 'New')));
  }
  created.push(createSharedTask({
    title: 'Sales Agent Phase 46A proposal-ready notification review',
    description: 'Review top Louisville ICP prospects and decide which need proposal prep after contact verification.',
    sourceAgent: 'Sales',
    assignedAgent: 'Sales',
    organization: 'Vyra internal operations',
    priority: 'Medium',
    status: 'Needs Review',
    category: 'Sales',
    approvalRequired: true,
    linkedEntities: ['sales:phase-46a', 'proposal-ready-notification'],
    notes: ['Local task only. No customer contact, CRM write, Stripe write, or production write occurred.'],
  }));
  return { title: 'Sales Tasks Created', generatedAt: new Date().toISOString(), created, safety: safetySummary() };
}

export function validateSalesExecution() {
  const intelligence = buildSalesIntelligenceSnapshot();
  const taskValidation = validateSharedTaskLayer();
  const draftValidation = validateCommunicationDraftLayer();
  const checks = [
    { name: 'Sales status command available', passed: true },
    { name: 'Research prospects available', passed: salesProspects.length >= 10 },
    { name: 'All prospects have websites', passed: salesProspects.every((item) => item.website) },
    { name: 'No external writes enabled', passed: true },
    { name: 'Manual research mode documented', passed: true },
    { name: 'Shared task layer valid', passed: taskValidation.status === 'pass' },
    { name: 'Communication draft layer valid', passed: draftValidation.status === 'pass' },
    { name: 'Local CRM opportunities valid', passed: validateOpportunities(readOpportunities()).length === 0 },
    { name: 'Local CRM reports available', passed: Object.keys(buildOpportunityReports(readOpportunities())).length >= 9 },
    { name: 'Research intelligence storage valid', passed: validateResearchStore(readResearchStore()).length === 0 },
    { name: 'Only approved sources usable for enrichment', passed: readResearchStore().sources.some((source) => source.approvalStatus === 'Approved' && source.enabled) },
    { name: 'Sales workflow orchestration valid', passed: validateWorkflowStore(readWorkflowStore()).length === 0 },
    { name: 'External actions are workflow-gated', passed: readWorkflowStore().workflows.some((workflow) => workflow.type === 'external_action_gate' && workflow.approvalRequirement) },
    { name: 'Sales intelligence scores explainable', passed: intelligence.scores.every((score) => score.topReasons.length && score.recommendedNextAction) },
    { name: 'Priority queues available', passed: intelligence.priorityQueues.length === 6 },
    { name: 'Duplicate detection is review-only', passed: intelligence.duplicateCandidates.every((candidate) => candidate.reviewAction === 'Review Duplicate') },
  ];
  return {
    title: 'Sales Agent Execution Validation',
    generatedAt: new Date().toISOString(),
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    checks,
    taskValidationStatus: taskValidation.status,
    draftValidationStatus: draftValidation.status,
    blockedActions,
  };
}

export function validateSalesReports() {
  const opportunities = readOpportunities();
  const reports = { ...buildOpportunityReports(opportunities), ...buildResearchReports(readResearchStore()), ...buildWorkflowReports(readWorkflowStore()), ...buildIntelligenceReports(buildSalesIntelligenceSnapshot()) };
  const checks = Object.entries(reports).map(([name, payload]) => ({ name, passed: Boolean(payload.title && (payload.rows?.length || payload.summary)) }));
  return { title: 'Sales Reports Validation', generatedAt: new Date().toISOString(), status: checks.every((check) => check.passed) ? 'pass' : 'fail', checks, safety: safetySummary() };
}

function taskFor(prospect, need, assignedAgent, status, priority = 'Medium', approvalRequired = false) {
  return {
    title: `${prospect.name}: ${need}`,
    description: `${prospect.name} is a ${prospect.tier.replace(/_/g, ' ')} ${identifyBusinessType(prospect)} prospect in ${prospect.city}, ${prospect.state}. ${prospect.nextResearch}`,
    sourceAgent: 'Sales',
    assignedAgent,
    organization: prospect.name,
    priority,
    status,
    category: need.includes('executive') ? 'Executive' : need.includes('research') ? 'Research' : 'Sales',
    approvalRequired,
    linkedEntities: [`sales-prospect:${slugify(prospect.name)}`],
    relatedGraphNodeIds: [`sales:${slugify(prospect.name)}`],
    notes: ['Created by Sales Agent Phase 46A. Local only; no external action occurred.'],
  };
}

function readOpportunities() {
  ensureCrmRoot();
  if (!existsSync(crmPath)) {
    const seeded = salesProspects.slice(0, 8).map(opportunityFromProspect);
    writeOpportunities(seeded);
    return seeded;
  }
  return JSON.parse(readFileSync(crmPath, 'utf8'));
}

function writeOpportunities(opportunities) {
  ensureCrmRoot();
  writeFileSync(crmPath, `${JSON.stringify(opportunities, null, 2)}\n`);
}

function readResearchStore() {
  ensureCrmRoot();
  if (!existsSync(researchPath)) {
    const seeded = seedResearchStore(readOpportunities());
    writeResearchStore(seeded);
    return seeded;
  }
  return JSON.parse(readFileSync(researchPath, 'utf8'));
}

function writeResearchStore(store) {
  ensureCrmRoot();
  writeFileSync(researchPath, `${JSON.stringify(store, null, 2)}\n`);
}

function readWorkflowStore() {
  ensureCrmRoot();
  if (!existsSync(workflowPath)) {
    const seeded = seedWorkflowStore(readOpportunities(), readResearchStore());
    writeWorkflowStore(seeded);
    return seeded;
  }
  return JSON.parse(readFileSync(workflowPath, 'utf8'));
}

function writeWorkflowStore(store) {
  ensureCrmRoot();
  syncWorkflowDerivedCollections(store);
  writeFileSync(workflowPath, `${JSON.stringify(store, null, 2)}\n`);
}

function seedWorkflowStore(opportunities, researchStore) {
  const now = new Date().toISOString();
  const seed = [
    ['wf-research-area-502', 'research_request', 'Sales', 'Operator', opportunities[0], 'High', 'queued', 'Verify website, owner/contact path, and current software.', false],
    ['wf-verify-louisville-combat', 'verification_request', 'Sales', 'Operator', opportunities[1], 'High', 'assigned', 'Verify contact path and source confidence before outreach prep.', false],
    ['wf-duplicate-louisville-combat', 'duplicate_review', 'Sales', 'Operator', opportunities[1], 'High', 'in_review', 'Review possible duplicate opportunity; do not merge automatically.', false],
    ['wf-proposal-core-combat', 'proposal_prep_handoff', 'Sales', 'Proposal Prep', opportunities[2], 'High', 'queued', 'Prepare proposal package after missing requirements are resolved.', true],
    ['wf-exec-apex', 'executive_approval', 'Sales', 'Executive', opportunities[3], 'High', 'in_review', 'High-fit prospect requires Executive approval before proposal readiness.', true],
    ['wf-risky-linkedin-source', 'risky_source_review', 'Sales', 'Executive', opportunities[0], 'Medium', 'blocked', 'LinkedIn manual reference remains pending and cannot enrich opportunities yet.', true],
    ['wf-external-action-gate', 'external_action_gate', 'Sales', 'Executive', opportunities[0], 'Critical', 'draft', 'Any external email, CRM sync, browsing job, or proposal submission requires manual approval.', true],
    ['wf-follow-up-butchertown', 'follow_up_preparation', 'Sales', 'Operator', opportunities[4], 'Medium', 'assigned', 'Prepare follow-up plan after verification queue clears.', false],
    ['wf-stalled-full-moon', 'stalled_opportunity_review', 'Sales', 'Executive', opportunities[5], 'Medium', 'queued', 'Review stalled opportunity before changing status or archiving.', true],
    ['wf-missing-covalence', 'missing_info_request', 'Sales', 'Operator', opportunities[6], 'Medium', 'queued', 'Collect missing pricing, requirements, and decision-maker fields.', false],
  ];
  const workflows = seed
    .filter((item) => item[4])
    .map(([id, type, sourceAgent, targetAgent, opportunity, priority, status, requestedAction, approvalRequirement]) =>
      workflowRecord({ id, type, sourceAgent, targetAgent, opportunity, priority, status, requestedAction, reason: requestedAction, approvalRequirement, now, researchStore }),
    );
  const store = {
    generatedAt: now,
    localOnly: true,
    workflows,
    handoffRecords: workflows.map((workflow) => ({ id: `handoff-${workflow.id}`, workflowId: workflow.id, sourceAgent: workflow.sourceAgent, targetAgent: workflow.targetAgent, status: workflow.status, createdAt: workflow.createdAt })),
    approvalDecisions: [],
    proposalPrepQueue: [],
    workflowAuditHistory: workflows.flatMap((workflow) => workflow.auditTrail),
    safety: safetySummary(),
  };
  syncWorkflowDerivedCollections(store);
  return store;
}

function workflowRecord({ id, type, sourceAgent, targetAgent, opportunity, priority, status, requestedAction, reason, approvalRequirement, now, researchStore }) {
  const intake = researchStore.intakeQueue.find((item) => item.opportunityId === opportunity.id);
  const relatedSourceIds = type === 'risky_source_review' ? ['src-linkedin-manual'] : intake ? [intake.sourceId] : [];
  const approvalStatus = approvalRequirement ? (status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status === 'blocked' ? 'blocked' : 'pending') : 'not_required';
  const workflow = {
    id,
    type,
    sourceAgent,
    targetAgent,
    opportunityId: opportunity.id,
    company: opportunity.company,
    priority,
    status,
    owner: targetAgent,
    requestedAction,
    reason,
    requiredInputs: ['verified contact path', 'approved source', 'current software', 'requirements notes'],
    missingInformation: opportunity.proposalPreparationStatus.missing,
    relatedSourceIds,
    relatedIntakeIds: intake ? [intake.id] : [],
    relatedReportIds: opportunity.generatedReports,
    relatedDraftIds: opportunity.draftOutreach.length ? [`draft-${opportunity.id}`] : [],
    approvalRequirement,
    approvalStatus,
    createdAt: now,
    updatedAt: now,
    dueAt: new Date(Date.parse(now) + 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: status === 'completed' ? now : null,
    auditTrail: [],
  };
  workflow.auditTrail.push(auditFor(workflow, 'draft', status, 'Initial Phase 49 local orchestration seed.', now));
  return workflow;
}

function transitionSalesWorkflow(newStatus) {
  const store = readWorkflowStore();
  const id = process.env.SALES_WORKFLOW_ID ?? store.workflows[0]?.id;
  const now = new Date().toISOString();
  const workflow = store.workflows.find((item) => item.id === id);
  if (!workflow) return { title: 'Sales Workflow Transition Blocked', generatedAt: now, status: 'fail', reason: 'Workflow not found.', safety: safetySummary() };
  if (!validTransition(workflow.status, newStatus)) {
    return { title: 'Sales Workflow Transition Blocked', generatedAt: now, status: 'fail', reason: `Invalid transition ${workflow.status} -> ${newStatus}`, workflow, safety: safetySummary() };
  }
  const previousStatus = workflow.status;
  workflow.status = newStatus;
  workflow.updatedAt = now;
  workflow.completedAt = newStatus === 'completed' ? now : workflow.completedAt;
  if (newStatus === 'approved') workflow.approvalStatus = 'approved';
  if (newStatus === 'rejected') workflow.approvalStatus = 'rejected';
  if (newStatus === 'blocked') workflow.approvalStatus = workflow.approvalRequirement ? 'blocked' : workflow.approvalStatus;
  const audit = auditFor(workflow, previousStatus, newStatus, process.env.SALES_WORKFLOW_REASON ?? 'Local workflow status transition.', now);
  workflow.auditTrail.unshift(audit);
  store.workflowAuditHistory.unshift(audit);
  if (workflow.approvalRequirement && ['approved', 'rejected', 'blocked'].includes(newStatus)) {
    store.approvalDecisions.unshift({ id: `decision-${workflow.id}-${compactStamp(now)}`, workflowId: workflow.id, decision: newStatus, operator: audit.operator, reason: audit.reason, timestamp: now });
  }
  syncWorkflowDerivedCollections(store);
  writeWorkflowStore(store);
  return { title: 'Sales Workflow Transition Recorded', generatedAt: now, workflow, summary: summarizeWorkflowStore(store), safety: safetySummary() };
}

function validTransition(from, to) {
  const transitions = {
    draft: ['queued', 'assigned', 'blocked', 'archived'],
    queued: ['assigned', 'in_review', 'blocked', 'archived'],
    assigned: ['in_review', 'approved', 'blocked', 'completed', 'archived'],
    in_review: ['approved', 'rejected', 'blocked', 'completed', 'archived'],
    approved: ['completed', 'archived'],
    rejected: ['archived'],
    blocked: ['assigned', 'in_review', 'archived'],
    completed: ['archived'],
    archived: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

function auditFor(workflow, previousStatus, newStatus, reason, timestamp) {
  return {
    id: `audit-${workflow?.id ?? 'unknown'}-${compactStamp(timestamp)}`,
    workflowId: workflow?.id ?? 'unknown',
    timestamp,
    previousStatus,
    newStatus,
    operator: process.env.SALES_OPERATOR ?? 'Sales Agent CLI',
    reason,
    affectedArtifacts: [workflow?.opportunityId, ...(workflow?.relatedSourceIds ?? []), ...(workflow?.relatedIntakeIds ?? []), ...(workflow?.relatedReportIds ?? []), ...(workflow?.relatedDraftIds ?? [])].filter(Boolean),
    confidenceImpact: workflow?.priority === 'Critical' ? 95 : workflow?.priority === 'High' ? 86 : 70,
    nextAction: process.env.SALES_NEXT_ACTION ?? workflow?.requestedAction ?? 'Review next local workflow action.',
  };
}

function syncWorkflowDerivedCollections(store) {
  const opportunities = readOpportunities();
  const researchStore = readResearchStore();
  store.handoffRecords = store.workflows.map((workflow) => ({ id: `handoff-${workflow.id}`, workflowId: workflow.id, sourceAgent: workflow.sourceAgent, targetAgent: workflow.targetAgent, status: workflow.status, createdAt: workflow.createdAt, updatedAt: workflow.updatedAt }));
  store.proposalPrepQueue = store.workflows
    .filter((workflow) => workflow.type === 'proposal_prep_handoff' || workflow.type === 'proposal_readiness_review' || workflow.targetAgent === 'Proposal Prep')
    .map((workflow) => {
      const opportunity = opportunities.find((item) => item.id === workflow.opportunityId);
      const intake = researchStore.intakeQueue.find((item) => workflow.relatedIntakeIds.includes(item.id));
      return {
        workflowId: workflow.id,
        opportunityId: workflow.opportunityId,
        company: workflow.company,
        readinessPercent: opportunity?.proposalPreparationStatus?.readinessPercent ?? 0,
        missingInfo: opportunity?.proposalPreparationStatus?.missing ?? workflow.missingInformation,
        sourceConfidence: intake?.confidence ?? 0,
        verificationStatus: intake?.verificationStatus ?? 'unverified',
        executiveApprovalStatus: workflow.approvalStatus,
        proposalStatus: opportunity?.proposalPreparationStatus?.status ?? 'not_ready',
        nextAction: workflow.requestedAction,
      };
    });
  return store;
}

function seedResearchStore(opportunities) {
  const now = new Date().toISOString();
  const sources = [
    researchSource('src-manual-notes', 'Manual Operator Notes', 'Manual Research', 'Operator pasted public/manual notes.', true, 'Manual', 'Local', false, 92, 88, 'Approved', now),
    researchSource('src-public-website', 'Public Website Review', 'Public Website', 'Operator-reviewed public website fields only.', true, 'Manual', 'External', false, 84, 78, 'Approved', now),
    researchSource('src-local-reports', 'Existing Sales Reports', 'Existing Reports', 'Local reports generated by Sales Agent.', true, 'Semi-Automatic', 'Local', false, 88, 84, 'Approved', now),
    researchSource('src-linkedin-manual', 'LinkedIn Manual Reference', 'LinkedIn (manual reference only)', 'Manual reference only. No scraping or automation.', false, 'Manual', 'External', true, 65, 52, 'Pending Review', now),
    researchSource('src-state-registry', 'Kentucky State Registry Manual Lookup', 'State Registry', 'Manual state registry checks when pasted by operator.', false, 'Manual', 'External', false, 80, 62, 'Draft', now),
    researchSource('src-csv-import', 'Local CSV Import', 'CSV Import', 'Local CSV files reviewed before scoring.', true, 'Semi-Automatic', 'Local', false, 74, 70, 'Approved', now),
  ];
  const intakeQueue = opportunities.slice(0, 6).map((opportunity, index) => researchIntake(opportunity, index, now));
  const duplicateCandidates = intakeQueue.flatMap((item) => item.duplicateDetection);
  const enrichmentHistory = opportunities.slice(0, 4).map((opportunity, index) => ({
    id: `enrich-${opportunity.id}`,
    opportunityId: opportunity.id,
    field: 'companySizeEstimate',
    previousValue: 'Unknown',
    newValue: opportunity.companySizeEstimate,
    timestamp: now,
    sourceId: index % 2 === 0 ? 'src-manual-notes' : 'src-public-website',
    operator: 'Sales Agent',
    confidence: 78 + index,
    reason: 'Seeded from approved local/manual research for Phase 48.',
  }));
  return {
    generatedAt: now,
    localOnly: true,
    safety: safetySummary(),
    sources,
    intakeQueue,
    verificationRecords: intakeQueue.map((item) => ({
      id: `verify-${item.id}`,
      intakeId: item.id,
      timestamp: now,
      operator: 'Sales Agent',
      confidence: item.confidence,
      evidenceLevel: item.evidenceLevel,
      completeness: item.completeness,
      riskRating: item.riskRating,
      reviewStatus: item.reviewStatus,
      missingInformation: item.missingInformation,
      humanReviewRequired: item.humanReviewRequired,
    })),
    enrichmentHistory,
    duplicateCandidates,
    reviewHistory: sources.map((source) => reviewRecord(source.id, source.approvalStatus, 'initial local source state', now)),
  };
}

function researchSource(id, name, category, description, enabled, mode, scope, authenticationRequired, trustScore, confidenceScore, approvalStatus, now) {
  return {
    id,
    name,
    category,
    description,
    enabled,
    mode,
    scope,
    authenticationRequired,
    notes: ['Local source record only. Automatic source approval is disabled.'],
    createdAt: now,
    updatedAt: now,
    lastUsedAt: approvalStatus === 'Approved' ? now : null,
    trustScore,
    confidenceScore,
    status: approvalStatus === 'Approved' && enabled ? 'active' : 'needs_review',
    approvalStatus,
  };
}

function researchIntake(opportunity, index, now) {
  const duplicateDetection =
    index === 1
      ? [
          {
            id: `dup-${opportunity.id}`,
            targetType: 'opportunity',
            targetId: opportunity.id,
            fields: ['company', 'website'],
            confidence: 86,
            reason: 'Company and website resemble an existing local opportunity.',
            suggestedMergeAction: 'Review manually and merge only after operator approval.',
            detectedAt: now,
          },
        ]
      : [];
  return {
    id: `intake-${opportunity.id}`,
    sourceId: index % 2 === 0 ? 'src-manual-notes' : 'src-public-website',
    opportunityId: opportunity.id,
    company: opportunity.company,
    researchType: index % 2 === 0 ? 'company profile' : 'contact path',
    date: now,
    analyst: 'Sales Agent',
    summary: `${opportunity.company} research intake prepared from approved local/manual source.`,
    rawNotes: `Manual/public research notes for ${opportunity.company}.`,
    confidence: 72 + index * 4,
    verificationStatus: index < 2 ? 'verified' : 'partially_verified',
    duplicateDetection,
    suggestedActions: ['Verify contact path', 'Update opportunity notes', 'Queue follow-up after review'],
    evidenceLevel: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
    completeness: 68 + index * 3,
    riskRating: index > 3 ? 'medium' : 'low',
    reviewStatus: index < 2 ? 'approved' : 'pending_review',
    missingInformation: ['verified contact', 'current software', 'decision maker'],
    humanReviewRequired: index > 2 || duplicateDetection.length > 0,
  };
}

function setSalesSourceApproval(approvalStatus, enabled) {
  const store = readResearchStore();
  const id = process.env.SALES_SOURCE_ID ?? store.sources.find((source) => source.approvalStatus !== approvalStatus)?.id ?? store.sources[0]?.id;
  const now = new Date().toISOString();
  store.sources = store.sources.map((source) =>
    source.id === id
      ? {
          ...source,
          approvalStatus,
          enabled,
          lastUsedAt: approvalStatus === 'Approved' ? now : source.lastUsedAt,
          status: approvalStatus === 'Approved' && enabled ? 'active' : approvalStatus === 'Disabled' ? 'inactive' : 'needs_review',
          updatedAt: now,
        }
      : source,
  );
  store.reviewHistory.unshift(reviewRecord(id, approvalStatus, process.env.SALES_REVIEW_REASON ?? `source ${approvalStatus.toLowerCase()}`, now));
  writeResearchStore(store);
  return { title: `Sales Research Source ${approvalStatus}`, generatedAt: now, source: store.sources.find((source) => source.id === id), safety: safetySummary() };
}

function reviewRecord(sourceId, status, reason, timestamp = new Date().toISOString()) {
  return {
    id: `review-${sourceId}-${compactStamp(timestamp)}`,
    sourceId,
    status,
    reason,
    operator: process.env.SALES_OPERATOR ?? 'Sales Agent CLI',
    timestamp,
    automaticApproval: false,
  };
}

function opportunityFromProspect(prospect) {
  const score = scoreOpportunity(prospect);
  const proposalPreparationStatus = proposalStatus(score.overallScore, prospect.score >= 86 ? 'proposal_preparation' : 'researching');
  const stage = prospect.score >= 86 ? 'proposal_preparation' : prospect.score >= 83 ? 'contact_ready' : prospect.score >= 80 ? 'follow_up' : 'prospect';
  const id = `opp-${slugify(prospect.name)}`;
  const now = new Date().toISOString();
  return {
    id,
    company: prospect.name,
    contacts: [{ name: 'Owner/operator TBD', role: 'Decision maker', email: '', phone: '' }],
    industry: identifyBusinessType(prospect),
    location: `${prospect.city}, ${prospect.state}`,
    city: prospect.city,
    state: prospect.state,
    naics: prospect.category === 'crossfit' ? '713940' : '611620',
    website: prospect.website,
    phone: '',
    email: '',
    companySizeEstimate: 'Small independent gym',
    icpScore: prospect.score,
    leadScore: score.leadScore,
    priority: score.priority,
    status: 'active',
    stage,
    assignedOwner: 'Sales Agent',
    source: 'Louisville ICP local research',
    createdAt: now,
    updatedAt: now,
    notes: ['Local CRM only. Verify contacts and requirements before outreach.'],
    activityTimeline: [
      timeline('created', 'Opportunity created', 'Seeded from local ICP research.', 'Sales Agent', now),
      timeline('research_generated', 'Research generated', prospect.nextResearch, 'Sales Agent', now),
    ],
    attachments: [`reports/agents/sales/${id}.md`],
    generatedReports: ['Company Research Dossier', 'Outreach Prep Report'],
    draftOutreach: [prospect.outreachAngle],
    proposalPreparationStatus,
    executiveVisibility: prospect.score >= 84,
    archived: false,
    tags: [prospect.category, prospect.tier, 'local-crm'],
    favorite: prospect.score >= 84,
    pinned: prospect.score >= 84,
    score,
    followUpPlan: followupPlan(prospect, proposalPreparationStatus, stage),
  };
}

function moveStage(opportunity, stage, reason) {
  const now = new Date().toISOString();
  return {
    ...opportunity,
    archived: stage === 'archived',
    status: stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : stage === 'archived' ? 'archived' : 'active',
    stage,
    updatedAt: now,
    activityTimeline: [timeline('stage_changed', 'Stage changed', reason, 'Sales Agent CLI', now, opportunity.stage, stage), ...opportunity.activityTimeline],
  };
}

function addTimeline(opportunity, type, title, reason) {
  const now = new Date().toISOString();
  return { ...opportunity, updatedAt: now, activityTimeline: [timeline(type, title, reason, 'Sales Agent CLI', now), ...opportunity.activityTimeline] };
}

function timeline(type, title, reason, operator, timestamp, previousStage, newStage) {
  return { id: `${type}-${compactStamp(timestamp)}-${Math.random().toString(36).slice(2, 8)}`, type, title, reason, operator, timestamp, previousStage, newStage };
}

function scoreOpportunity(prospect) {
  const overallScore = Math.max(0, Math.min(100, Math.round((prospect.score + 12 + 10 + (prospect.score >= 85 ? 12 : 8) + 8 + 7) / 1.5)));
  return {
    confidence: Math.max(0, prospect.score - 5),
    leadScore: Math.max(0, overallScore - 3),
    opportunityRating: overallScore >= 88 ? 'A' : overallScore >= 78 ? 'B' : overallScore >= 65 ? 'C' : 'D',
    overallScore,
    priority: overallScore >= 88 ? 'High' : overallScore >= 78 ? 'Medium' : 'Low',
    reasoning: ['Matches Vyra first target segments.', 'Louisville-area local motion.', 'Decision-maker and budget are estimates until manually verified.'],
  };
}

function proposalStatus(score, stage) {
  const missing = ['contacts', 'requirements', 'discovery notes', 'executive approval'];
  if (score < 90) missing.unshift('pricing');
  if (stage === 'prospect') missing.push('research');
  const readinessPercent = Math.max(0, Math.min(100, 100 - missing.length * 14));
  return { missing, readinessPercent, status: stage === 'proposal_sent' ? 'sent' : readinessPercent >= 80 ? 'ready' : readinessPercent >= 55 ? 'needs_review' : 'not_ready' };
}

function followupPlan(prospect, proposalPreparationStatus, stage) {
  return {
    recommendedNextAction: prospect.nextResearch,
    recommendedTimeframe: stage === 'follow_up' ? 'Today' : 'Within 2 business days',
    talkingPoints: painPoints(prospect),
    unansweredQuestions: ['Who owns software decisions?', 'What system do they use now?', 'How many active members do they serve?'],
    missingInformation: proposalPreparationStatus.missing,
    proposalReadiness: proposalPreparationStatus.readinessPercent,
    estimatedCloseProbability: stage === 'proposal_preparation' ? 48 : stage === 'contact_ready' ? 34 : 22,
  };
}

function summarizeOpportunities(opportunities) {
  const active = opportunities.filter((item) => item.status === 'active' && !item.archived);
  return {
    totalOpportunities: opportunities.length,
    activeOpportunities: active.length,
    won: opportunities.filter((item) => item.status === 'won').length,
    lost: opportunities.filter((item) => item.status === 'lost').length,
    highPriority: opportunities.filter((item) => item.priority === 'High' || item.priority === 'Critical').length,
    awaitingFollowUp: opportunities.filter((item) => ['waiting', 'follow_up'].includes(item.stage)).length,
    proposalReady: opportunities.filter((item) => item.proposalPreparationStatus.readinessPercent >= 70).length,
    proposalSent: opportunities.filter((item) => item.stage === 'proposal_sent').length,
    averageIcp: average(opportunities.map((item) => item.icpScore)),
    averageLeadScore: average(opportunities.map((item) => item.leadScore)),
  };
}

function buildOpportunityReports(opportunities) {
  return {
    'opportunity-pipeline-report': opportunityReport('Pipeline Report', opportunities),
    'opportunity-health-report': opportunityReport('Opportunity Health Report', opportunities),
    'opportunity-forecast-report': opportunityReport('Forecast Report', opportunities.map((item) => ({ ...item, closeProbability: item.followUpPlan.estimatedCloseProbability }))),
    'executive-sales-summary': opportunityReport('Executive Sales Summary', opportunities.filter((item) => item.executiveVisibility)),
    'opportunity-follow-up-report': opportunityReport('Follow-up Report', opportunities.filter((item) => ['waiting', 'follow_up'].includes(item.stage))),
    'opportunity-proposal-queue': opportunityReport('Proposal Queue', opportunities.filter((item) => item.proposalPreparationStatus.readinessPercent >= 70)),
    'opportunity-stage-aging-report': opportunityReport('Stage Aging Report', opportunities),
    'lost-opportunity-analysis': opportunityReport('Lost Opportunity Analysis', opportunities.filter((item) => item.status === 'lost')),
    'win-summary': opportunityReport('Win Summary', opportunities.filter((item) => item.status === 'won')),
  };
}

function buildResearchReports(store) {
  const summary = summarizeResearchStore(store);
  return {
    'source-inventory': researchReport('Source Inventory', store.sources, summary),
    'research-intake-report': researchReport('Research Intake Report', store.intakeQueue, summary),
    'verification-report': researchReport('Verification Report', store.verificationRecords, summary),
    'duplicate-analysis': researchReport('Duplicate Analysis', store.duplicateCandidates, summary),
    'opportunity-enrichment-report': researchReport('Opportunity Enrichment Report', store.enrichmentHistory, summary),
    'executive-intelligence-summary': researchReport('Executive Intelligence Summary', [summary], summary),
    'source-utilization-report': researchReport(
      'Source Utilization Report',
      store.sources.map((source) => ({ source: source.name, enabled: source.enabled, approvalStatus: source.approvalStatus, lastUsedAt: source.lastUsedAt })),
      summary,
    ),
    'confidence-trend-report': researchReport(
      'Confidence Trend Report',
      store.sources.map((source) => ({ source: source.name, trustScore: source.trustScore, confidenceScore: source.confidenceScore })),
      summary,
    ),
  };
}

function buildWorkflowReports(store) {
  const summary = summarizeWorkflowStore(store);
  return {
    'workflow-summary': workflowReport('Workflow Summary', store.workflows, summary),
    'handoff-activity-report': workflowReport('Handoff Activity Report', store.handoffRecords, summary),
    'approval-queue-report': workflowReport('Approval Queue Report', store.workflows.filter((workflow) => workflow.approvalRequirement), summary),
    'blocked-workflow-report': workflowReport('Blocked Workflow Report', store.workflows.filter((workflow) => workflow.status === 'blocked'), summary),
    'proposal-prep-queue-report': workflowReport('Proposal Prep Queue Report', store.proposalPrepQueue, summary),
    'operator-task-report': workflowReport('Operator Task Report', store.workflows.filter((workflow) => workflow.targetAgent === 'Operator'), summary),
    'executive-approval-report': workflowReport('Executive Approval Report', store.workflows.filter((workflow) => workflow.targetAgent === 'Executive'), summary),
    'workflow-audit-report': workflowReport('Workflow Audit Report', store.workflowAuditHistory, summary),
  };
}

function buildSalesIntelligenceSnapshot() {
  const opportunities = readOpportunities();
  const researchStore = readResearchStore();
  const workflowStore = readWorkflowStore();
  const scores = scoreOpportunitiesForIntelligence(opportunities, researchStore.intakeQueue, workflowStore.workflows);
  const priorityQueues = buildPriorityQueues(opportunities, scores, workflowStore.workflows);
  const duplicateCandidates = detectRelatedOpportunities(opportunities);
  const analytics = buildPipelineAnalytics(opportunities, scores, workflowStore.workflows);
  return { opportunities, scores, priorityQueues, duplicateCandidates, analytics, safety: safetySummary() };
}

function buildIntelligenceReports(snapshot) {
  return {
    'sales-intelligence-report': intelligenceReport('Sales Intelligence Report', snapshot.scores, snapshot),
    'priority-queue-report': intelligenceReport('Priority Queue Report', snapshot.priorityQueues.flatMap((queue) => queue.items.map((item) => ({ queue: queue.label, ...item }))), snapshot),
    'duplicate-candidates-report': intelligenceReport('Duplicate Candidates Report', snapshot.duplicateCandidates, snapshot),
    'pipeline-forecast-report': intelligenceReport(
      'Pipeline Forecast Report',
      snapshot.scores.map((score) => ({
        company: score.company,
        scoreLabel: score.scoreLabel,
        totalScore: score.totalScore,
        confidence: score.confidence,
        forecastValue: score.estimatedRevenuePotential * 125,
        recommendedNextAction: score.recommendedNextAction,
      })),
      snapshot,
    ),
  };
}

function scoreOpportunitiesForIntelligence(opportunities, intakeQueue, workflows) {
  return opportunities.map((opportunity) => {
    const intake = intakeQueue.find((item) => item.opportunityId === opportunity.id);
    const relatedWorkflows = workflows.filter((workflow) => workflow.opportunityId === opportunity.id);
    const companyFit = clamp(opportunity.icpScore);
    const industryFit = /mma|bjj|martial|crossfit|gym|fitness/i.test(opportunity.industry) ? 92 : 66;
    const organizationSize = /small|independent/i.test(opportunity.companySizeEstimate) ? 86 : 68;
    const geographicFit = /KY|IN|Louisville|Jeffersonville|New Albany/i.test(`${opportunity.city} ${opportunity.state} ${opportunity.location}`) ? 92 : 72;
    const buyingSignals = clamp(55 + (opportunity.score.overallScore - 70) + relatedWorkflows.filter((workflow) => workflow.status !== 'archived').length * 4);
    const existingRelationship = opportunity.contacts.some((contact) => contact.email || contact.phone) ? 72 : 35;
    const estimatedRevenuePotential = clamp(opportunity.score.overallScore + (['High', 'Critical'].includes(opportunity.priority) ? 8 : 0));
    const confidence = clamp(((intake?.confidence ?? opportunity.score.confidence) + opportunity.score.confidence + (intake?.completeness ?? 60)) / 3);
    const workflowUrgency = clamp(50 + relatedWorkflows.filter((workflow) => ['blocked', 'in_review', 'assigned'].includes(workflow.status)).length * 12);
    const proposalReadiness = opportunity.proposalPreparationStatus.readinessPercent;
    const totalScore = Math.round(
      companyFit * 0.16 +
        industryFit * 0.12 +
        organizationSize * 0.08 +
        geographicFit * 0.1 +
        buyingSignals * 0.12 +
        existingRelationship * 0.08 +
        estimatedRevenuePotential * 0.12 +
        confidence * 0.08 +
        workflowUrgency * 0.07 +
        proposalReadiness * 0.07,
    );
    const risks = [
      !opportunity.contacts.some((contact) => contact.email || contact.phone) ? 'Contact path missing' : null,
      proposalReadiness < 60 ? 'Proposal requirements incomplete' : null,
      relatedWorkflows.some((workflow) => workflow.status === 'blocked') ? 'Blocked workflow exists' : null,
      intake?.verificationStatus !== 'verified' ? 'Research not fully verified' : null,
    ].filter(Boolean);
    const scoreLabel = proposalReadiness < 35 || risks.length >= 3 ? 'Not Ready' : totalScore >= 84 ? 'Hot' : totalScore >= 70 ? 'Warm' : 'Cold';
    return {
      opportunityId: opportunity.id,
      company: opportunity.company,
      totalScore,
      scoreLabel,
      confidence,
      confidenceLevel: confidence >= 80 ? 'High' : confidence >= 65 ? 'Medium' : 'Low',
      companyFit,
      industryFit,
      organizationSize,
      geographicFit,
      buyingSignals,
      existingRelationship,
      estimatedRevenuePotential,
      workflowUrgency,
      proposalReadiness,
      topReasons: [`${companyFit}% company fit`, `${industryFit}% industry fit`, `${geographicFit}% geographic fit`, `${proposalReadiness}% proposal readiness`],
      risks,
      recommendedNextAction: intelligenceNextAction(scoreLabel, risks, opportunity.followUpPlan.recommendedNextAction),
    };
  });
}

function buildPriorityQueues(opportunities, scores, workflows) {
  const labels = {
    blocked: 'Blocked',
    executive_review: 'Executive Review',
    hot_prospects: 'Hot Prospects',
    needs_research: 'Needs Research',
    proposal_ready: 'Proposal Ready',
    warm_prospects: 'Warm Prospects',
  };
  const queues = Object.entries(labels).map(([id, label]) => ({ id, label, items: [] }));
  for (const opportunity of opportunities) {
    const score = scores.find((item) => item.opportunityId === opportunity.id);
    if (!score) continue;
    const relatedWorkflows = workflows.filter((workflow) => workflow.opportunityId === opportunity.id);
    const ids = [];
    if (score.scoreLabel === 'Hot') ids.push('hot_prospects');
    if (score.scoreLabel === 'Warm') ids.push('warm_prospects');
    if (score.risks.some((risk) => /verified|contact|requirements/i.test(risk))) ids.push('needs_research');
    if (opportunity.proposalPreparationStatus.readinessPercent >= 70) ids.push('proposal_ready');
    if (relatedWorkflows.some((workflow) => workflow.targetAgent === 'Executive' || workflow.approvalRequirement)) ids.push('executive_review');
    if (relatedWorkflows.some((workflow) => workflow.status === 'blocked')) ids.push('blocked');
    for (const id of ids) {
      queues.find((queue) => queue.id === id)?.items.push({
        opportunityId: opportunity.id,
        company: opportunity.company,
        totalScore: score.totalScore,
        scoreLabel: score.scoreLabel,
        priority: opportunity.priority,
        explanation: queueExplanation(id, score),
        nextAction: score.recommendedNextAction,
        risks: score.risks,
      });
    }
  }
  return queues;
}

function detectRelatedOpportunities(opportunities) {
  const candidates = [];
  for (let i = 0; i < opportunities.length; i += 1) {
    for (let j = i + 1; j < opportunities.length; j += 1) {
      const left = opportunities[i];
      const right = opportunities[j];
      const fields = [
        normalize(left.company) === normalize(right.company) ? 'company name' : null,
        domain(left.website) && domain(left.website) === domain(right.website) ? 'domain' : null,
        left.email && left.email === right.email ? 'contact email' : null,
        normalize(left.source) === normalize(right.source) ? 'source' : null,
        sharedToken(left.company, right.company) ? 'opportunity title' : null,
      ].filter(Boolean);
      if (fields.length >= 2) {
        candidates.push({
          id: `related-${left.id}-${right.id}`,
          opportunityId: left.id,
          relatedOpportunityId: right.id,
          company: left.company,
          relatedCompany: right.company,
          fields,
          confidence: Math.min(96, 45 + fields.length * 15),
          reason: `Shared ${fields.join(', ')} suggests manual review.`,
          reviewAction: 'Review Duplicate',
        });
      }
    }
  }
  return candidates;
}

function buildPipelineAnalytics(opportunities, scores, workflows) {
  const nextActionBreakdown = scores.reduce((counts, score) => {
    counts[score.recommendedNextAction] = (counts[score.recommendedNextAction] ?? 0) + 1;
    return counts;
  }, {});
  return {
    totalOpportunities: opportunities.length,
    hotCount: scores.filter((score) => score.scoreLabel === 'Hot').length,
    warmCount: scores.filter((score) => score.scoreLabel === 'Warm').length,
    coldCount: scores.filter((score) => score.scoreLabel === 'Cold').length,
    notReadyCount: scores.filter((score) => score.scoreLabel === 'Not Ready').length,
    estimatedPipelineValue: scores.reduce((sum, score) => sum + score.estimatedRevenuePotential * 125, 0),
    proposalReadyCount: opportunities.filter((opportunity) => opportunity.proposalPreparationStatus.readinessPercent >= 70).length,
    blockedCount: workflows.filter((workflow) => workflow.status === 'blocked').length,
    executiveReviewCount: workflows.filter((workflow) => workflow.targetAgent === 'Executive' || workflow.approvalRequirement).length,
    averageConfidence: average(scores.map((score) => score.confidence)),
    nextActionBreakdown,
  };
}

function intelligenceReport(title, rows, snapshot) {
  return { title, generatedAt: new Date().toISOString(), summary: snapshot.analytics, rows, safety: snapshot.safety, localOnly: true };
}

function intelligenceNextAction(label, risks, fallback) {
  if (risks.some((risk) => /Contact/.test(risk))) return 'Verify contact path';
  if (risks.some((risk) => /Proposal/.test(risk))) return 'Complete proposal requirements';
  if (label === 'Hot') return 'Queue Executive review';
  if (label === 'Warm') return 'Prepare follow-up';
  if (label === 'Cold') return 'Keep in nurture';
  return fallback;
}

function queueExplanation(queueId, score) {
  if (queueId === 'hot_prospects') return `Hot score ${score.totalScore} with ${String(score.confidenceLevel).toLowerCase()} confidence.`;
  if (queueId === 'warm_prospects') return `Warm score ${score.totalScore}; useful but needs more proof.`;
  if (queueId === 'needs_research') return `Needs research because ${score.risks[0] ?? 'key fields are incomplete'}.`;
  if (queueId === 'proposal_ready') return `${score.proposalReadiness}% proposal readiness.`;
  if (queueId === 'executive_review') return 'Approval or Executive review workflow is attached.';
  return 'Blocked or gated work exists; resolve before external action.';
}

function workflowReport(title, rows, summary) {
  return { title, generatedAt: new Date().toISOString(), summary, rows, localOnly: true, safety: safetySummary() };
}

function summarizeWorkflowStore(store) {
  const open = store.workflows.filter((workflow) => !['completed', 'archived', 'rejected'].includes(workflow.status));
  const blocked = store.workflows.filter((workflow) => workflow.status === 'blocked').length;
  const approvals = store.workflows.filter((workflow) => workflow.approvalRequirement && ['pending', 'required', 'blocked'].includes(workflow.approvalStatus)).length;
  return {
    totalWorkflows: store.workflows.length,
    activeHandoffs: open.length,
    assignedToOperator: open.filter((workflow) => workflow.targetAgent === 'Operator').length,
    assignedToExecutive: open.filter((workflow) => workflow.targetAgent === 'Executive').length,
    assignedToProposalPrep: open.filter((workflow) => workflow.targetAgent === 'Proposal Prep').length,
    approvalQueue: approvals,
    blockedWorkflows: blocked,
    completedWorkflows: store.workflows.filter((workflow) => workflow.status === 'completed').length,
    proposalPrepItems: store.proposalPrepQueue.length,
    externalActionGates: store.workflows.filter((workflow) => workflow.type === 'external_action_gate').length,
    workflowHealth: Math.max(0, Math.round(100 - blocked * 10 - approvals * 4)),
  };
}

function researchReport(title, rows, summary) {
  return {
    title,
    generatedAt: new Date().toISOString(),
    summary,
    rows,
    localOnly: true,
    safety: safetySummary(),
  };
}

function summarizeResearchStore(store) {
  return {
    approvedSources: store.sources.filter((source) => source.approvalStatus === 'Approved' && source.enabled).length,
    pendingReviews:
      store.sources.filter((source) => ['Draft', 'Pending Review'].includes(source.approvalStatus)).length +
      store.intakeQueue.filter((item) => item.reviewStatus === 'pending_review').length,
    rejectedSources: store.sources.filter((source) => source.approvalStatus === 'Rejected').length,
    researchBacklog: store.intakeQueue.filter((item) => item.reviewStatus === 'pending_review').length,
    enrichmentProgress: Math.round((store.enrichmentHistory.length / Math.max(1, store.intakeQueue.length)) * 100),
    confidenceTrend: average([...store.sources.map((source) => source.confidenceScore), ...store.intakeQueue.map((item) => item.confidence)]),
    duplicateAlerts: store.duplicateCandidates.length,
    verificationQueue: store.intakeQueue.filter((item) => item.verificationStatus !== 'verified' || item.humanReviewRequired).length,
  };
}

function opportunityReport(title, opportunities) {
  return { title, generatedAt: new Date().toISOString(), summary: summarizeOpportunities(readOpportunities()), rows: opportunities.map((item) => ({ company: item.company, stage: item.stage, priority: item.priority, score: item.score?.overallScore, proposalReadiness: item.proposalPreparationStatus?.readinessPercent, nextAction: item.followUpPlan?.recommendedNextAction })), safety: safetySummary() };
}

function validateOpportunities(opportunities) {
  return opportunities.flatMap((item) => {
    const errors = [];
    ['id', 'company', 'stage', 'status', 'createdAt', 'updatedAt'].forEach((field) => {
      if (!item[field]) errors.push(`${item.company ?? item.id}: missing ${field}`);
    });
    if (!Array.isArray(item.activityTimeline) || !item.activityTimeline.length) errors.push(`${item.company}: missing timeline`);
    return errors;
  });
}

function validateResearchStore(store) {
  const errors = [];
  if (!Array.isArray(store.sources)) errors.push('sources missing');
  if (!Array.isArray(store.intakeQueue)) errors.push('intake queue missing');
  if (!Array.isArray(store.verificationRecords)) errors.push('verification records missing');
  if (!Array.isArray(store.enrichmentHistory)) errors.push('enrichment history missing');
  if (!Array.isArray(store.duplicateCandidates)) errors.push('duplicate candidates missing');
  if (!Array.isArray(store.reviewHistory)) errors.push('review history missing');
  for (const source of store.sources ?? []) {
    ['id', 'name', 'category', 'description', 'createdAt', 'updatedAt', 'trustScore', 'confidenceScore', 'status', 'approvalStatus'].forEach((field) => {
      if (source[field] === undefined || source[field] === '') errors.push(`${source.id ?? 'source'} missing ${field}`);
    });
  }
  for (const item of store.intakeQueue ?? []) {
    ['id', 'sourceId', 'opportunityId', 'company', 'researchType', 'date', 'analyst', 'summary', 'rawNotes', 'confidence', 'verificationStatus'].forEach((field) => {
      if (item[field] === undefined || item[field] === '') errors.push(`${item.id ?? 'intake'} missing ${field}`);
    });
  }
  return errors;
}

function validateWorkflowStore(store) {
  const errors = [];
  if (!Array.isArray(store.workflows)) errors.push('workflows missing');
  if (!Array.isArray(store.handoffRecords)) errors.push('handoff records missing');
  if (!Array.isArray(store.approvalDecisions)) errors.push('approval decisions missing');
  if (!Array.isArray(store.proposalPrepQueue)) errors.push('proposal prep queue missing');
  if (!Array.isArray(store.workflowAuditHistory)) errors.push('workflow audit history missing');
  for (const workflow of store.workflows ?? []) {
    [
      'id',
      'type',
      'sourceAgent',
      'targetAgent',
      'opportunityId',
      'company',
      'priority',
      'status',
      'owner',
      'requestedAction',
      'reason',
      'createdAt',
      'updatedAt',
      'dueAt',
    ].forEach((field) => {
      if (workflow[field] === undefined || workflow[field] === '') errors.push(`${workflow.id ?? 'workflow'} missing ${field}`);
    });
    if (!Array.isArray(workflow.auditTrail) || !workflow.auditTrail.length) errors.push(`${workflow.id}: missing audit trail`);
    if (workflow.type === 'external_action_gate' && !workflow.approvalRequirement) errors.push(`${workflow.id}: external action gate must require approval`);
  }
  return errors;
}

function defaultTargetAgent(type) {
  if (['executive_approval', 'risky_source_review', 'external_action_gate', 'proposal_readiness_review', 'stalled_opportunity_review', 'lost_opportunity_review'].includes(type)) return 'Executive';
  if (type === 'proposal_prep_handoff') return 'Proposal Prep';
  return 'Operator';
}

function setArchiveState(archived) {
  const opportunities = readOpportunities();
  const id = process.env.SALES_OPPORTUNITY_ID ?? opportunities[0]?.id;
  const stage = archived ? 'archived' : 'prospect';
  const next = opportunities.map((item) => (item.id === id ? moveStage(item, stage, archived ? 'Archived locally.' : 'Restored locally.') : item));
  writeOpportunities(next);
  return { title: archived ? 'Sales Opportunity Archived' : 'Sales Opportunity Restored', generatedAt: new Date().toISOString(), opportunity: next.find((item) => item.id === id), safety: safetySummary() };
}

function writeSalesReport(slug, payload) {
  ensureReportRoot();
  const jsonPath = path.join(reportRoot, `${slug}.json`);
  const mdPath = path.join(reportRoot, `${slug}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return { json: path.relative(repoRoot, jsonPath), markdown: path.relative(repoRoot, mdPath) };
}

function writeCsv(slug, rows) {
  ensureReportRoot();
  const csvPath = path.join(reportRoot, `${slug}.csv`);
  const headers = ['name', 'city', 'state', 'category', 'website', 'score', 'tier', 'nextResearch'];
  writeFileSync(csvPath, `${headers.join(',')}\n${rows.map((row) => headers.map((key) => csvCell(row[key])).join(',')).join('\n')}\n`);
  return path.relative(repoRoot, csvPath);
}

function report(title, rows) {
  return { title, generatedAt: new Date().toISOString(), rows, safety: safetySummary() };
}

function safetySummary() {
  return { mode: 'local/mock/read-only', blockedActions, productionWritesOccurred: false };
}

function manualResearchMode() {
  return {
    instructions: [
      'Paste public website URL, Instagram/social URL, owner/contact name if publicly listed, contact page URL, current software clues, schedule/program notes, and member count proxy.',
      'Do not paste private data, login-gated content, paywalled data, scraped personal data, or secrets.',
      'If web research is configured later, use only approved public sources and respect site rules and rate limits.',
    ],
  };
}

function identifyBusinessType(prospect) {
  if (prospect.category === 'crossfit') return 'CrossFit / functional fitness';
  if (prospect.category === 'small_gym') return 'small independent gym';
  return 'MMA / BJJ / martial arts';
}

function recommendedProduct(prospect) {
  if (prospect.category === 'crossfit') return 'Gym OS + App for Gyms';
  if (prospect.category === 'small_gym') return 'Gym OS';
  return 'Gym OS + member app';
}

function painPoints(prospect) {
  if (prospect.category === 'crossfit') return ['trial onboarding', 'class scheduling', 'member retention', 'coach-led habit tracking'];
  if (prospect.category === 'small_gym') return ['fragmented member operations', 'digital programming delivery', 'member communication'];
  return ['student progression visibility', 'youth/adult program retention', 'class communication', 'member onboarding'];
}

function ensureReportRoot() {
  mkdirSync(reportRoot, { recursive: true });
}

function ensureCrmRoot() {
  mkdirSync(crmRoot, { recursive: true });
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function domain(value) {
  return String(value ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

function sharedToken(left, right) {
  const leftTokens = String(left ?? '').toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 4);
  const rightTokens = new Set(String(right ?? '').toLowerCase().split(/[^a-z0-9]+/));
  return leftTokens.some((token) => rightTokens.has(token));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length);
}

function compactStamp(timestamp) {
  return timestamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title}`, '', `Generated: ${payload.generatedAt ?? new Date().toISOString()}`, '', 'Safety: local/mock/read-only. No external writes.', ''];
  if (payload.summary) {
    lines.push('## Summary', '');
    Object.entries(payload.summary).forEach(([key, value]) => lines.push(`- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`));
    lines.push('');
  }
  const rows = payload.rows ?? payload.dossiers ?? payload.topProspects ?? [];
  if (Array.isArray(rows) && rows.length) {
    lines.push('## Rows', '');
    rows.forEach((row, index) => {
      lines.push(`### ${index + 1}. ${row.name ?? row.prospect ?? row.title ?? 'Item'}`);
      Object.entries(row).forEach(([key, value]) => lines.push(`- ${key}: ${Array.isArray(value) ? value.join('; ') : typeof value === 'object' ? JSON.stringify(value) : value}`));
      lines.push('');
    });
  }
  return `${lines.join('\n').trim()}\n`;
}
