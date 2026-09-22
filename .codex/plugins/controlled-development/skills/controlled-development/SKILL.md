---
name: controlled-development
description: Guides a software change through a safe autonomous, resumable, approval-gated development workflow from intake to final review. Use when the user asks to implement a feature, bug fix, or refactor with controlled autonomy, durable evidence, bounded remediation, no commit or pull request, or an explicit stop before shipping. Do not use for a narrow standalone review, explanation-only request, or any request whose primary goal is commit, PR, merge, release, or deployment.
---

# Controlled Development

## Overview

Own the lifecycle and state of a software change while keeping product decisions and risky authority with the human. Use one main-agent context, invoke the focused phase skills when their phase begins, evaluate durable workflow learning after a clean review, and stop after the final report.

Before acting, read:

- [output language policy](../../references/policies/output-language-policy.md)
- [decision evidence policy](../../references/policies/decision-evidence-policy.md)
- [risk matrix](../../references/policies/risk-matrix.md)
- [solution design policy](../../references/policies/solution-design-policy.md)
- [permission policy](../../references/policies/permission-policy.md)
- [evidence policy](../../references/policies/evidence-policy.md)
- [review policy](../../references/policies/review-policy.md)
- [Definition of Done](../../references/policies/definition-of-done.md)
- [learning policy](../../references/policies/learning-policy.md)
- [workflow state schema](../../references/schemas/workflow-state-schema.md)

## When to Use

Use this skill when:

- a feature or meaningful behavior change should be developed end to end;
- the user wants explicit specification or plan approval gates;
- work may span sessions and needs durable state;
- verification claims require concrete receipts;
- serious review findings may be fixed automatically inside approved scope.

Do not use this orchestrator when:

- the user only wants an explanation, investigation, plan, or standalone review;
- a one-line unambiguous edit is requested without the controlled workflow;
- the primary requested outcome is commit, push, PR, merge, release, or deploy;
- another active controlled change would be overwritten or confused.

Use the narrow phase skill directly for a phase-only request.

## Absolute Boundary

This workflow never stages, commits, pushes, creates/updates a pull request, merges, releases, deploys, accesses production, or mutates real customer/user data. Human approval cannot convert those operations into part of this plugin; use a separate workflow after Controlled Development stops.

## State Machine

```text
BOOTSTRAP
  -> INTAKE
  -> DISCOVER
  -> TRIAGE
  -> DEFINE
  -> SPEC APPROVAL
  -> SOLUTION DESIGN
  -> SOLUTION APPROVAL
  -> PLAN
  -> PLAN APPROVAL (Deep or sensitive execution)
  -> BUILD
  -> VERIFY
  -> REVIEW
  -> AUTO-REMEDIATE
  -> RE-VERIFY
  -> RE-REVIEW
  -> LEARNING RETROSPECTIVE
  -> FINAL REPORT
  -> STOP
```

AUTO-REMEDIATE, RE-VERIFY, and RE-REVIEW form a loop of at most three complete cycles. Skip the loop when no eligible finding exists.

## Workflow Profiles

Classify with the risk matrix after focused discovery:

- **Quick:** all factors Low; no specification or solution artifact; proceed from evidenced triage to the bounded
  change requested by the user, then verify and review. A small diff alone does not prove Quick.
- **Standard:** any Medium factor; full artifact set; explicit specification approval; `SOLUTION LITE` and
  explicit solution approval; separate plan approval only for sensitive execution or stricter project policy.
- **Deep:** any High factor; full artifacts; explicit specification, `FULL SOLUTION`, solution, and plan
  approvals; narrower increments and stronger evidence.

Escalate when new risk appears. Never silently downgrade a human-selected level.

## Artifact Contract

For Standard and Deep, create or resume:

```text
.codex/workflows/changes/<change-id>/
├── spec.md
├── solution.md
├── plan.md
├── tasks.md
├── state.json
├── evidence.md
├── final-review.md
└── learning-retrospective.md  # only when a plugin candidate qualifies
```

Use the files in `../../assets/workflow-templates/` as starting contracts. Project instructions may redirect the path or designate an external tracker. Never edit `.gitignore` merely to hide artifacts.

New Standard/Deep changes use state schema version 3. Existing schema-version-1 and schema-version-2 changes may
resume through their recorded semantics; do not silently migrate them or inject new phases into an approved
legacy change.

`change-id` is stable, lowercase, filesystem-safe, and unique in the project. Do not reuse an existing ID for a different outcome.

## Controller Ownership

