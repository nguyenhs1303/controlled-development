# Permission Policy

This policy applies throughout the workflow. Project instructions can make it stricter. They cannot relax the absolute prohibitions.

## Always allowed within approved scope

- Read repository files and applicable project instructions.
- Inspect Git status, tracked/untracked file lists, and diffs.
- Create or update approved workflow artifacts.
- Edit working-tree files named or clearly covered by the approved plan.
- Run local, non-destructive project checks that do not access external systems or real data.
- Create temporary local test data inside an isolated test environment.

## Ask first

- Add, remove, or upgrade a dependency.
- Create or alter a database schema or migration.
- Modify CI, infrastructure, credential handling, build-system contracts, or public interfaces.
- Expand behavior, files, or subsystems beyond approved scope.
- Run destructive commands or commands with meaningful external effects.
- Use credentials, external paid services, or non-local environments.
- Delete uncertain or unrelated code, tests, configuration, or user work.

If approval is required, finish safe analysis first and ask immediately before the gated action.

## Never allowed

- Stage files with `git add` or equivalent.
- Commit, amend, tag, push, or publish a branch.
- Create, update, approve, or merge a pull request.
- Release or deploy.
- Access or mutate production systems.
- Read or modify real customer/user data.
- Disable, delete, skip, or weaken tests and safeguards merely to produce a pass.
- Hide artifacts by editing `.gitignore` without an independently approved project requirement.
- Treat a successful local check as authorization for a shipping action.

## Scope checks before writes

Before editing, confirm:

1. The current phase permits writes.
2. Required approvals exist in state.
3. The target file is inside the approved plan or is a required workflow artifact.
4. The operation has no prohibited external effect.
5. Existing unrelated changes will be preserved.

If any condition is false or unknown, do not write.

## Command checks

Before running a command, classify it as read-only, local mutation, or external/destructive. Inspect scripts when their effects are unclear. Names such as `test`, `build`, or `validate` are not proof that a command is safe.

Commands that may run migrations, seed shared databases, publish packages, upload artifacts, invoke cloud CLIs, or use production credentials require human approval or must remain `NOT RUN`.

## Conflict resolution

- Apply the strictest compatible instruction.
- If project instructions require an operation this plugin forbids, report the conflict and stop at a blocked state.
- If two project instructions conflict and precedence cannot be established, do not guess; request human direction.
