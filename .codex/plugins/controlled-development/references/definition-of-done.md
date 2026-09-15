# Definition of Done

A change is done only when the selected terminal-state conditions are supported by current evidence.

## Common requirements

- An approved specification exists; Standard and Deep persist it in the change artifacts.
- Required plan approval exists for medium/high-risk work.
- Implementation remains inside approved scope and permission boundaries.
- Every task has a terminal task status and evidence reference.
- Every acceptance criterion has an explicit outcome.
- Required project-native checks have current evidence or an honest non-pass status.
- Specification compliance review completed before engineering review.
- No unresolved evidenced Critical or Important finding is hidden.
- Automatic remediation and recovery limits were respected.
- Clean review completed learning retrospective; blocked changes record that retrospective was skipped.
- Any learning candidate remains a validated proposal and caused no plugin mutation.
- Unrelated user changes were preserved.
- Final report lists changed files, evidence, residual risks, and unverified items.
- No shipping operation occurred.

## REVIEW PASSED

Use only when:

- all approved acceptance criteria are satisfied;
- required verification is `PASS` with current receipts;
- both review stages have no unresolved Critical or Important findings;
- learning retrospective completed with exactly one classification, whether or not a candidate qualified;
- any candidate has current evidence, a proposed regression eval, `status: proposed`, and `pluginMutation: none`;
- Suggestions and residual risks are disclosed;
- no permission or scope violation occurred.

## REVIEW BLOCKED

Use when BUILD and verification reached review, but:

- an evidenced Critical or Important finding remains unresolved;
- remediation needs new scope, permission, dependency, or product judgment;
- verification required for acceptance cannot be established after implementation;
- the three-cycle review-remediation limit is reached.

## IMPLEMENTATION BLOCKED

Use when BUILD or VERIFY cannot complete because of:

- an unresolved environment or dependency problem;
- ambiguous or conflicting requirements;
- a permission boundary;
- a missing required project input;
- three exhausted recovery attempts for the same blocker.

## Stop condition

After writing the final report and setting one terminal state, stop. Candidate approval and plugin implementation occur only in a later, separate Controlled Development change. Do not stage, commit, push, create a pull request, merge, release, deploy, or modify production/real data.
