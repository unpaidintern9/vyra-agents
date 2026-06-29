export type GitHubIssueCreationMode = 'dry-run' | 'live';
export type GitHubIssueCreationResultStatus = 'dry_run' | 'created' | 'duplicate_skipped' | 'blocked' | 'failed';

export interface GitHubIssueCreationConfig {
  dryRun: boolean;
  enabled: boolean;
  owner: string;
  token: string;
}

export interface GitHubIssueDraftPayload {
  bodyMarkdown: string;
  id: string;
  labels: string[];
  readyForGitHub: boolean;
  repo: string;
  title: string;
}

export interface GitHubIssueCreationResult {
  createdAt: string;
  draftId: string;
  dryRun: boolean;
  existingIssueUrl?: string;
  issueNumber?: number;
  issueUrl?: string;
  message: string;
  repo: string;
  status: GitHubIssueCreationResultStatus;
  title: string;
}

export type CreatedGitHubIssueRecord = GitHubIssueCreationResult;
