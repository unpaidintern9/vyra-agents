import type { GitHubRepoConfig } from './githubRepoConfig';

const vyraPart1FullName = 'Matthewalbin1/Vyra-Part-1';

export interface GitHubTokenResolution {
  token?: string;
  tokenLabel: 'default' | 'vyra-part-1';
  tokenStatus: 'configured' | 'missing' | 'fallback-default';
}

export interface GitHubTokenConfigurationStatus {
  defaultToken: 'configured' | 'missing';
  vyraPart1Token: 'configured' | 'missing';
}

export function resolveGitHubTokenForRepo(repo: GitHubRepoConfig): GitHubTokenResolution {
  const defaultToken = import.meta.env.VITE_GITHUB_TOKEN || undefined;
  const vyraPart1Token = import.meta.env.VITE_GITHUB_TOKEN_VYRA_PART_1 || undefined;

  if (repo.fullName === vyraPart1FullName) {
    if (vyraPart1Token) {
      return {
        token: vyraPart1Token,
        tokenLabel: 'vyra-part-1',
        tokenStatus: 'configured',
      };
    }

    return {
      token: defaultToken,
      tokenLabel: 'default',
      tokenStatus: defaultToken ? 'fallback-default' : 'missing',
    };
  }

  return {
    token: defaultToken,
    tokenLabel: 'default',
    tokenStatus: defaultToken ? 'configured' : 'missing',
  };
}

export function resolveGitHubTokenCandidatesForRepo(repo: GitHubRepoConfig): string[] {
  const defaultToken = import.meta.env.VITE_GITHUB_TOKEN || undefined;
  const vyraPart1Token = import.meta.env.VITE_GITHUB_TOKEN_VYRA_PART_1 || undefined;

  if (repo.fullName !== vyraPart1FullName) {
    return defaultToken ? [defaultToken] : [];
  }

  return [vyraPart1Token, defaultToken].filter((token, index, tokens): token is string => Boolean(token) && tokens.indexOf(token) === index);
}

export function gitHubTokenConfigurationStatus(): GitHubTokenConfigurationStatus {
  return {
    defaultToken: import.meta.env.VITE_GITHUB_TOKEN ? 'configured' : 'missing',
    vyraPart1Token: import.meta.env.VITE_GITHUB_TOKEN_VYRA_PART_1 ? 'configured' : 'missing',
  };
}

export function hasGitHubTokenForRepo(repo: GitHubRepoConfig): boolean {
  return Boolean(resolveGitHubTokenForRepo(repo).token);
}
