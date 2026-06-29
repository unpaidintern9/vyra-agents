import { githubRepositoryStatuses } from './githubMockData';
import type { GitHubRepositoryStatus, IntegrationHealth } from './githubTypes';

export function getGitHubRepositoryStatuses(): GitHubRepositoryStatus[] {
  return githubRepositoryStatuses;
}

export function getGitHubHealthStatus(): IntegrationHealth {
  if (githubRepositoryStatuses.some((repository) => repository.healthStatus === 'critical')) {
    return 'critical';
  }

  if (githubRepositoryStatuses.some((repository) => repository.healthStatus === 'warning')) {
    return 'warning';
  }

  return 'healthy';
}

