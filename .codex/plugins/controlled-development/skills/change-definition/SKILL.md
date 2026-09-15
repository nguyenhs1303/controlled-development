---
name: change-definition
description: Converts a feature request or bug fix and project evidence into an approval-ready change specification that defines what evidence will prove it done. Use when scope, non-goals, acceptance criteria, risk, permissions, or verification intent must be made explicit before implementation. Do not use after an unchanged specification is already approved or for implementation planning details.
---

# Change Definition

## Overview

Define the behavior contract before choosing implementation details. First clarify it in conversation; only
after explicit write consent is the output persisted as a specification the human can approve, correct, or
reject.

Use [spec.md](../../templates/spec.md), the [output language policy](../../references/output-language-policy.md), the [decision evidence policy](../../references/decision-evidence-policy.md), the [evidence policy](../../references/evidence-policy.md), the [risk matrix](../../references/risk-matrix.md), and the [permission policy](../../references/permission-policy.md).

## Artifact Write Gate

Requirement clarification and specification writing are separate actions.

- While the user is answering questions, correcting the model, supplying evidence or schemas, or comparing
  alternatives, keep the proposed definition in the conversation and do not create or update a spec file.
- A user's answer to an open question changes the proposed content but is not consent to persist it.
- When no material open question remains, ask whether the user wants the spec created or updated.
- Persist the clarified content only after an explicit affirmative instruction. Do not ask again if the user
  already explicitly requested the write/update for the current content.
- Writing or updating the spec does not approve it. Present the resulting version and request a separate,
  explicit version-specific approval.

This gate applies to the authoritative spec, workflow mirrors, approval metadata, and evidence receipts that
would claim the clarified definition has been persisted. Read-only discovery and conversational drafts remain
allowed before consent.

## When to Use

Use when:

- a new feature, bug fix, or behavior-preserving refactor needs a contract;
- requirements contain assumptions or ambiguous words;
- scope and non-goals need separation;
- acceptance and verification conditions are not yet explicit.

Do not use to select files/tasks after approval or to rewrite an unchanged approved specification.

## Process

### 1. Restate the outcome

State who benefits, what observable outcome changes, and why. Avoid solution language unless the user mandated a constraint.

### 2. Surface assumptions

Classify each decision-relevant statement as an evidenced fact, user-confirmed decision, proposal, or unknown. Cite evidence or the user's confirmation for every material requirement.

An assumption that could change behavior, scope, acceptance, data/API compatibility, architecture, security, risk, permissions, or verification is a material unknown: turn it into a focused question and stop definition until it is resolved. Keep only demonstrably non-material implementation assumptions, labeled as such.

### 3. Bound scope

Separate:

- in-scope outcomes;
- non-goals;
- existing behavior that must remain unchanged;
- project areas likely affected;
- operations requiring separate permission.

Do not add adjacent improvements.

### 4. Write acceptance criteria

Give each criterion a stable ID. Criteria must be observable, testable, solution-independent where possible, and collectively cover the requested outcome.

Include important failure paths, boundaries, compatibility, and preservation requirements. A criterion such as "works correctly" is invalid.

Do not create a criterion from common practice, model knowledge, an adjacent implementation, or a proposal the user has not confirmed. If the source establishes current behavior but not desired behavior, ask.

### 5. Classify risk

Use the highest applicable risk factor and cite discovery evidence. Record escalation triggers that would invalidate the current profile.

### 6. Define verification intent

Map every criterion to a proposed native check or explicit manual observation and the evidence required. If meaningful verification is missing, mark the gap; do not invent a command.

### 7. Present approval packet

Present:

- objective and criteria;
- scope/non-goals;
- assumptions/open questions;
- the evidence or user-confirmation source for each material decision;
- risk/profile and reasons;
- permission-sensitive operations;
- known verification gaps.

Do not request approval while a material open question remains. If write consent has not yet been given, stop after asking whether to create or update the spec; do not present
an unwritten artifact as though it exists. After consent, persist and present the approval packet. For
Standard/Deep, stop the current turn after requesting explicit approval. Record `PENDING` until the human
approves the presented version.

## Change Control

Before approval, corrections are collected conversationally and do not automatically update the draft file;
when clarification is complete, ask for update consent. After approval, any change to behavior, scope,
criteria, risk, non-goals, or permission-sensitive operations requires both consent to write a new spec version
and approval of that new version. Clarifying wording that does not change meaning may preserve approval, but
still requires write consent before editing the artifact and the distinction must be explicit.

## Exit Criteria

- Every requested behavior maps to a criterion or open question.
- Every material criterion and scope decision traces to evidence or explicit user confirmation.
- No material unknown remains disguised as an assumption or proposal.
- Explicit consent exists for creating or updating the specification artifact.
- Scope and non-goals are unambiguous.
- Risk and verification intent use project evidence.
- Required human approval is explicit and version-specific.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The desired implementation is obvious." | Definition specifies outcomes; planning chooses implementation. |
| "Edge cases can be decided while coding." | Behavior decisions discovered in BUILD are scope drift. |
| "The adjacent feature behaves this way, so this one should too." | Existing behavior is not desired-behavior authority unless an applicable contract says so. |
| "All questions are answered, so I can update the file." | Resolution of questions is not write consent. Ask whether to create or update the spec. |
| "No response means approval." | Approval must be explicit for the presented version. |
| "This adjacent cleanup will help." | Useful but unrequested behavior belongs in non-goals or a separate change. |

## Red Flags

- Acceptance criteria contain vague adjectives with no measure.
- A material requirement has no evidence or user-confirmation source.
- A proposal is written as an approved requirement.
- A spec file or workflow mirror is written while clarification is active or before explicit write/update consent.
- File-level tasks appear in the behavioral specification.
- Assumptions are embedded as facts.
- Risk classification has no discovery evidence.
- Verification intent omits failure paths.
- Planning or BUILD begins in the approval-request turn.

## Verification

- [ ] Objective is observable and user-centered.
- [ ] Specification write/update consent was explicit and distinct from content approval.
- [ ] Scope, non-goals, preservation requirements, and assumptions are explicit.
- [ ] Material decisions cite evidence or user confirmation; unresolved ones are questions.
- [ ] Criteria are stable, testable, and collectively complete.
- [ ] Risk/profile and permission boundaries are documented.
- [ ] Every criterion has verification intent or a visible gap.
- [ ] Required approval is recorded before planning.
