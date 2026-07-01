#!/usr/bin/env node
import {
  buildProjectRegistry,
  getProjectHealth,
  getProjectReport,
  getProjectStatus,
  listProjects,
  scanProjects,
  validateProjectRegistry,
} from './project-registry-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(getProjectStatus());
    break;
  case 'list':
    outputJson(listProjects());
    break;
  case 'scan':
    outputJson(scanProjects());
    break;
  case 'health':
    outputJson(getProjectHealth());
    break;
  case 'report':
    outputJson(getProjectReport());
    break;
  case 'validate': {
    const result = validateProjectRegistry();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown projects command: ${command}\n`);
    process.exitCode = 1;
}
