export interface EngineeringProductRecord {
  productId: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  version: string;
  roadmap: string;
  linkedGoals: string[];
  linkedKpis: string[];
  linkedCampaigns: string[];
  linkedRevenue: string[];
  linkedCustomers: string[];
  linkedEngineeringWork: string[];
}

export interface EngineeringFeatureRecord {
  featureId: string;
  productId: string;
  productName: string;
  description: string;
  priority: string;
  complexity: string;
  estimatedValue: number;
  customerImpact: string;
  engineeringEffort: number;
  linkedTasks: string[];
  linkedAssets: string[];
  linkedRequirements: string[];
  linkedBugs: string[];
  linkedFeedback: string[];
  status: string;
}

export interface EngineeringRoadmapRecord {
  roadmapId: string;
  name: string;
  type: string;
  milestones: string[];
  features: string[];
  goals: string[];
  dependencies: string[];
  risks: string[];
  progress: number;
  executivePriority: string;
}

export interface EngineeringIssueRecord {
  issueId: string;
  type: string;
  severity: string;
  priority: string;
  owner: string;
  status: string;
  productId: string;
  productName: string;
  featureId: string;
  reproductionNotes: string;
  linkedTasks: string[];
  linkedAssets: string[];
  linkedReports: string[];
}

export interface EngineeringReleaseRecord {
  releaseId: string;
  version: string;
  plannedDate: string;
  includedFeatures: string[];
  bugFixes: string[];
  risks: string[];
  qaStatus: string;
  releaseNotesDraft: string;
  readinessScore: number;
  executiveApprovalStatus: string;
}

export interface EngineeringFeedbackRecord {
  feedbackId: string;
  source: string;
  category: string;
  frequency: number;
  severity: string;
  linkedFeatures: string[];
  linkedCustomers: string[];
  recommendations: string;
}

