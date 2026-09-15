---
name: learning-retrospective
description: Analyzes verified and reviewed software changes for durable evidence-backed workflow learning and proposes one human-approved plugin candidate. Use when running a post-change retrospective or deciding whether a completed change should improve Controlled Development; do not use for implementation, ordinary code review, or direct plugin mutation.
---

# Learning Retrospective

## Overview

Evaluate a completed, verified, and reviewed change for one durable improvement to the Controlled Development plugin. Produce an approval-ready proposal only when current evidence supports it. Never modify the plugin in this skill.

Before acting, read:

- [output language policy](../../references/output-language-policy.md)
- [decision evidence policy](../../references/decision-evidence-policy.md)
- [learning policy](../../references/learning-policy.md)
- [evidence policy](../../references/evidence-policy.md)

Use [learning-retrospective.md](../../templates/learning-retrospective.md) only for a qualifying `PLUGIN CANDIDATE`.

## Preconditions

- Implementation reached verification and both ordered review stages.
- No unresolved evidenced Critical or Important finding remains.
- The current spec, plan when present, tasks, evidence, reviews, and changed-file diff are available.
- The retrospective write target, when used, is the current change artifact root.

If the change is implementation- or review-blocked, report `Retrospective: SKIPPED` with the blocker reason. Do not turn an unresolved attempt into a lesson.

## Procedure

### 1. Assemble evidence

Read the approved specification, plan when present, task outcomes, evidence receipts, specification-compliance review, engineering review, and final changed-file diff. Record explicit user corrections separately from model observations.

Do not infer learning from silence, smooth completion, naming, adjacent code, or recalled conversation details that have no current reference.

### 2. Identify the strongest observation

Look for an evidenced gap in the reusable workflow contract, including approval, evidence, permission, state, verification, review, recovery, or phase ownership. Exclude product-domain rules and routine implementation facts.

Apply the durability counterfactual from the learning policy. Keep at most one observation: the one with the greatest demonstrated recurrence or risk-reduction value.

### 3. Check current coverage

Inspect the current plugin skills, references, templates, scripts, and evals that could own the behavior. Distinguish:

- missing guidance;
- contradictory guidance;
- guidance that exists but was demonstrably ineffective;
- behavior already adequately covered.

Do not claim a guidance failure merely because the agent made a mistake once. Cite the instruction and the execution evidence that shows why a change may be warranted.

### 4. Classify

Choose exactly one classification defined by the learning policy:

- `PLUGIN CANDIDATE`
- `REPOSITORY LEARNING`
- `ALREADY COVERED`
- `NEEDS MORE EVIDENCE`
- `NO DURABLE LEARNING`

If a material question prevents plugin classification, use `NEEDS MORE EVIDENCE`, state the minimum focused question, and do not write a candidate. This uncertainty does not change the completed feature's terminal result because no plugin mutation is authorized.

### 5. Draft and validate a candidate

For `PLUGIN CANDIDATE` only:

1. Copy the template to `<artifactRoot>/learning-retrospective.md` for Standard/Deep. Quick remains conversational and does not create a workflow directory solely for retrospective output.
2. Replace every placeholder and keep `status: proposed`, `classification: PLUGIN CANDIDATE`, and `pluginMutation: none`.
3. Cite concrete evidence for the observation and every proposed target.
4. Propose the smallest existing owner update before proposing a new skill or subsystem.
5. Include at least one regression eval with observable before/after behavior.
6. Run `node ../../scripts/validate-learning-retrospective.mjs <artifact-path>` from the skill directory or resolve the equivalent installed-plugin path.
7. If validation fails, correct the artifact and rerun it. Do not call the candidate approval-ready until validation passes.

The retrospective may write only its approved workflow artifact. It must not edit product files or plugin source.

### 6. Return the result

Report:

- classification;
- candidate ID and artifact path when created;
- evidence summary;
- why the candidate is durable or why no candidate qualifies;
- unresolved question when classification is `NEEDS MORE EVIDENCE`;
- `Plugin mutation: none`;
- the exact approval boundary.

Do not request or treat approval as part of the completed feature. A later explicit approval must name the candidate and is input to a separate Controlled Development plugin change.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The feature took a long time, so something must be learned." | Effort is not evidence of durable workflow value. |
| "The user did not correct this pattern." | Silence does not establish preference or correctness. |
| "This project rule could help all projects." | Project evidence does not establish plugin-wide applicability. |
| "A candidate is harmless, so I can update the plugin now." | A proposal carries no mutation authority. |
| "The plugin already says this, so repeat it more strongly." | First determine whether coverage is missing, contradictory, ineffective, or already adequate. |
| "Several possible lessons should be captured together." | Select one supported candidate; batching obscures evidence and ownership. |

## Red Flags

- Retrospective begins before verification and both reviews complete.
- A blocked or unverified attempt is described as a solved lesson.
- A project-domain convention is promoted to plugin policy.
- Applicability is inferred from one incident without stated limits.
- Candidate evidence points only to model reasoning or chat memory.
- Existing plugin coverage is not inspected.
- A candidate omits a before/after eval.
- `status` is written as approved without a separate explicit approval.
- Any plugin, marketplace, installed-cache, or product file is changed during retrospective.

## Verification

Before returning:

- [ ] Preconditions are evidenced or retrospective is explicitly skipped.
- [ ] Exactly one classification is reported.
- [ ] Every material claim has a current evidence pointer.
- [ ] The durability counterfactual was applied.
- [ ] Existing plugin coverage and overlap were checked.
- [ ] At most one candidate was produced.
- [ ] A written candidate has status `proposed`, no plugin mutation, and a concrete eval.
- [ ] The bundled candidate validator passed when an artifact was written.
- [ ] No plugin or product file was modified.
- [ ] Approval is deferred to a separate, explicitly authorized plugin change.

