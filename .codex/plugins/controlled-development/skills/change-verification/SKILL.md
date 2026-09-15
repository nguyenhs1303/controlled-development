---
name: change-verification
description: Runs project-native verification commands and records evidence-backed results and status claims for a controlled change. Use when implementation or remediation needs focused tests, regression checks, lint, type-check, build, static analysis, or manual acceptance evidence. Do not use to infer passes from source inspection or to run unsafe external checks without approval.
---

# Change Verification

## Overview

Run the right checks for the approved criteria and risk, then record exactly what the evidence proves. Verification is execution, not confidence.

Read the [output language policy](../../references/output-language-policy.md), [decision evidence policy](../../references/decision-evidence-policy.md), [evidence policy](../../references/evidence-policy.md), [permission policy](../../references/permission-policy.md), and [Definition of Done](../../references/definition-of-done.md).

## Preconditions

- Approved criteria and current changed files are known.
- Native commands and their sources were discovered.
- Command side effects are understood and allowed.
- Evidence from before the latest relevant edit is treated as stale.

## Process

### 1. Build the verification matrix

Map every acceptance criterion, task, and review finding to the smallest check that can prove it. Then add proportional regression coverage based on risk.

Typical layers, only when the project exposes them:

- focused unit/integration test;
- affected package/module suite;
- full test suite;
- lint/format validation;
- type-check/compile/build;
- static/security analysis;
- manual/runtime acceptance check.

Do not use one layer as evidence for another.

### 2. Safety-check commands

Inspect command definitions when effects are unclear. A command named `test` or `build` may still migrate, upload, publish, seed shared data, or invoke external services.

Run only permitted local checks. Mark unsafe checks `NOT RUN` with the exact permission/effect reason.

### 3. Execute focused checks first

Run focused checks for fast, attributable feedback. Record command, directory, exit code/result, relevant output, Git baseline, and supported criteria.

If a check fails, distinguish product failure, test failure, environment failure, and command/configuration failure using evidence.

### 4. Execute regression checks

Run the broader checks required by the risk profile and Definition of Done. If a tool is unavailable, record `NOT RUN`; do not install dependencies without approval.

### 5. Perform manual checks when required

State the exact action and observable. A manual check is `PASS` only when actually performed and observed. Screenshots or artifact references may support UI evidence when applicable.

### 6. Record honest outcomes

Use only:

- `PASS`
- `FAIL`
- `NOT RUN`
- `UNVERIFIED`

Update the evidence artifact and acceptance-criterion matrix. State the coverage boundary: focused package, full repository, build only, and so on.

### 7. Decide readiness for review

Proceed to review when current evidence covers the planned checks or when remaining gaps are explicitly represented and the orchestrator can determine a blocked outcome. Do not hide a required failing/missing check to reach review.

## Failure Handling

Return implementation-related failures to `incremental-build` bounded recovery. Environment or permission failures consume attempts only when a materially different local recovery is actually tried. Never change tests merely to match incorrect implementation.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Focused tests passed, so the full suite passed." | Different scopes require different receipts. |
| "The code is simple enough to inspect." | Inspection can guide a check but cannot produce `PASS`. |
| "The tool is missing, so the check is probably unnecessary." | Record `NOT RUN`; the gap remains visible. |
| "This passed before the remediation." | Relevant edits make prior evidence stale. |

## Red Flags

- A `PASS` entry has no executed receipt.
- The receipt omits command scope or working directory.
- A broad claim cites only a focused check.
- Unsafe/external checks run without approval.
- Missing tools trigger installation without approval.
- Failing output is summarized away.
- Evidence contains secrets or unnecessary full logs.

## Verification

- [ ] Every criterion has a current verification status.
- [ ] Required focused and regression checks ran or have explicit non-pass reasons.
- [ ] Receipt scope matches each claim's scope.
- [ ] Post-edit evidence is fresh.
- [ ] Command effects stayed within permission boundaries.
- [ ] Failures are classified by observed evidence.
- [ ] No unexecuted check is labeled `PASS`.
