import { riskLevelForNode, riskWarningQueue } from './engineeringOwnership';
import type { EngineeringGraph, EngineeringNode } from './engineeringTypes';
import type {
  EngineeringBacklogCategory,
  EngineeringBacklogEffort,
  EngineeringBacklogItem,
  EngineeringBacklogSeverity,
  EngineeringBacklogSummary,
  EngineeringBacklogStatus,
} from './engineeringTaskTypes';

export const engineeringBacklogStatusStorageKey = 'vyra-agents:engineering-backlog-status';

export function buildEngineeringBacklog(graph: EngineeringGraph, statusMap: Record<string, EngineeringBacklogStatus> = {}): EngineeringBacklogItem[] {
  const createdAt = graph.generatedAt && graph.generatedAt !== 'Not generated yet' ? graph.generatedAt : new Date().toISOString();
  const queue = riskWarningQueue(graph);
  const items = [
    ...repoHealthTasks(graph, createdAt),
    ...queue.missingDocs.slice(0, 250).map((node) => nodeTask(node, 'missing_doc', createdAt)),
    ...queue.orphanCandidates.slice(0, 250).map((node) => nodeTask(node, 'orphan_review', createdAt)),
    ...queue.brokenRelationships.slice(0, 250).map((warning) => warningTask(graph, warning, createdAt)),
    ...queue.highRiskNodes.slice(0, 250).map((node) => nodeTask(node, highRiskCategory(node), createdAt)),
  ];
  return dedupeItems(items).map((item) => ({
    ...item,
    status: statusMap[item.id] || item.status,
  }));
}

export function summarizeEngineeringBacklog(items: EngineeringBacklogItem[]): EngineeringBacklogSummary {
  return {
    brokenRelationships: items.filter((item) => item.category === 'broken_relationship').length,
    critical: items.filter((item) => item.severity === 'critical').length,
    high: items.filter((item) => item.severity === 'high').length,
    low: items.filter((item) => item.severity === 'low').length,
    medium: items.filter((item) => item.severity === 'medium').length,
    missingDocs: items.filter((item) => item.category === 'missing_doc').length,
    orphanReviews: items.filter((item) => item.category === 'orphan_review').length,
    repoHealthTasks: items.filter((item) => item.category === 'repo_health').length,
    total: items.length,
  };
}

export function backlogStatusMap(items: EngineeringBacklogItem[]): Record<string, EngineeringBacklogStatus> {
  return Object.fromEntries(items.map((item) => [item.id, item.status]));
}

function repoHealthTasks(graph: EngineeringGraph, createdAt: string): EngineeringBacklogItem[] {
  return graph.repositories
    .filter((repo) => (repo.healthScore ?? 100) < 80)
    .map((repo) => ({
      id: stableId(['repo_health', repo.name]),
      title: `Improve ${repo.name} engineering health score`,
      description: `${repo.name} is currently ${repo.healthScore ?? 0}/100 with ${repo.riskLevel || 'unknown'} risk, ${repo.highRiskNodes ?? 0} high-risk nodes, ${repo.missingDocs ?? 0} missing docs, ${repo.orphanCandidates ?? 0} orphan candidates, and ${repo.brokenRelationshipWarnings ?? 0} relationship warnings.`,
      source: 'engineering_graph',
      category: 'repo_health',
      severity: (repo.healthScore ?? 100) < 50 ? 'high' : 'medium',
      effort: 'large',
      owner: repo.owner || 'Unknown',
      featureArea: 'repo-health',
      repo: repo.name,
      relatedNodeIds: [],
      recommendedAction: 'Review the top missing-doc, orphan-review, broken-relationship, and high-risk tasks for this repo before planning code work.',
      approvalRequired: false,
      status: 'open',
      createdAt,
    }));
}

function nodeTask(node: EngineeringNode, category: EngineeringBacklogCategory, createdAt: string): EngineeringBacklogItem {
  const severity = severityForNode(node, category);
  return {
    id: stableId([category, node.id]),
    title: titleForNode(node, category),
    description: descriptionForNode(node, category),
    source: 'engineering_graph',
    category,
    severity,
    effort: effortForNode(node, category),
    owner: node.owner || 'Unknown',
    featureArea: node.featureArea || 'core-platform',
    repo: node.repo,
    nodeId: node.id,
    relatedNodeIds: [],
    recommendedAction: recommendedActionForNode(node, category),
    approvalRequired: false,
    status: 'open',
    createdAt,
  };
}

function warningTask(graph: EngineeringGraph, warning: string, createdAt: string): EngineeringBacklogItem {
  const repo = graph.repositories.find((candidate) => warning.includes(`${candidate.name}:`));
  const normalized = warning.replace(/^Relationship warning:\s*/, '');
  return {
    id: stableId(['broken_relationship', normalized]),
    title: titleForWarning(normalized),
    description: normalized,
    source: 'engineering_graph',
    category: 'broken_relationship',
    severity: severityForWarning(normalized),
    effort: 'medium',
    owner: repo?.owner || ownerFromWarning(normalized),
    featureArea: featureAreaFromText(normalized),
    repo: repo?.name || 'Unknown',
    relatedNodeIds: [],
    recommendedAction: 'Investigate the relationship source and target in the local graph. Do not change application code from this planning queue alone.',
    approvalRequired: false,
    status: 'open',
    createdAt,
  };
}

