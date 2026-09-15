---
name: incremental-build
description: Implements an approved feature or bug fix one small test-first increment at a time while preserving unrelated working-tree changes. Use when BUILD has valid approvals, bounded file scope, task acceptance criteria, and native verification commands. Do not use before approval, for out-of-scope cleanup, or for commit, PR, merge, release, or deployment work.
---

# Incremental Build

## Overview

Execute one approved task at a time and leave the working tree in a verifiable state after every increment. Preserve unrelated changes and record progress durably.

Read the [output language policy](../../references/output-language-policy.md), [permission policy](../../references/permission-policy.md), [decision evidence policy](../../references/decision-evidence-policy.md), [evidence policy](../../references/evidence-policy.md), and active `tasks.md`/`state.json` before writing.

## Preconditions

- Current phase is BUILD.
- Specification approval exists.
- Required plan approval exists.
- One next-ready task is selected and its dependencies are complete.
- Approved files, criteria, and native checks are known.
- Current Git state and unrelated changes are recorded.

If a precondition fails, return to the orchestrator; do not edit product code.

## Increment Cycle

### 1. Claim one task

Set exactly one task to `IN_PROGRESS` in durable state. Re-read its acceptance criteria, file boundary, dependencies, and permission notes.

### 2. Establish RED when behavior changes

Write the smallest test that demonstrates the missing behavior or bug. Run the focused native command and confirm it fails for the expected reason.

If the test passes immediately, the test does not prove the change is needed; correct the test or investigate existing behavior. If RED cannot apply to documentation/static configuration, record `NOT APPLICABLE` with a reason and define another observable before/after check.

### 3. Implement the minimum change

Change only what is needed to satisfy the selected task. Prefer existing patterns and standard-library/project utilities. Do not add dependencies or widen file scope without approval.

Do not clean up adjacent code, rename unrelated symbols, or implement Suggestions.

Codex may choose non-material mechanical details inside the approved boundary. If implementation exposes an unresolved choice that could affect behavior, data/API compatibility, architecture ownership, security, risk, permissions, or verification, stop before editing that choice and return it as a focused question. Do not infer the answer from a nearby pattern.

### 4. Establish GREEN

Run the focused check and confirm success. Record a receipt. If it fails, enter bounded recovery instead of moving to another task.

### 5. Refactor only inside scope

With focused tests green, simplify the new implementation when doing so reduces complexity without changing behavior or touching unrelated scope. Re-run affected checks after any refactor.

### 6. Run incremental regression checks

Run the checks assigned to the task/checkpoint. Do not repeat unchanged successful commands without intervening relevant edits.

### 7. Close the task

Update `tasks.md`, `state.json`, and `evidence.md` with:

- task status;
- changed files;
- RED/GREEN/regression receipts;
- assumptions discovered;
- blocker status;
- next-ready task.

Do not stage or commit.

## Bounded Recovery

For the same blocker, allow at most three materially different attempts.

Each attempt records:

1. blocker identity and exact failure;
2. attempt number;
3. current hypothesis;
4. new evidence supporting that hypothesis;
5. action different from prior attempts;
6. observed result.

Inspect cheap, local causes first: command correctness, focused output, configuration, nearby call sites, and minimal reproduction. Do not introduce dependencies or destructive workarounds.

If three meaningful attempts fail, mark the task blocked and return `IMPLEMENTATION BLOCKED` evidence to the orchestrator. Repeating the same command or making cosmetic variations does not reset the count.

## Scope Drift

Stop and return to the relevant approval gate when BUILD discovers:

- behavior not covered by the approved criteria;
- a new dependency, migration, public interface, CI/infrastructure change, or risky permission;
- additional files/subsystems that materially change blast radius;
- an ambiguous product decision;
- any other material decision unsupported by project evidence or explicit user confirmation;
- a risk escalation.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The test is obvious; I can write it after." | A passing-after test cannot prove it would have caught the missing behavior. |
| "This nearby cleanup is tiny." | It is outside the selected task and obscures review evidence. |
| "Committing each slice is best practice." | This plugin explicitly forbids staging and commits. Durable artifacts track progress instead. |
| "I'll start the next task while this check is failing." | Dependencies and evidence become ambiguous; resolve or block one task first. |
| "A fourth attempt is harmless." | The cap is a control boundary, not a suggestion. |
| "The likely interpretation is safe enough to implement." | A material ambiguity returns to clarification; only non-material mechanical choices remain autonomous. |

## Red Flags

- More than one task is `IN_PROGRESS` in a single-agent workflow.
- Product files change before a required RED receipt.
- The failing test fails for syntax/setup rather than expected behavior.
- Files outside approved scope change.
- Unrelated working-tree changes are overwritten.
- A dependency is added without approval.
- A material implementation choice is made from inference rather than evidence or user confirmation.
- A task closes with failing or stale focused verification.
- Git staging, commit, or shipping commands run.

## Verification

- [ ] Preconditions and approved scope were checked before writes.
- [ ] Behavioral changes have genuine RED then GREEN receipts, or a justified alternative.
- [ ] Implementation is minimal and uses existing patterns.
- [ ] Autonomous choices were non-material; material uncertainty returned to clarification.
- [ ] Assigned regression checks have current statuses.
- [ ] Unrelated changes are preserved.
- [ ] Task/state/evidence artifacts are current.
- [ ] Recovery attempts, if any, are distinct and at most three.
- [ ] No commit or shipping operation occurred.
