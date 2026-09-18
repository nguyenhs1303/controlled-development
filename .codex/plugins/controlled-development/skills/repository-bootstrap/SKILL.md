---
name: repository-bootstrap
description: Initializes evidence-backed repository instructions after a starter `.codex` directory and `AGENTS.md` are copied into a project. Use when the user explicitly invokes repository bootstrap or asks to resume it; do not use automatically for ordinary discovery, feature work, or repository review.
---

# Repository Bootstrap

## Overview

Turn the copied Codex starter kit into repository-specific instructions through an explicit, resumable, evidence-gated workflow. Never invoke this skill automatically because instructions contain placeholders.

Before acting, read:

- [output language policy](../../references/output-language-policy.md)
- [decision evidence policy](../../references/decision-evidence-policy.md)
- [repository bootstrap policy](../../references/repository-bootstrap-policy.md)
- [evidence policy](../../references/evidence-policy.md)

## Invocation Gate

Proceed only when the user explicitly invokes `$repository-bootstrap`, asks to run repository bootstrap, or asks to resume an existing bootstrap state. An ordinary feature request, repository question, or discovery request is not authorization.

If repository instructions still contain starter placeholders during another workflow, report that bootstrap is available and wait for explicit invocation. Do not silently bootstrap first.

## One-Invocation Continuation

One explicit invocation authorizes the bootstrap run until it becomes `complete`, the user cancels it, or the current task loses the active run context. A focused question pauses only the current assistant turn.

When the user answers that question in the same task:

1. treat the answer as `user-confirmed` evidence for the active bootstrap;
2. close only the question that the answer resolves;
3. continue discovery, writing, and validation automatically;
4. do not ask the user to invoke `$repository-bootstrap` again.

Require a new invocation only in a new task, after an interrupted/lost task context, after cancellation, or when the user requests an audit of a completed bootstrap.

## Procedure

### 1. Preflight

1. Resolve the repository root without relying on a machine-specific absolute path in persisted artifacts.
2. Read `AGENTS.md`, `.codex/instructions/common/working-rules.md`, and `.codex/instructions/common/security.md` before broader discovery.
3. Require `.codex/scripts/initialize-repository.ps1` and `.codex/templates/repository-bootstrap-state.json`. If either is absent, report the missing starter artifact and stop.
4. Run the initializer for the current repository. It may create only the documented starter directories, a missing `AGENTS.md`, and missing bootstrap state.
5. Read and validate `.codex/repository-bootstrap.json`. Preserve an existing valid state; never reset it merely to restart discovery.

### 2. Discover evidence

After preflight succeeds, record `lastCompletedPhase: preflight` and set status to `discovering`. Inspect the minimum sources needed to establish:

- product purpose, domain, and repository type;
- languages, frameworks, package managers, build systems, and toolchain versions;
- source, test, resource, and migration locations;
- entry points, module boundaries, dependency direction, and important execution paths;
- authoritative install, build, test, lint, type-check, run, health-check, and smoke-test commands;
- API, schema, configuration, database, queue, cache, and integration sources of truth;
- formatter, linter, naming, validation, error-handling, logging, and test conventions;
- files or patterns likely to contain secrets, without reading or displaying secret values;
- evidenced performance-sensitive paths and the repository's available verification mechanisms.

Prefer manifests, wrapper scripts, CI, formatter/linter configuration, entry-point call paths, and tests over prose or naming. Use `rg` to confirm call sites and references before declaring code unused or authoritative.

Record material facts in state as `confirmed` with project-relative sources. Record explicit answers as `user-confirmed` with a portable `user:<short-reference>` source. Do not persist model observations as evidence.

### 3. Stop on material unknowns

When missing or conflicting evidence could change repository purpose, runtime behavior, architecture, official commands, security boundaries, or instruction ownership:

1. add one focused unresolved question with its impact;
2. record `lastCompletedPhase: discovery` and set status to `needs-input`;
3. save state;
4. ask the minimum question and pause the current turn.

The next user answer in the same task resumes this run automatically. Do not present re-invocation as the normal next step.

Do not write a polished-looking instruction that depends on an unanswered material question. Non-material mechanical wording and document organization may be chosen autonomously.

### 4. Write repository instructions

