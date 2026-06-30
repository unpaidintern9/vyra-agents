#!/usr/bin/env node
import {
  getGitHubBranches,
  getGitHubCommits,
  getGitHubIssues,
  getGitHubPullRequests,
  getGitHubRepo,
  getGitHubRepoStatusReport,
  getGitHubSafetyCheck,
  getGitHubStatus,
  validateGitHubReadOnlyConnector,
} from './github-readonly-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(await getGitHubStatus());
    break;
  case 'repo':
    outputJson(await getGitHubRepoStatusReport());
    break;
  case 'branches':
    outputJson(await getGitHubBranches());
    break;
  case 'commits':
    outputJson(await getGitHubCommits());
    break;
  case 'issues':
    outputJson(await getGitHubIssues());
    break;
  case 'prs':
    outputJson(await getGitHubPullRequests());
    break;
  case 'safety-check': {
    const result = getGitHubSafetyCheck();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  case 'validate': {
    const result = await validateGitHubReadOnlyConnector();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown GitHub read-only command: ${command}\n`);
    process.exitCode = 1;
}
