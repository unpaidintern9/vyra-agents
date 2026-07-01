import type {
  SalesIntelligenceScore,
  SalesOpportunity,
  SalesPipelineAnalytics,
  SalesPriorityQueue,
  SalesPriorityQueueId,
  SalesRelatedOpportunityCandidate,
  SalesResearchIntakeItem,
  SalesWorkflowRecord,
} from './salesTypes';

const queueLabels: Record<SalesPriorityQueueId, string> = {
  blocked: 'Blocked',
  executive_review: 'Executive Review',
  hot_prospects: 'Hot Prospects',
  needs_research: 'Needs Research',
  proposal_ready: 'Proposal Ready',
  warm_prospects: 'Warm Prospects',
};

export function scoreSalesOpportunitiesIntelligently(
  opportunities: SalesOpportunity[],
  intakeQueue: SalesResearchIntakeItem[],
  workflows: SalesWorkflowRecord[],
): SalesIntelligenceScore[] {
  return opportunities.map((opportunity) => {
    const intake = intakeQueue.find((item) => item.opportunityId === opportunity.id);
    const relatedWorkflows = workflows.filter((workflow) => workflow.opportunityId === opportunity.id);
    const companyFit = clamp(opportunity.icpScore);
    const industryFit = /mma|bjj|martial|crossfit|gym|fitness/i.test(opportunity.industry) ? 92 : 66;
    const organizationSize = /small|independent/i.test(opportunity.companySizeEstimate) ? 86 : 68;
    const geographicFit = /KY|IN|Louisville|Jeffersonville|New Albany/i.test(`${opportunity.city} ${opportunity.state} ${opportunity.location}`) ? 92 : 72;
    const buyingSignals = clamp(55 + (opportunity.score.overallScore - 70) + relatedWorkflows.filter((workflow) => workflow.status !== 'archived').length * 4);
    const existingRelationship = opportunity.contacts.some((contact) => contact.email || contact.phone) ? 72 : 35;
    const estimatedRevenuePotential = clamp(opportunity.score.overallScore + (opportunity.priority === 'High' || opportunity.priority === 'Critical' ? 8 : 0));
    const confidence = clamp(Math.round(((intake?.confidence ?? opportunity.score.confidence) + opportunity.score.confidence + (intake?.completeness ?? 60)) / 3));
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
    ].filter(Boolean) as string[];
    const scoreLabel = proposalReadiness < 35 || risks.length >= 3 ? 'Not Ready' : totalScore >= 84 ? 'Hot' : totalScore >= 70 ? 'Warm' : 'Cold';
    return {
      buyingSignals,
      companyFit,
      confidence,
      confidenceLevel: confidence >= 80 ? 'High' : confidence >= 65 ? 'Medium' : 'Low',
      estimatedRevenuePotential,
      existingRelationship,
      geographicFit,
      industryFit,
      opportunityId: opportunity.id,
      organizationSize,
      proposalReadiness,
      recommendedNextAction: nextAction(scoreLabel, risks, opportunity.followUpPlan.recommendedNextAction),
      risks,
      scoreLabel,
      topReasons: [
        `${companyFit}% company fit`,
        `${industryFit}% industry fit`,
        `${geographicFit}% geographic fit`,
        `${proposalReadiness}% proposal readiness`,
      ],
      totalScore,
      workflowUrgency,
    };
  });
}

export function buildSalesPriorityQueues(opportunities: SalesOpportunity[], scores: SalesIntelligenceScore[], workflows: SalesWorkflowRecord[]): SalesPriorityQueue[] {
  const queues = (Object.keys(queueLabels) as SalesPriorityQueueId[]).map((id) => ({ id, label: queueLabels[id], items: [] as SalesPriorityQueue['items'] }));
  for (const opportunity of opportunities) {
    const score = scores.find((item) => item.opportunityId === opportunity.id);
    if (!score) continue;
    const relatedWorkflows = workflows.filter((workflow) => workflow.opportunityId === opportunity.id);
    const queueIds: SalesPriorityQueueId[] = [];
    if (score.scoreLabel === 'Hot') queueIds.push('hot_prospects');
    if (score.scoreLabel === 'Warm') queueIds.push('warm_prospects');
    if (score.risks.some((risk) => /verified|contact|requirements/i.test(risk))) queueIds.push('needs_research');
    if (opportunity.proposalPreparationStatus.readinessPercent >= 70) queueIds.push('proposal_ready');
    if (relatedWorkflows.some((workflow) => workflow.targetAgent === 'Executive' || workflow.approvalRequirement)) queueIds.push('executive_review');
    if (relatedWorkflows.some((workflow) => workflow.status === 'blocked')) queueIds.push('blocked');
    for (const queueId of queueIds) {
      queues.find((queue) => queue.id === queueId)?.items.push({
        company: opportunity.company,
        explanation: queueExplanation(queueId, score),
        nextAction: score.recommendedNextAction,
        opportunityId: opportunity.id,
        priority: opportunity.priority,
        queueId,
        risks: score.risks,
        scoreLabel: score.scoreLabel,
        totalScore: score.totalScore,
      });
    }
  }
  return queues;
}

