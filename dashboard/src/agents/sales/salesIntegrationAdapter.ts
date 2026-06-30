import type { SalesIntegrationMode, SalesIntegrationSummary } from './salesTypes';

export function resolveSalesIntegrationMode(appMode: 'mock' | 'live'): SalesIntegrationMode {
  return appMode === 'live' || import.meta.env.VITE_SALES_INTEGRATION_MODE === 'live' ? 'live_read_only' : 'mock';
}

export function buildSalesIntegrationSummary(appMode: 'mock' | 'live'): SalesIntegrationSummary {
  const mode = resolveSalesIntegrationMode(appMode);
  const liveConfigured = Boolean(import.meta.env.VITE_SALES_CRM_PROVIDER || import.meta.env.VITE_SALES_CRM_READ_ONLY);
  const crmReadinessStatus = mode === 'mock' ? 'ready' : liveConfigured ? 'ready' : 'not_configured';
  return {
    blockedExternalActionCount: 3,
    crmReadinessStatus,
    externalActionsEnabled: false,
    mode,
    modeLabel: mode === 'live_read_only' ? 'LIVE READ-ONLY' : 'LOCAL MOCK',
    readOnly: true,
    safetyLabel:
      mode === 'live_read_only'
        ? 'Live CRM readiness checks are read-only. Writes, emails, and invoices are blocked.'
        : 'Local mock mode. Sales records stay in browser storage.',
  };
}
