import type { SalesOpportunityPipelineSummary } from '../agents/sales/salesTypes';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';

export interface ExecutivePlanningGoal {
  attentionLabel: string;
  blockers: string[];
  category: string;
  confidenceScore: number;
  goalId: string;
  linkedOrganizations: string[];
  ownerAgent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  progressScore: number;
  recommendations: string[];
  status: 'draft' | 'active' | 'at_risk' | 'blocked' | 'review' | 'completed' | 'paused' | 'archived';
  targetDate: string;
  title: string;
}

export interface ExecutivePlanningKpi {
  category: string;
  currentValue: number;
  kpiId: string;
  linkedGoal: string;
  name: string;
  status: 'ahead' | 'on_track' | 'behind' | 'at_risk' | 'blocked' | 'unknown';
  targetValue: number;
  trend: string;
  unit: string;
}

export interface ExecutivePlanningInitiative {
  blockers: string[];
  initiativeId: string;
  linkedGoal: string;
  owner: string;
  progress: number;
  status: string;
  title: string;
}

export interface ExecutivePlanningDecision {
  decision: string;
  decisionId: string;
  decisionMaker: string;
  decisionType: string;
  relatedGoal: string;
  status: string;
  title: string;
}

export interface ExecutivePlanningBlocker {
  blockerId: string;
  nextAction: string;
  owner: string;
  severity: string;
  title: string;
  type: string;
}

export interface ExecutivePlanningSummary {
  agentContribution: Array<{ agent: string; blockedItems: number; contributionLabel: string; goalsOwned: number; initiativesOwned: number; linkedTasks: number }>;
  blockers: ExecutivePlanningBlocker[];
  decisions: ExecutivePlanningDecision[];
  goals: ExecutivePlanningGoal[];
  initiatives: ExecutivePlanningInitiative[];
  kpis: ExecutivePlanningKpi[];
  salesGoalAlignment: Array<{ goal: string; opportunityContribution: string; revenueKpi: string; status: string }>;
  strategicRisks: Array<{ level: string; recommendation: string; risk: string }>;
  summary: {
    activeGoals: number;
    atRiskGoals: number;
    blockedGoals: number;
    decisionsLogged: number;
    executiveAttentionNeeded: number;
    initiativesActive: number;
    kpisOnTrack: number;
    totalGoals: number;
  };
}

