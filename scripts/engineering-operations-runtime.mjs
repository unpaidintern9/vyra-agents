import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEngineeringTaskGenerator } from './engineering-task-generator-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const engineeringRoot = path.join(repoRoot, 'codex-agent-threads/shared/engineering');
const reportsRoot = path.join(engineeringRoot, 'reports');
const files = {
  products: path.join(engineeringRoot, 'products.json'),
  features: path.join(engineeringRoot, 'features.json'),
  roadmaps: path.join(engineeringRoot, 'roadmaps.json'),
  issues: path.join(engineeringRoot, 'issues.json'),
  releases: path.join(engineeringRoot, 'releases.json'),
  feedback: path.join(engineeringRoot, 'feedback.json'),
  audit: path.join(engineeringRoot, 'audit-history.json'),
};

export const engineeringOperationCommands = [
  'engineering:products',
  'engineering:features',
  'engineering:roadmaps',
  'engineering:issues',
  'engineering:releases',
  'engineering:feedback',
  'engineering:health',
  'engineering:roadmap-report',
  'engineering:release-report',
  'engineering:validate',
];

const safety = {
  localOnly: true,
  externalDatabase: false,
  githubMutations: false,
  deploymentAutomation: false,
  ciCdMutations: false,
  appStorePublishing: false,
  autonomousCodeGeneration: false,
  autonomousMerges: false,
  advisoryOnly: true,
};

export function getProducts() {
  const store = readEngineeringOperationsStore();
  return { title: 'Product Portfolio', generatedAt: stamp(), products: store.products, summary: summarizeEngineering(store), safety };
}

export function getFeatures() {
  const store = readEngineeringOperationsStore();
  return { title: 'Feature Board', generatedAt: stamp(), features: store.features, summary: summarizeEngineering(store), safety };
}

export function getRoadmaps() {
  const store = readEngineeringOperationsStore();
  return { title: 'Product Roadmaps', generatedAt: stamp(), roadmaps: store.roadmaps, summary: summarizeEngineering(store), safety };
}

export function getIssues() {
  const store = readEngineeringOperationsStore();
  return { title: 'Issue Tracker', generatedAt: stamp(), issues: store.issues, summary: summarizeEngineering(store), safety };
}

export function getReleases() {
  const store = readEngineeringOperationsStore();
  return { title: 'Release Planning', generatedAt: stamp(), releases: store.releases, summary: summarizeEngineering(store), safety };
}

export function getFeedback() {
  const store = readEngineeringOperationsStore();
  return { title: 'Product Feedback', generatedAt: stamp(), feedback: store.feedback, summary: summarizeEngineering(store), safety };
}

export function getEngineeringHealth() {
  const store = readEngineeringOperationsStore();
  return { title: 'Engineering Health', generatedAt: stamp(), health: buildEngineeringHealth(store), summary: summarizeEngineering(store), safety };
}

export function getRoadmapReport() {
  const store = readEngineeringOperationsStore();
  const payload = {
    title: 'Roadmap Progress Report',
    generatedAt: stamp(),
    summary: summarizeEngineering(store),
    roadmaps: store.roadmaps.map((roadmap) => ({
      roadmapId: roadmap.roadmapId,
      name: roadmap.name,
      type: roadmap.type,
      progress: roadmap.progress,
      executivePriority: roadmap.executivePriority,
      milestones: roadmap.milestones,
      risks: roadmap.risks,
    })),
    health: buildEngineeringHealth(store).roadmapProgress,
    safety,
  };
  writeReport('roadmap-progress-report', payload);
  return payload;
}

export function getReleaseReport() {
  const store = readEngineeringOperationsStore();
  const payload = {
    title: 'Release Readiness Report',
    generatedAt: stamp(),
    summary: summarizeEngineering(store),
    releases: store.releases,
    health: buildEngineeringHealth(store).releaseReadiness,
    safety,
  };
  writeReport('release-readiness-report', payload);
  return payload;
}

