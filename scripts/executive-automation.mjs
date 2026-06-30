#!/usr/bin/env node
import {
  buildExecutiveAutomationStatus,
  getExecutiveAutomationReport,
  getExecutiveAutomationRules,
  getExecutiveAutomationSafetyCheck,
  runExecutiveAutomation,
  validateExecutiveAutomation,
} from './executive-automation-runtime.mjs';
import { parseArgs } from './agent-operator-runtime.mjs';

const [command = 'status', ...rest] = process.argv.slice(2);
const options = parseArgs(rest);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(buildExecutiveAutomationStatus(options));
    break;
  case 'run':
    outputJson(await runExecutiveAutomation(options));
    break;
  case 'rules':
    outputJson(getExecutiveAutomationRules());
    break;
  case 'report':
    outputJson(getExecutiveAutomationReport(options));
    break;
  case 'validate': {
    const result = validateExecutiveAutomation(options);
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  case 'safety-check': {
    const result = getExecutiveAutomationSafetyCheck(options);
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown Executive automation command: ${command}\n`);
    process.exitCode = 1;
}