After the initial schema-3 compatibility state or schema-4 enforcement `state.json` is copied from the template, the controller exclusively owns
`phase`, `lastCompletedPhase`, `terminalState`, `approvals`, `revision`, `lastEventSequence`, `lastEventHash`,
and `updatedAt`. The agent must not edit them directly.

Use `node ../../scripts/runtime/workflow-controller.mjs` from the plugin root, resolving the installed-plugin equivalent
when invoked elsewhere:

- read-only inspection: `status`, `validate-state`, `check-resume`, `hash-artifact`;
- approval: `approve --gate <spec|solution|plan> --expected-revision <n> --reference <text>`;
- phase change: `transition --to <PHASE> --expected-revision <n>`;
- allowlisted task/evidence/baseline metadata: `record --patch-file <json> --expected-revision <n>`.

For schema 4, activate the one-change checkout binding and readiness proof before tool authorization:
`activate --checkout <root> --policy <execution-policy.json> --expected-revision <n>`, then
`ready --proof <proof>`. Use `authorize` for machine-readable decisions and `bind-evidence` after current
implementation checks. Hooks are thin adapters; they do not duplicate task or phase policy.

Use the revision returned by the latest controller receipt for every mutation and save the JSON receipt in
`evidence.md`. Never compensate for a controller failure by editing `state.json`, event files, lock files, or
revision fields manually.

## Specification Write Consent

Clarifying requirements is not permission to create or update a specification. While the user is answering
questions, correcting interpretations, comparing options, or otherwise making the requirement precise:

- keep the working definition in the conversation;
- do not create or update the authoritative spec, its workflow mirror, approval metadata, or evidence that
  claims the unsettled definition is captured;
- do not treat a schema, example, correction, answer, or "no more questions" response as write consent.

When no material clarification question remains, ask whether the user wants the specification created or
updated. Write it only after an explicit affirmative instruction such as "write the spec", "update the spec",
or an equivalent unambiguous response. If the user already gave that instruction for the current clarified
content, do not ask redundantly.

Consent to write or update a spec is separate from approval of that spec. After writing, present the exact
version and obtain explicit approval before PLAN. An instruction to clarify, write, update, review, or inspect
a spec does not by itself approve it.

## Decision Evidence Gate

At every phase, classify material statements using the decision evidence policy. Requirements and plan decisions must be supported by project evidence or explicit human confirmation. Proposals remain proposals.

When missing, conflicting, or insufficient evidence could change behavior, scope, acceptance, data/API compatibility, architecture, security, risk, permissions, or verification, ask the minimum focused question and stop the current phase. Do not silently choose a likely default or carry the uncertainty forward as an assumption.

Non-material mechanical implementation details may be chosen autonomously when they stay inside approved boundaries, follow evidenced conventions where available, and are local and reversible.

## Phase Procedure

### 1. BOOTSTRAP

1. Check for `AGENTS.md`, `CLAUDE.md`, and other applicable project instructions before repository exploration.
2. If repository instructions still contain starter placeholders, do not invoke `repository-bootstrap` automatically. Report that the user may explicitly run `$repository-bootstrap`; continue only when the current change has enough task-specific evidence, otherwise stop on the missing evidence.
3. Identify whether the request names an existing change ID or a compatible active state.
4. If resuming, run controller `check-resume` before any write, then validate that:
   - schema version is supported;
   - terminal state is null;
   - phase and `lastCompletedPhase` form a legal transition;
   - required approvals exist before write phases;
   - attempt and cycle counters are within bounds;
   - artifact paths are safe project-relative paths; non-default roots end with the change ID and carry an approved override reference;
   - recorded Git baseline differences are understood.
5. Fail closed on malformed, future-version, ambiguous, or stale state. Report reconciliation needed; do not enter BUILD.

Exit: instructions and a trustworthy state source are known.

### 2. INTAKE

1. Restate outcome, scope, constraints, acceptance signals, and non-goals.
2. Surface evidenced facts, user-confirmed decisions, proposals, and unresolved material questions separately.
3. Select the workflow profile with evidence from the risk matrix.
4. For Standard/Deep, initialize specification/workflow artifacts only after specification write consent.
   Until then, retain the working definition in the conversation without claiming it is persisted or approved.

Exit: the request is clear enough for task-relevant discovery.

### 3. DISCOVER

Follow `project-discovery`. Record applicable instructions, native commands, relevant patterns/modules, Git state, CI facts, and gaps.

Exit: discovery evidence is sufficient to classify task-relevant risk and define behavior without broad repository ingestion, and no material unknown is being treated as an assumption.

