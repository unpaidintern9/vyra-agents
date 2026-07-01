#!/usr/bin/env node
import {
  buildFinanceReports,
  getArr,
  getExpansion,
  getFinanceOverview,
  getForecast,
  getMrr,
  getPricing,
  getRenewals,
  getRevenue,
  getSubscriptions,
  validateFinance,
} from './finance-runtime.mjs';

const command = process.argv[2] ?? 'overview';
const commands = {
  overview: getFinanceOverview,
  revenue: getRevenue,
  mrr: getMrr,
  arr: getArr,
  forecast: getForecast,
  pricing: getPricing,
  subscriptions: getSubscriptions,
  renewals: getRenewals,
  expansion: getExpansion,
  report: buildFinanceReports,
  validate: validateFinance,
};

if (!commands[command]) {
  process.stderr.write(`Unknown finance command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command]();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
