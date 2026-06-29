export type IntegrationHealth = 'healthy' | 'warning' | 'critical' | 'prepared';

export interface GitHubRepositoryStatus {
  repositoryName: string;
  remoteUrl: string;
  defaultBranch: string;
  latestCommit: string;
  openPullRequests: number;
  issueCount: number;
  workflowStatus: string;
  lastUpdated: string;
  healthStatus: IntegrationHealth;
}

