#!/usr/bin/env node
import {
  buildAnalyticsReports,
  getAnalyticsOverview,
  getBottlenecks,
  getCompanyHealth,
  getInsights,
  getRisks,
  getScorecards,
  getTrends,
  validateAnalytics,
} from './analytics-insights-runtime.mjs';

const command = process.argv[2] ?? 'overview';
const commands = {
  overview: getAnalyticsOverview,
  'company-health': getCompanyHealth,
  scorecards: getScorecards,
  insights: getInsights,
  risks: getRisks,
  bottlenecks: getBottlenecks,
  trends: getTrends,
  report: buildAnalyticsReports,
  validate: validateAnalytics,
};

if (!commands[command]) {
  process.stderr.write(`Unknown analytics command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command]();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