export function buildEngineeringOperationsReports() {
  const store = readEngineeringOperationsStore();
  const summary = summarizeEngineering(store);
  const health = buildEngineeringHealth(store);
  const reports = {
    'product-portfolio-report': { title: 'Product Portfolio Report', generatedAt: stamp(), summary, products: store.products, safety },
    'engineering-health-report': { title: 'Engineering Health Report', generatedAt: stamp(), summary, health, safety },
    'roadmap-progress-report': { title: 'Roadmap Progress Report', generatedAt: stamp(), summary, roadmaps: store.roadmaps, health: health.roadmapProgress, safety },
    'feature-status-report': { title: 'Feature Status Report', generatedAt: stamp(), summary, features: store.features, health: health.featureCompletion, safety },
    'bug-summary-report': { title: 'Bug Summary Report', generatedAt: stamp(), summary, issues: store.issues.filter((issue) => issue.type === 'Bug'), health: health.bugBacklogHealth, safety },
    'release-readiness-report': { title: 'Release Readiness Report', generatedAt: stamp(), summary, releases: store.releases, health: health.releaseReadiness, safety },
    'customer-feedback-summary': { title: 'Customer Feedback Summary', generatedAt: stamp(), summary, feedback: store.feedback, safety },
    'executive-engineering-summary': { title: 'Executive Engineering Summary', generatedAt: stamp(), summary, health, risks: collectRisks(store), safety },
  };
  return {
    title: 'Engineering Product Operations Reports Generated',
    generatedAt: stamp(),
    written: Object.entries(reports).map(([slug, payload]) => writeReport(slug, payload)),
    safety,
  };
}

