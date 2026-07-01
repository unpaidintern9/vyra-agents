#!/usr/bin/env node
import {
  buildSuccessReports,
  createCustomer,
  getCustomers,
  getExpansion,
  getHealth,
  getMilestones,
  getOnboarding,
  getRenewals,
  getSupport,
  getTemplates,
  validateSuccess,
} from './customer-success-runtime.mjs';

const command = process.argv[2] ?? 'customers';

const commands = {
  customers: getCustomers,
  'create-customer': createCustomer,
  onboarding: getOnboarding,
  templates: getTemplates,
  milestones: getMilestones,
  health: getHealth,
  support: getSupport,
  renewals: getRenewals,
  expansion: getExpansion,
  report: buildSuccessReports,
  validate: validateSuccess,
};

if (!commands[command]) {
  process.stderr.write(`Unknown customer success command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command]();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
