#!/usr/bin/env node
import {
  buildMarketingBrandReport,
  buildMarketingCampaignReport,
  buildMarketingContentReport,
  buildContentStudioReport,
  buildMarketingDraftReport,
  approveMarketingDraft,
  archiveMarketingDraft,
  createMarketingDraft,
  getMarketingBrandCheck,
  getMarketingDrafts,
  getMarketingAudiences,
  getMarketingBrand,
  getMarketingCalendar,
  getMarketingCampaigns,
  getMarketingContent,
  getMarketingProducts,
  rejectMarketingDraft,
  submitMarketingDraft,
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
  drafts: getMarketingDrafts,
  'create-draft': createMarketingDraft,
  'brand-check': getMarketingBrandCheck,
  'submit-draft': submitMarketingDraft,
  'approve-draft': approveMarketingDraft,
  'reject-draft': rejectMarketingDraft,
  'archive-draft': archiveMarketingDraft,
  'content-studio-report': buildContentStudioReport,
  'draft-report': buildMarketingDraftReport,
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
