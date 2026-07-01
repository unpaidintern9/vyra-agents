#!/usr/bin/env node
import { parseArgs } from './agent-operator-runtime.mjs';
import {
  getExecutiveBriefing,
  getExecutiveHealth,
  getExecutiveKpis,
  getExecutiveOperations,
  getExecutiveOperationsReport,
  validateExecutiveOperations,
} from './executive-operations-runtime.mjs';

const [command = 'operations', ...args] = process.argv.slice(2);
const options = parseArgs(args);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'briefing':
    outputJson(getExecutiveBriefing(options));
    break;
  case 'kpis':
    outputJson(getExecutiveKpis(options));
    break;
  case 'operations':
    outputJson(getExecutiveOperations(options));
    break;
  case 'health':
    outputJson(getExecutiveHealth(options));
    break;
  case 'report':
    outputJson(getExecutiveOperationsReport(options));
    break;
  case 'validate': {
    const result = validateExecutiveOperations(options);
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown executive operations command: ${command}\n`);
    process.exitCode = 1;
}
