export type EngineeringBacklogCategory =
  | 'missing_doc'
  | 'orphan_review'
  | 'broken_relationship'
  | 'high_risk_node'
  | 'repo_health'
  | 'dependency'
  | 'migration'
  | 'table'
  | 'function'
  | 'route';

export type EngineeringBacklogSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EngineeringBacklogEffort = 'small' | 'medium' | 'large' | 'unknown';
export type EngineeringBacklogStatus = 'open' | 'reviewed' | 'dismissed' | 'planned' | 'done';

export interface EngineeringBacklogItem {
  id: string;
  title: string;
  description: string;
  source: 'engineering_graph';
  category: EngineeringBacklogCategory;
  severity: EngineeringBacklogSeverity;
  effort: EngineeringBacklogEffort;
  owner: string;
  featureArea: string;
  repo: string;
  nodeId?: string;
  relatedNodeIds: string[];
  recommendedAction: string;
  approvalRequired: false;
  status: EngineeringBacklogStatus;
  createdAt: string;
}

export interface EngineeringBacklogSummary {
  brokenRelationships: number;
  critical: number;
  high: number;
  low: number;
  medium: number;
  missingDocs: number;
  orphanReviews: number;
  repoHealthTasks: number;
  total: number;
}
