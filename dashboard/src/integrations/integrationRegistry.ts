import { getGitHubHealthStatus } from './github/githubStatus';
import { getSupabaseProjectStatus } from './supabase/supabaseStatus';

export interface IntegrationRegistryItem {
  name: string;
  category: string;
  status: string;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'prepared' | 'planned';
  detail: string;
}

const supabaseStatus = getSupabaseProjectStatus();

export const integrationRegistry: IntegrationRegistryItem[] = [
  {
    name: 'GitHub',
    category: 'Source Control',
    status: 'Mock read-only foundation',
    healthStatus: getGitHubHealthStatus(),
    detail: 'Repository status shape prepared; no GitHub API calls yet.',
  },
  {
    name: 'Supabase',
    category: 'Backend',
    status: 'Mock read-only foundation',
    healthStatus: supabaseStatus.healthStatus,
    detail: 'Migration table readiness modeled; dashboard does not query production yet.',
  },
  {
    name: 'Stripe',
    category: 'Billing',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Billing checks remain future read-only work.',
  },
  {
    name: 'Apple App Store',
    category: 'Distribution',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Release and subscription status checks planned.',
  },
  {
    name: 'Google Play',
    category: 'Distribution',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Release status checks planned.',
  },
  {
    name: 'SendGrid',
    category: 'Messaging',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Email delivery checks planned.',
  },
  {
    name: 'Slack',
    category: 'Operations',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Internal alert routing planned.',
  },
  {
    name: 'Discord',
    category: 'Community',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Community/support signal checks planned.',
  },
  {
    name: 'Sentry',
    category: 'Observability',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Error health checks planned.',
  },
  {
    name: 'Apple Health',
    category: 'Health Data',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Member-facing integration checks planned.',
  },
  {
    name: 'WHOOP',
    category: 'Wearables',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Webhook and data sync checks planned.',
  },
  {
    name: 'Oura',
    category: 'Wearables',
    status: 'Planned',
    healthStatus: 'planned',
    detail: 'Data sync checks planned.',
  },
];

