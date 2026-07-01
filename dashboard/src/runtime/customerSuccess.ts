export interface CustomerSuccessCustomer {
  customerId: string;
  organization: string;
  primaryContact: string;
  customerType: string;
  owner: string;
  status: string;
  plan: string;
  seats: number;
  trial: boolean;
  renewalDate: string;
  billingStatus: string;
  activeFeatures: string[];
}

export interface CustomerOnboardingPlan {
  onboardingId: string;
  customerId: string;
  organization: string;
  template: string;
  status: string;
  progress: number;
  trainingCompletion: number;
  documentationUsage: number;
  requiredAssets: string[];
  nextAction: string;
}

export interface CustomerHealthEvaluation {
  customerId: string;
  organization: string;
  healthScore: number;
  adoptionScore: number;
  engagementScore: number;
  riskScore: number;
  expansionOpportunity: string;
  confidence: number;
  reasons: string[];
  risks: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface CustomerMilestone {
  customerId: string;
  organization: string;
  name: string;
  status: string;
  evidence: string;
}

export interface CustomerSupportRecord {
  supportId: string;
  type: string;
  status: string;
  priority: string;
  owner: string;
  organization: string;
  summary: string;
  linkedAssets: string[];
  customerCommunicationEnabled: boolean;
  nextAction: string;
}

export interface CustomerRenewalRecord {
  customerId: string;
  organization: string;
  renewalDate: string;
  readiness: number;
  status: string;
  risks: string[];
  nextAction: string;
}

export interface CustomerExpansionRecord {
  customerId: string;
  organization: string;
  opportunity: string;
  score: number;
  confidence: number;
  recommendedAction: string;
}

export interface CustomerSuccessSummary {
  totalCustomers: number;
  onboardingCustomers: number;
  activeCustomers: number;
  averageHealth: number;
  averageAdoption: number;
  churnRisks: number;
  renewalQueue: number;
  expansionOpportunities: number;
  supportOpen: number;
}

export interface CustomerSuccessDashboardSummary {
  customers: CustomerSuccessCustomer[];
  onboarding: CustomerOnboardingPlan[];
  health: CustomerHealthEvaluation[];
  milestones: CustomerMilestone[];
  support: CustomerSupportRecord[];
  renewals: CustomerRenewalRecord[];
  expansion: CustomerExpansionRecord[];
  summary: CustomerSuccessSummary;
  safety: {
    localOnly: boolean;
    automaticCustomerEmails: boolean;
    automaticAccountUpdates: boolean;
    externalCrmSync: boolean;
    automaticRenewals: boolean;
    autonomousSupportResponses: boolean;
  };
}

export function buildDashboardCustomerSuccessSummary(): CustomerSuccessDashboardSummary {
  const customers: CustomerSuccessCustomer[] = [
    customer('cust-louisville-combat-academy', 'Louisville Combat Academy', 'Operations Lead', 'Gym', 'Onboarding', 'Gym Software Trial', 8, true, ['gym settings', 'coach platform', 'member import'], 0),
    customer('cust-area-502-mma', 'Area 502 MMA', 'Owner', 'Gym', 'Active', 'Coach Platform', 4, false, ['coach platform', 'workouts', 'messaging'], 1),
    customer('cust-river-city-performance', 'River City Performance', 'Head Coach', 'Individual Coach', 'Growing', 'Coach Starter', 1, false, ['profile', 'first client', 'workouts'], 2),
    customer('cust-kentucky-youth-sports', 'Kentucky Youth Sports', 'Program Director', 'Sports Organization', 'Qualified', 'Enterprise Reference', 20, true, ['enterprise onboarding', 'training'], 3),
  ];
  const onboarding = customers.map((item) => onboardingPlan(item));
  const health = customers.map((item, index) => healthEvaluation(item, onboarding[index]));
  const milestones = customers.flatMap((item) => milestoneRows(item));
  const support: CustomerSupportRecord[] = [
    supportRecord('support-lca-member-import', 'Louisville Combat Academy', 'onboarding help', 'high', 'Need local member import checklist reviewed.'),
    supportRecord('support-area-502-training', 'Area 502 MMA', 'training request', 'medium', 'Coach training completion needs review.'),
    supportRecord('support-river-city-feature', 'River City Performance', 'feature request', 'low', 'Requested client progress snapshot planning note.'),
    supportRecord('support-kys-question', 'Kentucky Youth Sports', 'question', 'medium', 'Enterprise onboarding scope question for internal prep.'),
  ];
  const renewals = customers.map((item, index) => ({
    customerId: item.customerId,
    organization: item.organization,
    renewalDate: item.renewalDate,
    readiness: Math.max(42, 88 - index * 12),
    status: index === 0 ? 'trial review' : index === 3 ? 'not started' : 'monitor',
    risks: index === 0 ? ['Onboarding not complete.'] : [],
    nextAction: index === 0 ? 'Complete onboarding review before renewal prep.' : 'Prepare local account review.',
  }));
  const expansion = customers.map((item, index) => ({
    customerId: item.customerId,
    organization: item.organization,
    opportunity: index === 2 ? 'Add assistant coach workflow.' : index === 3 ? 'Enterprise pilot planning.' : 'Increase adoption across active features.',
    score: Math.max(45, 82 - index * 8),
    confidence: 72,
    recommendedAction: 'Review expansion potential manually with Sales and Executive.',
  }));
  return {
    customers,
    onboarding,
    health,
    milestones,
    support,
    renewals,
    expansion,
    summary: {
      totalCustomers: customers.length,
      onboardingCustomers: customers.filter((item) => item.status === 'Onboarding').length,
      activeCustomers: customers.filter((item) => ['Active', 'Growing', 'Expansion', 'Renewal'].includes(item.status)).length,
      averageHealth: avg(health.map((item) => item.healthScore)),
      averageAdoption: avg(health.map((item) => item.adoptionScore)),
      churnRisks: health.filter((item) => item.riskScore >= 45).length,
      renewalQueue: renewals.length,
      expansionOpportunities: expansion.filter((item) => item.score >= 60).length,
      supportOpen: support.filter((item) => item.status === 'open').length,
    },
    safety: {
      localOnly: true,
      automaticCustomerEmails: false,
      automaticAccountUpdates: false,
      externalCrmSync: false,
      automaticRenewals: false,
      autonomousSupportResponses: false,
    },
  };
}

function customer(customerId: string, organization: string, primaryContact: string, customerType: string, status: string, plan: string, seats: number, trial: boolean, activeFeatures: string[], index: number): CustomerSuccessCustomer {
  return {
    customerId,
    organization,
    primaryContact,
    customerType,
    owner: 'Customer Success',
    status,
    plan,
    seats,
    trial,
    renewalDate: new Date(Date.UTC(2026, 8 + index, 15, 14)).toISOString(),
    billingStatus: trial ? 'trial reference' : 'active reference',
    activeFeatures,
  };
}

function onboardingPlan(customer: CustomerSuccessCustomer): CustomerOnboardingPlan {
  const progress = customer.status === 'Active' ? 78 : customer.status === 'Growing' ? 86 : customer.status === 'Qualified' ? 25 : 52;
  return {
    onboardingId: `onboarding-${customer.customerId}`,
    customerId: customer.customerId,
    organization: customer.organization,
    template: customer.customerType === 'Individual Coach' ? 'Coach Onboarding' : customer.customerType === 'Gym' ? 'Gym Onboarding' : 'Enterprise Onboarding',
    status: progress >= 80 ? 'near complete' : progress < 40 ? 'not started' : 'in progress',
    progress,
    trainingCompletion: Math.max(20, progress - 12),
    documentationUsage: Math.max(20, progress - 8),
    requiredAssets: ['asset-operator-runtime-docs', 'asset-knowledge-graph-doc', 'asset-sales-agent-guide'],
    nextAction: progress < 60 ? 'Schedule local onboarding review.' : 'Prepare adoption review.',
  };
}

function healthEvaluation(customer: CustomerSuccessCustomer, onboarding: CustomerOnboardingPlan): CustomerHealthEvaluation {
  const adoptionScore = avg([onboarding.progress, onboarding.trainingCompletion, onboarding.documentationUsage]);
  const engagementScore = customer.status === 'Growing' ? 84 : customer.status === 'Active' ? 76 : customer.status === 'Onboarding' ? 58 : 42;
  const riskScore = Math.max(12, 100 - adoptionScore - (customer.trial ? 8 : 18));
  const healthScore = Math.max(30, avg([adoptionScore, engagementScore, 100 - riskScore]));
  return {
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
  };
}

function milestoneRows(customer: CustomerSuccessCustomer): CustomerMilestone[] {
  const names = ['first login', 'first workout', 'first client', 'first gym member', 'first payment', 'first message', 'first campaign', 'onboarding completion', 'adoption milestones', 'renewal readiness'];
  const complete = customer.status === 'Growing' ? 8 : customer.status === 'Active' ? 6 : customer.status === 'Onboarding' ? 4 : 2;
  return names.map((name, index) => ({
    customerId: customer.customerId,
    organization: customer.organization,
    name,
    status: index < complete ? 'complete' : 'pending',
    evidence: 'Local deterministic milestone tracking.',
  }));
}

function supportRecord(supportId: string, organization: string, type: string, priority: string, summary: string): CustomerSupportRecord {
  return {
    supportId,
    type,
    status: 'open',
    priority,
    owner: 'Customer Success',
    organization,
    summary,
    linkedAssets: ['asset-operator-runtime-docs', 'asset-knowledge-graph-doc'],
    customerCommunicationEnabled: false,
    nextAction: 'Review locally and prepare internal notes.',
  };
}

function avg(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}