export function buildDashboardExecutivePlanningSummary(input: {
  salesOpportunitySummary?: SalesOpportunityPipelineSummary;
  sharedTasks: SharedTaskDashboardSummary;
}): ExecutivePlanningSummary {
  const blockedTaskCount = input.sharedTasks.blockedTasks;
  const approvalCount = input.sharedTasks.executiveQueue.length;
  const goals: ExecutivePlanningGoal[] = [
    {
      attentionLabel: approvalCount ? 'Watch' : 'Normal',
      blockers: approvalCount ? [`${approvalCount} Executive approval item(s) need manual review.`] : [],
      category: 'revenue',
      confidenceScore: 72,
      goalId: 'goal-revenue-louisville-sales',
      linkedOrganizations: ['Louisville Combat Academy', 'Area 502 MMA'],
      ownerAgent: 'Sales',
      priority: 'critical',
      progressScore: 55,
      recommendations: ['Review Sales Goals and Revenue/KPI Alignment before new outreach planning.'],
      status: 'active',
      targetDate: '2026-09-30',
      title: 'Grow Louisville KY sales pipeline',
    },
    {
      attentionLabel: blockedTaskCount ? 'Executive Review' : 'Watch',
      blockers: blockedTaskCount ? [`${blockedTaskCount} blocked task(s) affect operating control.`] : ['Manual review queues need daily attention.'],
      category: 'operations',
      confidenceScore: 78,
      goalId: 'goal-operating-control',
      linkedOrganizations: ['Vyra internal operations'],
      ownerAgent: 'Executive',
      priority: 'high',
      progressScore: 64,
      recommendations: ['Use Operator Goal-Linked Tasks to clear blockers.'],
      status: 'at_risk',
      targetDate: '2026-07-31',
      title: 'Maintain local operating control',
    },
    {
      attentionLabel: 'Watch',
      blockers: ['Missing decision maker confirmation on warm prospects.'],
      category: 'sales',
      confidenceScore: 68,
      goalId: 'goal-proposal-readiness',
      linkedOrganizations: ['Core Combat Sports'],
      ownerAgent: 'Proposal Prep',
      priority: 'high',
      progressScore: 48,
      recommendations: ['Confirm proposal readiness before any external action gate.'],
      status: 'review',
      targetDate: '2026-07-31',
      title: 'Improve proposal readiness gates',
    },
  ];
  const kpis: ExecutivePlanningKpi[] = [
    { category: 'revenue', currentValue: (input.salesOpportunitySummary?.activeOpportunities ?? 6) * 6600, kpiId: 'kpi-pipeline-value', linkedGoal: 'goal-revenue-louisville-sales', name: 'Weighted Louisville pipeline', status: 'behind', targetValue: 75000, trend: 'rising', unit: 'USD' },
    { category: 'operations', currentValue: Math.max(0, 100 - blockedTaskCount * 10), kpiId: 'kpi-blocked-work', linkedGoal: 'goal-operating-control', name: 'Blocked work clearance', status: blockedTaskCount ? 'at_risk' : 'on_track', targetValue: 95, trend: 'stable', unit: 'percent' },
    { category: 'sales', currentValue: 62, kpiId: 'kpi-proposal-readiness', linkedGoal: 'goal-proposal-readiness', name: 'Proposal readiness coverage', status: 'behind', targetValue: 90, trend: 'rising', unit: 'percent' },
  ];
  const initiatives: ExecutivePlanningInitiative[] = [
    { blockers: [], initiativeId: 'initiative-sales-priority-queues', linkedGoal: 'goal-revenue-louisville-sales', owner: 'Sales', progress: 58, status: 'active', title: 'Use Sales priority queues for daily planning' },
    { blockers: ['Memory conflict review queue is non-empty.'], initiativeId: 'initiative-memory-review', linkedGoal: 'goal-operating-control', owner: 'Operator', progress: 42, status: 'active', title: 'Resolve planning-critical memory conflicts' },
  ];
  const blockers: ExecutivePlanningBlocker[] = [
    { blockerId: 'blocker-001', nextAction: 'Review approval queue manually.', owner: 'Executive', severity: 'high', title: `${approvalCount} task(s) require Executive review.`, type: 'missing_approval' },
    { blockerId: 'blocker-002', nextAction: 'Confirm decision makers before proposal work.', owner: 'Sales', severity: 'medium', title: 'Missing decision makers on proposal candidates.', type: 'missing_decision_maker' },
    ...input.sharedTasks.blockedWork.map((task, index) => ({ blockerId: `blocker-task-${index + 1}`, nextAction: task.recommendedNextAction, owner: task.assignedAgent, severity: 'high', title: task.title, type: 'blocked_task' })),
  ];
  return {
    agentContribution: ['Executive', 'Sales', 'Operator', 'Proposal Prep'].map((agent) => ({
      agent,
      blockedItems: blockers.filter((blocker) => blocker.owner === agent).length,
      contributionLabel: blockers.some((blocker) => blocker.owner === agent) ? 'Needs Attention' : 'Contributing',
      goalsOwned: goals.filter((goal) => goal.ownerAgent === agent).length,
      initiativesOwned: initiatives.filter((initiative) => initiative.owner === agent).length,
      linkedTasks: input.sharedTasks.activeWorkQueue.filter((task) => task.assignedAgent === agent).length,
    })),
    blockers,
    decisions: [{ decision: 'Maintain local-only execution with manual approval gates.', decisionId: 'decision-keep-local-only', decisionMaker: 'Robert', decisionType: 'strategic direction', relatedGoal: 'goal-operating-control', status: 'recorded', title: 'Keep Executive planning local only' }],
    goals,
    initiatives,
    kpis,
    salesGoalAlignment: goals
      .filter((goal) => ['revenue', 'sales'].includes(goal.category))
      .map((goal) => ({
        goal: goal.title,
        opportunityContribution: goal.linkedOrganizations.join(', '),
        revenueKpi: kpis.find((kpi) => kpi.linkedGoal === goal.goalId)?.name ?? 'No KPI linked',
        status: goal.status.replace(/_/g, ' '),
      })),
    strategicRisks: blockers.length ? [{ level: 'high', recommendation: 'Review Blocked Goals and Executive Priority Queue.', risk: 'Planning blockers are affecting goals.' }] : [],
    summary: {
      activeGoals: goals.filter((goal) => goal.status === 'active').length,
      atRiskGoals: goals.filter((goal) => goal.status === 'at_risk' || goal.attentionLabel !== 'Normal').length,
      blockedGoals: goals.filter((goal) => goal.blockers.length).length,
      decisionsLogged: 1,
      executiveAttentionNeeded: goals.filter((goal) => goal.attentionLabel !== 'Normal').length,
      initiativesActive: initiatives.filter((initiative) => initiative.status === 'active').length,
      kpisOnTrack: kpis.filter((kpi) => ['ahead', 'on_track'].includes(kpi.status)).length,
      totalGoals: goals.length,
    },
  };
}
