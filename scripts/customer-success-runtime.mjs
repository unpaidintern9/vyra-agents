import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAssetStore } from './asset-library-runtime.mjs';
import { buildSharedMemoryStore } from './shared-memory-runtime.mjs';
import { listSharedTasks } from './shared-task-runtime.mjs';
import { getExecutivePlanningSummary } from './executive-planning-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const successRoot = path.join(repoRoot, 'codex-agent-threads/shared/customer-success');
const reportsRoot = path.join(successRoot, 'reports');
const files = {
  customers: path.join(successRoot, 'customers.json'),
  onboarding: path.join(successRoot, 'onboarding.json'),
  templates: path.join(successRoot, 'templates.json'),
  milestones: path.join(successRoot, 'milestones.json'),
  health: path.join(successRoot, 'health.json'),
  support: path.join(successRoot, 'support.json'),
  renewals: path.join(successRoot, 'renewals.json'),
  expansion: path.join(successRoot, 'expansion.json'),
  journeys: path.join(successRoot, 'journeys.json'),
};

const safety = {
  localOnly: true,
  automaticCustomerEmails: false,
  automaticCustomerMessaging: false,
  automaticAccountUpdates: false,
  externalCrmSynchronization: false,
  automaticRenewals: false,
  autonomousSupportResponses: false,
  billingChanges: false,
  advisoryOnly: true,
};

export function getCustomers() {
  const store = readSuccessStore();
  return { title: 'Customer Success Customers', generatedAt: stamp(), customers: store.customers, summary: summarizeSuccess(store), safety };
}

export function createCustomer(options = {}) {
  const store = readSuccessStore();
  const now = stamp();
  const customer = buildCustomer({
    id: slug(`cust-${process.env.SUCCESS_CUSTOMER_ORG ?? options.organization ?? 'Local Customer'}`),
    organization: process.env.SUCCESS_CUSTOMER_ORG ?? options.organization ?? 'Local Customer',
    primaryContact: process.env.SUCCESS_PRIMARY_CONTACT ?? options.primaryContact ?? 'Pending contact',
    customerType: process.env.SUCCESS_CUSTOMER_TYPE ?? options.customerType ?? 'Gym',
    owner: process.env.SUCCESS_OWNER ?? options.owner ?? 'Customer Success',
    status: 'Onboarding',
    plan: process.env.SUCCESS_PLAN ?? options.plan ?? 'Local reference',
    seats: Number(process.env.SUCCESS_SEATS ?? options.seats ?? 5),
    trial: true,
    activeFeatures: csv(process.env.SUCCESS_FEATURES ?? options.activeFeatures ?? 'coach platform,onboarding'),
    now,
    index: store.customers.length,
  });
  const onboarding = onboardingPlan(customer, store.templates.find((template) => template.customerType === customer.customerType) ?? store.templates[0], now);
  const health = healthEvaluation(customer, onboarding, now);
  const journey = journeyRecord(customer, null, 'Onboarding', 'Customer Success', 'Customer created locally from CLI.', now);
  writeSuccessStore({
    ...store,
    customers: [customer, ...store.customers.filter((item) => item.customerId !== customer.customerId)],
    onboarding: [onboarding, ...store.onboarding.filter((item) => item.customerId !== customer.customerId)],
    health: [health, ...store.health.filter((item) => item.customerId !== customer.customerId)],
    journeys: [journey, ...store.journeys],
  });
  return { title: 'Customer Created', generatedAt: now, customer, onboarding, health, journey, safety };
}

export function getOnboarding() {
  const store = readSuccessStore();
  return { title: 'Customer Onboarding Queue', generatedAt: stamp(), onboarding: store.onboarding, safety };
}

export function getTemplates() {
  const store = readSuccessStore();
  return { title: 'Onboarding Templates', generatedAt: stamp(), templates: store.templates, safety };
}

export function getMilestones() {
  const store = readSuccessStore();
  return { title: 'Success Milestones', generatedAt: stamp(), milestones: store.milestones, safety };
}

export function getHealth() {
  const store = readSuccessStore();
  return { title: 'Customer Health Monitoring', generatedAt: stamp(), health: store.health, safety };
}

export function getSupport() {
  const store = readSuccessStore();
  return { title: 'Support Queue', generatedAt: stamp(), support: store.support, safety };
}

