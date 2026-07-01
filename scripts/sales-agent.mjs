#!/usr/bin/env node
import {
  getSalesStatus,
  runSalesOutreach,
  runSalesReports,
  runSalesResearch,
  runSalesTasks,
  validateSalesExecution,
} from './sales-agent-runtime.mjs';

const command = process.argv[2] ?? 'status';

const commands = {
  status: getSalesStatus,
  research: runSalesResearch,
  reports: runSalesReports,
  outreach: runSalesOutreach,
  tasks: runSalesTasks,
  validate: validateSalesExecution,
};

if (!commands[command]) {
  console.error(`Unknown sales command: ${command}`);
  console.error(`Available commands: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

const result = commands[command]();
console.log(JSON.stringify(result, null, 2));

if (result?.status === 'fail') {
  process.exit(1);
}
