# Review Policy

Review runs in two ordered stages. Specification compliance comes first so engineering quality is evaluated against the intended change rather than an inferred one.

## Stage 1: Specification compliance

For every applicable Quick outcome or approved Standard/Deep acceptance criterion, classify the implementation as:

- satisfied;
- missing;
- incorrectly implemented;
- implemented but unverified.

Also identify extra behavior that was not approved. Extra behavior is a scope finding even when it appears useful.

Every finding cites the criterion, affected file or artifact, concrete evidence, and the observable mismatch.

For schema v4 changes, compliance review also checks that the active binding and policy digest are current, required readiness proof exists, no unresolved enforcement violation remains, and verification receipts match the current implementation snapshot. A disabled or untrusted hook is an explicit non-pass condition, not an inferred success.

## Stage 2: Engineering quality

Review the approved implementation for:

- correctness and error handling;
- security and trust boundaries;
- readability and maintainability;
- architecture and project conventions;
- performance and bounded resource use;
- test quality and regression coverage;
- compatibility and public-interface impact.

Review rule IDs from the central controller registry; do not invent adapter-specific aliases or duplicate the phase matrix.

## Finding format

Each finding contains:

- stable finding ID;
- severity: Critical, Important, or Suggestion;
- title;
- affected file/location or artifact;
- concrete evidence;
- triggering condition and its likelihood/context;
- consequence;
- approved-scope status;
- recommended action;
- remediation eligibility.

## Severity

### Critical

Likely or plausible data loss, security compromise, broken core behavior, unsafe external effect, or a fundamental specification violation. Critical findings block review.

### Important

A real correctness, maintainability, test, compatibility, performance, or scope defect that should be fixed before acceptance. Important findings block review.

### Suggestion

An optional improvement, preference, or low-impact opportunity. Suggestions never trigger automatic code changes and do not block `REVIEW PASSED` when all required criteria and checks pass.

## Evidence threshold

A blocking finding must name the condition under which it occurs and connect that condition to real project inputs, invariants, configuration, or code paths. If the concern cannot be verified, label it `UNVERIFIED` and request targeted evidence; do not automatically remediate speculation.

Downgrade when evidence shows the triggering condition is unreachable or remote. Do not drop the observation; explain the downgrade.

## Automatic remediation eligibility

A finding is eligible only when all are true:

1. Severity is Critical or Important.
2. Evidence meets the blocking threshold.
3. The fix is inside the applicable Quick triage boundary or approved specification, solution, and plan.
4. The operation is allowed by the permission policy.
5. The expected correction is unambiguous.
6. The review-remediation cycle limit has not been reached.

If any condition is false, report the finding and stop for human direction when it blocks completion.

Examples:

- An evidenced Important correctness defect inside approved scope is eligible for automatic remediation.
- A naming preference remains a Suggestion and is not eligible.
- A plausible but unreproduced remote concern remains `UNVERIFIED` until targeted evidence exists.
- An evidenced Critical defect outside approved scope remains blocking but is not auto-fixed; request human direction.

## Re-review

After any remediation:

1. Re-run affected focused checks.
2. Run enough regression coverage for the impact.
3. Repeat specification compliance review.
4. Repeat engineering quality review.
5. Reconcile repeated or duplicate findings by stable ID.

The same unresolved finding across cycles remains blocking and counts toward the three-cycle limit.