export function detectRelatedSalesOpportunities(opportunities: SalesOpportunity[]): SalesRelatedOpportunityCandidate[] {
  const candidates: SalesRelatedOpportunityCandidate[] = [];
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
      ].filter(Boolean) as string[];
      if (fields.length >= 2) {
        candidates.push({
          company: left.company,
          confidence: Math.min(96, 45 + fields.length * 15),
          fields,
          id: `related-${left.id}-${right.id}`,
          opportunityId: left.id,
          reason: `Shared ${fields.join(', ')} suggests these records should be reviewed together.`,
          relatedCompany: right.company,
          relatedOpportunityId: right.id,
          reviewAction: 'Review Duplicate',
        });
      }
    }
  }
  return candidates;
}

export function buildSalesPipelineAnalytics(
  opportunities: SalesOpportunity[],
  scores: SalesIntelligenceScore[],
  workflows: SalesWorkflowRecord[],
): SalesPipelineAnalytics {
  const nextActionBreakdown = scores.reduce<Record<string, number>>((counts, score) => {
    counts[score.recommendedNextAction] = (counts[score.recommendedNextAction] ?? 0) + 1;
    return counts;
  }, {});
  return {
    averageConfidence: average(scores.map((score) => score.confidence)),
    blockedCount: workflows.filter((workflow) => workflow.status === 'blocked').length,
    coldCount: scores.filter((score) => score.scoreLabel === 'Cold').length,
    estimatedPipelineValue: scores.reduce((sum, score) => sum + score.estimatedRevenuePotential * 125, 0),
    executiveReviewCount: workflows.filter((workflow) => workflow.targetAgent === 'Executive' || workflow.approvalRequirement).length,
    hotCount: scores.filter((score) => score.scoreLabel === 'Hot').length,
    nextActionBreakdown,
    notReadyCount: scores.filter((score) => score.scoreLabel === 'Not Ready').length,
    proposalReadyCount: opportunities.filter((opportunity) => opportunity.proposalPreparationStatus.readinessPercent >= 70).length,
    totalOpportunities: opportunities.length,
    warmCount: scores.filter((score) => score.scoreLabel === 'Warm').length,
  };
}

function nextAction(label: SalesIntelligenceScore['scoreLabel'], risks: string[], fallback: string) {
  if (risks.some((risk) => /Contact/.test(risk))) return 'Verify contact path';
  if (risks.some((risk) => /Proposal/.test(risk))) return 'Complete proposal requirements';
  if (label === 'Hot') return 'Queue Executive review';
  if (label === 'Warm') return 'Prepare follow-up';
  if (label === 'Cold') return 'Keep in nurture';
  return fallback;
}

function queueExplanation(queueId: SalesPriorityQueueId, score: SalesIntelligenceScore) {
  if (queueId === 'hot_prospects') return `Hot score ${score.totalScore} with ${score.confidenceLevel.toLowerCase()} confidence.`;
  if (queueId === 'warm_prospects') return `Warm score ${score.totalScore}; useful but needs more proof.`;
  if (queueId === 'needs_research') return `Needs research because ${score.risks[0] ?? 'key fields are incomplete'}.`;
  if (queueId === 'proposal_ready') return `${score.proposalReadiness}% proposal readiness.`;
  if (queueId === 'executive_review') return 'Approval or Executive review workflow is attached.';
  return `Blocked or gated work exists; resolve before external action.`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function domain(value: string) {
  return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

function sharedToken(left: string, right: string) {
  const leftTokens = left.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 4);
  const rightTokens = new Set(right.toLowerCase().split(/[^a-z0-9]+/));
  return leftTokens.some((token) => rightTokens.has(token));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
