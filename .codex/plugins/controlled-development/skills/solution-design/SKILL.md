---
name: solution-design
description: Produces an evidence-backed technical solution with decision drivers, realistic options, trade-offs, architecture, patterns, quality scenarios, and approval conditions. Use when an approved specification needs a Standard solution-lite or Deep full-solution decision before implementation planning. Do not use for Quick mechanical edits, unapproved requirements, detailed task planning, implementation, or direct dependency mutation.
---

# Solution Design

## Overview

Turn an approved behavior contract into an approval-ready technical direction without writing product code.
The solution explains why an approach should be chosen; implementation planning later explains how to execute
the approved approach.

Read [solution.md](../../templates/solution.md), the [solution design policy](../../references/solution-design-policy.md),
the [output language policy](../../references/output-language-policy.md), the [decision evidence policy](../../references/decision-evidence-policy.md),
the [risk matrix](../../references/risk-matrix.md), the [permission policy](../../references/permission-policy.md),
and the [evidence policy](../../references/evidence-policy.md).

## Preconditions

- The specification version is explicitly approved.
- Triage selected Standard or Deep; Quick changes do not invoke this skill unless new evidence escalates them.
- Discovery evidence covers the relevant modules, boundaries, contracts, native checks, and applicable project instructions.
- No material behavior requirement remains unresolved.

If a precondition fails, return to the orchestrator. Do not compensate by inventing an architecture assumption.

## Modes

### SOLUTION LITE

Use for Standard changes. Keep the artifact concise:

- cite the existing architecture and project convention being followed;
- identify the decision drivers and material risks;
- present one evidenced approach when no genuine alternative exists;
- when approved constraints and repository evidence identify one sufficient extension point, present only that
  approach; do not promote wrappers, parallel abstractions, or extra indirection into artificial options;
- explain why additional architecture, patterns, technology, or dependency are unnecessary;
- define verification and revisit conditions proportional to the change.

### FULL SOLUTION

Use for Deep changes. Include realistic alternatives, explicit trade-offs, architecture views when useful,
quality scenarios, migration/rollback consequences, technology/dependency impact, and stronger verification.

## Process

### 1. Establish decision context

Restate the approved outcome, relevant constraints, current boundaries, and the technical decision that must be
made. Separate evidenced facts, user-confirmed decisions, proposals, and unknowns.

### 2. Define decision drivers

Derive drivers from approved criteria, project evidence, and explicit user decisions before proposing options.
Mark each driver `MUST` or `SHOULD`. A missing material driver becomes a focused question.

### 3. Define quality scenarios

For each quality attribute that can change the recommendation, define a measurable scenario using available
evidence. Performance scenarios may include latency, throughput, data volume, concurrency, resource use, query
count, or another relevant measure.

Do not invent numbers. If the missing measure changes the architecture choice, ask and stop. If it does not,
record it as a bounded hypothesis and name the later verification needed.

### 4. Develop realistic options

Include only viable approaches. For each option, explain why it is considered, its high-level structure,
architecture/design patterns, technology impact, benefits, drawbacks, quality trade-offs, migration/rollback,
and evidence confidence.

Prefer the current architecture when it meets the drivers. Do not introduce patterns or infrastructure for
theoretical future scale.

An alternative is not viable merely because it can be implemented. Exclude approaches that only add a wrapper,
parallel abstraction, dependency, or indirection without satisfying a decision driver that the existing design
cannot satisfy. For `SOLUTION LITE`, state that exclusion briefly instead of formatting it as another option.

### 5. Compare and recommend

Compare options against the same decision drivers. Use descriptive results such as `PASS`, `FAIL`,
`HIGH`, `MEDIUM`, `LOW`, and `UNKNOWN`; do not fabricate precise scores or weights.

Recommend one option and identify which claims are `MEASURED`, `EVIDENCED`, `INFERRED`, `HYPOTHESIS`, or
`UNKNOWN`. A material `UNKNOWN` blocks the recommendation from approval readiness.

### 6. Describe the proposed architecture

Define affected boundaries, dependency direction, components, data/runtime flow, interfaces, transaction or
concurrency ownership, and deployment consequences when relevant. Use a C4 or dynamic/deployment diagram only
when it helps the human evaluate the decision.

For every proposed pattern, name the problem it solves and its cost. It is valid to select no new pattern.

### 7. Declare technology and dependency impact

List every new, removed, upgraded, or materially reconfigured technology/dependency separately. These remain
permission-gated even when the solution is approved.

### 8. Define verification and revisit conditions

Map material claims and drivers to architecture tests, focused tests, benchmarks, profiling, load tests,
execution plans, review checks, or manual observations. Define concrete conditions that require the decision to
be reconsidered.

### 9. Request solution approval

Present the exact solution version, material evidence, trade-offs, recommendation, architecture, technology
impact, hypotheses, and open questions. Stop the current turn for explicit human approval. Record approval only
for the presented version.

## Change Control

After approval, any material change to architecture boundaries, patterns, dependencies, compatibility, data,
security, migration, concurrency, performance strategy, or verification implications returns to `SOLUTION DESIGN`
and requires approval of a new solution version. Local reversible mechanics may remain in planning.

## Exit Criteria

- Decision drivers precede and consistently evaluate the options.
- Quality scenarios are measurable where material and contain no invented targets.
- Options are realistic and supported by project evidence.
- Recommendation, architecture, patterns, and technology impact are explicit.
- Material uncertainty is resolved or blocks approval.
- Verification and revisit conditions are concrete.
- The presented solution version has explicit human approval before planning.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We need at least three options." | Invented options create noise; include only genuinely viable alternatives. |
| "This pattern is industry standard." | General popularity is not project evidence or a reason to add complexity. |
| "Option B should be faster." | Performance claims require evidence confidence and a verification path. |
| "The plan can settle architecture later." | Material technical direction must be approved before task decomposition. |
| "The user approved the spec, so the recommendation is approved." | Specification approval covers outcomes, not the proposed technical solution. |

## Red Flags

- Options appear before decision drivers.
- A quality target is invented from common practice.
- Every change receives a heavyweight diagram or multiple artificial options.
- A pattern, cache, queue, index, dependency, or distributed component lacks a named problem.
- `INFERRED`, `HYPOTHESIS`, or `UNKNOWN` content is presented as measured fact.
- A material unknown remains when solution approval is requested.
- Planning or BUILD starts in the solution-approval turn.

## Verification

- [ ] Specification approval and current discovery evidence were confirmed.
- [ ] Correct solution mode was selected from triage evidence.
- [ ] Decision drivers and material quality scenarios are explicit.
- [ ] Options, trade-offs, and recommendation use consistent criteria.
- [ ] Architecture/pattern/technology changes have evidence and consequences.
- [ ] Performance claims distinguish measurement, evidence, inference, hypothesis, and unknowns.
- [ ] Verification and revisit conditions are recorded.
- [ ] Explicit solution approval exists before planning.
