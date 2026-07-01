export interface FinanceRevenueRecord {
  financialRecordId: string;
  organization: string;
  customerType: string;
  product: string;
  plan: string;
  status: string;
  monthlyAmount: number;
  annualAmount: number;
  setupRevenue: number;
  expansionRevenue: number;
  estimatedLifetimeValue: number;
  revenueCategory: string;
  forecast: {
    mrrContribution: number;
    arrContribution: number;
    expansionPotential: number;
    churnExposure: number;
    renewalProbability: number;
    forecastConfidence: number;
    risks: string[];
    recommendations: string[];
    nextActions: string[];
  };
}

export interface FinancePricingRecord {
  pricingId: string;
  category: string;
  product: string;
  plan: string;
  monthlyReference: number;
  annualReference: number;
  version: string;
  positioning: string;
  linkedProducts: string[];
  linkedCampaigns: string[];
}

export interface FinanceForecastRecord {
  forecastId: string;
  label: string;
  period: string;
  baseRevenue: number;
  expansionRevenue: number;
  churnExposure: number;
  forecastRevenue: number;
  confidence: number;
  rule: string;
}

export interface RevenueHealthRecord {
  organization: string;
  revenueHealth: number;
  retentionRisk: number;
  expansionOpportunity: number;
  lifetimeValueEstimate: number;
  renewalReadiness: number;
  upsellReadiness: number;
  confidence: number;
  risks: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface FinanceDashboardSummary {
  revenue: FinanceRevenueRecord[];
  pricing: FinancePricingRecord[];
  subscriptions: Array<{ organization: string; subscriptionState: string; product: string; plan: string; renewalDate: string }>;
  forecasts: FinanceForecastRecord[];
  health: RevenueHealthRecord[];
  summary: {
    totalEstimatedMrr: number;
    totalEstimatedArr: number;
    expansionRevenue: number;
    pipelineRevenue: number;
    forecastRevenue: number;
    revenueByProduct: Record<string, number>;
    revenueByCustomerType: Record<string, number>;
    revenueByPlan: Record<string, number>;
    revenueRisks: number;
  };
  safety: {
    localOnly: boolean;
    stripeMutations: boolean;
    paymentProcessing: boolean;
    invoiceSending: boolean;
    accountingSync: boolean;
    automaticBillingChanges: boolean;
  };
}

export function buildDashboardFinanceSummary(): FinanceDashboardSummary {
  const revenue: FinanceRevenueRecord[] = [
    revenueRecord('fin-cust-louisville-combat-academy', 'Louisville Combat Academy', 'Gym', 'Gym Software', 'Gym Software Trial', 'Renewal Due', 299, 0, 299, 'subscription', 42),
    revenueRecord('fin-cust-area-502-mma', 'Area 502 MMA', 'Gym', 'Gym Software', 'Coach Platform', 'Active', 299, 750, 299, 'subscription', 24),
    revenueRecord('fin-cust-river-city-performance', 'River City Performance', 'Individual Coach', 'Coach Platform', 'Coach Starter', 'Active', 79, 250, 79, 'subscription', 24),
    revenueRecord('fin-cust-kentucky-youth-sports', 'Kentucky Youth Sports', 'Sports Organization', 'Enterprise', 'Enterprise Reference', 'Trial', 1500, 0, 1500, 'pipeline revenue', 55),
    revenueRecord('fin-future-white-label', 'Future White Label Partner', 'White Label subscription', 'White Label Platform', 'Partner Platform', 'Enterprise Review', 1500, 2500, 5000, 'future product', 30),
  ];
  const pricing: FinancePricingRecord[] = [
    price('price-athlete-monthly', 'Athlete plans', 'Athlete App', 'Athlete Monthly', 19, 'Entry athlete plan reference.', ['prod-athlete-app'], ['camp-athlete-app-foundation']),
    price('price-coach-starter', 'Coach plans', 'Coach Platform', 'Coach Starter', 79, 'Independent coach subscription reference.', ['prod-coach-platform'], ['camp-gym-growth-readiness']),
    price('price-gym-software', 'Gym plans', 'Gym Software', 'Gym Growth', 299, 'Gym operations subscription reference.', ['prod-gym-software'], ['camp-gym-growth-readiness']),
    price('price-white-label', 'White Label', 'White Label Platform', 'Partner Platform', 1500, 'White label planning reference.', ['prod-white-label'], ['camp-white-label-positioning']),
    price('price-enterprise', 'Enterprise', 'Enterprise', 'Enterprise Review', 2500, 'Enterprise review reference.', ['prod-white-label'], ['camp-white-label-positioning']),
    price('price-setup', 'Setup services', 'Setup Services', 'Implementation Setup', 750, 'One-time setup service reference.', ['setup'], []),
    price('price-migration', 'Migration services', 'Migration Services', 'Data Migration', 1200, 'One-time migration service reference.', ['migration'], []),
  ];
  const subscriptions = revenue.map((item, index) => ({
    organization: item.organization,
    subscriptionState: item.status,
    product: item.product,
    plan: item.plan,
    renewalDate: new Date(Date.UTC(2026, 8 + index, 15, 14)).toISOString(),
  }));
  const health = revenue.map((item) => ({
    organization: item.organization,
    revenueHealth: Math.max(35, 100 - item.forecast.churnExposure),
    retentionRisk: item.forecast.churnExposure,
    expansionOpportunity: item.forecast.expansionPotential,
    lifetimeValueEstimate: item.estimatedLifetimeValue,
    renewalReadiness: item.forecast.renewalProbability,
    upsellReadiness: Math.min(92, Math.round(item.forecast.expansionPotential / Math.max(item.monthlyAmount, 1) * 35)),
    confidence: item.forecast.forecastConfidence,
    risks: item.forecast.risks,
    recommendations: item.forecast.recommendations,
    nextActions: item.forecast.nextActions,
  }));
  const summary = summarize(revenue, health);
  const forecasts = [
    forecast('forecast-monthly', 'Monthly Forecast', 'monthly', revenue, 1),
    forecast('forecast-quarterly', 'Quarterly Forecast', 'quarterly', revenue, 3),
    forecast('forecast-annual', 'Annual Forecast', 'annual', revenue, 12),
  ];
  summary.forecastRevenue = forecasts.find((item) => item.period === 'annual')?.forecastRevenue ?? 0;
  return {
    revenue,
    pricing,
    subscriptions,
    forecasts,
    health,
    summary,
    safety: { localOnly: true, stripeMutations: false, paymentProcessing: false, invoiceSending: false, accountingSync: false, automaticBillingChanges: false },
  };
}

function revenueRecord(financialRecordId: string, organization: string, customerType: string, product: string, plan: string, status: string, monthlyAmount: number, setupRevenue: number, expansionRevenue: number, revenueCategory: string, churnExposure: number): FinanceRevenueRecord {
  return {
    financialRecordId,
    organization,
    customerType,
    product,
    plan,
    status,
    monthlyAmount,
    annualAmount: monthlyAmount * 12,
    setupRevenue,
    expansionRevenue,
    estimatedLifetimeValue: monthlyAmount * 24 + setupRevenue + expansionRevenue * 2,
    revenueCategory,
    forecast: {
      mrrContribution: monthlyAmount,
      arrContribution: monthlyAmount * 12,
      expansionPotential: expansionRevenue,
      churnExposure,
      renewalProbability: Math.max(35, 95 - churnExposure),
      forecastConfidence: 74,
      risks: churnExposure >= 45 ? ['Retention or onboarding risk requires review.'] : [],
      recommendations: ['Review revenue health with Executive and Customer Success.', 'Keep billing changes manual.'],
      nextActions: [churnExposure >= 45 ? 'Create manual revenue risk review.' : 'Monitor renewal readiness.'],
    },
  };
}

function price(pricingId: string, category: string, product: string, plan: string, monthlyReference: number, positioning: string, linkedProducts: string[], linkedCampaigns: string[]): FinancePricingRecord {
  return { pricingId, category, product, plan, monthlyReference, annualReference: monthlyReference * 12, version: '1.0.0', positioning, linkedProducts, linkedCampaigns };
}

function forecast(forecastId: string, label: string, period: string, revenue: FinanceRevenueRecord[], multiplier: number): FinanceForecastRecord {
  const baseRevenue = revenue.reduce((sum, row) => sum + row.forecast.mrrContribution, 0) * multiplier;
  const expansionRevenue = revenue.reduce((sum, row) => sum + row.forecast.expansionPotential, 0) * (period === 'annual' ? 1 : period === 'quarterly' ? 0.35 : 0.12);
  const churnExposure = revenue.reduce((sum, row) => sum + (row.forecast.churnExposure / 100) * row.monthlyAmount, 0) * multiplier;
  return {
    forecastId,
    label,
    period,
    baseRevenue: Math.round(baseRevenue),
    expansionRevenue: Math.round(expansionRevenue),
    churnExposure: Math.round(churnExposure),
    forecastRevenue: Math.round(baseRevenue + expansionRevenue - churnExposure),
    confidence: 72,
    rule: 'Deterministic local forecast from revenue references, customer success status, and expansion estimates.',
  };
}

function summarize(revenue: FinanceRevenueRecord[], health: RevenueHealthRecord[]) {
  return {
    totalEstimatedMrr: revenue.reduce((sum, row) => sum + row.forecast.mrrContribution, 0),
    totalEstimatedArr: revenue.reduce((sum, row) => sum + row.forecast.arrContribution, 0),
    expansionRevenue: revenue.reduce((sum, row) => sum + row.expansionRevenue, 0),
    pipelineRevenue: revenue.filter((row) => row.revenueCategory === 'pipeline revenue' || row.status === 'Trial').reduce((sum, row) => sum + row.annualAmount + row.setupRevenue, 0),
    forecastRevenue: 0,
    revenueByProduct: groupSum(revenue, 'product'),
    revenueByCustomerType: groupSum(revenue, 'customerType'),
    revenueByPlan: groupSum(revenue, 'plan'),
    revenueRisks: health.filter((row) => row.retentionRisk >= 45).length,
  };
}

function groupSum(rows: FinanceRevenueRecord[], field: 'product' | 'customerType' | 'plan') {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row[field]] = (acc[row[field]] ?? 0) + row.annualAmount;
    return acc;
  }, {});
}
