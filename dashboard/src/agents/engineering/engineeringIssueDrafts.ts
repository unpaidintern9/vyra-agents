import { buildIssueBodyMarkdown } from './engineeringIssueTemplates';
import type { EngineeringBacklogCategory, EngineeringBacklogItem, EngineeringBacklogSeverity } from './engineeringTaskTypes';
import type {
  EngineeringIssueCategory,
  EngineeringIssueDraft,
  EngineeringIssueDraftStatus,
  EngineeringIssueDraftSummary,
  EngineeringIssuePriority,
} from './engineeringIssueTypes';

export const engineeringIssueDraftStatusStorageKey = 'vyra-agents:engineering-issue-draft-status';

export function buildEngineeringIssueDrafts(
  backlogItems: EngineeringBacklogItem[],
  statusMap: Record<string, EngineeringIssueDraftStatus> = {},
): EngineeringIssueDraft[] {
  const grouped = new Map<string, EngineeringBacklogItem[]>();
  for (const item of backlogItems.filter((candidate) => candidate.status !== 'dismissed')) {
    const key = [
      item.repo,
      issueCategoryForBacklog(item.category),
      item.owner,
      item.featureArea,
      item.severity,
      nodeTypeBucket(item),
    ].join('|');
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }

  return [...grouped.entries()]
    .map(([key, items]) => buildDraft(key, items, statusMap))
    .sort((left, right) => priorityWeight(left.priority) - priorityWeight(right.priority) || right.sourceBacklogItemIds.length - left.sourceBacklogItemIds.length);
}

export function summarizeIssueDrafts(drafts: EngineeringIssueDraft[]): EngineeringIssueDraftSummary {
  return {
    approvalRequired: drafts.filter((draft) => draft.approvalRequired).length,
    exported: drafts.filter((draft) => draft.status === 'exported').length,
    p0: drafts.filter((draft) => draft.priority === 'P0').length,
    p1: drafts.filter((draft) => draft.priority === 'P1').length,
    p2: drafts.filter((draft) => draft.priority === 'P2').length,
    p3: drafts.filter((draft) => draft.priority === 'P3').length,
    readyForGitHub: drafts.filter((draft) => draft.readyForGitHub).length,
    total: drafts.length,
  };
}

export function draftCollectionMarkdown(drafts: EngineeringIssueDraft[], title: string): string {
  return `# ${title}

Generated: ${new Date().toISOString()}

${drafts.map((draft) => `# ${draft.title}\n\n${draft.bodyMarkdown}`).join('\n\n---\n\n')}`.trim() + '\n';
}

export function downloadIssueDraft(draft: EngineeringIssueDraft): void {
  downloadBlob(`${slug(draft.title)}.md`, draft.bodyMarkdown, 'text/markdown');
}

export function downloadIssueDraftCollection(drafts: EngineeringIssueDraft[], kind: 'all-json' | 'all-markdown' | 'ready-markdown' | 'p0-p1-markdown'): void {
  const date = new Date().toISOString().slice(0, 10);
  if (kind === 'all-json') {
    downloadBlob(`vyra-engineering-issue-drafts-${date}.json`, JSON.stringify(drafts, null, 2), 'application/json');
    return;
  }
  const filtered =
    kind === 'ready-markdown'
      ? drafts.filter((draft) => draft.readyForGitHub)
      : kind === 'p0-p1-markdown'
        ? drafts.filter((draft) => draft.priority === 'P0' || draft.priority === 'P1')
        : drafts;
  const filename =
    kind === 'ready-markdown'
      ? `vyra-engineering-ready-github-issues-${date}.md`
      : kind === 'p0-p1-markdown'
        ? `vyra-engineering-p0-p1-issues-${date}.md`
        : `vyra-engineering-issue-drafts-${date}.md`;
  downloadBlob(filename, draftCollectionMarkdown(filtered, titleForKind(kind)), 'text/markdown');
}

