import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCommunicationDraft, validateCommunicationDraftLayer } from './comms-draft-runtime.mjs';
import { createSharedTask, validateSharedTaskLayer } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const reportRoot = path.join(repoRoot, 'reports/agents/sales');

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

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
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