When no material question remains, record the completed discovery or input phase, set status to `writing`, and update only the bootstrap-owned files:

- `.codex/instructions/repository/overview.md`
- `.codex/instructions/repository/architecture.md`
- `.codex/instructions/repository/code-conventions.md`
- `.codex/instructions/repository/local-development.md`
- `.codex/instructions/repository/performance.md`
- additional `.codex/instructions/repository/*.md` files only when evidence supports a distinct concern;
- `.codex/repository-bootstrap.json`;
- `AGENTS.md` only when it is missing or an explicit repository-specific bootstrap rule must be reconciled.

Preserve compatible user-authored rules. When existing content conflicts with current evidence or user confirmation, surface the conflict rather than silently replacing it.

Remove the exact `REPOSITORY-BOOTSTRAP-PENDING` marker from each repository instruction only when that file has been replaced with evidence-backed content. The final validator uses this ASCII marker instead of language-specific placeholder prose.

Keep commands literal and project-relative. Mark optional or unavailable checks accurately. Name secret-bearing files or patterns only; never copy their values.

### 5. Validate and complete

After writing completes, record `lastCompletedPhase: writing`, set status to `validating`, then run the first three checks from the repository root and record their actual receipts:

```powershell
powershell -ExecutionPolicy Bypass -File .codex/scripts/validate-structure.ps1
powershell -ExecutionPolicy Bypass -File .codex/scripts/validate-references.ps1
powershell -ExecutionPolicy Bypass -File .codex/scripts/validate-portability.ps1
```

Correct bootstrap-owned files when validation fails. Do not weaken a validator or edit product files to obtain a pass.

After those checks pass and no unresolved question remains, populate `generatedFiles`, set `lastCompletedPhase: validation`, set `updatedAt`, set status to `complete`, and run the final state-aware check:

```powershell
powershell -ExecutionPolicy Bypass -File .codex/scripts/validate-repository-bootstrap.ps1
```

If the final check fails, return status to `validating`, correct the bootstrap-owned files or state, and rerun it. Report generated files, evidence sources, commands that were actually verified versus only discovered, and residual unknowns.

## Resume Behavior

- `pending`: start preflight and discovery.
- `discovering`: reconcile saved evidence with the current repository before continuing.
- `needs-input`: when the user answers in the same task, use the answer as `user-confirmed` evidence, close only the answered question, and resume automatically without another invocation. In a new task, an explicit resume invocation is required.
- `writing`: verify existing partial instruction edits before continuing.
- `validating`: rerun the required validators; do not infer their previous result.
- `complete`: perform an audit. Preserve valid customization and propose material replacements before applying them.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The repository obviously uses the usual command." | A likely command is not an authoritative command. |
| "Bootstrap should run before every feature for safety." | The user required explicit invocation; ordinary work must not trigger it. |
| "I asked a question, so the user must invoke the skill again." | The original invocation remains active in the same task; the answer resumes the paused run. |
| "The neighboring service proves this module has the same architecture." | Similarity is not repository evidence. |
| "Reading the environment file is the fastest way to document setup." | Secret-bearing files must not be read or reproduced. |
| "Overwriting the starter pages is harmless." | Existing customized instructions are user-owned and must be reconciled. |
| "A validator probably passed because the files look correct." | Only an executed receipt supports PASS. |

## Red Flags

- Bootstrap starts without explicit user invocation.
- The user is told to repeat `$repository-bootstrap` after answering a question in the same task.
- Product source, tests, migrations, or runtime configuration are edited.
- Dependencies are installed or services are started without separate authorization.
- A requirement or command is inferred from a filename or convention.
- State contains absolute paths or secret values.
- Existing customized instructions are replaced without reconciliation.
- Status becomes `complete` while open material questions remain.
- A required validator is marked passed without execution.

## Verification

- [ ] Invocation was explicit.
- [ ] Starter artifacts and state were validated before discovery writes.
- [ ] Material facts cite project-relative evidence or explicit user confirmation.
- [ ] Material unknowns caused `needs-input` rather than inference.
- [ ] Only bootstrap-owned instruction/state files changed.
- [ ] Existing compatible customization was preserved.
- [ ] No secret value was read, printed, or persisted.
- [ ] Structure, reference, portability, and bootstrap validators passed.
- [ ] Final status and report match the current receipts.
