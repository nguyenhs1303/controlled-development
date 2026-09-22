---
name: project-discovery
description: Discovers the minimum project context needed for a controlled software change. Use when starting or resuming work that requires reading project instructions, finding native build/test commands, locating relevant modules, or assessing Git and CI context. Do not use for broad repository documentation or when the required project context is already current and evidenced.
---

# Project Discovery

## Overview

Establish trustworthy, task-relevant context before defining or editing a change. Read instructions first, discover native commands from project evidence, and avoid flooding the working context with unrelated files.

Apply the [output language policy](../../references/policies/output-language-policy.md), [permission policy](../../references/policies/permission-policy.md), and [decision evidence policy](../../references/policies/decision-evidence-policy.md), then record findings using the [evidence policy](../../references/policies/evidence-policy.md).

## When to Use

Use when:

- a new controlled change begins;
- a saved change resumes after repository drift;
- build, test, lint, or type-check commands are unknown;
- relevant conventions, module boundaries, or CI gates must be identified.

Do not use for a full architecture survey, general onboarding document, or repetitive rediscovery when current receipts already cover unchanged context.

## Process

### 1. Read instructions before exploration

Locate applicable instruction files from repository root toward the target path, including `AGENTS.md`, `CLAUDE.md`, README/CONTRIBUTING guidance, and tool-specific equivalents. Resolve precedence by scope and use the strictest compatible rule.

Do not begin with source search and promise to read instructions later.

### 2. Establish repository state

When Git is present, inspect only:

- current HEAD/reference;
- status and changed/untracked paths;
- relevant diff when it affects the task;
- repository root and target scope.

Preserve unrelated changes. Discovery never resets, cleans, stages, or commits.

### 3. Detect the stack and native commands

Inspect the smallest authoritative sources:

- manifests and checked-in wrappers;
- test/lint/build configuration;
- CI workflows that show real gate commands;
- README/CONTRIBUTING commands;
- neighboring modules and tests.

Record each command exactly, its source, intended scope, and any side-effect uncertainty. Prefer checked-in wrappers and repository scripts. Never assume `npm test`, `pytest`, Gradle, Cargo, or another default without evidence.

### 4. Locate task-relevant patterns

Search for the named feature, behavior, interface, failing test, or nearest analogous module. Read only the files needed to understand:

- ownership and dependency direction;
- local style and naming;
- test placement and conventions;
- validation/error patterns;
- likely files affected.

Expand only when a concrete question remains unanswered.

Separate observed facts from interpretations. A nearby implementation may be evidence of an available pattern, but it is not evidence that the current change must use the same behavior or boundary.

For enforcement-enabled changes, classify candidate write paths, protected controller paths, read-only commands,
and command grants into the execution-policy contract. Unknown tools and commands remain deny-by-default.

### 5. Resolve material unknowns

Classify missing or conflicting information with the decision evidence policy. If it could change behavior,
scope, acceptance, data/API compatibility, architecture, security, risk, permissions, solution selection, or
verification, ask the minimum focused question and do not pass an inferred answer to TRIAGE, DEFINE,
SOLUTION DESIGN, or PLAN.

Non-material mechanical choices may remain for implementation when their impact is demonstrably local and reversible.

### 6. Assess risk inputs

Collect facts needed by the [risk matrix](../../references/policies/risk-matrix.md): auth/data/schema impact, public interfaces, dependencies/configuration, concurrency/external effects, rollback, and test coverage.

Do not decide risk from file count alone.

### 7. Record the discovery result

For Standard/Deep, update `spec.md` project context and `state.json` baseline after the applicable artifact
write gate permits it. Record:

- instruction paths and key constraints;
- stack/manifests;
- native commands with sources;
- relevant modules/tests;
- current Git baseline and unrelated changes;
- risk facts;
- unknowns and unsafe/unavailable checks.

## Exit Criteria

Discovery is complete when the change can be specified without inventing project behavior, no material unknown is being carried forward as an assumption, relevant native verification paths are known or explicitly missing, and the likely scope is bounded.

If conflicting instructions, unexplained state drift, or an unsafe command blocks reliable discovery, return the blocker to the orchestrator.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll inspect code first; instructions can wait." | Instructions define what may be inspected or changed and must come first. |
| "This looks like Node, so `npm test` is fine." | A manifest or CI command is required evidence. |
| "Reading the whole repository is safer." | Broad ingestion hides the relevant constraints and wastes context. |
| "Git is dirty, but those changes are probably irrelevant." | Record and protect them before any later write. |
| "The neighboring module probably defines the intended behavior." | It proves only an existing pattern. Cite an applicable contract or ask about the material choice. |

## Red Flags

- Source files opened before applicable instruction files.
- Commands guessed from language recognition.
- A material unknown is recorded as an assumption and passed to TRIAGE, DEFINE, SOLUTION DESIGN, or PLAN.
- Large directories read without a task question.
- Unrelated working-tree changes omitted from discovery.
- Risk-sensitive paths such as auth or migrations treated as ordinary local edits.
- A command is labeled safe without inspecting its definition when effects are unclear.

## Verification

- [ ] Applicable project instructions and precedence are recorded.
- [ ] Git baseline and unrelated changes are known.
- [ ] Native commands include authoritative sources.
- [ ] Relevant modules and test patterns are identified.
- [ ] Material conclusions are evidenced or converted into focused questions.
- [ ] Risk facts and discovery gaps are explicit.
- [ ] No repository mutation or shipping action occurred.
