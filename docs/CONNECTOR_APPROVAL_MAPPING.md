# Connector Approval Mapping

Connector approval mapping links local task/action types to future connector actions. The map is a planning layer only.

## Mappings

| Task or Action Type | Connector | Future Action | Approval Type |
| --- | --- | --- | --- |
| GitHub issue/PR task | GitHub | create or update issue/pull request | `github_write_request` |
| Gmail draft/send | Gmail | create provider draft or send email | `email_draft_request` |
| Calendar event draft/create | Google Calendar | create or update calendar event | `calendar_event_request` |
| Stripe invoice/payment link | Stripe | create invoice or payment link | `stripe_invoice_request` |
| Supabase record write | Supabase | write through approved server or Edge Function path | `supabase_write_request` |
| Twilio SMS | Twilio/SMS | send SMS | `sms_draft_request` |
| Google Drive doc export | Google Drive | create, export, update, or share document | `drive_export_request` |

Every mapping defaults to `blocked_placeholder`.

Approval records are local review objects. Approving a record must not perform the connector action unless a future phase explicitly builds and validates a live, approval-gated connector runtime.

## Reports

`npm run connectors:approval-map` writes a local Approval Mapping Report in Markdown and JSON. Generated reports are ignored by Git.
