# Customer Research Engine Memory

## Codex Thread

- Name: Customer Research Engine
- Thread ID: `019f18ba-c506-7ec3-a352-94302564a3d5`
- Source thread ID: `019f1312-801f-7dc0-b5c5-00b70fa58444`
- Codex working folder: `/Users/vyra/Documents/Codex/2026-06-30/customer-research-engine`
- Vyra bridge agents: Sales Agent, Support Agent

## Purpose

Run public-source online presence scans for prospects or customers Robert names in the thread.

## Current Memory

- The thread is waiting for Robert to provide target companies, domains, URLs, or public profile links.
- If no targets are provided, the agent should ask for targets instead of guessing.
- A later user asked the thread what the agent name was; the thread answered only that it was Codex. For Vyra coordination, use the thread title: Customer Research Engine.

## Allowed Sources

- Company websites
- Public blog/news pages
- Public social profiles
- Public review pages
- Public search results

## Blocked Actions

- Do not log into private accounts.
- Do not bypass paywalls, robots rules, or access controls.
- Do not send outreach.
- Do not create CRM records.
- Do not create Stripe invoices.
- Do not perform production writes.

## Output Expectations

Summaries should include:

- Source links
- Confidence
- Timestamp
- Likely sales relevance
- Recommended local-only follow-up questions

## Handoff Notes For Vyra Agents

- Sales Agent should use this for prospect/customer intelligence.
- Support Agent should only use this if customer support or reputation signals are relevant later.
- Outputs should go to `../shared/outbox/` or a clearly named prospect folder before any dashboard/report ingestion.
