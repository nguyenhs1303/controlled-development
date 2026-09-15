---
name: controlled-development
description: Guides a software change through a safe autonomous, resumable, approval-gated development workflow from intake to final review. Use when the user asks to implement a feature, bug fix, or refactor with controlled autonomy, durable evidence, bounded remediation, no commit or pull request, or an explicit stop before shipping. Do not use for a narrow standalone review, explanation-only request, or any request whose primary goal is commit, PR, merge, release, or deployment.
---

# Controlled Development

## Overview

Own the lifecycle and state of a software change while keeping product decisions and risky authority with the human. Use one main-agent context, invoke the focused phase skills when their phase begins, evaluate durable workflow learning after a clean review, and stop after the final report.

Before acting, read:

- [output language policy](../../references/output-language-policy.md)
- [decision evidence policy](../../references/decision-evidence-policy.md)
- [risk matrix](../../references/risk-matrix.md)
- [permission policy](../../references/permission-policy.md)
- [evidence policy](../../references/evidence-policy.md)
- [review policy](../../references/review-policy.md)
- [Definition of Done](../../references/definition-of-done.md)
- [learning policy](../../references/learning-policy.md)

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
  -> DEFINE
  -> SPEC APPROVAL
  -> PLAN
  -> PLAN APPROVAL (medium/high risk)
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

Classify with the risk matrix:

- **Quick:** all factors Low; concise in-conversation definition/plan; normally no artifact directory.
- **Standard:** any Medium factor; full artifact set; explicit spec approval; plan approval when required by risk.
- **Deep:** any High factor; full artifacts; both approvals; narrower increments and stronger evidence.

Escalate when new risk appears. Never silently downgrade a human-selected level.

## Artifact Contract

For Standard and Deep, create or resume:

```text
.codex/workflows/changes/<change-id>/
├── spec.md
├── plan.md
├── tasks.md
├── state.json
├── evidence.md
├── final-review.md
└── learning-retrospective.md  # only when a plugin candidate qualifies
```

Use the files in `../../templates/` as starting contracts. Project instructions may redirect the path or designate an external tracker. Never edit `.gitignore` merely to hide artifacts.

`change-id` is stable, lowercase, filesystem-safe, and unique in the project. Do not reuse an existing ID for a different outcome.

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
2. Identify whether the request names an existing change ID or a compatible active state.
3. If resuming, validate `state.json`:
   - schema version is supported;
   - terminal state is null;
   - phase and `lastCompletedPhase` form a legal transition;
   - required approvals exist before write phases;
   - attempt and cycle counters are within bounds;
   - artifact paths are safe project-relative paths; non-default roots end with the change ID and carry an approved override reference;
   - recorded Git baseline differences are understood.
4. Fail closed on malformed, future-version, ambiguous, or stale state. Report reconciliation needed; do not enter BUILD.

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

Exit: discovery evidence is sufficient to define behavior without broad repository ingestion, and no material unknown is being treated as an assumption.

### 4. DEFINE

Follow `change-definition`. Clarify testable criteria, scope, non-goals, risk, permissions, and verification
intent. Persist them only after specification write consent.

Exit: each requested behavior maps to a criterion or explicit open question, and the user has explicitly
authorized creating or updating the specification.

Do not present an approval-ready specification while any material requirement, boundary, or verification expectation lacks evidence or explicit user confirmation.

### 5. SPEC APPROVAL

Present the spec, important evidence, non-material implementation assumptions, resolved decision sources, risk, and permission-sensitive operations. Stop the current turn and require explicit human approval for every profile. Quick may use a concise inline spec; Standard/Deep persist the approval reference. Silence, lack of objection, or earlier approval of a different version is not approval.

Record the approval reference before PLAN. Corrections update the spec and require approval of the new version.
When corrections are still being discussed, collect them without editing the spec. Once no material question
remains, ask whether to update the spec; only an explicit affirmative response authorizes the new version.

### 6. PLAN

Follow `implementation-planning`. Produce dependency-ordered vertical tasks, likely files, checks, risks, and checkpoints.

If a material architecture, compatibility, data, security, or verification decision lacks evidence, return to targeted discovery/DEFINE and ask instead of selecting a conventional-looking design.

Exit: each task traces to approved criteria and has verification.

### 7. PLAN APPROVAL

