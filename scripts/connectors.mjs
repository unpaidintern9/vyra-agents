#!/usr/bin/env node
import {
  buildConnectorReadinessStatus,
  getConnectorApprovalMappingReport,
  getConnectorReadinessReport,
  getConnectorSafetyCheck,
  validateConnectorReadiness,
} from './connector-readiness-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(buildConnectorReadinessStatus());
    break;
  case 'readiness':
    outputJson(getConnectorReadinessReport());
    break;
  case 'approval-map':
    outputJson(getConnectorApprovalMappingReport());
    break;
  case 'safety-check': {
    const result = getConnectorSafetyCheck();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  case 'validate': {
    const result = validateConnectorReadiness();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown connector command: ${command}\n`);
    process.exitCode = 1;
}
