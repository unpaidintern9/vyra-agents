import type { ExecutiveOperationsDashboardSummary } from './executiveOperations';
import type { GmailEmailDashboardSummary, GmailEmailRecipient } from './gmailEmail';

export interface ExecutiveEmailBriefingAttempt {
  auditId: string | null;
  briefingDate: string;
  draftId: string | null;
  executiveScore: number;
  recipient: string;
  recipientName: 'Robert' | 'Matthew';
  recipientStatus: GmailEmailRecipient['status'];
  sendStatus: 'ready_for_send' | 'sent' | 'failed' | 'skipped';
  skipReason: string | null;
  subject: string;
}

export interface ExecutiveEmailBriefingSummary {
  automationStatus: string;
  briefingDate: string;
  commands: string[];
  failedOrSkippedAttempts: ExecutiveEmailBriefingAttempt[];
  lastBriefingSentOrSkipped: string;
  nextScheduledBriefing: string;
  previewBody: string;
  previewSubject: string;
  recipientReadiness: ExecutiveEmailBriefingAttempt[];
  reports: string[];
  safetyStatus: string;
  scheduleTemplate: string;
}

export const executiveEmailBriefingCommands = [
  'npm run executive:email-briefing',
  'npm run executive:email-preview',
  'npm run executive:email-send',
  'npm run executive:email-status',
  'npm run executive:email-validate',
];

export function buildDashboardExecutiveEmailBriefingSummary(input: {
  email: GmailEmailDashboardSummary;
  executiveOperations: ExecutiveOperationsDashboardSummary;
}): ExecutiveEmailBriefingSummary {
  const briefingDate = input.executiveOperations.briefing.date;
  const previewSubject = `Vyra Executive Briefing - ${briefingDate}`;
  const recipientReadiness = input.email.internalRecipients.map<ExecutiveEmailBriefingAttempt>((recipient) => {
    const ready = recipient.name === 'Robert' || recipient.status === 'ready';
    const sendStatus = ready && recipient.status === 'ready' ? 'ready_for_send' : 'skipped';
    return {
      auditId: input.email.latestEmailAuditActions.find((entry) => entry.recipientName === recipient.name)?.draftId ?? null,
      briefingDate,
      draftId: null,
      executiveScore: input.executiveOperations.overallExecutiveScore,
      recipient: recipient.email || recipient.name,
      recipientName: recipient.name,
      recipientStatus: recipient.status,
      sendStatus,
      skipReason: sendStatus === 'skipped' ? `${recipient.name} is ${recipient.status}; no send will be attempted until configured.` : null,
      subject: previewSubject,
    };
  });

  return {
    automationStatus: input.email.automationStatus,
    briefingDate,
    commands: executiveEmailBriefingCommands,
    failedOrSkippedAttempts: recipientReadiness.filter((attempt) => attempt.sendStatus === 'failed' || attempt.sendStatus === 'skipped'),
    lastBriefingSentOrSkipped: input.email.latestEmailAuditActions[0]?.timestamp ?? 'none',
    nextScheduledBriefing: 'Next local email briefing: tomorrow 8:00 AM America/New_York',
    previewBody: renderPreviewBody(input.executiveOperations),
    previewSubject,
    recipientReadiness,
    reports: ['Daily Briefing Email Preview Markdown', 'Daily Briefing Email JSON', 'Daily Briefing Send Audit Markdown'],
    safetyStatus: 'internal-only / no bulk / Gmail audit required',
    scheduleTemplate: 'codex-agent-threads/shared/schedules/executive-daily-email-briefing.schedule.example.json',
  };
}

function renderPreviewBody(operations: ExecutiveOperationsDashboardSummary) {
  return [
    `Executive score: ${operations.overallExecutiveScore}/100`,
    `Top priority: ${operations.briefing.todaysPriorities[0] ?? 'No priority recorded.'}`,
    `Blocked work: ${operations.briefing.blockedWork[0] ?? 'No blocked work recorded.'}`,
    `Engineering health: ${operations.engineeringHealth}`,
    `Sales health: ${operations.salesHealth}`,
    `Release readiness: ${operations.briefing.releaseReadinessSummary.releaseHealth}`,
    `Pending approvals: ${Object.values(operations.briefing.pendingApprovals).reduce((sum, value) => sum + value, 0)}`,
    `Recommended action: ${operations.briefing.recommendedNextActions[0] ?? 'No action recorded.'}`,
  ].join('\n');
}
