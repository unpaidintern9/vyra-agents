#!/usr/bin/env node
import {
  buildEngineeringTaskCandidateSet,
  generateEngineeringTaskCandidates,
  getEngineeringTaskReport,
  listEngineeringTaskCandidates,
  validateEngineeringTaskGenerator,
  writeEngineeringTaskReports,
} from './engineering-task-generator-runtime.mjs';

const [command = 'tasks'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'tasks':
    outputJson(listEngineeringTaskCandidates());
    break;
  case 'generate-tasks':
    outputJson(generateEngineeringTaskCandidates());
    break;
  case 'task-report':
    outputJson(getEngineeringTaskReport());
    break;
  case 'validate': {
    const result = validateEngineeringTaskGenerator();
    if (result.status === 'pass') writeEngineeringTaskReports(buildEngineeringTaskCandidateSet());
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown engineering task command: ${command}\n`);
    process.exitCode = 1;
}
