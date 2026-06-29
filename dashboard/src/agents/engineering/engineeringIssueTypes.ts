import type { EngineeringBacklogEffort, EngineeringBacklogSeverity } from './engineeringTaskTypes';

export type EngineeringIssuePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type EngineeringIssueCategory = 'documentation' | 'cleanup' | 'investigation' | 'risk' | 'repo-health';
export type EngineeringIssueDraftStatus = 'draft' | 'ready' | 'dismissed' | 'exported' | 'created_later' | 'duplicate_skipped';

export interface EngineeringIssueDraft {
  id: string;
  title: string;
  bodyMarkdown: string;
  repo: string;
  labels: string[];
  priority: EngineeringIssuePriority;
  severity: EngineeringBacklogSeverity;
  effort: EngineeringBacklogEffort;
  owner: string;
  featureArea: string;
  sourceBacklogItemIds: string[];
  category: EngineeringIssueCategory;
  readyForGitHub: boolean;
  approvalRequired: true;
  status: EngineeringIssueDraftStatus;
  createdAt: string;
}

export interface EngineeringIssueDraftSummary {
  approvalRequired: number;
  exported: number;
  p0: number;
  p1: number;
  p2: number;
  p3: number;
  readyForGitHub: number;
  total: number;
}