### 4. TRIAGE

1. Apply the risk matrix using evidence from DISCOVER, not diff-size intuition.
2. Record the profile, highest risk factors, evidence excluding higher-risk triggers, solution mode, approval
   gates, and escalation triggers.
3. Select:
   - Quick -> solution mode `none`; no separate specification or solution artifact/gate.
   - Standard -> solution mode `lite`; specification and solution approvals required.
   - Deep -> solution mode `full`; specification, solution, and plan approvals required.
4. If material evidence needed for classification is missing, ask one focused question and stop. Do not claim
   Quick merely because no risk was noticed.

Quick exits directly to BUILD only when the implementation request is explicit, local, reversible, and all
risk factors are evidenced Low. Standard and Deep continue to DEFINE.

Exit: profile, solution mode, approval gates, and escalation triggers are evidence-backed.

### 5. DEFINE

Follow `change-definition`. Clarify testable criteria, scope, non-goals, risk, permissions, and verification
intent. Persist them only after specification write consent.

Exit: each requested behavior maps to a criterion or explicit open question, and the user has explicitly
authorized creating or updating the specification.

Do not present an approval-ready specification while any material requirement, boundary, or verification expectation lacks evidence or explicit user confirmation.

Quick skips DEFINE and SPEC APPROVAL as separate phases. Its approved scope is the user's explicit,
unambiguous implementation request plus the triage boundary; any new material choice escalates before writing.

### 6. SPEC APPROVAL

Present the spec, important evidence, non-material implementation assumptions, resolved decision sources, risk,
and permission-sensitive operations. Stop the current turn and require explicit human approval for Standard and
Deep. Persist the approval reference. Silence, lack of objection, or earlier approval of a different version is
not approval.

Record the approval with controller `approve` before SOLUTION DESIGN and save its receipt. Corrections update the
spec and require approval of the new version.
When corrections are still being discussed, collect them without editing the spec. Once no material question
remains, ask whether to update the spec; only an explicit affirmative response authorizes the new version.

### 7. SOLUTION DESIGN

Follow `solution-design`:

- Standard produces `SOLUTION LITE`.
- Deep produces `FULL SOLUTION`.

Decision drivers must precede options. Include measurable quality scenarios only when relevant; never invent
targets. Compare realistic options, recommend one, describe architecture/pattern/technology consequences, and
define verification plus revisit conditions.

If missing evidence can change the recommendation, ask and stop instead of carrying a material assumption.

Exit: the exact solution version is approval-ready with no material unknown presented as fact.

### 8. SOLUTION APPROVAL

Present decision drivers, material evidence, options and trade-offs, recommendation, proposed architecture,
patterns, technology/dependency impact, performance and other quality implications, verification conditions,
revisit conditions, and unresolved questions. Stop the current turn and require explicit human approval.

Record the approved solution version/reference with controller `approve` before PLAN. Corrections that materially change the solution
require approval of the new version. Solution approval does not itself authorize permission-gated dependency,
migration, CI, infrastructure, public-interface, destructive, or external operations.

### 9. PLAN

Follow `implementation-planning`. Produce dependency-ordered vertical tasks, likely files, checks, risks, and
checkpoints traced to the approved specification and solution.

If planning discovers a material architecture, compatibility, data, security, dependency, performance, or
verification decision not covered by the approved solution, return to SOLUTION DESIGN instead of selecting a
conventional-looking design.

Exit: each task traces to approved criteria and has verification.

### 10. PLAN APPROVAL

Require explicit approval for Deep and for Standard plans with sensitive, destructive, difficult-to-reverse,
permission-gated, or project-policy-gated execution. Standard may proceed without a separate plan approval when
the approved solution fixed all material direction and the plan is bounded and reversible.

Present task order, sensitive operations, permission gates, and verification gaps. Do not reopen architecture
in the plan packet. Record the approved plan reference with controller `approve` before BUILD when required.

### 11. BUILD

Follow `incremental-build` one task at a time.

Before each write, enforce the permission policy and approved-file boundary. Update task/evidence artifacts and
use controller `record` for allowlisted state metadata after each increment. Preserve unrelated changes.

For Quick, preserve the triage boundary and use concise conversational task/evidence tracking rather than
creating a workflow directory solely for the change.

For one blocker, allow at most three materially different recovery attempts. Each attempt records a changed hypothesis. On exhaustion, go to FINAL REPORT with `IMPLEMENTATION BLOCKED`.

### 12. VERIFY

