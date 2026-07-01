import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSuccessStore } from './customer-success-runtime.mjs';
import { getExecutivePlanningSummary } from './executive-planning-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const financeRoot = path.join(repoRoot, 'codex-agent-threads/shared/finance');
const reportsRoot = path.join(financeRoot, 'reports');
const files = {
  revenue: path.join(financeRoot, 'revenue.json'),
  pricing: path.join(financeRoot, 'pricing.json'),
  subscriptions: path.join(financeRoot, 'subscriptions.json'),
  forecasts: path.join(financeRoot, 'forecasts.json'),
  health: path.join(financeRoot, 'revenue-health.json'),
  audit: path.join(financeRoot, 'audit-history.json'),
};

const safety = {
  localOnly: true,
  stripeMutations: false,
  paymentProcessing: false,
  invoiceSending: false,
  payoutProcessing: false,
  accountingSync: false,
  financialTransactions: false,
  automaticBillingChanges: false,
  advisoryOnly: true,
};

export function getFinanceOverview() {
  const store = readFinanceStore();
  return { title: 'Finance Overview', generatedAt: stamp(), summary: summarizeFinance(store), safety };
}

export function getRevenue() {
  const store = readFinanceStore();
  return { title: 'Revenue Intelligence', generatedAt: stamp(), revenue: store.revenue, summary: summarizeFinance(store), safety };
}

export function getMrr() {
  const store = readFinanceStore();
  return { title: 'MRR Summary', generatedAt: stamp(), totalMrr: summarizeFinance(store).totalEstimatedMrr, rows: store.revenue.map((row) => ({ organization: row.organization, mrrContribution: row.forecast.mrrContribution })), safety };
}

export function getArr() {
  const store = readFinanceStore();
  return { title: 'ARR Summary', generatedAt: stamp(), totalArr: summarizeFinance(store).totalEstimatedArr, rows: store.revenue.map((row) => ({ organization: row.organization, arrContribution: row.forecast.arrContribution })), safety };
}

export function getForecast() {
  const store = readFinanceStore();
  return { title: 'Revenue Forecast', generatedAt: stamp(), forecasts: store.forecasts, safety };
}

export function getPricing() {
  const store = readFinanceStore();
  return { title: 'Pricing Library', generatedAt: stamp(), pricing: store.pricing, safety };
}

export function getSubscriptions() {
  const store = readFinanceStore();
  return { title: 'Subscription Intelligence', generatedAt: stamp(), subscriptions: store.subscriptions, safety };
}

export function getRenewals() {
  const store = readFinanceStore();
  return { title: 'Finance Renewal Forecast', generatedAt: stamp(), renewals: store.subscriptions.filter((item) => ['Renewal Due', 'At Risk', 'Enterprise Review'].includes(item.subscriptionState)), safety };
}

export function getExpansion() {
  const store = readFinanceStore();
  return { title: 'Finance Expansion Forecast', generatedAt: stamp(), expansion: store.revenue.map((row) => ({ organization: row.organization, expansionRevenue: row.expansionRevenue, expansionPotential: row.forecast.expansionPotential })), safety };
}

export function buildFinanceReports() {
  const store = readFinanceStore();
  const summary = summarizeFinance(store);
  const reports = {
    'revenue-summary-report': { title: 'Revenue Summary Report', generatedAt: stamp(), summary, revenue: store.revenue, safety },
    'mrr-report': { title: 'MRR Report', generatedAt: stamp(), totalMrr: summary.totalEstimatedMrr, revenue: store.revenue, safety },
    'arr-report': { title: 'ARR Report', generatedAt: stamp(), totalArr: summary.totalEstimatedArr, revenue: store.revenue, safety },
    'revenue-forecast-report': { title: 'Revenue Forecast Report', generatedAt: stamp(), forecasts: store.forecasts, safety },
    'pricing-summary-report': { title: 'Pricing Summary Report', generatedAt: stamp(), pricing: store.pricing, safety },
    'renewal-report': { title: 'Renewal Report', generatedAt: stamp(), renewals: store.subscriptions.filter((item) => item.renewalDate), safety },
    'expansion-report': { title: 'Expansion Report', generatedAt: stamp(), expansion: store.revenue.map((row) => ({ organization: row.organization, expansionRevenue: row.expansionRevenue, potential: row.forecast.expansionPotential })), safety },
    'revenue-risk-report': { title: 'Revenue Risk Report', generatedAt: stamp(), risks: store.health.filter((item) => item.retentionRisk >= 45), safety },
    'executive-finance-summary': { title: 'Executive Finance Summary', generatedAt: stamp(), summary, risks: store.health.filter((item) => item.retentionRisk >= 45), safety },
  };
  return { title: 'Finance Reports Generated', generatedAt: stamp(), written: Object.entries(reports).map(([slug, payload]) => writeReport(slug, payload)), safety };
}

