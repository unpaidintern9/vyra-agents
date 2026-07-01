#!/usr/bin/env node
import {
  buildMarketingBrandReport,
  buildMarketingCampaignReport,
  buildMarketingContentReport,
  getMarketingAudiences,
  getMarketingBrand,
  getMarketingCalendar,
  getMarketingCampaigns,
  getMarketingContent,
  getMarketingProducts,
  validateMarketing,
} from './marketing-agent-runtime.mjs';

const command = process.argv[2] ?? 'brand';

const commands = {
  brand: getMarketingBrand,
  products: getMarketingProducts,
  audiences: getMarketingAudiences,
  content: getMarketingContent,
  campaigns: getMarketingCampaigns,
  calendar: getMarketingCalendar,
  'brand-report': buildMarketingBrandReport,
  'campaign-report': buildMarketingCampaignReport,
  'content-report': buildMarketingContentReport,
  validate: validateMarketing,
};

if (!commands[command]) {
  process.stderr.write(`Unknown marketing command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command]();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
