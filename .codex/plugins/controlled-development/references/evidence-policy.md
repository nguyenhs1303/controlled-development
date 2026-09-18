# Evidence Policy

Collect evidence continuously, but surface it where it supports a decision: approvals, blockers, remediation, and the final report.

Use the [decision evidence policy](decision-evidence-policy.md) to distinguish evidenced facts, user-confirmed decisions, proposals, and unknowns. A plausible inference is not evidence for a material workflow decision.

## Status vocabulary

| Status | Meaning | Minimum evidence |
|---|---|---|
| `PASS` | The named check ran successfully | Command/check identity, working directory or target, exit/result, and relevant output |
| `FAIL` | The named check ran and failed | Same receipt fields plus the observed failure |
| `NOT RUN` | The check was not executed | A concrete reason, such as unavailable tool, unsafe effect, or explicit scope decision |
| `UNVERIFIED` | Available evidence cannot establish the claim | What evidence exists, what is missing, and why inference is insufficient |

`PASS` is never inferred from source inspection, another check, a previous run before later edits, or the absence of an observed error.

## Classification examples

| Observation | Status | Why |
|---|---|---|
| `node --test` ran in the fixture and exited 0 | `PASS` | The named check executed successfully with a receipt |
| `python -m unittest` ran and exited 1 | `FAIL` | The check executed and the failure is observable |
| `mypy` is unavailable and dependency installation is not approved | `NOT RUN` | The check did not execute and the limitation is explicit |
| Compatibility is asserted only from source inspection | `UNVERIFIED` | Available evidence cannot prove the runtime claim |

## Receipt fields

Every executed check records:

- stable receipt ID;
- timestamp or session reference;
- command or manual check description;
- working directory or inspected target;
- exit code or explicit result;
- status;
- concise relevant output;
- criteria/tasks/findings supported;
- Git baseline or changed-file state when relevant.

Do not paste secrets or unnecessary full logs into evidence artifacts.

## Freshness

Evidence becomes stale when relevant files change after the check. Re-run affected focused checks and enough regression coverage to support the new claim. Repeating a check on unchanged code adds no evidence.

## Approval evidence

At specification approval, surface:

- important discovery facts and their sources;
- non-material implementation assumptions and unresolved material questions;
- scope, non-goals, and risk reasons;
- operations that will require separate permission.

At plan approval, surface:

- approved solution reference and dependency order;
- sensitive or difficult-to-reverse steps;
- proposed verification coverage and known gaps.

At solution approval, surface:

- decision drivers and their evidence;
- realistic options, trade-offs, and recommendation;
- architecture/pattern/technology/dependency impact;
- quality scenarios and confidence of performance or reliability claims;
- verification and revisit conditions;
- material unknowns, which must be resolved before approval.

## Blocker evidence

Record the blocker identity, expected behavior, exact observed result, attempt number, hypothesis, action taken, and what changed from the previous attempt. Three repetitions of the same action are not three meaningful recovery attempts.

## Remediation evidence

Every automatic fix links:

1. one eligible Critical or Important finding;
2. the concrete changed files/behavior;
3. focused re-verification receipts;
4. regression receipts;
5. both subsequent review results.

## Acceptance-criterion matrix

The final report maps every approved criterion to implementation evidence and verification status. A criterion with only indirect evidence remains `UNVERIFIED`; it prevents `REVIEW PASSED` when the Definition of Done requires verification.

## Honesty rules

- Report exact limitations without softening them.
- Distinguish observed facts from interpretations.
- Do not claim the full suite passed after running a focused test only.
- Do not claim a build passed because tests passed.
- Do not convert a tool or environment failure into a product-code failure without evidence.
