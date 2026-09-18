# Repository Bootstrap Policy

Use this policy only when the user explicitly invokes `repository-bootstrap`. Repository bootstrap is never an automatic prerequisite or background action.

One explicit invocation authorizes the current bootstrap run for the lifetime of the current Codex task. When the workflow pauses for a focused answer, the user's answer continues that authorized run automatically. Do not require the user to repeat `$repository-bootstrap` within the same task.

A new explicit invocation is required only when starting bootstrap in another task, resuming after the active task context was lost or interrupted, rerunning a completed bootstrap as an audit, or starting again after the user cancelled the run.

## Authority boundary

Bootstrap may:

- read repository instructions, manifests, wrappers, CI configuration, documentation, source entry points, test configuration, and non-secret metadata;
- create missing starter directories under `.codex/`;
- create `AGENTS.md` from the checked-in starter template when it is absent;
- create or update `.codex/repository-bootstrap.json`;
- update repository-specific instruction files under `.codex/instructions/repository/`;
- run read-only discovery commands and the checked-in bootstrap validators.

Bootstrap must not:

- run automatically because a repository looks uninitialized;
- edit product source, tests, runtime resources, migrations, or official product configuration;
- install dependencies, start services or containers, run migrations, or access external systems;
- read or print secret values;
- stage, commit, push, create a pull request, merge, release, or deploy;
- overwrite customized instructions without reconciling the existing content and evidence.

## Evidence contract

Classify repository knowledge as:

- `confirmed`: directly supported by a current repository file, command output, or inspected execution path;
- `user-confirmed`: explicitly supplied or corrected by the user;
- `unknown`: not established by current evidence.

Names, nearby implementations, common conventions, and likely defaults are not evidence. When an unknown could materially change repository purpose, runtime behavior, architecture, commands, security boundaries, or instruction ownership, persist a focused open question, set status to `needs-input`, ask the question, and stop writing instructions that depend on the answer.

## State contract

Bootstrap state lives at `.codex/repository-bootstrap.json` and is initialized from `.codex/templates/repository-bootstrap-state.json`.

Allowed statuses are:

```text
pending -> discovering -> needs-input -> writing -> validating -> complete
```

Record `lastCompletedPhase` as one of `preflight`, `discovery`, `input`, `writing`, or `validation`. The current status must follow a compatible completed phase; do not jump from `pending` to `complete` by rewriting status alone.

`needs-input` automatically resumes at `discovering` after the user answers the recorded question in the same task. The answer itself is continuation authority; do not ask for another invocation. A completed bootstrap may be explicitly run again as an audit, but it must preserve still-valid customized content and report proposed changes before replacing contradictory user-maintained rules.

State must remain project-relative and portable. Repository evidence sources use project-relative paths; explicit user decisions use a `user:<short-reference>` source. Generated files and command references must not contain absolute local-machine paths.

## Output contract

The normal repository instruction set is:

- `.codex/instructions/repository/overview.md`
- `.codex/instructions/repository/architecture.md`
- `.codex/instructions/repository/code-conventions.md`
- `.codex/instructions/repository/local-development.md`
- `.codex/instructions/repository/performance.md`

Additional repository-specific instruction files are allowed only when current evidence demonstrates a distinct durable concern. Update the instruction map in `overview.md` when adding one.

Every material instruction must be traceable to a project-relative evidence source or an explicit user confirmation. Unknowns must remain visible; do not make the document look complete by hiding unresolved decisions.

## Completion

Before setting status to `complete`, run the checked-in structure, reference, portability, and repository-bootstrap validators. Record actual command results. A validator that did not run is `NOT RUN`, not a pass.

Completion means the starter structure is valid, repository instructions are evidence-backed, no material bootstrap question remains open, and no file outside the allowed bootstrap scope was changed.
