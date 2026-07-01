import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSharedMemoryStore } from './shared-memory-runtime.mjs';
import { listSharedTasks } from './shared-task-runtime.mjs';
import { readOpportunities, readResearchStore, readWorkflowStore } from './sales-agent-runtime.mjs';
import { getExecutivePlanningSummary } from './executive-planning-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const proposalRoot = path.join(repoRoot, 'codex-agent-threads/shared/proposals');
const reportRoot = path.join(proposalRoot, 'reports');
const proposalPath = path.join(proposalRoot, 'proposals.json');
const sectionsPath = path.join(proposalRoot, 'sections.json');
const compliancePath = path.join(proposalRoot, 'compliance-matrix.json');
const evidencePath = path.join(proposalRoot, 'evidence.json');
const reviewsPath = path.join(proposalRoot, 'reviews.json');
const timelinesPath = path.join(proposalRoot, 'timelines.json');
const readinessPath = path.join(proposalRoot, 'readiness.json');

const allowedStatuses = [
  'Draft',
  'Planning',
  'Research',
  'Compliance Review',
  'Technical Writing',
  'Pricing',
  'Internal Review',
  'Pink Team',
  'Red Team',
  'Gold Team',
  'Executive Review',
  'Ready',
  'Archived',
];

const complianceStatuses = ['Unknown', 'Pending', 'Partially Addressed', 'Addressed', 'Needs Review', 'Approved'];
const safety = {
  localOnly: true,
  autonomousBrowsing: false,
  emailing: false,
  crmSync: false,
  proposalSubmission: false,
  automaticComplianceApproval: false,
  automaticExecutiveApproval: false,
  customerCommunication: false,
};

export function listProposals() {
  const store = readProposalStore();
  return { title: 'Proposal Workspaces', generatedAt: stamp(), proposals: store.proposals, summary: summarizeProposals(store), safety };
}

export function createProposal(options = {}) {
  const store = readProposalStore();
  const opportunity = findOpportunity(options.opportunityId ?? process.env.PROPOSAL_OPPORTUNITY_ID) ?? readOpportunities()[0];
  const now = stamp();
  const proposal = seedProposalFromOpportunity(opportunity, now, store.proposals.length + 1);
  const next = {
    ...store,
    proposals: [proposal, ...store.proposals.filter((item) => item.proposalId !== proposal.proposalId)],
    sections: [...seedSections(proposal, now), ...store.sections.filter((item) => item.proposalId !== proposal.proposalId)],
    complianceMatrix: [...seedCompliance(proposal, now), ...store.complianceMatrix.filter((item) => item.proposalId !== proposal.proposalId)],
    evidence: [...seedEvidence(proposal, now), ...store.evidence.filter((item) => item.linkedProposal !== proposal.proposalId)],
    reviews: [...seedReviews(proposal, now), ...store.reviews.filter((item) => item.proposalId !== proposal.proposalId)],
    readiness: [seedReadiness(proposal, now), ...store.readiness.filter((item) => item.proposalId !== proposal.proposalId)],
    timelines: [
      timelineEvent(proposal.proposalId, 'created', 'Proposal workspace created locally.', 'Proposal Engine', now),
      ...store.timelines.filter((item) => item.proposalId !== proposal.proposalId),
    ],
  };
  writeProposalStore(next);
  return { title: 'Proposal Workspace Created', generatedAt: now, proposal, summary: summarizeProposals(next), safety };
}