Follow `change-verification`. Run focused and proportional regression checks, record receipts, and map them to criteria. A missing or unsafe check is `NOT RUN`; insufficient indirect evidence is `UNVERIFIED`.

If implementation cannot be verified because of a blocker and recovery is exhausted, choose `IMPLEMENTATION BLOCKED` and skip learning retrospective.

### 13. REVIEW

Run both skills in this order:

1. `spec-compliance-review`
2. `engineering-review`

Use the review policy. Reconcile duplicates by finding ID/evidence; do not lose a finding through summarization.

### 14. AUTO-REMEDIATE

For each finding, evaluate all remediation eligibility rules. Automatically change code only for evidenced
Critical/Important findings that are unambiguous, permitted, and inside the applicable Quick triage boundary or
approved specification/solution/plan.

Do not fix Suggestions. If a blocking fix needs new scope, dependency, product judgment, or permission, return to the relevant approval gate or produce `REVIEW BLOCKED` when the current run cannot proceed.

Increment `reviewRemediationCycle` once per complete fix/re-verify/re-review cycle. Never start cycle 4.

### 15. RE-VERIFY AND RE-REVIEW

After a fix:

1. Follow `change-verification` for affected and regression checks.
2. Repeat `spec-compliance-review`.
3. Repeat `engineering-review`.
4. Close resolved finding IDs and preserve unresolved ones.

If eligible findings remain and cycles are below three, repeat. If review becomes clean, continue to LEARNING RETROSPECTIVE. Otherwise continue to FINAL REPORT with the blocking evidence.

### 16. LEARNING RETROSPECTIVE

Run `learning-retrospective` only after verification passed and both review stages have no unresolved Critical or Important findings.

The retrospective evaluates whether the completed change exposed one durable, evidence-backed improvement to this plugin. It may create `<artifactRoot>/learning-retrospective.md` with `status: proposed` for Standard/Deep when a `PLUGIN CANDIDATE` qualifies. Quick reports the result conversationally and does not create a workflow directory solely for this phase.

The retrospective never edits plugin or product files. `REPOSITORY LEARNING`, `ALREADY COVERED`, `NEEDS MORE EVIDENCE`, and `NO DURABLE LEARNING` are valid outcomes and do not create an empty candidate artifact. Learning approval is separate from feature approval and must occur after this workflow stops.

Exit: exactly one retrospective classification is available for the final report, and any candidate passed its bundled validator.

### 17. FINAL REPORT

Use `../../assets/workflow-templates/final-review.md`. Map every criterion and required check to current evidence. List changed files, approvals, cycle counts, remaining Suggestions, unresolved findings, the retrospective result, and human action if blocked.

Select exactly one final state using the Definition of Done:

- `REVIEW PASSED`
- `REVIEW BLOCKED`
- `IMPLEMENTATION BLOCKED`

Persist the final state for Standard/Deep.

For `REVIEW PASSED`, FINAL REPORT must follow LEARNING RETROSPECTIVE, even when the result was `NO DURABLE LEARNING`. Blocked changes skip retrospective and may enter FINAL REPORT directly from BUILD, VERIFY, REVIEW, or RE-REVIEW.

### 18. STOP

Stop immediately after the final report. Do not offer or perform a shipping action as part of this workflow.

## Legal Transitions

| From | To | Gate |
|---|---|---|
| BOOTSTRAP | INTAKE | State source checked |
| INTAKE | DISCOVER | Request discoverable |
| DISCOVER | TRIAGE | Task-relevant risk evidence sufficient |
| TRIAGE | BUILD | Quick; every risk factor Low and scope unambiguous |
| TRIAGE | DEFINE | Standard or Deep |
| DEFINE | SPEC APPROVAL | Spec draft complete |
| SPEC APPROVAL | SOLUTION DESIGN | Explicit specification approval |
| SOLUTION DESIGN | SOLUTION APPROVAL | Solution version approval-ready |
| SOLUTION APPROVAL | PLAN | Explicit solution approval |
| PLAN | PLAN APPROVAL or BUILD | Risk rule applied |
| PLAN APPROVAL | BUILD | Explicit approval |
| BUILD | VERIFY | Tasks implemented |
| BUILD | FINAL REPORT | Implementation blocker exhausted |
| VERIFY | REVIEW | Required evidence collected |
| VERIFY | FINAL REPORT | Verification/implementation blocker exhausted |
| REVIEW | AUTO-REMEDIATE | Eligible serious finding exists |
| REVIEW | LEARNING RETROSPECTIVE | Clean review |
| REVIEW | FINAL REPORT | Non-remediable blocker |
| AUTO-REMEDIATE | RE-VERIFY | Eligible fix applied |
| RE-VERIFY | RE-REVIEW | Current evidence recorded |
| RE-REVIEW | AUTO-REMEDIATE | Eligible findings remain and cycles < 3 |
| RE-REVIEW | LEARNING RETROSPECTIVE | Clean review |
| RE-REVIEW | FINAL REPORT | Blocked or cycles = 3 |
| LEARNING RETROSPECTIVE | FINAL REPORT | One classification recorded; candidate validated when present |
| FINAL REPORT | STOP | One terminal state recorded |

