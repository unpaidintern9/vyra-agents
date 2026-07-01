# Task Routing

Task routing is local and explicit. It changes assigned ownership and records a route history entry, but it never performs the external action described by the task.

Supported routing patterns:

- Sales to Operator, Executive, or Proposal Prep.
- Executive to Operator or Sales.
- Operator to Sales.
- Contract Intelligence to Proposal Prep or Executive.
- Memory to Operator.
- Marketing or Future Marketing to Sales.
- Finance or Future Finance to Executive.
- Engineering or Future Engineering to Operator.
- Operations to Operator, Sales, or Executive.
- Research to Operator or Sales.

Use `npm run tasks:route -- --id <task-id> --sourceAgent Sales --targetAgent Operator --reason "Needs verification"` to create a local handoff.

Invalid routes are blocked and returned as validation-safe failures.