export interface EngineeringHealthEvaluation {
  score: number;
  confidence: number;
  risks: string[];
  blockers: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface EngineeringProductOperationsSummary {
  products: EngineeringProductRecord[];
  features: EngineeringFeatureRecord[];
  roadmaps: EngineeringRoadmapRecord[];
  issues: EngineeringIssueRecord[];
  releases: EngineeringReleaseRecord[];
  feedback: EngineeringFeedbackRecord[];
  health: Record<string, EngineeringHealthEvaluation>;
  summary: {
    productCount: number;
    featureCount: number;
    activeFeatures: number;
    releasedFeatures: number;
    averageRoadmapProgress: number;
    openIssues: number;
    criticalIssues: number;
    upcomingReleases: number;
    blockedReleases: number;
    feedbackItems: number;
    highSeverityFeedback: number;
  };
  safety: {
    localOnly: boolean;
    githubMutations: boolean;
    deploymentAutomation: boolean;
    ciCdMutations: boolean;
    appStorePublishing: boolean;
    autonomousCodeGeneration: boolean;
    autonomousMerges: boolean;
    advisoryOnly: boolean;
  };
}

export function buildDashboardEngineeringProductOperations(): EngineeringProductOperationsSummary {
  const products = [
    product('prod-athlete-app', 'Athlete App', 'Athlete-facing performance companion for training accountability.', 'Active Development', '0.8.0', ['goal-athlete-launch'], ['kpi-activation'], ['camp-athlete-app-foundation'], ['forecast-annual'], ['cust-river-city-performance'], ['engineering-task:repo-risk:vyra-app']),
    product('prod-coach-platform', 'Coach Platform', 'Coach workspace for athlete progress, programming, and client communication.', 'QA', '1.1.0', ['goal-coach-retention'], ['kpi-retention'], ['camp-gym-growth-readiness'], ['fin-cust-area-502-mma'], ['cust-area-502-mma'], ['engineering-task:documentation:coach-platform']),
    product('prod-gym-software', 'Gym Software', 'Gym operations software for member experience, onboarding, and growth follow-through.', 'Beta', '0.9.0', ['goal-gym-growth'], ['kpi-onboarding'], ['camp-gym-growth-readiness'], ['fin-cust-louisville-combat-academy'], ['cust-louisville-combat-academy'], ['engineering-task:release-blocker:gym-software:qa']),
    product('prod-white-label', 'White Label Platform', 'Partner-branded performance experience planning for larger organizations.', 'Planned', '0.3.0', ['goal-enterprise-pilot'], ['kpi-pipeline'], ['camp-white-label-positioning'], ['fin-future-white-label'], ['cust-kentucky-youth-sports'], ['engineering-task:project-registry:white-label']),
  ];
  const features = [
    feature('feat-athlete-progress-snapshot', products[0], 'Feature Ideas', 'High', 'Medium', 82, 'High', 6, ['tasks:list'], ['asset-operator-runtime-docs'], ['req-progress-summary'], ['issue-athlete-empty-state'], ['feedback-river-city-progress']),
    feature('feat-coach-client-board', products[1], 'QA', 'High', 'Medium', 78, 'High', 8, ['engineering-task:documentation:coach-platform'], ['asset-knowledge-graph-doc'], ['req-client-board'], ['issue-coach-doc-gap'], ['feedback-area-502-training']),
    feature('feat-gym-member-import', products[2], 'Beta', 'Critical', 'High', 90, 'Critical', 13, ['engineering-task:release-blocker:gym-software:qa'], ['asset-migration-guide'], ['req-member-import'], ['issue-gym-import-validation'], ['feedback-lca-import']),
    feature('feat-white-label-branding', products[3], 'Planned Features', 'Medium', 'High', 70, 'Medium', 13, ['engineering-task:project-registry:white-label'], ['asset-brand-intelligence'], ['req-branding'], ['issue-white-label-scope'], ['feedback-kys-enterprise']),
    feature('feat-release-notes-workflow', products[1], 'Released', 'Medium', 'Low', 64, 'Medium', 3, ['release:ship-plans'], ['asset-release-notes'], ['req-release-notes'], [], ['feedback-success-release-comms']),
  ];
  const roadmaps = [
    roadmap('roadmap-q3-product-readiness', 'Q3 Product Readiness', 'Quarterly', 62, ['Gym member import beta', 'Coach client board QA', 'Athlete snapshot idea review'], ['goal-gym-growth', 'goal-coach-retention'], ['feat-gym-member-import', 'feat-coach-client-board'], ['Member import QA remains the release blocker.'], 'High'),
    roadmap('roadmap-july-release', 'July Release Plan', 'Release', 58, ['Release notes workflow', 'Gym beta readiness', 'Feedback summary review'], ['goal-athlete-launch'], ['feat-release-notes-workflow', 'feat-gym-member-import'], ['Release approval is planning-only.'], 'High'),
    roadmap('roadmap-long-term-platform', 'Long-Term Product Platform', 'Long-term', 36, ['White label branding', 'Shared product analytics', 'Cross-agent product memory'], ['goal-enterprise-pilot'], ['feat-white-label-branding'], ['Enterprise scope needs customer validation.'], 'Medium'),
  ];
  const issues = [
    issue('issue-gym-import-validation', 'Bug', 'Critical', 'P0', 'Engineering', 'open', products[2], 'feat-gym-member-import', 'CSV import validation misses duplicate local IDs in one dry-run path.', ['tasks:validate'], ['asset-migration-guide'], ['release-readiness-report']),
    issue('issue-coach-doc-gap', 'Documentation', 'Medium', 'P2', 'Product', 'planned', products[1], 'feat-coach-client-board', 'Coach client board acceptance notes need screenshots before release review.', ['engineering-task:documentation:coach-platform'], ['asset-operator-runtime-docs'], ['feature-status-report']),
    issue('issue-athlete-empty-state', 'UI', 'Low', 'P3', 'Design', 'triage', products[0], 'feat-athlete-progress-snapshot', 'Progress snapshot empty state needs clearer product wording.', ['marketing:content'], ['asset-brand-intelligence'], ['product-portfolio-report']),
    issue('issue-white-label-scope', 'Enhancement', 'High', 'P1', 'Product', 'planned', products[3], 'feat-white-label-branding', 'White label scope requires manual executive review before any build work.', ['executive:goals'], ['asset-brand-intelligence'], ['executive-engineering-summary']),
  ];
  const releases = [
    release('rel-0.9.0-gym-beta', '0.9.0', '2026-07-22', ['feat-gym-member-import', 'feat-release-notes-workflow'], ['issue-gym-import-validation'], ['QA blocker unresolved.'], 'blocked', 61, 'needs_review'),
    release('rel-1.1.0-coach-qa', '1.1.0', '2026-08-05', ['feat-coach-client-board'], ['issue-coach-doc-gap'], ['Documentation gap before release notes.'], 'review', 74, 'pending'),
    release('rel-0.8.0-athlete-planning', '0.8.0', '2026-08-19', ['feat-athlete-progress-snapshot'], ['issue-athlete-empty-state'], ['Feature is still in idea review.'], 'planning', 52, 'not_requested'),
  ];
  const feedback = [
    feedbackRow('feedback-lca-import', 'Gyms', 'member import', 5, 'High', ['feat-gym-member-import'], ['cust-louisville-combat-academy'], 'Prioritize import validation and release readiness review.'),
    feedbackRow('feedback-river-city-progress', 'Coaches', 'progress reporting', 3, 'Medium', ['feat-athlete-progress-snapshot'], ['cust-river-city-performance'], 'Shape progress snapshot requirements with Customer Success.'),
    feedbackRow('feedback-area-502-training', 'Customer Success', 'training workflow', 4, 'Medium', ['feat-coach-client-board'], ['cust-area-502-mma'], 'Complete QA notes and training assets together.'),
    feedbackRow('feedback-kys-enterprise', 'Sales', 'enterprise branding', 2, 'High', ['feat-white-label-branding'], ['cust-kentucky-youth-sports'], 'Keep white label planning advisory until executive approval.'),
    feedbackRow('feedback-success-release-comms', 'Customer Success', 'release communication', 3, 'Medium', ['feat-release-notes-workflow'], ['cust-louisville-combat-academy', 'cust-area-502-mma'], 'Prepare release communications as drafts only.'),
  ];
  const summary = summarize(products, features, roadmaps, issues, releases, feedback);
  const blockerIssues = issues.filter((item) => ['Critical', 'High'].includes(item.severity) && !['done', 'closed'].includes(item.status)).length;
  const averageReleaseReadiness = average(releases.map((item) => item.readinessScore));
  const health = {
    releaseReadiness: evaluation(averageReleaseReadiness, releases.flatMap((item) => item.risks), ['Review blocked releases.', 'Keep release approval manual.']),
    roadmapProgress: evaluation(summary.averageRoadmapProgress, roadmaps.flatMap((item) => item.risks), ['Review roadmap risks with Executive.', 'Keep dependencies explicit.']),
    featureCompletion: evaluation(Math.round((features.filter((item) => ['QA', 'Beta', 'Released'].includes(item.status)).length / features.length) * 100), [], ['Move active features through QA intentionally.']),
    bugBacklogHealth: evaluation(Math.max(0, 100 - issues.filter((item) => item.type === 'Bug').length * 18 - blockerIssues * 12), blockerIssues ? ['Critical or high issue open.'] : [], ['Triage critical bugs before release planning.']),
    productHealth: evaluation(Math.round((summary.averageRoadmapProgress + averageReleaseReadiness + (100 - blockerIssues * 12)) / 3), [...roadmaps.flatMap((item) => item.risks), ...releases.flatMap((item) => item.risks)], ['Review product portfolio monthly.']),
  };
  return {
    products,
    features,
    roadmaps,
    issues,
    releases,
    feedback,
    health,
    summary,
    safety: {
      localOnly: true,
      githubMutations: false,
      deploymentAutomation: false,
      ciCdMutations: false,
      appStorePublishing: false,
      autonomousCodeGeneration: false,
      autonomousMerges: false,
      advisoryOnly: true,
    },
  };
}

function product(productId: string, name: string, description: string, status: string, version: string, linkedGoals: string[], linkedKpis: string[], linkedCampaigns: string[], linkedRevenue: string[], linkedCustomers: string[], linkedEngineeringWork: string[]): EngineeringProductRecord {
  return { productId, name, description, status, owner: 'Product', version, roadmap: `roadmap-${productId}`, linkedGoals, linkedKpis, linkedCampaigns, linkedRevenue, linkedCustomers, linkedEngineeringWork };
}

function feature(featureId: string, productRecord: EngineeringProductRecord, status: string, priority: string, complexity: string, estimatedValue: number, customerImpact: string, engineeringEffort: number, linkedTasks: string[], linkedAssets: string[], linkedRequirements: string[], linkedBugs: string[], linkedFeedback: string[]): EngineeringFeatureRecord {
  return { featureId, productId: productRecord.productId, productName: productRecord.name, description: featureId.replace('feat-', '').replace(/-/g, ' '), priority, complexity, estimatedValue, customerImpact, engineeringEffort, linkedTasks, linkedAssets, linkedRequirements, linkedBugs, linkedFeedback, status };
}

function roadmap(roadmapId: string, name: string, type: string, progress: number, milestones: string[], goals: string[], features: string[], risks: string[], executivePriority: string): EngineeringRoadmapRecord {
  return { roadmapId, name, type, milestones, features, goals, dependencies: ['Shared Memory', 'Universal Task Engine', 'Executive Planning'], risks, progress, executivePriority };
}

function issue(issueId: string, type: string, severity: string, priority: string, owner: string, status: string, productRecord: EngineeringProductRecord, featureId: string, reproductionNotes: string, linkedTasks: string[], linkedAssets: string[], linkedReports: string[]): EngineeringIssueRecord {
  return { issueId, type, severity, priority, owner, status, productId: productRecord.productId, productName: productRecord.name, featureId, reproductionNotes, linkedTasks, linkedAssets, linkedReports };
}

function release(releaseId: string, version: string, plannedDate: string, includedFeatures: string[], bugFixes: string[], risks: string[], qaStatus: string, readinessScore: number, executiveApprovalStatus: string): EngineeringReleaseRecord {
  return { releaseId, version, plannedDate, includedFeatures, bugFixes, risks, qaStatus, releaseNotesDraft: `Draft release notes for ${version}. Planning only; no automatic release.`, readinessScore, executiveApprovalStatus };
}

function feedbackRow(feedbackId: string, source: string, category: string, frequency: number, severity: string, linkedFeatures: string[], linkedCustomers: string[], recommendations: string): EngineeringFeedbackRecord {
  return { feedbackId, source, category, frequency, severity, linkedFeatures, linkedCustomers, recommendations };
}

function summarize(products: EngineeringProductRecord[], features: EngineeringFeatureRecord[], roadmaps: EngineeringRoadmapRecord[], issues: EngineeringIssueRecord[], releases: EngineeringReleaseRecord[], feedback: EngineeringFeedbackRecord[]) {
  return {
    productCount: products.length,
    featureCount: features.length,
    activeFeatures: features.filter((item) => ['Active Development', 'QA', 'Beta'].includes(item.status)).length,
    releasedFeatures: features.filter((item) => item.status === 'Released').length,
    averageRoadmapProgress: average(roadmaps.map((item) => item.progress)),
    openIssues: issues.filter((item) => !['done', 'closed'].includes(item.status)).length,
    criticalIssues: issues.filter((item) => item.severity === 'Critical').length,
    upcomingReleases: releases.length,
    blockedReleases: releases.filter((item) => item.qaStatus === 'blocked' || item.readinessScore < 65).length,
    feedbackItems: feedback.length,
    highSeverityFeedback: feedback.filter((item) => item.severity === 'High').length,
  };
}

function evaluation(score: number, risks: string[], recommendations: string[]): EngineeringHealthEvaluation {
  return {
    score,
    confidence: 78,
    risks,
    blockers: risks.filter((risk) => /blocker|critical|unresolved/i.test(risk)),
    recommendations,
    nextActions: recommendations,
  };
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}
