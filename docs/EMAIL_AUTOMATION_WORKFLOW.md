# Email Automation Workflow

Phase 40A supports automated and manually triggered internal email sends through Gmail.

## Workflow States

- `draft_created`
- `ready_for_send`
- `auto_scheduled`
- `sent`
- `failed`
- `skipped`
- `archived`

## Automation

Agents can prepare scheduled internal reports. `npm run email:send-pending` sends drafts in `ready_for_send` or `auto_scheduled` only when every Gmail safety gate passes.

Default report schedules:

- Executive daily summary: daily to Robert
- Engineering summary: event-triggered to Robert
- Task queue summary: daily to Robert
- Cross-agent review summary: daily to Matthew when Matthew email is configured

## Audit Trail

Every send attempt writes a Gmail email audit entry with draft id, action taken, operator name/tool, sender, recipient, timestamp, provider-send result, and notes. Skipped and failed sends are audited too.