export function getRenewals() {
  const store = readSuccessStore();
  return { title: 'Renewal Queue', generatedAt: stamp(), renewals: store.renewals, safety };
}

export function getExpansion() {
  const store = readSuccessStore();
  return { title: 'Expansion Opportunities', generatedAt: stamp(), expansion: store.expansion, safety };
}

export function buildSuccessReports() {
  const store = readSuccessStore();
  const reports = {
    'customer-health-report': { title: 'Customer Health Report', generatedAt: stamp(), health: store.health, safety },
    'onboarding-progress-report': { title: 'Onboarding Progress Report', generatedAt: stamp(), onboarding: store.onboarding, safety },
    'adoption-report': { title: 'Adoption Report', generatedAt: stamp(), rows: store.health.map((item) => ({ customerId: item.customerId, adoptionScore: item.adoptionScore, engagementScore: item.engagementScore })), safety },
    'expansion-opportunity-report': { title: 'Expansion Opportunity Report', generatedAt: stamp(), expansion: store.expansion, safety },
    'renewal-forecast': { title: 'Renewal Forecast', generatedAt: stamp(), renewals: store.renewals, safety },
    'support-summary': { title: 'Support Summary', generatedAt: stamp(), support: store.support, safety },
    'training-completion-report': { title: 'Training Completion Report', generatedAt: stamp(), rows: store.onboarding.map((item) => ({ customerId: item.customerId, trainingCompletion: item.trainingCompletion, requiredTraining: item.requiredTraining })), safety },
    'executive-customer-success-summary': { title: 'Executive Customer Success Summary', generatedAt: stamp(), summary: summarizeSuccess(store), churnRisks: store.health.filter((item) => item.riskScore >= 60), safety },
    'customer-journey-report': { title: 'Customer Journey Report', generatedAt: stamp(), journeys: store.journeys, safety },
  };
  return { title: 'Customer Success Reports Generated', generatedAt: stamp(), written: Object.entries(reports).map(([slugName, payload]) => writeReport(slugName, payload)), safety };
}

