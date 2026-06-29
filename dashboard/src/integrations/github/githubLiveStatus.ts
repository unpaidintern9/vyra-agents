import { githubGet } from './githubClient';
import { defaultGitHubOwner, parseGitHubRepos } from './githubRepoConfig';
import { resolveGitHubTokenCandidatesForRepo } from './githubTokenResolver';
import type { GitHubRepositoryStatus, GitHubStatusResult } from './githubTypes';
import type { GitHubRepoConfig } from './githubRepoConfig';

interface GitHubRepoResponse {
  default_branch: string;
  html_url: string;
  name: string;
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    committer?: {
      date?: string;
    };
  };
}

interface GitHubSearchResponse {
  total_count: number;
}

interface GitHubWorkflowRunsResponse {
  workflow_runs?: Array<{
    conclusion: string | null;
    status: string;
  }>;
}

export async function getLiveGitHubStatus(): Promise<GitHubStatusResult> {
  const owner = defaultGitHubOwner();
  const repos = parseGitHubRepos(import.meta.env.VITE_GITHUB_REPOS, owner);
  const warnings: string[] = [];

  const repositories = await Promise.all(repos.map((repo) => readRepository(repo, warnings)));

  return {
    repositories,
    warnings,
    usedFallback: false,
    lastChecked: new Date().toISOString(),
  };
}

async function readRepository(
  repositoryConfig: GitHubRepoConfig,
  warnings: string[],
): Promise<GitHubRepositoryStatus> {
  const lastUpdated = new Date().toISOString();
  const { fullName, name: repositoryName, owner } = repositoryConfig;
  const tokenCandidates = resolveGitHubTokenCandidatesForRepo(repositoryConfig);
  const tokensToTry = tokenCandidates.length ? tokenCandidates : [undefined];
  let lastError: unknown;

  for (const token of tokensToTry) {
    try {
      const repo = await githubGet<GitHubRepoResponse>(`/repos/${owner}/${repositoryName}`, { token });
      const [commit, pulls, issues, runs] = await Promise.all([
        githubGet<GitHubCommitResponse>(`/repos/${owner}/${repositoryName}/commits/${repo.default_branch}`, { token }),
        githubGet<GitHubSearchResponse>(
          `/search/issues?q=repo:${owner}/${repositoryName}+type:pr+state:open&per_page=1`,
          { token },
        ),
        githubGet<GitHubSearchResponse>(
          `/search/issues?q=repo:${owner}/${repositoryName}+type:issue+state:open&per_page=1`,
          { token },
        ),
        githubGet<GitHubWorkflowRunsResponse>(`/repos/${owner}/${repositoryName}/actions/runs?per_page=1`, { token }).catch(
          () => ({ workflow_runs: [] }),
        ),
      ]);
      const latestRun = runs.workflow_runs?.[0];
      const workflowConclusion = latestRun?.conclusion || latestRun?.status || 'not available';
      const healthStatus = workflowConclusion === 'failure' ? 'warning' : 'healthy';

      return {
        repositoryFullName: fullName,
        repositoryName: repo.name,
        repositoryOwner: owner,
        remoteUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        latestCommit: commit.sha,
        latestCommitMessage: firstLine(commit.commit.message),
        latestCommitDate: commit.commit.committer?.date || 'unknown',
        openPullRequests: pulls.total_count,
        issueCount: issues.total_count,
        workflowStatus: workflowConclusion,
        workflowConclusion,
        lastUpdated,
        healthStatus,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'Unknown GitHub read failure';
  warnings.push(`${fullName}: ${tokenCandidates.length ? message : 'GitHub token missing or repo is not publicly accessible.'}`);

  return {
    repositoryFullName: fullName,
    repositoryName,
    repositoryOwner: owner,
    remoteUrl: `https://github.com/${owner}/${repositoryName}`,
    defaultBranch: 'unknown',
    latestCommit: 'unknown',
    latestCommitMessage: 'Repository could not be read.',
    latestCommitDate: 'unknown',
    openPullRequests: 0,
    issueCount: 0,
    workflowStatus: 'not accessible',
    workflowConclusion: 'unknown',
    lastUpdated,
    healthStatus: 'warning',
    warning: message,
  };
}

function firstLine(value: string): string {
  return value.split('\n')[0] || 'No commit message';
}
