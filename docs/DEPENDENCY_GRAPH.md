# Dependency Graph

The Repository Intelligence dependency graph is built from local Engineering graph relationships.

Tracked relationships include:

- imports
- package dependencies
- module relationships
- runtime relationships
- shared components
- circular dependency detection
- orphaned modules

The graph is published into the local Vyra Knowledge Graph so Engineering and Executive agents can review repository relationships alongside tasks, GitHub plans, blockers, documentation, and ownership.

## Safety

Dependency graph generation is metadata-only. It does not install packages, change package files, update lockfiles, call GitHub write endpoints, or modify source code.