export function validateSuccess() {
  const store = readSuccessStore();
  const errors = [];
  const commands = ['success:customers', 'success:create-customer', 'success:onboarding', 'success:templates', 'success:milestones', 'success:health', 'success:support', 'success:renewals', 'success:expansion', 'success:report', 'success:validate'];
  const reports = ['customer-health-report', 'onboarding-progress-report', 'adoption-report', 'expansion-opportunity-report', 'renewal-forecast', 'support-summary', 'training-completion-report', 'executive-customer-success-summary', 'customer-journey-report'];
  if (!store.customers.length) errors.push('customers missing');
  if (!store.onboarding.length) errors.push('onboarding plans missing');
  if (!store.templates.length) errors.push('onboarding templates missing');
  if (!store.milestones.length) errors.push('success milestones missing');
  if (!store.health.length) errors.push('health evaluations missing');
  if (!store.support.length) errors.push('support queue missing');
  if (!store.renewals.length) errors.push('renewal queue missing');
  if (!store.expansion.length) errors.push('expansion opportunities missing');
  if (store.customers.some((customer) => customer.subscription.billingStatusChangeEnabled)) errors.push('billing changes must be disabled');
  if (store.support.some((item) => item.customerCommunicationEnabled)) errors.push('support records must not enable customer communication');
  buildSuccessReports();
  for (const report of reports) {
    if (!existsSync(path.join(reportsRoot, `${report}.json`)) || !existsSync(path.join(reportsRoot, `${report}.md`))) errors.push(`report missing: ${report}`);
  }
  return {
    title: 'Customer Success Validation',
    generatedAt: stamp(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands,
    storageRoot: 'codex-agent-threads/shared/customer-success',
    summary: summarizeSuccess(store),
    reportCount: reports.length,
    integrations: ['Executive', 'Sales', 'Marketing', 'Shared Memory', 'Universal Task Engine', 'Asset Library'],
    safety,
  };
}

export function readSuccessStore() {
  ensureSuccessStorage();
  return {
    customers: readJson(files.customers, []),
    onboarding: readJson(files.onboarding, []),
    templates: readJson(files.templates, []),
    milestones: readJson(files.milestones, []),
    health: readJson(files.health, []),
    support: readJson(files.support, []),
    renewals: readJson(files.renewals, []),
    expansion: readJson(files.expansion, []),
    journeys: readJson(files.journeys, []),
  };
}

function writeSuccessStore(store) {
  mkdirSync(successRoot, { recursive: true });
  writeJson(files.customers, store.customers);
  writeJson(files.onboarding, store.onboarding);
  writeJson(files.templates, store.templates);
  writeJson(files.milestones, store.milestones);
  writeJson(files.health, store.health);
  writeJson(files.support, store.support);
  writeJson(files.renewals, store.renewals);
  writeJson(files.expansion, store.expansion);
  writeJson(files.journeys, store.journeys);
}

function ensureSuccessStorage() {
  mkdirSync(successRoot, { recursive: true });
  mkdirSync(reportsRoot, { recursive: true });
  if (Object.values(files).some((file) => !existsSync(file))) seedSuccessStore();
}

function seedSuccessStore() {
  const now = stamp();
  const assets = readAssetStore();
  const memory = buildSharedMemoryStore();
  const tasks = listSharedTasks();
  const planning = getExecutivePlanningSummary();
  const linkedAssets = assets.assets.filter((asset) => ['Customer Success', 'Operations', 'Marketing', 'Sales'].includes(asset.category) || asset.assetType === 'SOP').map((asset) => asset.assetId).slice(0, 5);
  const linkedTasks = tasks.tasks?.slice(0, 5).map((task) => task.taskId ?? task.id).filter(Boolean) ?? [];
  const linkedGoals = planning.goals?.slice(0, 3).map((goal) => goal.goalId).filter(Boolean) ?? [];
  const templates = [
    template('template-coach-onboarding', 'Coach Onboarding', 'Individual Coach', ['account setup', 'profile completion', 'branding', 'first client', 'first workout', 'payments', 'messaging', 'training complete'], linkedAssets),
    template('template-gym-onboarding', 'Gym Onboarding', 'Gym', ['organization setup', 'coaches invited', 'members imported', 'branding', 'gym settings', 'check-in setup', 'first class', 'first workout'], linkedAssets),
    template('template-enterprise-onboarding', 'Enterprise Onboarding', 'Enterprise Organization', ['stakeholder kickoff', 'workspace setup', 'roles configured', 'training plan', 'pilot cohort', 'success review', 'renewal readiness'], linkedAssets),
  ];
  const customers = [
    buildCustomer({ id: 'cust-louisville-combat-academy', organization: 'Louisville Combat Academy', primaryContact: 'Operations Lead', customerType: 'Gym', owner: 'Customer Success', status: 'Onboarding', plan: 'Gym Software Trial', seats: 8, trial: true, activeFeatures: ['gym settings', 'coach platform', 'member import'], now, index: 0 }),
    buildCustomer({ id: 'cust-area-502-mma', organization: 'Area 502 MMA', primaryContact: 'Owner', customerType: 'Gym', owner: 'Customer Success', status: 'Active', plan: 'Coach Platform', seats: 4, trial: false, activeFeatures: ['coach platform', 'workouts', 'messaging'], now, index: 1 }),
    buildCustomer({ id: 'cust-river-city-performance', organization: 'River City Performance', primaryContact: 'Head Coach', customerType: 'Individual Coach', owner: 'Customer Success', status: 'Growing', plan: 'Coach Starter', seats: 1, trial: false, activeFeatures: ['profile', 'first client', 'workouts'], now, index: 2 }),
    buildCustomer({ id: 'cust-kentucky-youth-sports', organization: 'Kentucky Youth Sports', primaryContact: 'Program Director', customerType: 'Sports Organization', owner: 'Customer Success', status: 'Qualified', plan: 'Enterprise Reference', seats: 20, trial: true, activeFeatures: ['enterprise onboarding', 'training'], now, index: 3 }),
  ];
  const onboarding = customers.map((customer) => onboardingPlan(customer, templates.find((item) => item.customerType === customer.customerType) ?? templates[1], now, linkedTasks, linkedGoals));
  const health = customers.map((customer, index) => healthEvaluation(customer, onboarding[index], now));
  const milestones = customers.flatMap((customer) => milestoneRows(customer, now));
  const support = [
    supportRecord('support-lca-member-import', customers[0], 'onboarding help', 'high', 'Need local member import checklist reviewed.', linkedAssets, now),
    supportRecord('support-area-502-training', customers[1], 'training request', 'medium', 'Coach training completion needs review.', linkedAssets, now),
    supportRecord('support-river-city-feature', customers[2], 'feature request', 'low', 'Requested client progress snapshot planning note.', linkedAssets, now),
    supportRecord('support-kys-question', customers[3], 'question', 'medium', 'Enterprise onboarding scope question for internal prep.', linkedAssets, now),
  ];
  const renewals = customers.map((customer, index) => ({
    renewalId: `renewal-${customer.customerId}`,
    customerId: customer.customerId,
    organization: customer.organization,
    renewalDate: customer.subscription.renewalDate,
    readiness: Math.max(42, 88 - index * 12),
    status: index === 0 ? 'trial review' : index === 3 ? 'not started' : 'monitor',
    risks: index === 0 ? ['Onboarding not complete.'] : [],
    nextAction: index === 0 ? 'Complete onboarding review before renewal prep.' : 'Prepare local account review.',
    automaticRenewalEnabled: false,
  }));
  const expansion = customers.map((customer, index) => ({
    expansionId: `expansion-${customer.customerId}`,
    customerId: customer.customerId,
    organization: customer.organization,
    opportunity: index === 2 ? 'Add assistant coach workflow.' : index === 3 ? 'Enterprise pilot planning.' : 'Increase adoption across active features.',
    score: Math.max(45, 82 - index * 8),
    confidence: 72,
    recommendedAction: 'Review expansion potential manually with Sales and Executive.',
    automaticOfferEnabled: false,
  }));
  const journeys = customers.map((customer) => journeyRecord(customer, 'Closed', customer.status, 'Customer Success', 'Seeded local customer journey state.', now));
  writeSuccessStore({ customers, onboarding, templates, milestones, health, support, renewals, expansion, journeys });
}

function buildCustomer({ id, organization, primaryContact, customerType, owner, status, plan, seats, trial, activeFeatures, now, index }) {
  return {
    customerId: id,
    organization,
    primaryContact,
    customerType,
    owner,
    status,
    createdAt: now,
    updatedAt: now,
    subscription: {
      plan,
      seats,
      trial,
      renewalDate: new Date(Date.UTC(2026, 8 + index, 15, 14)).toISOString(),
      billingStatus: trial ? 'trial reference' : 'active reference',
      billingStatusChangeEnabled: false,
      activeFeatures,
    },
    linkedOrganizationId: slug(`organization-${organization}`),
    linkedContactId: slug(`contact-${primaryContact}`),
    auditHistory: [auditEvent(null, status, 'Customer Success', 'Customer record created locally.', now)],
  };
}

function template(templateId, name, customerType, stages, requiredAssets) {
  return {
    templateId,
    name,
    customerType,
    stages,
    milestones: stages.map((stage) => `${stage} complete`),
    requiredTasks: stages.map((stage) => `Review ${stage}`),
    requiredAssets,
    training: ['orientation', 'admin walkthrough', 'success review'],
    documentation: requiredAssets,
    completionRules: ['All required stages reviewed.', 'Training completion recorded.', 'Health review complete.'],
  };
}

function onboardingPlan(customer, template, now, linkedTasks = [], linkedGoals = []) {
  const progress = customer.status === 'Active' ? 78 : customer.status === 'Growing' ? 86 : customer.status === 'Qualified' ? 25 : 52;
  return {
    onboardingId: `onboarding-${customer.customerId}`,
    customerId: customer.customerId,
    organization: customer.organization,
    templateId: template.templateId,
    customerType: customer.customerType,
    status: progress >= 80 ? 'near complete' : progress < 40 ? 'not started' : 'in progress',
    progress,
    stages: template.stages.map((stage, index) => ({ stage, status: index * 12 < progress ? 'complete' : 'pending' })),
    requiredTasks: template.requiredTasks,
    requiredAssets: template.requiredAssets,
    requiredTraining: template.training,
    trainingCompletion: Math.max(20, progress - 12),
    documentationUsage: Math.max(20, progress - 8),
    linkedTasks,
    linkedGoals,
    nextAction: progress < 60 ? 'Schedule local onboarding review.' : 'Prepare adoption review.',
    updatedAt: now,
  };
}

function healthEvaluation(customer, onboarding, now) {
  const adoptionScore = Math.round((onboarding.progress + onboarding.trainingCompletion + onboarding.documentationUsage) / 3);
  const engagementScore = customer.status === 'Growing' ? 84 : customer.status === 'Active' ? 76 : customer.status === 'Onboarding' ? 58 : 42;
  const riskScore = Math.max(12, 100 - adoptionScore - (customer.subscription.trial ? 8 : 18));
  const healthScore = Math.max(30, Math.round((adoptionScore + engagementScore + (100 - riskScore)) / 3));
  return {
    healthId: `health-${customer.customerId}`,
    customerId: customer.customerId,
    organization: customer.organization,
    healthScore,
    adoptionScore,
    engagementScore,
    riskScore,
    expansionOpportunity: customer.status === 'Growing' ? 'High' : healthScore > 70 ? 'Medium' : 'Watch',
    confidence: 76,
    reasons: [`Onboarding progress ${onboarding.progress}%`, `Training completion ${onboarding.trainingCompletion}%`, `Engagement score ${engagementScore}%`],
    risks: riskScore > 45 ? ['Onboarding or adoption requires review.'] : [],
    recommendations: ['Review customer health locally.', 'Confirm training and documentation usage.', 'Coordinate handoff notes with Sales if expansion is likely.'],
    nextActions: [riskScore > 45 ? 'Create health review task.' : 'Prepare success check-in plan.'],
    evaluatedAt: now,
  };
}

function milestoneRows(customer, now) {
  const names = ['first login', 'first workout', 'first client', 'first gym member', 'first payment', 'first message', 'first campaign', 'onboarding completion', 'adoption milestones', 'renewal readiness'];
  return names.map((name, index) => ({
    milestoneId: `${customer.customerId}-${slug(name)}`,
    customerId: customer.customerId,
    organization: customer.organization,
    name,
    status: index < (customer.status === 'Growing' ? 8 : customer.status === 'Active' ? 6 : customer.status === 'Onboarding' ? 4 : 2) ? 'complete' : 'pending',
    completedAt: index < 4 ? now : null,
    evidence: 'Local deterministic milestone tracking.',
  }));
}

function supportRecord(id, customer, type, priority, summary, linkedAssets, now) {
  return {
    supportId: id,
    type,
    status: 'open',
    priority,
    owner: 'Customer Success',
    linkedCustomerId: customer.customerId,
    organization: customer.organization,
    summary,
    linkedAssets,
    linkedDocumentation: linkedAssets,
    customerCommunicationEnabled: false,
    nextAction: 'Review locally and prepare internal notes.',
    createdAt: now,
    updatedAt: now,
  };
}

function journeyRecord(customer, previousState, newState, actor, reason, timestamp) {
  return {
    journeyId: `journey-${customer.customerId}-${slug(newState)}-${timestamp.replace(/[^0-9]/g, '').slice(0, 12)}`,
    customerId: customer.customerId,
    organization: customer.organization,
    previousState,
    newState,
    actor,
    reason,
    timestamp,
    auditHistory: [auditEvent(previousState, newState, actor, reason, timestamp)],
  };
}

function summarizeSuccess(store) {
  return {
    totalCustomers: store.customers.length,
    onboardingCustomers: store.customers.filter((customer) => customer.status === 'Onboarding').length,
    activeCustomers: store.customers.filter((customer) => ['Active', 'Growing', 'Expansion', 'Renewal'].includes(customer.status)).length,
    averageHealth: average(store.health.map((item) => item.healthScore)),
    averageAdoption: average(store.health.map((item) => item.adoptionScore)),
    churnRisks: store.health.filter((item) => item.riskScore >= 45).length,
    renewalQueue: store.renewals.length,
    expansionOpportunities: store.expansion.filter((item) => item.score >= 60).length,
    supportOpen: store.support.filter((item) => item.status === 'open').length,
  };
}

function writeReport(slugName, payload) {
  mkdirSync(reportsRoot, { recursive: true });
  const jsonPath = path.join(reportsRoot, `${slugName}.json`);
  const mdPath = path.join(reportsRoot, `${slugName}.md`);
  writeJson(jsonPath, payload);
  writeFileSync(mdPath, `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nLocal-only customer success safety: no automatic emails, customer messaging, account updates, CRM sync, renewals, or autonomous support responses.\n`);
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

function auditEvent(previousValue, newValue, actor, reason, timestamp = stamp()) {
  return { timestamp, actor, previousValue, newValue, reason };
}

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}

function csv(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function stamp() {
  return new Date().toISOString();
}
