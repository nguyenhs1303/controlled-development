# Risk Matrix

Use the highest applicable factor. When uncertain between two levels, choose the higher level. The workflow may escalate automatically but may not silently downgrade a human-selected risk level.

## Classification

| Factor | Low / Quick eligible | Medium / Standard | High / Deep |
|---|---|---|---|
| Scope | One local concern, usually 1-2 files | One feature slice, usually 3-5 files | Multiple subsystems or cross-cutting behavior |
| Behavior | Unambiguous and easily reversible | New or changed user-visible behavior | Safety-, financial-, legal-, or business-critical behavior |
| Security/data | No auth, secrets, personal data, or schema impact | Internal validation or non-sensitive persistence | Authn/authz, secrets, privacy, real data, or migrations |
| Interface | Private/local implementation detail | Internal shared interface | Public API, protocol, compatibility, or external consumer contract |
| Runtime | Deterministic local logic | Async/I/O integration with good tests | Concurrency, distributed state, infrastructure, or difficult rollback |
| Dependencies/config | No new dependency or shared config | Existing dependency/config adjustment | New dependency, CI, infrastructure, build system, or environment contract |
| Verification | Strong focused tests and clear native commands | Some gaps but meaningful verification exists | Weak/no coverage for high-impact behavior or verification needs external systems |
| Clarity | No unresolved material question; only local mechanical choices remain | Material detail needs focused clarification but scope is bounded | Ambiguous product decision, conflicting project instructions, or multiple unresolved material boundaries |

## Profile selection

1. If any factor is High, select Deep and require both approval gates.
2. Otherwise, if any factor is Medium, select Standard.
3. Quick is allowed only when every factor is Low and the change remains local and reversible.
4. A Standard change classified Medium requires plan approval. A stricter project policy may also require plan approval for Low risk.
5. Project instructions may require a stricter profile or approval gate.

## Automatic escalation triggers

Escalate Quick to Standard or Deep when discovery or BUILD reveals:

- more files or subsystems than expected;
- a schema, dependency, CI, public-interface, auth, privacy, or production concern;
- conflicting requirements or an unapproved product choice;
- unrelated failing checks that obscure verification;
- insufficient rollback or meaningful verification for the current impact.

Stop at the relevant approval gate after escalation. Do not keep editing under the old profile.

## Examples

| Change | Profile | Reason |
|---|---|---|
| Correct a local error message with an existing test | Quick | Local, reversible, unambiguous |
| Add one API field used by an internal UI | Standard | Multi-file behavior and shared internal interface |
| Change authorization rules | Deep | Security-sensitive behavior |
| Add a database migration | Deep | Data shape and rollback risk |
| Refactor a pure helper across four files | Standard | Broader scope even if behavior is preserved |
| Upgrade a build dependency | Deep | New compatibility and supply-chain risk |

## Evidence required for classification

Record the selected profile, highest factors, source files or project facts that support them, and any unknowns. Apply the [decision evidence policy](decision-evidence-policy.md): unresolved material uncertainty must be asked rather than converted into a safe-default assumption. Do not claim Low merely because no risk was noticed; discovery must establish that the High and Medium triggers are absent for the task-relevant scope.
