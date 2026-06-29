export type IntegrationHealth = 'healthy' | 'warning' | 'critical' | 'prepared' | 'unknown';

export interface GitHubRepositoryStatus {
  repositoryFullName?: string;
  repositoryName: string;
  repositoryOwner?: string;
  remoteUrl: string;
  defaultBranch: string;
  latestCommit: string;
  latestCommitMessage: string;
  latestCommitDate: string;
  openPullRequests: number;
  issueCount: number;
  workflowStatus: string;
  workflowConclusion: string;
  lastUpdated: string;
  healthStatus: IntegrationHealth;
  warning?: string;
}

export interface GitHubStatusResult {
  repositories: GitHubRepositoryStatus[];
  warnings: string[];
  usedFallback: boolean;
  lastChecked: string;
}