export function updateProposal(options = {}) {
  const store = readProposalStore();
  const id = options.id ?? process.env.PROPOSAL_ID ?? store.proposals[0]?.proposalId;
  const status = options.status ?? process.env.PROPOSAL_STATUS ?? 'Planning';
  const reason = options.reason ?? process.env.PROPOSAL_REASON ?? 'Local proposal status update.';
  const operator = options.operator ?? process.env.PROPOSAL_OPERATOR ?? 'Proposal Engine';
  if (!allowedStatuses.includes(status)) return failure(`Invalid proposal status: ${status}`);
  const now = stamp();
  let changed = null;
  const proposals = store.proposals.map((proposal) => {
    if (proposal.proposalId !== id) return proposal;
    changed = { ...proposal, previousStatus: proposal.status };
    return { ...proposal, status, updatedAt: now };
  });
  if (!changed) return failure(`Proposal not found: ${id}`);
  const timelines = [
    timelineEvent(id, 'workflow changes', `Status moved from ${changed.previousStatus} to ${status}. ${reason}`, operator, now, {
      previousState: changed.previousStatus,
      newState: status,
      auditEvent: 'proposal_status_transition',
    }),
    ...store.timelines,
  ];
  const next = { ...store, proposals, timelines };
  writeProposalStore(next);
  return { title: 'Proposal Workspace Updated', generatedAt: now, proposal: proposals.find((item) => item.proposalId === id), safety };
}

export function listProposalSections() {
  const store = readProposalStore();
  return { title: 'Proposal Sections', generatedAt: stamp(), sections: store.sections, summary: summarizeSections(store), safety };
}

export function listComplianceMatrix() {
  const store = readProposalStore();
  return { title: 'Proposal Compliance Matrix', generatedAt: stamp(), complianceMatrix: store.complianceMatrix, summary: summarizeCompliance(store), safety };
}

export function listEvidenceLibrary() {
  const store = readProposalStore();
  return { title: 'Proposal Evidence Library', generatedAt: stamp(), evidence: store.evidence, summary: summarizeEvidence(store), safety };
}

export function listProposalReviews() {
  const store = readProposalStore();
  return { title: 'Proposal Review Queue', generatedAt: stamp(), reviews: store.reviews, summary: summarizeReviews(store), safety };
}

export function listProposalTimeline() {
  const store = readProposalStore();
  return { title: 'Proposal Timeline', generatedAt: stamp(), timeline: store.timelines, safety };
}

export function listProposalReadiness() {
  const store = readProposalStore();
  return { title: 'Proposal Readiness Scorecard', generatedAt: stamp(), readiness: store.readiness, summary: summarizeReadiness(store), safety };
}

export function getProposalHealth() {
  const store = readProposalStore();
  return { title: 'Proposal Health', generatedAt: stamp(), health: buildProposalHealth(store), safety };
}

export function buildProposalReports() {
  const store = readProposalStore();
  const payloads = {
    'proposal-health-report': { title: 'Proposal Health Report', generatedAt: stamp(), health: buildProposalHealth(store), safety },
    'proposal-readiness-report': { title: 'Proposal Readiness Report', generatedAt: stamp(), readiness: store.readiness, summary: summarizeReadiness(store), safety },
    'compliance-summary': { title: 'Compliance Summary', generatedAt: stamp(), compliance: store.complianceMatrix, summary: summarizeCompliance(store), safety },
    'missing-evidence-report': { title: 'Missing Evidence Report', generatedAt: stamp(), rows: missingEvidence(store), safety },
    'review-status-report': { title: 'Review Status Report', generatedAt: stamp(), reviews: store.reviews, summary: summarizeReviews(store), safety },
    'proposal-timeline-report': { title: 'Proposal Timeline Report', generatedAt: stamp(), timeline: store.timelines, safety },
    'executive-proposal-summary': { title: 'Executive Proposal Summary', generatedAt: stamp(), portfolio: buildExecutiveProposalPortfolio(store), safety },
    'proposal-portfolio-report': { title: 'Proposal Portfolio Report', generatedAt: stamp(), proposals: store.proposals, summary: summarizeProposals(store), safety },
    'section-completion-report': { title: 'Section Completion Report', generatedAt: stamp(), sections: store.sections, summary: summarizeSections(store), safety },
    'proposal-risk-report': { title: 'Proposal Risk Report', generatedAt: stamp(), rows: proposalRisks(store), safety },
  };
  return { title: 'Proposal Reports Generated', generatedAt: stamp(), written: Object.entries(payloads).map(([slug, payload]) => writeProposalReport(slug, payload)), safety };
}