export function validateEngineeringOperations() {
  const store = readEngineeringOperationsStore();
  const errors = [];
  const requiredReports = [
    'product-portfolio-report',
    'engineering-health-report',
    'roadmap-progress-report',
    'feature-status-report',
    'bug-summary-report',
    'release-readiness-report',
    'customer-feedback-summary',
    'executive-engineering-summary',
  ];
  if (!store.products.length) errors.push('product records missing');
  if (!store.features.length) errors.push('feature records missing');
  if (!store.roadmaps.length) errors.push('roadmap records missing');
  if (!store.issues.length) errors.push('issue records missing');
  if (!store.releases.length) errors.push('release records missing');
  if (!store.feedback.length) errors.push('feedback records missing');
  if (!store.audit.length) errors.push('audit history missing');
  if (store.releases.some((release) => release.releaseAutomationEnabled)) errors.push('release automation must remain disabled');
  if (store.issues.some((issue) => issue.githubWriteEnabled)) errors.push('GitHub issue write automation must remain disabled');
  if (store.products.some((product) => !Array.isArray(product.linkedEngineeringWork))) errors.push('products must link engineering work');
  const taskValidation = validateEngineeringTaskGenerator();
  if (taskValidation.status !== 'pass') errors.push(`existing engineering task generator failed validation: ${taskValidation.errors.join('; ')}`);
  buildEngineeringOperationsReports();
  for (const report of requiredReports) {
    if (!existsSync(path.join(reportsRoot, `${report}.json`)) || !existsSync(path.join(reportsRoot, `${report}.md`))) {
      errors.push(`report missing: ${report}`);
    }
  }
  return {
    title: 'Engineering Product Operations Validation',
    generatedAt: stamp(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands: engineeringOperationCommands,
    storageRoot: 'codex-agent-threads/shared/engineering',
    summary: summarizeEngineering(store),
    reportCount: requiredReports.length,
    safety,
  };
}

export function readEngineeringOperationsStore() {
  ensureEngineeringStorage();
  return {
    products: readJson(files.products, []),
    features: readJson(files.features, []),
    roadmaps: readJson(files.roadmaps, []),
    issues: readJson(files.issues, []),
    releases: readJson(files.releases, []),
    feedback: readJson(files.feedback, []),
    audit: readJson(files.audit, []),
  };
}

function ensureEngineeringStorage() {
  for (const directory of [engineeringRoot, reportsRoot]) mkdirSync(directory, { recursive: true });
  if (Object.values(files).some((file) => !existsSync(file))) seedEngineeringStore();
}

function seedEngineeringStore() {
  const now = stamp();
  const products = [
    product('prod-athlete-app', 'Athlete App', 'Athlete-facing performance companion for training accountability.', 'Active Development', 'Product', '0.8.0', ['goal-athlete-launch'], ['kpi-activation'], ['camp-athlete-app-foundation'], ['forecast-annual'], ['cust-river-city-performance'], ['engineering-task:repo-risk:vyra-app'], now),
    product('prod-coach-platform', 'Coach Platform', 'Coach workspace for athlete progress, programming, and client communication.', 'QA', 'Product', '1.1.0', ['goal-coach-retention'], ['kpi-retention'], ['camp-gym-growth-readiness'], ['fin-cust-area-502-mma'], ['cust-area-502-mma'], ['engineering-task:documentation:coach-platform'], now),
    product('prod-gym-software', 'Gym Software', 'Gym operations software for member experience, onboarding, and growth follow-through.', 'Beta', 'Product', '0.9.0', ['goal-gym-growth'], ['kpi-onboarding'], ['camp-gym-growth-readiness'], ['fin-cust-louisville-combat-academy'], ['cust-louisville-combat-academy'], ['engineering-task:release-blocker:gym-software:qa'], now),
    product('prod-white-label', 'White Label Platform', 'Partner-branded performance experience planning for larger organizations.', 'Planned', 'Product', '0.3.0', ['goal-enterprise-pilot'], ['kpi-pipeline'], ['camp-white-label-positioning'], ['fin-future-white-label'], ['cust-kentucky-youth-sports'], ['engineering-task:project-registry:white-label'], now),
  ];
  const features = [
    feature('feat-athlete-progress-snapshot', products[0], 'Feature Ideas', 'High', 'Medium', 82, 'High', 6, ['tasks:list'], ['asset-operator-runtime-docs'], ['req-progress-summary'], ['issue-athlete-empty-state'], ['feedback-river-city-progress'], now),
    feature('feat-coach-client-board', products[1], 'QA', 'High', 'Medium', 78, 'High', 8, ['engineering-task:documentation:coach-platform'], ['asset-knowledge-graph-doc'], ['req-client-board'], ['issue-coach-doc-gap'], ['feedback-area-502-training'], now),
    feature('feat-gym-member-import', products[2], 'Beta', 'Critical', 'High', 90, 'Critical', 13, ['engineering-task:release-blocker:gym-software:qa'], ['asset-migration-guide'], ['req-member-import'], ['issue-gym-import-validation'], ['feedback-lca-import'], now),
    feature('feat-white-label-branding', products[3], 'Planned Features', 'Medium', 'High', 70, 'Medium', 13, ['engineering-task:project-registry:white-label'], ['asset-brand-intelligence'], ['req-branding'], ['issue-white-label-scope'], ['feedback-kys-enterprise'], now),
    feature('feat-release-notes-workflow', products[1], 'Released', 'Medium', 'Low', 64, 'Medium', 3, ['release:ship-plans'], ['asset-release-notes'], ['req-release-notes'], [], ['feedback-success-release-comms'], now),
  ];
  const roadmaps = [
    roadmap('roadmap-q3-product-readiness', 'Q3 Product Readiness', 'Quarterly', 62, ['Gym member import beta', 'Coach client board QA', 'Athlete snapshot idea review'], ['goal-gym-growth', 'goal-coach-retention'], ['feat-gym-member-import', 'feat-coach-client-board'], ['Member import QA remains the release blocker.'], 'High', now),
    roadmap('roadmap-july-release', 'July Release Plan', 'Release', 58, ['Release notes workflow', 'Gym beta readiness', 'Feedback summary review'], ['goal-athlete-launch'], ['feat-release-notes-workflow', 'feat-gym-member-import'], ['Release approval is planning-only.'], 'High', now),
    roadmap('roadmap-long-term-platform', 'Long-Term Product Platform', 'Long-term', 36, ['White label branding', 'Shared product analytics', 'Cross-agent product memory'], ['goal-enterprise-pilot'], ['feat-white-label-branding'], ['Enterprise scope needs customer validation.'], 'Medium', now),
  ];
  const issues = [
    issue('issue-gym-import-validation', 'Bug', 'Critical', 'P0', 'Engineering', 'open', products[2], 'feat-gym-member-import', 'CSV import validation misses duplicate local IDs in one dry-run path.', ['tasks:validate'], ['asset-migration-guide'], ['release-readiness-report'], now),
    issue('issue-coach-doc-gap', 'Documentation', 'Medium', 'P2', 'Product', 'planned', products[1], 'feat-coach-client-board', 'Coach client board acceptance notes need screenshots before release review.', ['engineering-task:documentation:coach-platform'], ['asset-operator-runtime-docs'], ['feature-status-report'], now),
    issue('issue-athlete-empty-state', 'UI', 'Low', 'P3', 'Design', 'triage', products[0], 'feat-athlete-progress-snapshot', 'Progress snapshot empty state needs clearer product wording.', ['marketing:content'], ['asset-brand-intelligence'], ['product-portfolio-report'], now),
    issue('issue-white-label-scope', 'Enhancement', 'High', 'P1', 'Product', 'planned', products[3], 'feat-white-label-branding', 'White label scope requires manual executive review before any build work.', ['executive:goals'], ['asset-brand-intelligence'], ['executive-engineering-summary'], now),
  ];
  const releases = [
    release('rel-0.9.0-gym-beta', '0.9.0', '2026-07-22', ['feat-gym-member-import', 'feat-release-notes-workflow'], ['issue-gym-import-validation'], ['QA blocker unresolved.'], 'blocked', 61, 'needs_review', now),
    release('rel-1.1.0-coach-qa', '1.1.0', '2026-08-05', ['feat-coach-client-board'], ['issue-coach-doc-gap'], ['Documentation gap before release notes.'], 'review', 74, 'pending', now),
    release('rel-0.8.0-athlete-planning', '0.8.0', '2026-08-19', ['feat-athlete-progress-snapshot'], ['issue-athlete-empty-state'], ['Feature is still in idea review.'], 'planning', 52, 'not_requested', now),
  ];
  const feedbackRows = [
    feedbackRecord('feedback-lca-import', 'Gyms', 'member import', 5, 'High', ['feat-gym-member-import'], ['cust-louisville-combat-academy'], 'Prioritize import validation and release readiness review.', now),
    feedbackRecord('feedback-river-city-progress', 'Coaches', 'progress reporting', 3, 'Medium', ['feat-athlete-progress-snapshot'], ['cust-river-city-performance'], 'Shape progress snapshot requirements with Customer Success.', now),
    feedbackRecord('feedback-area-502-training', 'Customer Success', 'training workflow', 4, 'Medium', ['feat-coach-client-board'], ['cust-area-502-mma'], 'Complete QA notes and training assets together.', now),
    feedbackRecord('feedback-kys-enterprise', 'Sales', 'enterprise branding', 2, 'High', ['feat-white-label-branding'], ['cust-kentucky-youth-sports'], 'Keep white label planning advisory until executive approval.', now),
    feedbackRecord('feedback-success-release-comms', 'Customer Success', 'release communication', 3, 'Medium', ['feat-release-notes-workflow'], ['cust-louisville-combat-academy', 'cust-area-502-mma'], 'Prepare release communications as drafts only.', now),
  ];
  const audit = [{ timestamp: now, actor: 'Engineering Product Operations Agent', previousValue: null, newValue: 'phase61.engineering.seeded', reason: 'Seeded local product operations records. No GitHub, deployment, CI/CD, App Store, or release action occurred.' }];
  writeJson(files.products, products);
  writeJson(files.features, features);
  writeJson(files.roadmaps, roadmaps);
  writeJson(files.issues, issues);
  writeJson(files.releases, releases);
  writeJson(files.feedback, feedbackRows);
  writeJson(files.audit, audit);
}

function product(productId, name, description, status, owner, version, linkedGoals, linkedKpis, linkedCampaigns, linkedRevenue, linkedCustomers, linkedEngineeringWork, now) {
  return { productId, name, description, status, owner, version, roadmap: `roadmap-${productId}`, linkedGoals, linkedKpis, linkedCampaigns, linkedRevenue, linkedCustomers, linkedEngineeringWork, auditHistory: [{ timestamp: now, event: 'product.record.created' }] };
}

function feature(featureId, productRecord, status, priority, complexity, estimatedValue, customerImpact, engineeringEffort, linkedTasks, linkedAssets, linkedRequirements, linkedBugs, linkedFeedback, now) {
  return { featureId, productId: productRecord.productId, productName: productRecord.name, description: featureId.replace('feat-', '').replace(/-/g, ' '), priority, complexity, estimatedValue, customerImpact, engineeringEffort, linkedTasks, linkedAssets, linkedRequirements, linkedBugs, linkedFeedback, status, auditHistory: [{ timestamp: now, event: 'feature.record.created' }] };
}

function roadmap(roadmapId, name, type, progress, milestones, goals, features, risks, executivePriority, now) {
  return { roadmapId, name, type, milestones, features, goals, dependencies: ['Shared Memory', 'Universal Task Engine', 'Executive Planning'], risks, progress, executivePriority, auditHistory: [{ timestamp: now, event: 'roadmap.record.created' }] };
}

function issue(issueId, type, severity, priority, owner, status, productRecord, featureId, reproductionNotes, linkedTasks, linkedAssets, linkedReports, now) {
  return { issueId, type, severity, priority, owner, status, productId: productRecord.productId, productName: productRecord.name, featureId, reproductionNotes, linkedTasks, linkedAssets, linkedReports, githubWriteEnabled: false, auditHistory: [{ timestamp: now, event: 'issue.record.created' }] };
}

function release(releaseId, version, plannedDate, includedFeatures, bugFixes, risks, qaStatus, readinessScore, executiveApprovalStatus, now) {
  return { releaseId, version, plannedDate, includedFeatures, bugFixes, risks, qaStatus, releaseNotesDraft: `Draft release notes for ${version}. Planning only; no automatic release.`, readinessScore, executiveApprovalStatus, releaseAutomationEnabled: false, auditHistory: [{ timestamp: now, event: 'release.record.created' }] };
}

function feedbackRecord(feedbackId, source, category, frequency, severity, linkedFeatures, linkedCustomers, recommendations, now) {
  return { feedbackId, source, category, frequency, severity, linkedFeatures, linkedCustomers, recommendations, auditHistory: [{ timestamp: now, event: 'feedback.record.created' }] };
}

function buildEngineeringHealth(store) {
  const summary = summarizeEngineering(store);
  const openBugs = store.issues.filter((issue) => issue.type === 'Bug' && !['done', 'closed'].includes(issue.status)).length;
  const blockerIssues = store.issues.filter((issue) => ['Critical', 'High'].includes(issue.severity) && !['done', 'closed'].includes(issue.status)).length;
  const averageRoadmapProgress = avg(store.roadmaps.map((roadmap) => roadmap.progress));
  const averageReleaseReadiness = avg(store.releases.map((release) => release.readinessScore));
  const qaFeatures = store.features.filter((feature) => ['QA', 'Beta', 'Released'].includes(feature.status)).length;
  return {
    releaseReadiness: evaluation(averageReleaseReadiness, ['Review blocked releases.', 'Keep release approval manual.'], store.releases.flatMap((release) => release.risks)),
    roadmapProgress: evaluation(averageRoadmapProgress, ['Review roadmap risks with Executive.', 'Keep dependencies explicit.'], store.roadmaps.flatMap((roadmap) => roadmap.risks)),
    featureCompletion: evaluation(Math.round((qaFeatures / Math.max(store.features.length, 1)) * 100), ['Move active features through QA intentionally.'], []),
    bugBacklogHealth: evaluation(Math.max(0, 100 - openBugs * 18 - blockerIssues * 12), ['Triage critical bugs before release planning.'], blockerIssues ? ['Critical or high issue open.'] : []),
    technicalDebt: evaluation(72, ['Review repository-intelligence task candidates.'], ['Technical debt is inferred from local planning records.']),
    qaReadiness: evaluation(Math.max(35, averageReleaseReadiness - blockerIssues * 8), ['Resolve QA blockers before release readiness approval.'], blockerIssues ? ['QA blockers remain open.'] : []),
    productHealth: evaluation(Math.round((summary.averageRoadmapProgress + averageReleaseReadiness + (100 - blockerIssues * 12)) / 3), ['Review product portfolio monthly.'], collectRisks(store)),
  };
}

function evaluation(score, recommendations, risks) {
  return {
    score,
    confidence: 78,
    risks,
    blockers: risks.filter((risk) => /blocker|critical|unresolved/i.test(risk)),
    recommendations,
    nextActions: recommendations.map((item) => item.replace(/\.$/, '.')),
  };
}

function summarizeEngineering(store) {
  return {
    productCount: store.products.length,
    featureCount: store.features.length,
    activeFeatures: store.features.filter((feature) => ['Active Development', 'QA', 'Beta'].includes(feature.status)).length,
    releasedFeatures: store.features.filter((feature) => feature.status === 'Released').length,
    roadmapCount: store.roadmaps.length,
    averageRoadmapProgress: avg(store.roadmaps.map((roadmap) => roadmap.progress)),
    openIssues: store.issues.filter((issue) => !['done', 'closed'].includes(issue.status)).length,
    criticalIssues: store.issues.filter((issue) => issue.severity === 'Critical').length,
    upcomingReleases: store.releases.length,
    blockedReleases: store.releases.filter((release) => release.qaStatus === 'blocked' || release.readinessScore < 65).length,
    feedbackItems: store.feedback.length,
    highSeverityFeedback: store.feedback.filter((item) => item.severity === 'High').length,
  };
}

function collectRisks(store) {
  return [
    ...store.roadmaps.flatMap((roadmap) => roadmap.risks),
    ...store.releases.flatMap((release) => release.risks),
    ...store.issues.filter((issue) => ['Critical', 'High'].includes(issue.severity)).map((issue) => issue.reproductionNotes),
  ].filter(Boolean);
}

function writeReport(slugName, payload) {
  mkdirSync(reportsRoot, { recursive: true });
  const jsonPath = path.join(reportsRoot, `${slugName}.json`);
  const mdPath = path.join(reportsRoot, `${slugName}.md`);
  writeJson(jsonPath, payload);
  writeFileSync(mdPath, `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nLocal-only engineering safety: no GitHub mutations, deployments, CI/CD mutations, App Store publishing, autonomous code generation, automatic releases, or autonomous merges.\n`);
  return { slug: slugName, jsonPath: path.relative(repoRoot, jsonPath), markdownPath: path.relative(repoRoot, mdPath) };
}

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function avg(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}

function stamp() {
  return new Date().toISOString();
}
