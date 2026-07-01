#!/usr/bin/env node
import {
  getSalesStatus,
  archiveSalesOpportunity,
  buildSalesFollowupPlans,
  buildSalesOpportunityDashboard,
  createSalesOpportunity,
  getProposalStatus,
  getSalesOpportunityTimeline,
  listSalesOpportunities,
  mergeSalesOpportunities,
  moveSalesOpportunityStage,
  restoreSalesOpportunity,
  runSalesOutreach,
  runSalesReports,
  runSalesResearch,
  runSalesTasks,
  scoreSalesOpportunities,
  updateSalesOpportunity,
  validateSalesExecution,
  validateSalesReports,
} from './sales-agent-runtime.mjs';

const command = process.argv[2] ?? 'status';

const commands = {
  status: getSalesStatus,
  research: runSalesResearch,
  reports: runSalesReports,
  outreach: runSalesOutreach,
  tasks: runSalesTasks,
  opportunities: listSalesOpportunities,
  'create-opportunity': createSalesOpportunity,
  'update-opportunity': updateSalesOpportunity,
  'move-stage': moveSalesOpportunityStage,
  timeline: getSalesOpportunityTimeline,
  score: scoreSalesOpportunities,
  followup: buildSalesFollowupPlans,
  'proposal-status': getProposalStatus,
  archive: archiveSalesOpportunity,
  restore: restoreSalesOpportunity,
  merge: mergeSalesOpportunities,
  dashboard: buildSalesOpportunityDashboard,
  'reports-validate': validateSalesReports,
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
