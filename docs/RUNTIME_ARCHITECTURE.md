# Runtime Architecture

The runtime lives in `dashboard/src/runtime/`.

Core modules:

- `agentRuntime.ts` builds the runtime snapshot.
- `agentFactory.ts` creates agents from shared definitions.
- `agentRegistry.ts` registers Engineering, Migration, Sales, Support, Finance, Operations, Marketing, Product, and Executive agents.
- `agentLifecycle.ts` defines the inherited lifecycle.
- `agentPermissions.ts` defines shared permission defaults.
- `agentHealth.ts` derives runtime health.
- `agentActivity.ts` derives runtime activity.
- `agentApproval.ts` normalizes approvals.
- `agentMemory.ts` summarizes memory.
- `agentSync.ts` summarizes sync.
- `agentWorkflow.ts` contains workflow helpers.
- `runtimeTypes.ts` owns shared contracts.

The dashboard keeps existing pages, but Overview and the Runtime inspector now read from the shared runtime snapshot.

Adding a new agent should be a registry entry, not a new infrastructure stack.
