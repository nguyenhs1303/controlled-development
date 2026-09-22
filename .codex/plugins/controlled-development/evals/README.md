# Controlled Development Evals

The eval suite follows the repository's three-tier model:

1. Structural checks validate the manifest, skill anatomy, links, JSON, and fixture references.
2. Trigger checks ensure each prompt routes to the intended skill and away from owned negatives.
3. Behavioral checks evaluate approval gates, evidence honesty, incremental build behavior, review quality, remediation limits, and STOP boundaries.

Every skill has at least three positive triggers, two owned negatives, and one behavioral case. Execution cases reference real paths under `tests/fixtures/`. Dialogue cases are used only when the required artifact is a decision or approval conversation rather than file mutation.

Fixtures are intentionally dependency-free and do not use network or external services.

Hook-enforcement coverage distinguishes inactive no-op, controller deny decisions, stale evidence, trust status,
and recovery paths. Structural and unit checks prove the package contract only; they do not prove that a user-scope
installed plugin is trusted or that the host executed every hook event.

The runner requires an explicit scope: `--changed`, one or more `--changed-file` or `--case` options, a skill
name, or `--all`. Running it without a scope, including with only `--dry-run` or `--kind`, fails before Codex is
invoked so an accidental command cannot default to the full token-consuming suite.

Preview all behavioral cases without invoking a model:

```text
node evals/runners/run-behavioral-evals.mjs --all --dry-run
```

Run only execution cases, or one exact case, without invoking unrelated evaluations:

```powershell
node evals/runners/run-behavioral-evals.mjs --all --kind execution
node evals/runners/run-behavioral-evals.mjs --case controlled-development:8
```

`--case` uses `<skill>:<id>`, may be repeated, and can be combined with `--kind`, skill selection, or impact
selection. Filters are intersected, so a valid exact case that is outside the changed-file impact set selects
zero evaluations.

Run one skill or the full behavioral tier on demand:

```text
node evals/runners/run-behavioral-evals.mjs <skill-name>
node evals/runners/run-behavioral-evals.mjs --all
```

Each behavioral case declares the exact executor inputs in `context_files`. The runner does not automatically
load every skill, policy, template, or schema. Cases may also declare `deterministic_checks` for expectations
that can be proven from the final message, commands, exit codes, JSON validity, or workspace changes.

Execution now follows this order:

1. Run one isolated executor.
2. Save raw JSONL trace only when the case fails or execution errors.
3. Build a bounded mechanical summary containing commands, exit codes, changed files, errors/timeouts, denied
   actions, and the executor final message.
4. Run deterministic checks.
5. Invoke the model grader only for unresolved semantic expectations. A deterministic failure stops grading
   early, and a fully deterministic case uses no model grader.

Run only cases affected by the current Git working tree:

```text
node evals/runners/run-behavioral-evals.mjs --changed --dry-run
node evals/runners/run-behavioral-evals.mjs --changed
```

Preview explicit changed paths, which is useful in CI:

```text
node evals/runners/run-behavioral-evals.mjs --changed-file skills/change-definition/SKILL.md --dry-run
node evals/runners/run-behavioral-evals.mjs --changed-file references/policies/evidence-policy.md --dry-run
```

Skill, policy, template, case, and fixture changes select their declared dependents. Shared runner/schema
changes and unknown paths fail closed to the full suite. README-only changes select zero behavioral cases.
Use `--all` before release, after shared changes, for scheduled coverage, or when explicitly requested.

