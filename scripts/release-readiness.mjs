#!/usr/bin/env node
import {
  getReleaseBlockers,
  getReleaseReadiness,
  getReleaseReport,
  getReleaseStatus,
  scanReleaseReadiness,
  validateReleaseReadiness,
} from './release-readiness-runtime.mjs';
import {
  approveShipPlan,
  createShipPlan,
  getShipPlanReport,
  listShipPlans,
  rejectShipPlan,
  reviewShipPlan,
  validateShipPlans,
} from './release-ship-plan-runtime.mjs';

const [command = 'status', ...args] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

const options = parseOptions(args);

switch (command) {
  case 'status':
    outputJson(getReleaseStatus());
    break;
  case 'scan':
    outputJson(scanReleaseReadiness());
    break;
  case 'readiness':
    outputJson(getReleaseReadiness());
    break;
  case 'blockers':
    outputJson(getReleaseBlockers());
    break;
  case 'report':
    outputJson(getReleaseReport());
    break;
  case 'validate': {
    const result = validateReleaseReadiness();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  case 'ship-plans':
    outputJson(listShipPlans(options));
    break;
  case 'create-ship-plan':
    outputJson(createShipPlan(options));
    break;
  case 'review-ship-plan':
    outputJson(reviewShipPlan(options));
    break;
  case 'approve-ship-plan':
    outputJson(approveShipPlan(options));
    break;
  case 'reject-ship-plan':
    outputJson(rejectShipPlan(options));
    break;
  case 'ship-plan-report':
    outputJson(getShipPlanReport(options));
    break;
  case 'ship-plan-validate': {
    const result = validateShipPlans();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown release command: ${command}\n`);
    process.exitCode = 1;
}

function parseOptions(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}
