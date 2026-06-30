#!/usr/bin/env node
import {
  archiveGitHubPlan,
  buildGitHubPlanningStatus,
  createGitHubPlan,
  getGitHubPlanningReport,
  reviewGitHubPlan,
  validateGitHubPlanningLayer,
} from './github-planning-runtime.mjs';

const [command = 'plans', ...rest] = process.argv.slice(2);
const options = parseArgs(rest);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'plans':
    outputJson(buildGitHubPlanningStatus());
    break;
  case 'create-plan':
    outputJson(createGitHubPlan(options));
    break;
  case 'review-plan':
    outputJson(reviewGitHubPlan(options));
    break;
  case 'archive-plan':
    outputJson(archiveGitHubPlan(options));
    break;
  case 'plan-report':
    outputJson(getGitHubPlanningReport());
    break;
  case 'planning-validate': {
    const result = validateGitHubPlanningLayer();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown GitHub planning command: ${command}\n`);
    process.exitCode = 1;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    const [rawKey, inlineValue] = value.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}
