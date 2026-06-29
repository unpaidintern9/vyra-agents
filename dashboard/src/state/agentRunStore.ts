export interface AgentRun {
  id: string;
  agent: string;
  workflow: string;
  status: 'completed' | 'queued' | 'failed';
  startedAt: string;
  completedAt: string;
  summary: object;
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  agent: string;
  event: string;
  detail: string;
}

export interface AgentTask {
  id: string;
  agent: string;
  title: string;
  status: 'open' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface AgentNote {
  id: string;
  agent: string;
  note: string;
  createdAt: string;
}

export function createInitialAgentRuns(): AgentRun[] {
  return [
    {
      id: 'run_seed_migration',
      agent: 'Migration Agent',
      workflow: 'migration-validation-dry-run',
      status: 'completed',
      startedAt: '2026-06-28T21:40:00-04:00',
      completedAt: '2026-06-28T21:40:08-04:00',
      summary: {
        totalImported: 8,
        ready: 6,
        warnings: 15,
        errors: 3,
        existingUserMatches: 3,
        pendingProfiles: 3,
        offlineMembers: 2,
        activeAppUsers: 1,
        needsGymReview: 8,
        readyForReview: 75,
      },
    },
  ];
}

export function createInitialAgentEvents(): AgentEvent[] {
  return [
    {
      id: 'evt_seed_refresh',
      timestamp: '2026-06-28T21:55:00-04:00',
      agent: 'Operations Agent',
      event: 'integration-status-refreshed',
      detail: 'Read-only integration registry refreshed in mock mode.',
    },
    {
      id: 'evt_seed_tables',
      timestamp: '2026-06-28T22:02:00-04:00',
      agent: 'Migration Agent',
      event: 'table-readiness-checked',
      detail: 'Agent and gym migration table readiness displayed locally.',
    },
  ];
}

export function createInitialAgentTasks(): AgentTask[] {
  return [
    {
      id: 'task_github_live',
      agent: 'Engineering Agent',
      title: 'Confirm GitHub live read-only credentials',
      status: 'open',
      priority: 'medium',
    },
    {
      id: 'task_supabase_rls',
      agent: 'Operations Agent',
      title: 'Review Supabase protected table status before exposing reads',
      status: 'open',
      priority: 'high',
    },
  ];
}

export function createInitialAgentNotes(): AgentNote[] {
  return [
    {
      id: 'note_memory_boundary',
      agent: 'Executive Agent',
      note: 'Agent memory tables exist in Supabase, but Phase 5 dashboard actions remain local/mock only.',
      createdAt: '2026-06-28T22:05:00-04:00',
    },
  ];
}
