import type { FollowUpQueueItem, LeadScore, ProposalPrep, SalesActivity, SalesLead } from './salesTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildSalesFollowUpQueue(
  leads: SalesLead[],
  proposals: ProposalPrep[],
  activities: SalesActivity[],
  scores: LeadScore[],
  now = new Date(),
): FollowUpQueueItem[] {
  const items = leads.flatMap((lead) => {
    const score = scores.find((item) => item.leadId === lead.id);
    if (!score || lead.status === 'lost' || lead.status === 'won') return [];
    const proposal = proposals.find((item) => item.leadId === lead.id);
    const leadItems: FollowUpQueueItem[] = [];
    const followUpDelta = lead.nextFollowUpDate ? daysBetween(new Date(lead.nextFollowUpDate), now) : null;

    if (followUpDelta !== null && followUpDelta > 0) {
      leadItems.push(queueItem(lead, score, 'overdue', `${followUpDelta} day(s) overdue`, lead.nextAction));
    } else if (followUpDelta === 0) {
      leadItems.push(queueItem(lead, score, 'today', 'Follow-up is due today', lead.nextAction));
    }

    if (lead.pipelineStage === 'proposal_needed' || proposal?.status === 'needed') {
      leadItems.push(queueItem(lead, score, 'proposal_needed', 'Proposal prep is needed', 'Prepare proposal notes locally; no email or invoice is sent.'));
    }

    if (score.stalled) {
      const lastActivityAge = daysSince(latestActivityAt(lead, activities), now);
      leadItems.push(queueItem(lead, score, 'stalled', `Stage has been quiet for ${lastActivityAge} day(s)`, 'Review and choose a local next step.'));
    }

    if (score.missingInfo.length > 0) {
      leadItems.push(queueItem(lead, score, 'missing_info', `Missing ${score.missingInfo.join(', ')}`, `Collect ${score.missingInfo.join(', ')} locally.`));
    }

    return leadItems;
  });

  return items.sort((a, b) => priorityRank(a) - priorityRank(b) || b.score - a.score || (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
}

function queueItem(
  lead: SalesLead,
  score: LeadScore,
  queue: FollowUpQueueItem['queue'],
  reason: string,
  nextAction: string,
): FollowUpQueueItem {
  return {
    dueDate: lead.nextFollowUpDate,
    leadId: lead.id,
    leadName: lead.name,
    nextAction,
    priorityLabel: score.priorityLabel,
    queue,
    reason,
    score: score.score,
  };
}

function priorityRank(item: FollowUpQueueItem): number {
  const queueRank: Record<FollowUpQueueItem['queue'], number> = {
    overdue: 0,
    today: 1,
    proposal_needed: 2,
    stalled: 3,
    missing_info: 4,
  };
  const priorityRank: Record<FollowUpQueueItem['priorityLabel'], number> = {
    Hot: 0,
    Warm: 1,
    'At Risk': 2,
    'Needs Info': 3,
    Nurture: 4,
  };
  return queueRank[item.queue] * 10 + priorityRank[item.priorityLabel];
}

function latestActivityAt(lead: SalesLead, activities: SalesActivity[]): Date {
  const timestamps = activities.filter((activity) => activity.leadId === lead.id).map((activity) => new Date(activity.timestamp).getTime());
  timestamps.push(new Date(lead.updatedAt).getTime());
  return new Date(Math.max(...timestamps.filter((timestamp) => !Number.isNaN(timestamp))));
}

function daysSince(date: Date, now: Date): number {
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS));
}

function daysBetween(date: Date, now: Date): number {
  return Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