Any transition not listed is forbidden.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The user approved the idea, so the spec is approved." | Approval applies to the presented artifact/version, not a vague intent. |
| "The user answered every question, so I should update the spec." | Answers resolve content; they do not authorize an artifact write. Ask whether to create or update the spec. |
| "The user pasted a schema, so it belongs in the spec now." | Evidence supplied during clarification remains conversational until the user authorizes the spec write. |
| "This new issue is close enough to scope." | New behavior returns to an approval gate. Similar is not approved. |
| "The docs are silent, but the intended answer is probably obvious." | Material silence is an open question, not permission to infer. |
| "The change is one line, so it is Quick." | Risk and blast radius determine the profile; line count does not. |
| "The approved spec tells me which architecture to use." | Specification defines outcomes; the solution version selects material technical direction. |
| "I can settle the pattern or dependency while planning." | Material solution changes return to SOLUTION DESIGN and approval. |
| "The test probably passes from inspection." | Only an executed successful check is `PASS`. |
| "One more retry might work." | Attempt 4 hides a blocker instead of resolving it. Stop with evidence. |
| "A suggestion is easy, so I can include it." | Suggestions are reported, never auto-fixed. |
| "A completed feature should update the plugin immediately." | Retrospective creates at most one proposed candidate; plugin mutation requires a separate approved change. |
| "No correction means the workflow pattern was accepted." | Silence is not evidence and cannot support a learning candidate. |
| "Review passed, so I should open a PR." | Shipping is outside this plugin. FINAL REPORT is followed only by STOP. |

## Red Flags

- Repository exploration before reading project instructions.
- A spec or workflow artifact is created/updated while requirements are still being clarified or before explicit
  specification write consent.
- A material conclusion in discovery, spec, plan, or BUILD lacks evidence or explicit user confirmation.
- Quick is selected without evidence excluding every Medium/High trigger.
- Standard or Deep reaches PLAN without an approved solution version.
- Options are invented to meet a fixed count, or appear before decision drivers.
- A performance claim is presented as fact without measurement/evidence classification.
- BUILD begins without the required approval record.
- Quick remains selected after a Medium/High factor appears.
- A write target is not in approved scope.
- `PASS` has no executed receipt.
- The same failed command is rerun with no changed hypothesis.
- A Suggestion causes a code edit.
- A fourth remediation cycle begins.
- A clean review bypasses LEARNING RETROSPECTIVE.
- A learning candidate is based on silence, effort, project-domain behavior, or unverified recollection.
- Retrospective changes plugin or product files, or marks a candidate approved.
- A final report omits unresolved or unverified items.
- Any staging, commit, PR, merge, release, deploy, production, or real-data action occurs.

## Verification

Before STOP, confirm:

- [ ] Project instructions were applied before discovery.
- [ ] Specification artifacts were written only after explicit write/update consent.
- [ ] Material decisions are traceable to evidence or user confirmation; proposals and unknowns were not promoted to facts.
- [ ] Profile/risk, solution mode, and skipped gates have evidence; all escalations were honored.
- [ ] Standard/Deep has an approved solution version with decision drivers, quality implications, verification, and revisit conditions.
- [ ] Planning traces to the approved solution and introduced no material architecture decision.
- [ ] Required approvals exist before BUILD.
- [ ] Every task and criterion has a traceable outcome.
- [ ] Verification statuses obey the evidence policy.
- [ ] Both review stages ran in order.
- [ ] Only eligible findings were remediated.
- [ ] Recovery and remediation limits were not exceeded.
- [ ] Clean review completed LEARNING RETROSPECTIVE; blocked changes recorded why it was skipped.
- [ ] Any learning candidate is evidence-backed, validated, status `proposed`, and caused no plugin mutation.
- [ ] Exactly one terminal state is recorded.
- [ ] The final action is report then STOP, with no shipping operation.