function buildDraft(key: string, items: EngineeringBacklogItem[], statusMap: Record<string, EngineeringIssueDraftStatus>): EngineeringIssueDraft {
  const [repo, category, owner, featureArea, severity] = key.split('|') as [string, EngineeringIssueCategory, string, string, EngineeringBacklogSeverity];
  const priority = priorityForItems(items);
  const draftWithoutBody = {
    id: stableId(['issue', key]),
    title: titleForDraft(repo, category, featureArea, items),
    repo,
    labels: labelsForDraft(category, priority, items),
    priority,
    severity,
    effort: effortForItems(items),
    owner,
    featureArea,
    sourceBacklogItemIds: items.map((item) => item.id),
    category,
    readyForGitHub: false,
    approvalRequired: true as const,
    status: 'draft' as EngineeringIssueDraftStatus,
    createdAt: items[0]?.createdAt || new Date().toISOString(),
  };
  const status = statusMap[draftWithoutBody.id] || draftWithoutBody.status;
  return {
    ...draftWithoutBody,
    status,
    readyForGitHub: status === 'ready',
    bodyMarkdown: buildIssueBodyMarkdown({ ...draftWithoutBody, status, readyForGitHub: status === 'ready' }, items),
  };
}

function titleForDraft(repo: string, category: EngineeringIssueCategory, featureArea: string, items: EngineeringBacklogItem[]): string {
  if (category === 'documentation') return `Document ${formatFeature(featureArea)} gaps in ${repo}`;
  if (category === 'cleanup') return `Review orphan candidates in ${formatFeature(featureArea)}`;
  if (category === 'investigation') return `Investigate ${formatFeature(featureArea)} relationship warnings`;
  if (category === 'repo-health') return `Improve ${repo} engineering health score`;
  const nodeType = nodeTypeBucket(items[0]);
  return `Review high-risk ${formatFeature(featureArea)} ${nodeType || 'nodes'}`;
}

function labelsForDraft(category: EngineeringIssueCategory, priority: EngineeringIssuePriority, items: EngineeringBacklogItem[]): string[] {
  const labels = ['engineering-agent', priority.toLowerCase(), category];
  if (items.some((item) => item.category === 'missing_doc')) labels.push('docs');
  if (items.some((item) => item.severity === 'critical' || item.severity === 'high')) labels.push('high-risk');
  return [...new Set(labels)];
}

function priorityForItems(items: EngineeringBacklogItem[]): EngineeringIssuePriority {
  const text = items.map((item) => `${item.title} ${item.description} ${item.recommendedAction}`).join(' ').toLowerCase();
  if (/(auth|billing|health|rls|organization membership|organization_member|payment|subscription|service role|secret|migration integrity)/.test(text)) return 'P0';
  if (items.some((item) => item.severity === 'critical')) return 'P0';
  if (items.some((item) => item.severity === 'high')) return 'P1';
  if (items.some((item) => item.severity === 'medium')) return 'P2';
  return 'P3';
}

function issueCategoryForBacklog(category: EngineeringBacklogCategory): EngineeringIssueCategory {
  if (category === 'missing_doc') return 'documentation';
  if (category === 'orphan_review') return 'cleanup';
  if (category === 'broken_relationship') return 'investigation';
  if (category === 'repo_health') return 'repo-health';
  return 'risk';
}

function effortForItems(items: EngineeringBacklogItem[]): EngineeringIssueDraft['effort'] {
  if (items.some((item) => item.effort === 'large')) return 'large';
  if (items.some((item) => item.effort === 'medium')) return 'medium';
  if (items.some((item) => item.effort === 'small')) return 'small';
  return 'unknown';
}

function nodeTypeBucket(item?: EngineeringBacklogItem): string {
  if (!item) return '';
  if (item.category === 'table') return 'tables';
  if (item.category === 'function') return 'functions';
  if (item.category === 'migration') return 'migrations';
  if (item.category === 'route') return 'routes';
  return item.category;
}

function titleForKind(kind: string): string {
  if (kind === 'ready-markdown') return 'Ready for GitHub Issue Drafts';
  if (kind === 'p0-p1-markdown') return 'P0/P1 Engineering Issue Drafts';
  return 'Engineering Issue Drafts';
}

function priorityWeight(priority: EngineeringIssuePriority): number {
  if (priority === 'P0') return 0;
  if (priority === 'P1') return 1;
  if (priority === 'P2') return 2;
  return 3;
}

function formatFeature(value: string): string {
  return value.replace(/[-_]/g, ' ');
}

function stableId(parts: string[]): string {
  return `eng-issue-${parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 150)}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'issue-draft';
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