export function validateFinance() {
  const store = readFinanceStore();
  const errors = [];
  const commands = ['finance:overview', 'finance:revenue', 'finance:mrr', 'finance:arr', 'finance:forecast', 'finance:pricing', 'finance:subscriptions', 'finance:renewals', 'finance:expansion', 'finance:report', 'finance:validate'];
  const reports = ['revenue-summary-report', 'mrr-report', 'arr-report', 'revenue-forecast-report', 'pricing-summary-report', 'renewal-report', 'expansion-report', 'revenue-risk-report', 'executive-finance-summary'];
  if (!store.revenue.length) errors.push('revenue records missing');
  if (!store.pricing.length) errors.push('pricing records missing');
  if (!store.subscriptions.length) errors.push('subscription records missing');
  if (!store.forecasts.length) errors.push('forecasts missing');
  if (!store.health.length) errors.push('revenue health missing');
  if (store.subscriptions.some((item) => item.liveBillingMutationEnabled)) errors.push('live billing mutations must be disabled');
  buildFinanceReports();
  for (const report of reports) {
    if (!existsSync(path.join(reportsRoot, `${report}.json`)) || !existsSync(path.join(reportsRoot, `${report}.md`))) errors.push(`report missing: ${report}`);
  }
  return { title: 'Finance Validation', generatedAt: stamp(), status: errors.length ? 'fail' : 'pass', errors, commands, storageRoot: 'codex-agent-threads/shared/finance', summary: summarizeFinance(store), reportCount: reports.length, safety };
}

export function readFinanceStore() {
  ensureFinanceStorage();
  return {
    revenue: readJson(files.revenue, []),
    pricing: readJson(files.pricing, []),
    subscriptions: readJson(files.subscriptions, []),
    forecasts: readJson(files.forecasts, []),
    health: readJson(files.health, []),
    audit: readJson(files.audit, []),
  };
}

function ensureFinanceStorage() {
  mkdirSync(financeRoot, { recursive: true });
  mkdirSync(reportsRoot, { recursive: true });
  if (Object.values(files).some((file) => !existsSync(file))) seedFinanceStore();
}

