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

