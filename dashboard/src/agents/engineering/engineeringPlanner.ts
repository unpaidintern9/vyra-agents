import type { EngineeringGraph } from './engineeringTypes';
import type { EngineeringBacklogCategory, EngineeringBacklogItem } from './engineeringTaskTypes';

export interface EngineeringPlannerGroup {
  count: number;
  effort: string;
  featureArea: string;
  items: EngineeringBacklogItem[];
  owner: string;
  repo: string;
}

export interface RepoHealthPlan {
  effort: 'medium' | 'large';
  expectedImpact: string;
  healthScore: number;
  recommendedActions: string[];
  repo: string;
  riskLevel: string;
}

export function groupBacklogItems(items: EngineeringBacklogItem[], category: EngineeringBacklogCategory): EngineeringPlannerGroup[] {
  const groups = new Map<string, EngineeringBacklogItem[]>();
  for (const item of items.filter((candidate) => candidate.category === category)) {
    const key = [item.repo, item.owner, item.featureArea].join('|');
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return [...groups.entries()]
    .map(([key, groupedItems]) => {
      const [repo, owner, featureArea] = key.split('|');
      return {
        count: groupedItems.length,
        effort: dominant(groupedItems.map((item) => item.effort)),
        featureArea,
        items: groupedItems,
        owner,
        repo,
      };
    })
    .sort((left, right) => right.count - left.count);
}

export function repoHealthImprovementPlans(graph: EngineeringGraph): RepoHealthPlan[] {
  return graph.repositories
    .filter((repo) => (repo.healthScore ?? 100) < 80)
    .map((repo) => ({
      effort: ((repo.healthScore ?? 100) < 50 ? 'large' : 'medium') as 'large' | 'medium',
      expectedImpact: expectedImpact(repo.healthScore ?? 0),
      healthScore: repo.healthScore ?? 0,
      recommendedActions: recommendedActions(repo),
      repo: repo.name,
      riskLevel: repo.riskLevel || 'unknown',
    }))
    .sort((left, right) => left.healthScore - right.healthScore);
}

function recommendedActions(repo: EngineeringGraph['repositories'][number]): string[] {
  const actions = [];
  if ((repo.missingDocs ?? 0) > 0) actions.push(`Plan documentation for ${repo.missingDocs} missing-doc candidates.`);
  if ((repo.orphanCandidates ?? 0) > 0) actions.push(`Review ${repo.orphanCandidates} orphan candidates without deleting automatically.`);
  if ((repo.brokenRelationshipWarnings ?? 0) > 0) actions.push(`Investigate ${repo.brokenRelationshipWarnings} broken relationship warnings.`);
  if ((repo.highRiskNodes ?? 0) > 0) actions.push(`Prioritize ownership notes for ${repo.highRiskNodes} high-risk nodes.`);
  return actions.length ? actions : ['Keep monitoring repo health after future graph scans.'];
}

function expectedImpact(score: number): string {
  if (score < 50) return 'High impact: addresses a low-health repo with concentrated planning debt.';
  if (score < 80) return 'Medium impact: improves visibility before implementation work.';
  return 'Low impact: maintain current planning hygiene.';
}

function dominant(values: string[]): string {
  if (values.includes('large')) return 'large';
  if (values.includes('medium')) return 'medium';
  if (values.includes('small')) return 'small';
  return 'unknown';
}
