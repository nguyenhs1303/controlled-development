---
name: spec-compliance-review
description: Reviews an implementation against its approved change contract before general code-quality review. Use when checking whether Quick triage scope or approved Standard/Deep acceptance criteria are satisfied, missing, incorrectly implemented, unverified, or exceeded by out-of-scope behavior. Do not use as a general engineering review.
---

# Specification Compliance Review

## Overview

Determine whether the implementation is the approved change. Review criteria and tests before judging code style or architecture.

Read the Quick triage/request contract or approved Standard/Deep spec, approved solution when present, current
plan/tasks, evidence artifact, changed-file diff, the [output language policy](../../references/output-language-policy.md),
[decision evidence policy](../../references/decision-evidence-policy.md), and the [review policy](../../references/review-policy.md).

## Preconditions

- Quick has an evidenced triage boundary and explicit implementation request, or the exact approved
  Standard/Deep specification version is available.
- Current changed files and verification receipts are known.
- BUILD is complete or has a clearly documented partial outcome.

Without either valid Quick triage evidence or an approved Standard/Deep spec, report that compliance cannot be
established; do not invent requirements.

## Process

### 1. Build the criterion matrix

For each acceptance criterion, locate:

- implementation paths;
- tests or manual observations;
- evidence receipts;
- preservation/compatibility evidence.

Classify it as satisfied, missing, incorrectly implemented, or implemented but unverified.

### 2. Check failure and boundary behavior

Compare specified error paths, edge cases, compatibility, and unchanged behavior requirements against the implementation and tests. Happy-path evidence cannot satisfy a failure-path criterion.

### 3. Check scope additions

Identify behavior, files, interfaces, configuration, architecture, dependency, or cleanup not authorized by the
applicable Quick triage boundary or approved specification/solution/plan. Useful extra behavior is still a scope
finding.

### 4. Write evidenced findings

Use stable IDs such as `SPEC-001`. Each finding includes criterion, location, concrete mismatch, triggering condition, consequence, scope status, severity, and recommended correction.

Use the review policy's severity and evidence threshold. Do not call a concern blocking without a plausible real condition.

### 5. Produce the compliance result

Summarize:

- criterion status matrix;
- blocking Critical/Important findings;
- Suggestions;
- unverified criteria;
- extra behavior;
- remediation eligibility.

Pass the complete findings directly to the orchestrator without dropping or paraphrasing evidence.

## Boundaries

- Do not perform engineering-quality review except where quality directly prevents a criterion from being satisfied.
- Do not edit code during review.
- Do not reinterpret the spec to fit the implementation.
- Do not convert an unapproved implementation decision into a new requirement.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The implementation is better than the spec." | Better-but-unapproved behavior is scope drift. |
| "Tests pass, so every criterion is satisfied." | Tests may not cover every criterion or may assert the wrong behavior. |
| "This criterion is implied." | Trace it to evidence or mark it unverified/missing. |
| "I'll mention style issues too." | Engineering review owns general quality findings. |

## Red Flags

- Review starts without the applicable Quick triage/request contract or approved Standard/Deep spec version.
- Criteria are checked from memory.
- Extra behavior is ignored because it is useful.
- Passing tests substitute for criterion-by-criterion mapping.
- Review modifies implementation.
- Findings lack criterion IDs or concrete evidence.

## Verification

- [ ] Every approved criterion has one explicit classification.
- [ ] Failure, boundary, compatibility, and preservation requirements were checked.
- [ ] Out-of-scope behavior was identified.
- [ ] Findings meet the evidence/format policy.
- [ ] Remediation eligibility is explicit.
- [ ] No code was changed during review.