function seedFinanceStore() {
  const now = stamp();
  const success = readSuccessStore();
  const planning = getExecutivePlanningSummary();
  const pricing = [
    price('price-athlete-monthly', 'Athlete plans', 'Athlete App', 'Athlete Monthly', 19, 'Entry athlete plan reference.', ['prod-athlete-app'], ['camp-athlete-app-foundation'], now),
    price('price-coach-starter', 'Coach plans', 'Coach Platform', 'Coach Starter', 79, 'Independent coach subscription reference.', ['prod-coach-platform'], ['camp-gym-growth-readiness'], now),
    price('price-gym-software', 'Gym plans', 'Gym Software', 'Gym Growth', 299, 'Gym operations subscription reference.', ['prod-gym-software'], ['camp-gym-growth-readiness'], now),
    price('price-white-label', 'White Label', 'White Label Platform', 'Partner Platform', 1500, 'White label planning reference.', ['prod-white-label'], ['camp-white-label-positioning'], now),
    price('price-enterprise', 'Enterprise', 'Enterprise', 'Enterprise Review', 2500, 'Enterprise review reference.', ['prod-white-label'], ['camp-white-label-positioning'], now),
    price('price-setup', 'Setup services', 'Setup Services', 'Implementation Setup', 750, 'One-time setup service reference.', ['setup'], [], now),
    price('price-migration', 'Migration services', 'Migration Services', 'Data Migration', 1200, 'One-time migration service reference.', ['migration'], [], now),
  ];
  const revenue = success.customers.map((customer, index) => {
    const monthly = customer.customerType === 'Individual Coach' ? 79 : customer.customerType === 'Gym' ? 299 : 1500;
    const setup = customer.subscription.trial ? 0 : index === 2 ? 250 : 750;
    const expansion = index === 2 ? 79 : customer.customerType === 'Sports Organization' ? 1500 : 299;
    return revenueRecord(customer, monthly, setup, expansion, index, now);
  });
  revenue.push({
    financialRecordId: 'fin-future-white-label',
    customer: 'Future White Label Partner',
    organization: 'Future White Label Partner',
    customerType: 'White Label subscription',
    product: 'White Label Platform',
    plan: 'Partner Platform',
    status: 'Enterprise Review',
    monthlyAmount: 1500,
    annualAmount: 18000,
    setupRevenue: 2500,
    expansionRevenue: 5000,
    estimatedLifetimeValue: 56500,
    revenueCategory: 'future product',
    forecast: forecastFields(1500, 5000, 30, 68),
  });
  const subscriptions = revenue.map((row, index) => ({
    subscriptionId: `sub-${row.financialRecordId}`,
    financialRecordId: row.financialRecordId,
    organization: row.organization,
    subscriptionState: row.status,
    product: row.product,
    plan: row.plan,
    renewalDate: new Date(Date.UTC(2026, 8 + index, 15, 14)).toISOString(),
    liveBillingMutationEnabled: false,
  }));
  const health = revenue.map((row) => revenueHealth(row));
  const forecasts = [
    forecastPeriod('Monthly Forecast', 'monthly', revenue, 1, planning),
    forecastPeriod('Quarterly Forecast', 'quarterly', revenue, 3, planning),
    forecastPeriod('Annual Forecast', 'annual', revenue, 12, planning),
  ];
  const audit = [{ timestamp: now, actor: 'Finance Agent', previousValue: null, newValue: 'phase59.finance.seeded', reason: 'Seeded local finance planning records. No financial action occurred.' }];
  writeJson(files.revenue, revenue);
  writeJson(files.pricing, pricing);
  writeJson(files.subscriptions, subscriptions);
  writeJson(files.forecasts, forecasts);
  writeJson(files.health, health);
  writeJson(files.audit, audit);
}

function revenueRecord(customer, monthly, setup, expansion, index, now) {
  const risk = customer.status === 'Qualified' ? 55 : customer.status === 'Onboarding' ? 42 : 24;
  return {
    financialRecordId: `fin-${customer.customerId}`,
    customer: customer.primaryContact,
    organization: customer.organization,
    customerType: customer.customerType,
    product: customer.customerType === 'Individual Coach' ? 'Coach Platform' : customer.customerType === 'Gym' ? 'Gym Software' : 'Enterprise',
    plan: customer.subscription.plan,
    status: customer.status === 'Qualified' ? 'Trial' : customer.status === 'Onboarding' ? 'Renewal Due' : customer.status === 'Growing' ? 'Active' : 'Active',
    monthlyAmount: monthly,
    annualAmount: monthly * 12,
    setupRevenue: setup,
    expansionRevenue: expansion,
    estimatedLifetimeValue: monthly * 24 + setup + expansion * 2,
    revenueCategory: index === 3 ? 'pipeline revenue' : 'subscription',
    forecast: forecastFields(monthly, expansion, risk, 74),
    createdAt: now,
    updatedAt: now,
  };
}

function forecastFields(monthly, expansion, churnExposure, confidence) {
  return {
    mrrContribution: monthly,
    arrContribution: monthly * 12,
    expansionPotential: expansion,
    churnExposure,
    renewalProbability: Math.max(35, 95 - churnExposure),
    forecastConfidence: confidence,
    reasons: ['Local customer success status.', 'Subscription reference amount.', 'Deterministic renewal and expansion rules.'],
    risks: churnExposure >= 45 ? ['Retention or onboarding risk requires review.'] : [],
    recommendations: ['Review revenue health with Executive and Customer Success.', 'Keep billing changes manual.'],
    nextActions: [churnExposure >= 45 ? 'Create manual revenue risk review.' : 'Monitor renewal readiness.'],
  };
}