function titleForNode(node: EngineeringNode, category: EngineeringBacklogCategory): string {
  if (category === 'missing_doc') return `Document ${node.label}`;
  if (category === 'orphan_review') return `Review orphan candidate ${node.label}`;
  if (category === 'high_risk_node') return `Review high-risk node ${node.label}`;
  if (category === 'table') return `Review high-risk table ${node.label}`;
  if (category === 'function') return `Review high-risk function ${node.label}`;
  if (category === 'migration') return `Review high-risk migration ${node.label}`;
  if (category === 'route') return `Review high-risk route ${node.label}`;
  return `Review ${node.label}`;
}

function descriptionForNode(node: EngineeringNode, category: EngineeringBacklogCategory): string {
  if (category === 'missing_doc') return `${node.type} ${node.label} appears to be missing useful documentation.`;
  if (category === 'orphan_review') return `${node.type} ${node.label} is a review candidate only. Do not delete automatically.`;
  return `${node.type} ${node.label} has advisory risk signals: ${(node.riskSignals || []).join(', ') || 'none recorded'}.`;
}

function recommendedActionForNode(node: EngineeringNode, category: EngineeringBacklogCategory): string {
  if (category === 'missing_doc') return 'Plan a README, owner note, or nearby documentation page that explains purpose, ownership, dependencies, and safe operating boundaries.';
  if (category === 'orphan_review') return 'Review candidate only. Confirm usage manually before any cleanup proposal; do not delete automatically.';
  if (node.type === 'table') return 'Plan ownership and usage review for dependent screens, functions, migrations, and RLS policies.';
  if (node.type === 'supabase_function') return 'Plan function documentation and table access review before any implementation work.';
  if (node.type === 'migration') return 'Plan migration history review and verify related tables are documented.';
  return 'Review graph relationships, ownership, docs, and impact before proposing changes.';
}

function highRiskCategory(node: EngineeringNode): EngineeringBacklogCategory {
  if (node.type === 'table') return 'table';
  if (node.type === 'supabase_function') return 'function';
  if (node.type === 'migration') return 'migration';
  if (node.type === 'route' || node.type === 'screen') return 'route';
  return 'high_risk_node';
}

function severityForNode(node: EngineeringNode, category: EngineeringBacklogCategory): EngineeringBacklogSeverity {
  const text = `${node.label} ${node.path} ${(node.riskSignals || []).join(' ')}`.toLowerCase();
  if (/(auth|billing|payment|health|rls|organization_member|membership)/.test(text) && (category === 'missing_doc' || riskLevelForNode(node) === 'high')) return 'critical';
  if (riskLevelForNode(node) === 'high' || ['table', 'function', 'migration'].includes(category)) return 'high';
  if (category === 'missing_doc' || category === 'orphan_review') return 'medium';
  return 'low';
}

function effortForNode(node: EngineeringNode, category: EngineeringBacklogCategory): EngineeringBacklogEffort {
  if (category === 'missing_doc') return node.type === 'table' || node.type === 'supabase_function' ? 'medium' : 'small';
  if (category === 'orphan_review') return 'small';
  if (node.type === 'table' || node.type === 'supabase_function') return 'large';
  return 'medium';
}

function titleForWarning(warning: string): string {
  if (warning.includes('env variable')) return 'Investigate missing example env variable';
  if (warning.includes('function') && warning.includes('referenced')) return 'Investigate referenced Supabase function';
  if (warning.includes('created by migrations')) return 'Investigate migration-created table with no app reference';
  if (warning.includes('references missing file')) return 'Investigate missing indexed file relationship';
  return 'Investigate broken graph relationship';
}

function severityForWarning(warning: string): EngineeringBacklogSeverity {
  const text = warning.toLowerCase();
  if (/(auth|billing|payment|health|rls|service_role|token)/.test(text)) return 'critical';
  if (/(function|table|migration|env variable)/.test(text)) return 'high';
  return 'medium';
}

function ownerFromWarning(warning: string): string {
  if (/supabase|table|migration|function/i.test(warning)) return 'Backend / Supabase';
  if (/agent/i.test(warning)) return 'Agent Platform';
  return 'Unknown';
}

function featureAreaFromText(text: string): string {
  const value = text.toLowerCase();
  if (/(stripe|billing|subscription|payment|invoice|revenue)/.test(value)) return 'billing';
  if (/(sales|crm|lead|commission|attribution)/.test(value)) return 'sales-crm';
  if (/(member|membership|organization_member)/.test(value)) return 'memberships';
  if (/(gym|organization|class|attendance)/.test(value)) return 'gym-operations';
  if (/coach/.test(value)) return 'coach-platform';
  if (/(athlete|workout|training|nutrition|progress)/.test(value)) return 'athlete-experience';
  if (/migration/.test(value)) return 'migration';
  if (/(health|oura|whoop|apple-health)/.test(value)) return 'health-integrations';
  if (/(auth|rls|policy|permission|security)/.test(value)) return 'auth-security';
  return 'core-platform';
}

function dedupeItems(items: EngineeringBacklogItem[]): EngineeringBacklogItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()].sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity));
}

function severityWeight(severity: EngineeringBacklogSeverity): number {
  if (severity === 'critical') return 4;
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

function stableId(parts: string[]): string {
  return `eng-backlog-${parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140)}`;
}
