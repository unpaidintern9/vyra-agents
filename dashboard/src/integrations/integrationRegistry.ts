import type { GitHubStatusResult } from './github/githubTypes';
import type { SupabaseProjectStatus } from './supabase/supabaseTypes';

export interface IntegrationRegistryItem {
  name: string;
  category: string;
  status: string;
  healthStatus: 'healthy' | 'warning' | 'critical' | 'prepared' | 'planned' | 'unknown';
  detail: string;
}

export function buildIntegrationRegistry(
  githubStatus?: GitHubStatusResult,
  supabaseStatus?: SupabaseProjectStatus,
): IntegrationRegistryItem[] {
  return [
  {
    name: 'GitHub',
    category: 'Source Control',
    status: githubStatus?.usedFallback ? 'Live fallback' : 'Read-only checks ready',
    healthStatus: githubStatus?.repositories.some((repo) => repo.healthStatus === 'warning') ? 'warning' : 'healthy',
    detail: 'Repository status checks use GET-only GitHub API calls in live mode.',
  },
  {
    name: 'Supabase',
    category: 'Backend',
    status: supabaseStatus?.usedFallback ? 'Live fallback' : 'Read-only checks ready',
    healthStatus: supabaseStatus?.healthStatus ?? 'prepared',
    detail: 'Anon-key table checks classify reachable, protected, missing, and unknown states.',
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
}

export const integrationRegistry = buildIntegrationRegistry();