Require explicit approval for medium/high risk. Low-risk Standard work may proceed only when the risk policy says approval is optional and the spec approval clearly authorized autonomous implementation.

Present architecture decisions, sensitive operations, dependencies, and verification gaps. Record the approved plan reference before BUILD.

### 8. BUILD

Follow `incremental-build` one task at a time.

Before each write, enforce the permission policy and approved-file boundary. Update task/state artifacts after each increment. Preserve unrelated changes.

For one blocker, allow at most three materially different recovery attempts. Each attempt records a changed hypothesis. On exhaustion, go to FINAL REPORT with `IMPLEMENTATION BLOCKED`.

### 9. VERIFY

Follow `change-verification`. Run focused and proportional regression checks, record receipts, and map them to criteria. A missing or unsafe check is `NOT RUN`; insufficient indirect evidence is `UNVERIFIED`.

If implementation cannot be verified because of a blocker and recovery is exhausted, choose `IMPLEMENTATION BLOCKED` and skip learning retrospective.

### 10. REVIEW

Run both skills in this order:

1. `spec-compliance-review`
2. `engineering-review`

Use the review policy. Reconcile duplicates by finding ID/evidence; do not lose a finding through summarization.

### 11. AUTO-REMEDIATE

For each finding, evaluate all remediation eligibility rules. Automatically change code only for evidenced Critical/Important findings that are unambiguous, permitted, and inside the approved spec/plan.

Do not fix Suggestions. If a blocking fix needs new scope, dependency, product judgment, or permission, return to the relevant approval gate or produce `REVIEW BLOCKED` when the current run cannot proceed.

Increment `reviewRemediationCycle` once per complete fix/re-verify/re-review cycle. Never start cycle 4.

### 12. RE-VERIFY AND RE-REVIEW

After a fix:

1. Follow `change-verification` for affected and regression checks.
2. Repeat `spec-compliance-review`.
3. Repeat `engineering-review`.
4. Close resolved finding IDs and preserve unresolved ones.

If eligible findings remain and cycles are below three, repeat. If review becomes clean, continue to LEARNING RETROSPECTIVE. Otherwise continue to FINAL REPORT with the blocking evidence.

### 13. LEARNING RETROSPECTIVE

Run `learning-retrospective` only after verification passed and both review stages have no unresolved Critical or Important findings.

The retrospective evaluates whether the completed change exposed one durable, evidence-backed improvement to this plugin. It may create `<artifactRoot>/learning-retrospective.md` with `status: proposed` for Standard/Deep when a `PLUGIN CANDIDATE` qualifies. Quick reports the result conversationally and does not create a workflow directory solely for this phase.

The retrospective never edits plugin or product files. `REPOSITORY LEARNING`, `ALREADY COVERED`, `NEEDS MORE EVIDENCE`, and `NO DURABLE LEARNING` are valid outcomes and do not create an empty candidate artifact. Learning approval is separate from feature approval and must occur after this workflow stops.

Exit: exactly one retrospective classification is available for the final report, and any candidate passed its bundled validator.

### 14. FINAL REPORT

Use `../../templates/final-review.md`. Map every criterion and required check to current evidence. List changed files, approvals, cycle counts, remaining Suggestions, unresolved findings, the retrospective result, and human action if blocked.

Select exactly one final state using the Definition of Done:

- `REVIEW PASSED`
- `REVIEW BLOCKED`
- `IMPLEMENTATION BLOCKED`

Persist the final state for Standard/Deep.

For `REVIEW PASSED`, FINAL REPORT must follow LEARNING RETROSPECTIVE, even when the result was `NO DURABLE LEARNING`. Blocked changes skip retrospective and may enter FINAL REPORT directly from BUILD, VERIFY, REVIEW, or RE-REVIEW.

### 15. STOP

Stop immediately after the final report. Do not offer or perform a shipping action as part of this workflow.

## Legal Transitions

| From | To | Gate |
|---|---|---|
| BOOTSTRAP | INTAKE | State source checked |
| INTAKE | DISCOVER | Request discoverable |
| DISCOVER | DEFINE | Context sufficient |
| DEFINE | SPEC APPROVAL | Spec draft complete |
| SPEC APPROVAL | PLAN | Explicit approval |
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
- [ ] Profile/risk has evidence and all escalations were honored.
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
