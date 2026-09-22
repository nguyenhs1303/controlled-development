---
name: implementation-planning
description: Turns an approved specification and technical solution into dependency-ordered, verifiable implementation tasks. Use when a controlled change needs vertical slices, likely files, checkpoints, risk-first ordering, or a Deep/sensitive plan approval. Do not use before required solution approval, to choose material architecture, or to execute the tasks.
---

# Implementation Planning

## Overview

Translate the approved behavior contract and technical solution into small, dependency-safe implementation increments. Planning is read-only with respect to product code and does not reopen approved architecture.

Use [plan.md](../../assets/workflow-templates/plan.md), [tasks.md](../../assets/workflow-templates/tasks.md), the [output language policy](../../references/policies/output-language-policy.md), the [decision evidence policy](../../references/policies/decision-evidence-policy.md), the [evidence policy](../../references/policies/evidence-policy.md), and the [risk matrix](../../references/policies/risk-matrix.md).

## Preconditions

- The specification version is explicitly approved.
- The required solution version is explicitly approved (`SOLUTION LITE` for Standard, `FULL SOLUTION` for Deep).
- Discovery evidence is current enough for planning.
- Any unresolved question that materially changes behavior, scope, data/API compatibility, architecture, security, risk, permissions, or verification is returned to DEFINE or targeted discovery.

## Process

### 1. Map criteria to components

For every acceptance criterion, identify the approved solution sections, modules, interfaces, tests, configuration, and boundaries involved. Prefer existing project patterns already selected by the solution.

Record the evidence for each material mapping. Similar names, neighboring files, or a common architectural pattern are leads to investigate, not authority to select a boundary.

### 2. Build the dependency graph

Record what must exist before each outcome can be implemented and tested. Detect cycles; a cycle indicates the boundary or task split is wrong.

Place high-risk unknowns early enough to fail fast, without creating unused horizontal infrastructure.

If planning exposes a new dependency, owner, transaction boundary, compatibility strategy, quality trade-off, or
verification substitute not settled by the approved solution, return to `SOLUTION DESIGN`. Do not encode the
guess as an architecture decision or task.

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
- enforcement contract: allowed write paths, allowed new files, protected paths, command grants, and required checks.

Do not prescribe fake test commands. Use commands established by discovery.

### 5. Add checkpoints

After each small dependency group, require checks that leave the project in a working state. Add explicit approval or reconciliation checkpoints before sensitive operations.

### 6. Decide plan approval

Require human approval for Deep changes and for Standard plans containing sensitive, destructive,
difficult-to-reverse, permission-gated, or project-policy-gated execution. Present task order, sensitive
operations, verification coverage, and known gaps, then stop the current turn.

Standard may skip a separate plan approval when the approved solution fixed the material technical direction
and the plan contains only bounded, reversible execution steps.

## Plan Quality Rules

- Every task traces to at least one approved criterion, approved solution section, or necessary verification/artifact duty.
- Every material plan decision cites an approved requirement, project evidence, or explicit user confirmation.
- Every criterion is covered by one or more tasks.
- Dependencies point backward in execution order.
- Product code remains untouched during planning.
- Parallel work is proposed only for genuinely independent files/contracts.
- New dependencies, migrations, CI, public-interface changes, or architecture changes not already approved return to solution design and remain permission-gated.

## Exit Criteria

The plan is executable without inventing behavior, tasks are dependency-ordered and bounded, verification is concrete, and required approval is recorded.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll choose files while coding." | Likely file scope is a control boundary and must be reviewable first. |
| "One large task is easier to track." | Large tasks hide dependency mistakes and prevent incremental verification. |
| "Tests can be a final task." | Each behavioral slice needs its own proof path. |
| "The approved solution lets the plan change architecture." | Planning decomposes the approved direction; material redesign returns to solution approval. |
| "This is the usual architecture for this stack." | General practice is not project evidence; investigate the project or ask when the choice is material. |

## Red Flags

- Planning begins from an unapproved spec or required solution.
- Tasks are horizontal layers with no working behavior.
- A task touches more than five files without split rationale.
- Acceptance criteria or verification are absent.
- A material architecture or compatibility choice is introduced during planning instead of returning to solution design.
- A proposal or likely pattern is presented as a settled plan decision.
- A dependency points to a later task.
- BUILD starts in the plan-approval turn.

## Verification

- [ ] All criteria and approved solution sections map to tasks and all tasks map back to approved inputs/duties.
- [ ] Dependency graph is acyclic and order is risk-aware.
- [ ] Tasks are small, vertical, and independently verifiable.
- [ ] Likely files and native checks are named.
- [ ] No material architecture decision was reopened or invented during planning.
- [ ] Checkpoints and permission-sensitive actions are visible.
- [ ] Required plan approval exists before BUILD.
