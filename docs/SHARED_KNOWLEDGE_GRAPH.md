# Shared Knowledge Graph

The shared knowledge graph links local entities across agents.

## Relationship Records

Each relationship stores:

- Relationship ID
- From entity
- To entity
- Relationship type
- Source
- Confidence
- Direction
- Created by
- Created and updated dates
- Audit trail

## Supported Examples

- Contact works at organization
- Opportunity belongs to organization
- Workflow requests action for opportunity
- Proposal prepared for opportunity
- Research intake supports organization
- Report summarizes entity
- Contract relates to organization
- Marketing asset belongs to brand

## Dashboard Use

Sales shows Shared Memory View, Relationship Graph, and Conflict Queue.

Executive shows Cross-Agent Knowledge Summary, Decision History, Risky Facts, and Memory Conflict signals.

Operator shows Memory Maintenance Queue, Missing Verification, Duplicate Entity Queue, and Stale Fact Queue.

## Phase 53 Task Graph

The Universal Task Engine adds task nodes and dependency edges to the shared local graph. Tasks can relate to agents, organizations, entities, facts, reports, workflows, proposals, parent tasks, and dependency tasks.

Graph links are local and advisory. They do not merge records, approve decisions, send messages, browse, sync CRM data, or submit proposals.
