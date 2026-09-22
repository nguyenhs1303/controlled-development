# Workflow State Schema

This reference defines the persisted workflow-state compatibility contract. Validation is read-only and must not
mutate or automatically migrate an input state.

## Supported versions

- `schemaVersion: 1` uses the legacy workflow phases and approval semantics already implemented by the validator.
- `schemaVersion: 2` adds triage and solution approval semantics.
- `schemaVersion: 3` retains schema 2 workflow semantics and adds revision, event-anchor, and approval-binding
  metadata.
- `schemaVersion: 4` adds the machine-readable enforcement contract used by controller-owned hook authorization.
- Any other version, including a future version, must fail closed.

Schema 1 and schema 2 states are not required to contain schema 3 fields. Schema 3 remains readable but is not
enforceable for a new BUILD. New workflow states use schema 4.

## Schema 4 enforcement fields

`enforcement` contains:

- `contractVersion: 1`;
- `status`: `inactive`, `pending`, `ready`, `violated`, or `stale`;
- `activeBinding`: null or controller-owned checkout/change binding metadata;
- `policy`: binding for `execution-policy.json` using `sha256-text-v1` when approved;
- `readiness`: whether hook proof is required plus controller-issued nonce/proof metadata;
- `implementation`: baseline/snapshot digests and changed paths used for evidence freshness;
- `violations`: controller-recorded rule violations.

The execution policy records task/phase, allowed write paths, allowed new files, protected paths, command grants,
and required checks. Hooks consume controller decisions derived from this contract; they do not infer permission
from Markdown.

Central enforcement rule IDs use the stable `CD-E###-*` namespace. The controller decision envelope contains
`allowed`, `ruleId`, `reason`, and bounded `audit` data. A policy/state/task/phase mismatch fails closed. Receipt
freshness is derived from the implementation snapshot digest; controller artifacts are excluded to avoid
self-invalidating receipts.

## Schema 3 integrity fields

- `revision` is a non-negative integer and starts at `0`.
- `lastEventSequence` is a non-negative integer and starts at `0`.
- `lastEventHash` is `null` when `lastEventSequence` is `0`.
- When `lastEventSequence` is greater than `0`, `lastEventHash` matches
  `sha256:<64-lowercase-hex>`.

## Schema 3 approval binding

Each of `approvals.spec`, `approvals.solution`, and `approvals.plan` contains these additional fields:

- `artifactPath`
- `digestAlgorithm`
- `artifactDigest`
- `approvedAt`

For a pending approval all four fields are `null`. For an approved record:

- `artifactPath` is `spec.md`, `solution.md`, or `plan.md` for the corresponding gate;
- `digestAlgorithm` is `sha256-text-v1`;
- `artifactDigest` matches `sha256:<64-lowercase-hex>`;
- `approvedAt` is a valid ISO timestamp;
- the existing `reference` is a non-empty string.

The validator checks metadata shape only. Reading the artifact and comparing the current digest belongs to the
controller.

## `sha256-text-v1`

The canonical digest algorithm for Markdown workflow artifacts is:

1. Read the file as valid UTF-8. Reject invalid UTF-8 input.
2. Remove at most one leading UTF-8 BOM.
3. Replace every CRLF pair with LF. Preserve a lone CR as content.
4. Preserve all other whitespace and preserve the trailing newline exactly.
5. Do not apply Unicode normalization.
6. Hash the normalized UTF-8 bytes with SHA-256.
7. Encode the result as `sha256:<64-lowercase-hex>`.

These rules make CRLF/LF platform differences stable without hiding other content changes.
