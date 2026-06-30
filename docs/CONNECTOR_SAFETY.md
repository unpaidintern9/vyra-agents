# Connector Safety

The connector readiness layer is intentionally non-operational.

## Current Safety Boundary

- No GitHub calls.
- No Gmail calls.
- No Google Calendar calls.
- No Stripe calls.
- No Supabase production writes.
- No Twilio calls.
- No Google Drive calls.
- No connector secrets required or printed.
- All connector write actions are disabled placeholders.

## Supabase Boundary

Supabase write paths must not weaken RLS and must not allow direct browser inserts. Future write paths must use approved server or Edge Function paths with explicit approval gates.

The browser must never receive service role keys.

## Communication Boundary

Gmail and Twilio/SMS are modeled only for readiness. Vyra can prepare local drafts and manual-send audit records, but it must not send through providers.

## Billing Boundary

Stripe is modeled only for future invoice or payment-link readiness. Vyra must not create Stripe invoices, payment links, checkout sessions, refunds, or customer updates in this phase.

## File Boundary

Google Drive is modeled only for future file search/export readiness. Vyra must not create, update, share, export, or delete Drive files in this phase.
