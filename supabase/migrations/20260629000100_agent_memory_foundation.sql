-- Vyra Agents Phase 2 agent memory foundation.
-- Foundation stub only. Do not run against production until reviewed.

create extension if not exists pgcrypto;

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  workflow_key text,
  status text not null default 'queued',
  source text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_events (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  run_id uuid references agent_runs(id),
  event_type text not null,
  status text not null default 'recorded',
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'normal',
  source text,
  metadata jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_status (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  status text not null,
  summary text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  memory_type text not null,
  title text not null,
  body text,
  status text not null default 'active',
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  run_id uuid references agent_runs(id),
  level text not null default 'info',
  message text not null,
  status text not null default 'recorded',
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_approvals (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  action_key text not null,
  risk_level text not null default 'medium',
  status text not null default 'pending',
  source text,
  requested_by text,
  approved_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists agent_workflows (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null,
  workflow_key text not null unique,
  status text not null default 'draft',
  source text,
  metadata jsonb not null default '{}'::jsonb,
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_integrations (
  id uuid primary key default gen_random_uuid(),
  integration_key text not null unique,
  agent_key text,
  status text not null default 'planned',
  source text,
  mode text not null default 'read_only',
  metadata jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agent_runs enable row level security;
alter table agent_events enable row level security;
alter table agent_tasks enable row level security;
alter table agent_status enable row level security;
alter table agent_memory enable row level security;
alter table agent_logs enable row level security;
alter table agent_approvals enable row level security;
alter table agent_workflows enable row level security;
alter table agent_integrations enable row level security;

create index if not exists idx_agent_runs_agent_status on agent_runs (agent_key, status);
create index if not exists idx_agent_runs_workflow on agent_runs (workflow_key);
create index if not exists idx_agent_events_agent_created on agent_events (agent_key, created_at desc);
create index if not exists idx_agent_events_run on agent_events (run_id);
create index if not exists idx_agent_tasks_agent_status on agent_tasks (agent_key, status);
create index if not exists idx_agent_status_agent_key on agent_status (agent_key);
create index if not exists idx_agent_memory_agent_type on agent_memory (agent_key, memory_type);
create index if not exists idx_agent_logs_agent_created on agent_logs (agent_key, created_at desc);
create index if not exists idx_agent_logs_run on agent_logs (run_id);
create index if not exists idx_agent_approvals_agent_status on agent_approvals (agent_key, status);
create index if not exists idx_agent_workflows_agent_status on agent_workflows (agent_key, status);
create index if not exists idx_agent_integrations_status on agent_integrations (status);
