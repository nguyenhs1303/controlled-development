---
name: implementation-planning
description: Turns an approved change specification into dependency-ordered, verifiable implementation tasks. Use when a controlled change needs architecture decisions, vertical slices, likely files, checkpoints, risk-first ordering, or a medium/high-risk plan approval. Do not use before specification approval or to execute the tasks.
---

# Implementation Planning

## Overview

Translate the approved behavior contract into small, dependency-safe implementation increments. Planning is read-only with respect to product code.

Use [plan.md](../../templates/plan.md), [tasks.md](../../templates/tasks.md), the [output language policy](../../references/output-language-policy.md), the [decision evidence policy](../../references/decision-evidence-policy.md), the [evidence policy](../../references/evidence-policy.md), and the [risk matrix](../../references/risk-matrix.md).

## Preconditions

- The specification version is explicitly approved.
- Discovery evidence is current enough for planning.
- Any unresolved question that materially changes behavior, scope, data/API compatibility, architecture, security, risk, permissions, or verification is returned to DEFINE or targeted discovery.

## Process

### 1. Map criteria to components

For every acceptance criterion, identify the existing modules, interfaces, tests, configuration, and boundaries likely involved. Prefer existing project patterns.

Record the evidence for each material mapping. Similar names, neighboring files, or a common architectural pattern are leads to investigate, not authority to select a boundary.

### 2. Build the dependency graph

Record what must exist before each outcome can be implemented and tested. Detect cycles; a cycle indicates the boundary or task split is wrong.

Place high-risk unknowns early enough to fail fast, without creating unused horizontal infrastructure.

If choosing a dependency, owner, transaction boundary, compatibility strategy, or verification substitute requires an unsupported material assumption, stop and ask the minimum focused question. Do not encode the guess as an architecture decision or task.

### 3. Slice vertically

Each task should deliver one complete, testable behavior or one necessary contract/foundation consumed immediately by the next task. Avoid "all models, then all services, then all UI" plans.

Target 1-5 files per task. Split tasks containing independent concerns or more than one focused session of work.

### 4. Define each task

Each stable task ID records:

- approved criterion IDs;
- one outcome-focused description;
- dependencies;
- likely/approved files;
- acceptance conditions;
- RED/GREEN or non-behavioral verification steps;
- regression checks;
- risk/permission notes.

Do not prescribe fake test commands. Use commands established by discovery.

### 5. Add checkpoints

After each small dependency group, require checks that leave the project in a working state. Add explicit approval or reconciliation checkpoints before sensitive operations.

### 6. Decide plan approval

Require human approval for medium/high risk. Present architecture decisions, dependencies, sensitive operations, verification coverage, and known gaps, then stop the current turn.

Low-risk Standard may skip a separate plan approval only when the risk policy permits it and the approved spec explicitly authorizes autonomous progression.

## Plan Quality Rules

- Every task traces to at least one approved criterion or necessary verification/artifact duty.
- Every material plan decision cites an approved requirement, project evidence, or explicit user confirmation.
- Every criterion is covered by one or more tasks.
- Dependencies point backward in execution order.
- Product code remains untouched during planning.
- Parallel work is proposed only for genuinely independent files/contracts.
- New dependencies, migrations, CI, or public-interface changes remain permission-gated.

## Exit Criteria

The plan is executable without inventing behavior, tasks are dependency-ordered and bounded, verification is concrete, and required approval is recorded.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll choose files while coding." | Likely file scope is a control boundary and must be reviewable first. |
| "One large task is easier to track." | Large tasks hide dependency mistakes and prevent incremental verification. |
| "Tests can be a final task." | Each behavioral slice needs its own proof path. |
| "The spec approval also approves any plan." | Medium/high-risk architecture choices require their own gate. |
| "This is the usual architecture for this stack." | General practice is not project evidence; investigate the project or ask when the choice is material. |

## Red Flags

- Planning begins from an unapproved spec.
- Tasks are horizontal layers with no working behavior.
- A task touches more than five files without split rationale.
- Acceptance criteria or verification are absent.
- A material architecture or compatibility choice has no traceable source.
- A proposal or likely pattern is presented as a settled plan decision.
- A dependency points to a later task.
- BUILD starts in the plan-approval turn.

## Verification

- [ ] All criteria map to tasks and all tasks map to approved criteria/duties.
- [ ] Dependency graph is acyclic and order is risk-aware.
- [ ] Tasks are small, vertical, and independently verifiable.
- [ ] Likely files and native checks are named.
- [ ] Material decisions trace to evidence or user confirmation; none depend on a hidden inference.
- [ ] Checkpoints and permission-sensitive actions are visible.
- [ ] Required plan approval exists before BUILD.
