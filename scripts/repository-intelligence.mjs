#!/usr/bin/env node
import {
  buildRepositoryIntelligence,
  getRepositoryGraph,
  getRepositoryHealth,
  getRepositoryOwners,
  getRepositoryStatus,
  runRepositoryScan,
  validateRepositoryIntelligence,
  writeRepositoryReports,
} from './repository-intelligence-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'scan':
    outputJson(runRepositoryScan());
    break;
  case 'status':
    outputJson(getRepositoryStatus());
    break;
  case 'graph':
    outputJson(getRepositoryGraph());
    break;
  case 'health':
    outputJson(getRepositoryHealth());
    break;
  case 'owners':
    outputJson(getRepositoryOwners());
    break;
  case 'validate': {
    const result = validateRepositoryIntelligence();
    if (result.status === 'pass') writeRepositoryReports(buildRepositoryIntelligence());
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown repository intelligence command: ${command}\n`);
    process.exitCode = 1;
}