function revenueHealth(row) {
  return {
    healthId: `rev-health-${row.financialRecordId}`,
    financialRecordId: row.financialRecordId,
    organization: row.organization,
    revenueHealth: Math.max(35, 100 - row.forecast.churnExposure),
    retentionRisk: row.forecast.churnExposure,
    expansionOpportunity: row.forecast.expansionPotential,
    lifetimeValueEstimate: row.estimatedLifetimeValue,
    renewalReadiness: row.forecast.renewalProbability,
    upsellReadiness: Math.min(92, Math.round(row.forecast.expansionPotential / Math.max(row.monthlyAmount, 1) * 35)),
    score: Math.round((100 - row.forecast.churnExposure + row.forecast.renewalProbability) / 2),
    confidence: row.forecast.forecastConfidence,
    risks: row.forecast.risks,
    recommendations: row.forecast.recommendations,
    nextActions: row.forecast.nextActions,
  };
}

function price(id, category, product, plan, monthly, positioning, linkedProducts, linkedCampaigns, now) {
  return { pricingId: id, category, product, plan, monthlyReference: monthly, annualReference: monthly * 12, version: '1.0.0', effectiveDate: now, positioning, linkedProducts, linkedCampaigns, livePricingChangeEnabled: false };
}

function forecastPeriod(label, period, revenue, multiplier, planning) {
  const base = revenue.reduce((sum, row) => sum + row.forecast.mrrContribution, 0) * multiplier;
  const expansion = revenue.reduce((sum, row) => sum + row.forecast.expansionPotential, 0) * (period === 'annual' ? 1 : period === 'quarterly' ? 0.35 : 0.12);
  const churn = revenue.reduce((sum, row) => sum + (row.forecast.churnExposure / 100) * row.monthlyAmount, 0) * multiplier;
  return {
    forecastId: `forecast-${period}`,
    label,
    period,
    baseRevenue: Math.round(base),
    expansionRevenue: Math.round(expansion),
    churnExposure: Math.round(churn),
    forecastRevenue: Math.round(base + expansion - churn),
    confidence: 72,
    linkedGoals: planning.goals?.map((goal) => goal.goalId).slice(0, 3) ?? [],
    rule: 'Deterministic local forecast from revenue references, customer success status, and expansion estimates.',
  };
}

function summarizeFinance(store) {
  return {
    totalEstimatedMrr: store.revenue.reduce((sum, row) => sum + row.forecast.mrrContribution, 0),
    totalEstimatedArr: store.revenue.reduce((sum, row) => sum + row.forecast.arrContribution, 0),
    expansionRevenue: store.revenue.reduce((sum, row) => sum + row.expansionRevenue, 0),
    pipelineRevenue: store.revenue.filter((row) => row.revenueCategory === 'pipeline revenue' || row.status === 'Trial').reduce((sum, row) => sum + row.annualAmount + row.setupRevenue, 0),
    forecastRevenue: store.forecasts.find((item) => item.period === 'annual')?.forecastRevenue ?? 0,
    revenueByProduct: groupSum(store.revenue, 'product', 'annualAmount'),
    revenueByCustomerType: groupSum(store.revenue, 'customerType', 'annualAmount'),
    revenueByPlan: groupSum(store.revenue, 'plan', 'annualAmount'),
    revenueRisks: store.health.filter((item) => item.retentionRisk >= 45).length,
  };
}

function groupSum(rows, field, valueField) {
  return rows.reduce((acc, row) => {
    acc[row[field]] = (acc[row[field]] ?? 0) + row[valueField];
    return acc;
  }, {});
}

function writeReport(slugName, payload) {
  mkdirSync(reportsRoot, { recursive: true });
  const jsonPath = path.join(reportsRoot, `${slugName}.json`);
  const mdPath = path.join(reportsRoot, `${slugName}.md`);
  writeJson(jsonPath, payload);
  writeFileSync(mdPath, `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nLocal-only finance safety: no Stripe mutations, payment processing, invoice sending, payout processing, accounting sync, financial transactions, or automatic billing changes.\n`);
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

function stamp() {
  return new Date().toISOString();
}
