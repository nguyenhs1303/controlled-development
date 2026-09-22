---
name: engineering-review
description: Finds evidenced engineering risks in a verified controlled change across correctness, security, maintainability, architecture, performance, tests, compatibility, and project conventions. Use when specification compliance review has finished or remediation has been re-verified. Do not use to redefine approved requirements, implement fixes during review, or raise blocking findings without concrete evidence and a plausible trigger.
---

# Engineering Review

## Overview

Evaluate whether the approved implementation is safe and healthy engineering. Keep the review independent from implementation: report findings first, then let the orchestrator decide remediation.

Read the spec-compliance result, diff, relevant surrounding code/tests, verification receipts, project instructions, the [output language policy](../../references/policies/output-language-policy.md), [decision evidence policy](../../references/policies/decision-evidence-policy.md), and the [review policy](../../references/policies/review-policy.md).

## Preconditions

- Specification compliance review has completed.
- Current verification evidence and changed-file scope are available.
- Relevant project conventions and trust boundaries are known.

## Review Axes

### Correctness

- boundary, null/empty, error, and state-transition behavior;
- race conditions, ordering, idempotency, and resource cleanup;
- mismatch between tests and real behavior;
- silent fallbacks that hide broken invariants.

### Security

- input validation and output encoding;
- authentication/authorization and trust boundaries;
- secrets, sensitive logs, injection, path traversal, unsafe deserialization;
- external/untrusted data used without validation.

### Readability and maintainability

- names, control flow, duplication, dead paths, and unnecessary abstraction;
- conditionals bolted into unrelated flows;
- file/module size and ownership;
- comments that explain non-obvious intent only.

### Architecture and compatibility

- dependency direction and project patterns;
- feature-specific logic leaking into shared modules;
- near-duplicate helpers instead of canonical ones;
- public/internal contract compatibility and migration impact.

### Performance

- unbounded operations, repeated I/O, N+1 behavior, blocking work;
- unnecessary allocations/renders in relevant paths;
- missing limits, pagination, caching, or cleanup where impact is real.

### Tests and evidence

Confirm schema-4 enforcement uses the controller as sole authority, adapters remain thin, unknown operations
fail closed, protected paths cannot be granted by task policy, and evidence receipts match the current diff.
Disabled or untrusted live hooks are a non-pass status rather than a package-test success.

- tests would fail for a meaningful regression;
- failure paths and invariants are covered;
- test scope matches risk;
- receipts are current and honest.

## Process

### 1. Review tests and evidence first

Understand intended behavior and what was actually proven. Identify gaps before reading implementation details.

### 2. Inspect changed code in context

Read enough surrounding code to verify ownership, callers, trust boundaries, and conventions. Do not broaden into unrelated cleanup.

### 3. Reproduce before blocking when practical

Use a focused local check or concrete code path to establish the triggering condition. If it cannot be established, label the concern `UNVERIFIED`; do not invent likelihood.

### 4. Categorize findings

Use stable IDs such as `ENG-001` and Critical, Important, or Suggestion. Include location, evidence, trigger, likelihood/context, consequence, scope status, recommendation, and remediation eligibility.

Order findings by severity and leverage. Reconcile duplicates already reported by spec review.

### 5. Return a verdict

- No Critical/Important findings: engineering review passes; disclose Suggestions.
- Eligible Critical/Important findings: return them for bounded remediation.
- Non-remediable blocking findings: recommend `REVIEW BLOCKED` and state the required human action.

Do not edit code in the review phase.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Tests pass, so architecture and security are fine." | Tests rarely cover all trust and structural risks. |
| "This might happen someday, so it is Important." | Name and validate a plausible triggering condition. |
| "I wrote it, so I can review and fix simultaneously." | Separate review evidence from remediation to prevent self-approval drift. |
| "A tiny style preference should be auto-fixed." | Suggestions are reported and left unchanged. |

## Red Flags

- Review rubber-stamps based only on green tests.
- Blocking severity lacks a concrete trigger or consequence.
- Remote speculation is presented as fact.
- Spec findings are duplicated without reconciliation.
- Review comments focus on cosmetic nits over correctness/security.
- Code changes occur before the orchestrator classifies remediation eligibility.

## Verification

- [ ] All six review axes were considered in relevant scope.
- [ ] Tests/evidence were reviewed before implementation details.
- [ ] Blocking findings have concrete evidence and plausible triggers.
- [ ] Findings use stable IDs, severity, scope, recommendation, and eligibility.
- [ ] Duplicate spec findings were reconciled.
- [ ] Suggestions remain optional and no code was changed during review.
