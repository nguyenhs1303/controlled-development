# Solution Design Policy

Use this policy after specification approval and before implementation planning. The solution stage decides
the technical direction; the plan only decomposes the approved direction into executable tasks.

## Routing

- **Quick:** skip solution design when triage proves the change is local, reversible, unambiguous, and has no
  architecture, dependency, interface, data, security, concurrency, migration, or material performance impact.
  Record the skip reason conversationally.
- **Standard:** produce `SOLUTION LITE` and require explicit solution approval. Prefer the existing architecture
  and established project patterns unless evidence shows that they do not satisfy the approved specification.
- **Deep:** produce `FULL SOLUTION` and require explicit solution approval before planning.

Escalate when new evidence introduces a higher-risk factor. Never skip or downgrade solution design merely
because the code change appears small.

## Decision sequence

Apply this order:

1. Establish decision context, constraints, and repository evidence.
2. Identify decision drivers before proposing options.
3. Define measurable quality scenarios when a quality attribute can affect the decision.
4. Present only realistic options supported by the problem and project context.
5. Compare trade-offs and evidence confidence.
6. Recommend one option and explain why it best fits the approved drivers.
7. Describe the resulting architecture, patterns, technology, dependencies, and verification implications.
8. Define consequences and conditions that require the decision to be revisited.

Do not invent extra options to reach a fixed count. One viable option is acceptable when constraints genuinely
exclude alternatives; explain the exclusion evidence. An implementable wrapper, parallel abstraction, new
dependency, or extra indirection is not a viable option unless it satisfies a decision driver that the existing
design cannot satisfy. In `SOLUTION LITE`, mention such exclusions briefly rather than presenting them as options.

## Decision drivers

Decision drivers are the approved criteria and constraints used to compare options. Consider only relevant
drivers, such as:

- behavior and compatibility;
- maintainability and existing ownership boundaries;
- security, privacy, auditability, and data integrity;
- performance, scalability, reliability, and resource limits;
- delivery complexity, operational cost, migration, and rollback;
- project conventions, team capability, and approved technology constraints.

Do not choose an option first and create supporting drivers afterward. A material driver without evidence or
explicit user confirmation is an open question.

## Quality scenarios

Make decision-relevant quality requirements concrete and measurable. A scenario should identify the stimulus,
operating conditions, affected behavior, and measurable response where those facts are known.

Do not invent an SLO, workload, data volume, concurrency level, recovery objective, or resource budget. If a
missing value could change the recommended solution, ask the user before solution approval. If the quality
attribute is not material to the change, state why and do not manufacture a scenario.

## Evidence confidence

Label material option claims using one of:

- `MEASURED`: directly supported by a current benchmark, profile, execution plan, or runtime metric;
- `EVIDENCED`: directly supported by applicable code, tests, contracts, configuration, or project documents;
- `INFERRED`: a technical interpretation derived from cited evidence but not directly measured;
- `HYPOTHESIS`: plausible and testable, but requires a spike, benchmark, or other verification;
- `UNKNOWN`: evidence is missing, conflicting, stale, or insufficient.

`INFERRED`, `HYPOTHESIS`, and `UNKNOWN` are not facts. A material `UNKNOWN` blocks solution approval. This
classification supplements, and does not replace, the decision evidence policy.

## Architecture and patterns

Prefer existing repository boundaries, dependency direction, and proven local patterns. Architectural patterns
and design patterns may be proposed only when they solve a named problem or quality scenario. Explain:

- the problem the pattern addresses;
- where it applies in the proposed architecture;
- benefits, costs, and failure modes;
- why simpler or existing structures are insufficient;
- how compliance will be verified.

It is valid to recommend no new pattern, technology, or dependency. Use C4 Context, Container, Component,
Dynamic, or Deployment views only when a diagram materially improves approval understanding; do not require a
diagram for a local solution.

## Performance analysis

When performance can affect the choice, compare relevant latency, throughput, CPU, memory, I/O, database,
network, concurrency, and scaling consequences. Separate measured results from expected behavior. Name the
benchmark, profiling, load-test, query-plan, or metric evidence needed to confirm each material hypothesis.

Do not add caching, queues, parallelism, indexes, pool changes, timeouts, retries, or distributed complexity
without an evidenced bottleneck or an approved quality scenario that requires them.

## Approval and change control

The recommended solution remains a proposal until the human explicitly approves the presented solution version.
Approval must cover the architecture direction, material patterns, dependency/technology changes, quality
trade-offs, and verification implications actually presented.

After approval:

- implementation planning must trace tasks to the approved solution;
- planning may decide only local, reversible, non-material mechanics;
- a new architecture boundary, dependency, compatibility strategy, data decision, security model, or materially
  different quality trade-off returns to `SOLUTION DESIGN` and `SOLUTION APPROVAL`;
- the solution records verification conditions and revisit conditions, but later verification must still execute
  the named checks before claiming success.