export function validateProposalEngine() {
  const store = readProposalStore();
  const errors = [];
  if (!Array.isArray(store.proposals) || !store.proposals.length) errors.push('proposal records missing');
  if (!Array.isArray(store.sections) || !store.sections.length) errors.push('proposal sections missing');
  if (!Array.isArray(store.complianceMatrix) || !store.complianceMatrix.length) errors.push('compliance matrix missing');
  if (!Array.isArray(store.evidence) || !store.evidence.length) errors.push('evidence library missing');
  if (!Array.isArray(store.reviews) || !store.reviews.length) errors.push('review workflow missing');
  if (!Array.isArray(store.timelines) || !store.timelines.length) errors.push('proposal timeline missing');
  if (!Array.isArray(store.readiness) || !store.readiness.length) errors.push('readiness records missing');
  for (const proposal of store.proposals ?? []) {
    ['proposalId', 'title', 'customer', 'opportunityId', 'organizationId', 'proposalOwner', 'status', 'priority', 'createdAt', 'updatedAt', 'dueDate'].forEach((field) => {
      if (!proposal[field]) errors.push(`${proposal.proposalId ?? 'proposal'} missing ${field}`);
    });
    if (!allowedStatuses.includes(proposal.status)) errors.push(`${proposal.proposalId} invalid status`);
    if (!proposal.sharedMemoryReferences?.opportunity || !proposal.sharedMemoryReferences?.organization) errors.push(`${proposal.proposalId} missing shared memory references`);
  }
  for (const requirement of store.complianceMatrix ?? []) {
    if (requirement.status === 'Approved' && requirement.reviewer === 'Proposal Engine') errors.push(`${requirement.requirementId} was automatically approved`);
    if (!complianceStatuses.includes(requirement.status)) errors.push(`${requirement.requirementId} invalid compliance status`);
  }
  const tasks = listSharedTasks();
  const memoryStore = buildSharedMemoryStore();
  const planningStore = getExecutivePlanningSummary();
  if (!tasks.length) errors.push('shared task integration unavailable');
  if (!memoryStore.entities?.length) errors.push('shared memory integration unavailable');
  if (!planningStore.goals?.length) errors.push('executive planning integration unavailable');
  const reports = buildProposalReports();
  return {
    title: 'Proposal Engine Validation',
    generatedAt: stamp(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands: proposalCommands,
    reportCount: reports.written.length,
    storageRoot: path.relative(repoRoot, proposalRoot),
    safety,
  };
}

export function buildProposalDashboardSummary() {
  const store = readProposalStore();
  return {
    ...store,
    summary: summarizeProposals(store),
    health: buildProposalHealth(store),
    executivePortfolio: buildExecutiveProposalPortfolio(store),
    salesPipeline: buildSalesProposalPipeline(store),
    operatorQueue: buildOperatorProposalQueue(store),
    missingEvidence: missingEvidence(store),
    risks: proposalRisks(store),
    safety,
  };
}

export const proposalCommands = [
  'proposal:list',
  'proposal:create',
  'proposal:update',
  'proposal:sections',
  'proposal:compliance',
  'proposal:evidence',
  'proposal:review',
  'proposal:timeline',
  'proposal:readiness',
  'proposal:health',
  'proposal:report',
  'proposal:validate',
];

export function readProposalStore() {
  ensureProposalStorage();
  return {
    proposals: readJson(proposalPath, []),
    sections: readJson(sectionsPath, []),
    complianceMatrix: readJson(compliancePath, []),
    evidence: readJson(evidencePath, []),
    reviews: readJson(reviewsPath, []),
    timelines: readJson(timelinesPath, []),
    readiness: readJson(readinessPath, []),
  };
}

function writeProposalStore(store) {
  ensureProposalDirectories();
  writeJson(proposalPath, store.proposals);
  writeJson(sectionsPath, store.sections);
  writeJson(compliancePath, store.complianceMatrix);
  writeJson(evidencePath, store.evidence);
  writeJson(reviewsPath, store.reviews);
  writeJson(timelinesPath, store.timelines);
  writeJson(readinessPath, store.readiness);
}

function ensureProposalStorage() {
  ensureProposalDirectories();
  if (existsSync(proposalPath)) return;
  const now = '2026-07-01T12:00:00.000Z';
  const opportunities = readOpportunities().slice(0, 3);
  const proposals = opportunities.map((opportunity, index) => seedProposalFromOpportunity(opportunity, now, index + 1));
  const store = {
    proposals,
    sections: proposals.flatMap((proposal) => seedSections(proposal, now)),
    complianceMatrix: proposals.flatMap((proposal) => seedCompliance(proposal, now)),
    evidence: proposals.flatMap((proposal) => seedEvidence(proposal, now)),
    reviews: proposals.flatMap((proposal) => seedReviews(proposal, now)),
    timelines: proposals.flatMap((proposal) => [
      timelineEvent(proposal.proposalId, 'created', 'Proposal workspace seeded from local opportunity readiness.', 'Proposal Engine', now),
      timelineEvent(proposal.proposalId, 'readiness changes', 'Initial readiness scorecard calculated from local CRM, workflow, research, memory, task, and Executive planning references.', 'Proposal Engine', now),
    ]),
    readiness: proposals.map((proposal) => seedReadiness(proposal, now)),
  };
  writeProposalStore(store);
}

function ensureProposalDirectories() {
  mkdirSync(proposalRoot, { recursive: true });
  mkdirSync(reportRoot, { recursive: true });
}

function seedProposalFromOpportunity(opportunity, now, index) {
  const id = `proposal-${slugify(opportunity.company)}`;
  const dueDate = new Date(Date.parse(now) + (index * 7 + 14) * 86400000).toISOString();
  return {
    proposalId: id,
    title: `${opportunity.company} Local Proposal Workspace`,
    customer: opportunity.company,
    solicitation: 'Local sales-led proposal preparation, no submission',
    opportunityId: opportunity.id,
    organizationId: `organization:${opportunity.id}`,
    proposalOwner: index === 1 ? 'Proposal Prep' : 'Sales',
    contributors: ['Sales', 'Operator', 'Executive', 'Proposal Prep'],
    status: index === 1 ? 'Compliance Review' : index === 2 ? 'Planning' : 'Research',
    priority: opportunity.priority,
    createdAt: now,
    updatedAt: now,
    dueDate,
    reviewDates: [
      { stage: 'Author Review', date: new Date(Date.parse(dueDate) - 10 * 86400000).toISOString() },
      { stage: 'Red Team', date: new Date(Date.parse(dueDate) - 5 * 86400000).toISOString() },
      { stage: 'Executive Review', date: new Date(Date.parse(dueDate) - 2 * 86400000).toISOString() },
    ],
    plannedSubmissionDate: new Date(Date.parse(dueDate) - 86400000).toISOString(),
    relatedWorkflowIds: readWorkflowStore().workflows.filter((workflow) => workflow.opportunityId === opportunity.id).map((workflow) => workflow.id),
    relatedTaskIds: taskCandidates().filter((task) => task.linkedOpportunities?.includes(opportunity.id) || task.linkedProposals?.includes(id)).map((task) => task.id),
    relatedReportIds: opportunity.generatedReports ?? [],
    relatedResearchIds: readResearchStore().intakeQueue.filter((item) => item.opportunityId === opportunity.id).map((item) => item.id),
    sharedMemoryReferences: {
      opportunity: opportunity.id,
      organization: `organization:${opportunity.id}`,
      facts: [`fact:${opportunity.id}:proposal-status`, `fact:${opportunity.id}:stage`],
      executiveGoal: 'goal-proposal-readiness',
    },
  };
}

function seedReadiness(proposal, now) {
  const opportunity = findOpportunity(proposal.opportunityId);
  const workflowStore = readWorkflowStore();
  const blocked = workflowStore.workflows.some((workflow) => workflow.opportunityId === proposal.opportunityId && workflow.status === 'blocked');
  const base = opportunity?.proposalPreparationStatus?.readinessPercent ?? 55;
  const compliance = Math.max(35, base - 12);
  const technical = Math.max(40, base - 5);
  const pricing = Math.max(30, base - 18);
  const staffing = Math.max(45, base - 10);
  const executive = proposal.priority === 'Critical' || proposal.priority === 'High' ? Math.max(35, base - 20) : Math.max(50, base - 8);
  const overall = Math.round((base + compliance + technical + pricing + staffing + executive) / 6);
  const riskScore = Math.min(100, 100 - overall + (blocked ? 18 : 0) + (pricing < 60 ? 8 : 0));
  return {
    proposalId: proposal.proposalId,
    calculatedAt: now,
    overallReadiness: readinessMetric(overall, 'Overall readiness blends local opportunity readiness, section progress, compliance, evidence, review, and approval dependencies.'),
    complianceReadiness: readinessMetric(compliance, 'Compliance readiness reflects matrix coverage and reviewer status.', compliance < 70 ? ['Compliance reviewer required before approval.'] : []),
    technicalReadiness: readinessMetric(technical, 'Technical readiness reflects linked facts, technical approach sections, and source-backed requirements.'),
    pricingReadiness: readinessMetric(pricing, 'Pricing readiness stays advisory until human pricing inputs are attached.', pricing < 70 ? ['Pricing assumptions are incomplete.'] : []),
    staffingReadiness: readinessMetric(staffing, 'Staffing readiness reflects section ownership and required contributors.'),
    executiveReadiness: readinessMetric(executive, 'Executive readiness depends on manual Executive review and approval gates.', executive < 75 ? ['Executive approval is not automatic.'] : []),
    confidence: opportunity?.score?.confidence ?? 70,
    riskScore,
    topRisks: [
      ...(blocked ? ['Blocked workflow affects proposal timing.'] : []),
      ...(pricing < 70 ? ['Pricing inputs need owner review.'] : []),
      ...(compliance < 70 ? ['Compliance matrix has unresolved requirements.'] : []),
    ],
    recommendations: ['Resolve missing evidence first.', 'Schedule section owner review.', 'Keep Executive approval manual.'],
    nextActions: ['Review compliance gaps.', 'Attach source-backed evidence.', 'Confirm pricing assumptions locally.'],
  };
}

function readinessMetric(score, explanation, risks = []) {
  return {
    score,
    explanation,
    risks,
    recommendations: score >= 80 ? ['Maintain review cadence.'] : ['Close missing inputs and rerun proposal readiness.'],
    nextActions: score >= 80 ? ['Prepare for human review.'] : ['Assign owner for the lowest scoring area.'],
  };
}

function seedSections(proposal, now) {
  const names = [
    'Executive Summary',
    'Technical Approach',
    'Scope Response',
    'Management Plan',
    'Staffing Plan',
    'Key Personnel',
    'Past Performance',
    'Corporate Experience',
    'Transition Plan',
    'Risk Management',
    'Quality Assurance',
    'Pricing Inputs',
    'Assumptions',
    'Attachments',
    'Required Forms',
    'References',
    'Compliance Matrix',
  ];
  return names.map((name, index) => ({
    sectionId: `${proposal.proposalId}-section-${slugify(name)}`,
    proposalId: proposal.proposalId,
    name,
    owner: index % 5 === 0 ? 'Executive' : index % 3 === 0 ? 'Operator' : index % 2 === 0 ? 'Proposal Prep' : 'Sales',
    status: index < 3 ? 'in_progress' : index < 9 ? 'planned' : 'needs_input',
    completion: Math.max(15, Math.min(85, 78 - index * 3)),
    confidence: Math.max(40, 82 - index * 2),
    linkedFacts: proposal.sharedMemoryReferences.facts,
    linkedOrganizations: [proposal.organizationId],
    linkedContacts: [],
    linkedReports: proposal.relatedReportIds,
    linkedTasks: proposal.relatedTaskIds,
    linkedWorkflows: proposal.relatedWorkflowIds,
    updatedAt: now,
  }));
}

function seedCompliance(proposal, now) {
  return [
    ['REQ-001', 'Opportunity requirements', 'Scope Response', 'Document customer problem, current workflow, and required outcome.', 'Partially Addressed'],
    ['REQ-002', 'Local CRM', 'Pricing Inputs', 'Record pricing assumptions and exclusions before Executive review.', 'Needs Review'],
    ['REQ-003', 'Research Intake', 'Technical Approach', 'Use only approved local/manual research sources.', 'Addressed'],
    ['REQ-004', 'Executive Planning', 'Compliance Matrix', 'Manual Executive approval required before any external action.', 'Pending'],
    ['REQ-005', 'Shared Memory', 'Evidence Library', 'Link all material facts to existing memory, reports, tasks, or workflows.', 'Partially Addressed'],
  ].map(([suffix, source, section, requirement, status]) => ({
    requirementId: `${proposal.proposalId}-${suffix}`,
    proposalId: proposal.proposalId,
    source,
    section,
    requirement,
    status,
    evidence: status === 'Pending' ? [] : [`${proposal.proposalId}-evidence-local-crm`],
    reviewer: status === 'Addressed' ? 'Operator' : '',
    confidence: status === 'Addressed' ? 78 : status === 'Partially Addressed' ? 62 : 45,
    notes: 'Local compliance tracking only; approval requires human reviewer.',
    risks: status === 'Pending' || status === 'Needs Review' ? ['Human review required before approval.'] : [],
    missingItems: status === 'Pending' ? ['Reviewer assignment'] : status === 'Needs Review' ? ['Pricing owner confirmation'] : [],
    updatedAt: now,
  }));
}

function seedEvidence(proposal, now) {
  return [
    ['local-crm', 'Local CRM opportunity', 'Opportunity readiness, score, stage, contacts, and missing proposal fields.', proposal.opportunityId, 76, 'partially_verified'],
    ['research-intake', 'Research intake', 'Approved source-backed research summary linked to the opportunity.', proposal.relatedResearchIds[0] ?? '', 72, 'partially_verified'],
    ['workflow', 'Workflow handoff', 'Proposal prep, Executive approval, or compliance workflow dependency.', proposal.relatedWorkflowIds[0] ?? '', 70, 'verified'],
    ['shared-memory', 'Shared memory fact', 'Existing opportunity and organization facts referenced instead of duplicated.', proposal.sharedMemoryReferences.facts[0], 74, 'verified'],
  ].map(([suffix, type, description, linkedFact, confidence, verificationStatus]) => ({
    id: `${proposal.proposalId}-evidence-${suffix}`,
    type,
    description,
    source: suffix,
    linkedRequirement: `${proposal.proposalId}-REQ-005`,
    linkedProposal: proposal.proposalId,
    linkedFact,
    linkedReport: proposal.relatedReportIds[0] ?? '',
    confidence,
    verificationStatus,
    auditHistory: [timelineEvent(proposal.proposalId, 'evidence additions', `${type} evidence linked locally.`, 'Proposal Engine', now)],
  }));
}

function seedReviews(proposal, now) {
  return ['Author Review', 'Peer Review', 'Pink Team', 'Red Team', 'Gold Team', 'Executive Review'].map((stage, index) => ({
    reviewId: `${proposal.proposalId}-review-${slugify(stage)}`,
    proposalId: proposal.proposalId,
    stage,
    reviewer: index === 5 ? 'Executive' : index % 2 ? 'Operator' : 'Proposal Prep',
    findings: index < 2 ? ['Initial workspace has enough structure for review.'] : [],
    risks: index >= 3 ? ['Review cannot be approved automatically.'] : [],
    recommendations: ['Confirm evidence and section owners before advancing.'],
    unresolvedIssues: index >= 2 ? ['Awaiting human review.'] : [],
    approvalStatus: index < 1 ? 'completed' : 'pending',
    updatedAt: now,
  }));
}

function timelineEvent(proposalId, type, description, operator, timestamp, extra = {}) {
  return {
    id: `timeline-${proposalId}-${slugify(type)}-${compactStamp(timestamp)}-${Math.random().toString(36).slice(2, 6)}`,
    proposalId,
    type,
    description,
    operator,
    timestamp,
    immutable: true,
    ...extra,
  };
}

function summarizeProposals(store) {
  return {
    totalProposals: store.proposals.length,
    activeProposals: store.proposals.filter((proposal) => !['Ready', 'Archived'].includes(proposal.status)).length,
    readyProposals: store.proposals.filter((proposal) => proposal.status === 'Ready').length,
    executiveReviewQueue: store.proposals.filter((proposal) => proposal.status === 'Executive Review' || proposal.priority === 'Critical' || proposal.priority === 'High').length,
    highRiskProposals: store.readiness.filter((item) => item.riskScore >= 45).length,
    averageReadiness: average(store.readiness.map((item) => item.overallReadiness.score)),
    complianceGaps: store.complianceMatrix.filter((item) => ['Unknown', 'Pending', 'Partially Addressed', 'Needs Review'].includes(item.status)).length,
    missingEvidence: missingEvidence(store).length,
    upcomingDeadlines: store.proposals.filter((proposal) => daysUntil(proposal.dueDate) <= 21).length,
  };
}

function summarizeSections(store) {
  return {
    totalSections: store.sections.length,
    averageCompletion: average(store.sections.map((section) => section.completion)),
    missingSections: store.sections.filter((section) => section.completion < 50).length,
    blockedSections: store.sections.filter((section) => section.status === 'needs_input').length,
  };
}

function summarizeCompliance(store) {
  return {
    requirements: store.complianceMatrix.length,
    approved: store.complianceMatrix.filter((item) => item.status === 'Approved').length,
    needsReview: store.complianceMatrix.filter((item) => item.status === 'Needs Review').length,
    pending: store.complianceMatrix.filter((item) => ['Unknown', 'Pending', 'Partially Addressed'].includes(item.status)).length,
    averageConfidence: average(store.complianceMatrix.map((item) => item.confidence)),
  };
}

function summarizeEvidence(store) {
  return {
    evidenceItems: store.evidence.length,
    verified: store.evidence.filter((item) => item.verificationStatus === 'verified').length,
    missingEvidence: missingEvidence(store).length,
    averageConfidence: average(store.evidence.map((item) => item.confidence)),
  };
}

function summarizeReviews(store) {
  return {
    reviews: store.reviews.length,
    pending: store.reviews.filter((review) => review.approvalStatus === 'pending').length,
    completed: store.reviews.filter((review) => review.approvalStatus === 'completed').length,
    executiveReviews: store.reviews.filter((review) => review.stage === 'Executive Review').length,
  };
}

function summarizeReadiness(store) {
  return {
    averageOverall: average(store.readiness.map((item) => item.overallReadiness.score)),
    averageCompliance: average(store.readiness.map((item) => item.complianceReadiness.score)),
    averageTechnical: average(store.readiness.map((item) => item.technicalReadiness.score)),
    averagePricing: average(store.readiness.map((item) => item.pricingReadiness.score)),
    averageExecutive: average(store.readiness.map((item) => item.executiveReadiness.score)),
    averageRisk: average(store.readiness.map((item) => item.riskScore)),
  };
}

function buildProposalHealth(store) {
  const summary = summarizeProposals(store);
  return {
    healthScore: Math.max(0, Math.round(summary.averageReadiness - summary.highRiskProposals * 6 - summary.complianceGaps * 1.5)),
    summary,
    readiness: summarizeReadiness(store),
    compliance: summarizeCompliance(store),
    evidence: summarizeEvidence(store),
    reviews: summarizeReviews(store),
    nextAction: summary.missingEvidence ? 'Attach missing evidence before review gates.' : 'Schedule the next human review.',
  };
}

function buildExecutiveProposalPortfolio(store) {
  return store.proposals.map((proposal) => {
    const readiness = store.readiness.find((item) => item.proposalId === proposal.proposalId);
    return {
      proposalId: proposal.proposalId,
      title: proposal.title,
      customer: proposal.customer,
      status: proposal.status,
      priority: proposal.priority,
      dueDate: proposal.dueDate,
      overallReadiness: readiness?.overallReadiness.score ?? 0,
      riskScore: readiness?.riskScore ?? 0,
      executiveReadiness: readiness?.executiveReadiness.score ?? 0,
      nextAction: readiness?.nextActions?.[0] ?? 'Review proposal workspace.',
    };
  });
}

function buildSalesProposalPipeline(store) {
  return store.proposals.map((proposal) => {
    const opportunity = findOpportunity(proposal.opportunityId);
    const readiness = store.readiness.find((item) => item.proposalId === proposal.proposalId);
    return {
      proposalId: proposal.proposalId,
      customer: proposal.customer,
      opportunityId: proposal.opportunityId,
      opportunityStage: opportunity?.stage ?? 'unknown',
      proposalStatus: proposal.status,
      readiness: readiness?.overallReadiness.score ?? 0,
      dependencies: [...proposal.relatedWorkflowIds, ...proposal.relatedTaskIds],
      risks: readiness?.topRisks ?? [],
    };
  });
}

function buildOperatorProposalQueue(store) {
  return [
    ...store.sections.filter((section) => section.completion < 55).map((section) => ({
      id: section.sectionId,
      proposalId: section.proposalId,
      queue: 'Missing Sections',
      item: section.name,
      owner: section.owner,
      blocker: section.status.replace(/_/g, ' '),
      nextAction: 'Collect local inputs and update section progress.',
    })),
    ...missingEvidence(store).map((item) => ({
      id: item.requirementId,
      proposalId: item.proposalId,
      queue: 'Missing Evidence',
      item: item.requirement,
      owner: item.reviewer || 'Operator',
      blocker: item.missingItems.join(', ') || 'Evidence not attached',
      nextAction: 'Attach local source-backed evidence.',
    })),
  ].slice(0, 12);
}

function missingEvidence(store) {
  return store.complianceMatrix.filter((item) => item.evidence.length === 0 || item.missingItems.length > 0);
}

function proposalRisks(store) {
  return store.readiness.flatMap((item) => item.topRisks.map((risk) => ({ proposalId: item.proposalId, risk, riskScore: item.riskScore, nextAction: item.nextActions[0] })));
}

function findOpportunity(id) {
  return readOpportunities().find((item) => item.id === id);
}

function taskCandidates() {
  return listSharedTasks().map((item) => item.parsed);
}

function writeProposalReport(slug, payload) {
  mkdirSync(reportRoot, { recursive: true });
  const jsonPath = path.join(reportRoot, `${slug}.json`);
  const mdPath = path.join(reportRoot, `${slug}.md`);
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
  const rows = payload.rows ?? payload.proposals ?? payload.readiness ?? payload.compliance ?? payload.reviews ?? payload.timeline ?? payload.portfolio ?? payload.health?.summary ?? [];
  const rowBlock = Array.isArray(rows) ? rows.map((row) => `- ${Object.entries(row).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join('; ') : typeof value === 'object' && value !== null ? JSON.stringify(value) : value}`).join(' | ')}`).join('\n') : JSON.stringify(rows, null, 2);
  return `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n${rowBlock || 'No rows.'}\n\nLocal-only safety: no browsing, email, CRM sync, proposal submission, or automatic approvals.\n`;
}

function stamp() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value ?? 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function compactStamp(value) {
  return String(value).replace(/[^0-9]/g, '').slice(0, 14);
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function daysUntil(value) {
  return Math.ceil((Date.parse(value) - Date.now()) / 86400000);
}

function failure(message) {
  return { title: 'Proposal Engine Error', generatedAt: stamp(), status: 'fail', errors: [message], safety };
}
