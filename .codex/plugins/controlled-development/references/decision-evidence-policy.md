# Decision Evidence Policy

Controlled Development must not turn a plausible inference into an approved requirement, architecture decision, risk conclusion, or verification claim.

## Material uncertainty

An uncertainty is material when choosing an answer could change any of:

- user-visible or externally observable behavior;
- scope, non-goals, acceptance criteria, or preservation requirements;
- data meaning, persistence, migration, API, protocol, or compatibility;
- security, authorization, privacy, auditability, or external effects;
- architecture ownership, dependency direction, transaction boundaries, concurrency, or rollback;
- risk classification, required permission, or verification coverage.

When material uncertainty exists, ask the minimum focused question and stop the current phase until the human answers or authoritative project evidence resolves it. Do not select a likely default, infer intent from adjacent code, or hide the uncertainty inside an assumption. Silence is not evidence.

## Evidence classes

Classify decision-relevant statements as one of:

- **Evidenced fact:** directly supported by an applicable instruction, project document, contract, configuration, test, executable behavior, or reachable code path. Cite the source.
- **User-confirmed decision:** explicitly answered or selected by the human in the current change context. Record the session or approval reference.
- **Proposal:** a possible choice offered for human consideration. A proposal is not approved behavior and cannot be used as a planning or BUILD input.
- **Unknown:** missing, conflicting, stale, or insufficient evidence. Convert a material unknown into a question.

Model knowledge, common practice, naming, file layout, similarity to another project, and the absence of a search result are not evidence of project intent. Existing code may establish current behavior but does not by itself establish desired behavior. When authoritative sources conflict on a material point, surface the conflict and ask; do not choose a winner silently.

## Non-material implementation choices

Codex may decide a mechanical internal detail without asking when the choice cannot change any material dimension above. Examples include a local variable name, a small helper extraction, or equivalent control flow inside an already approved boundary.

Use an evidenced project convention when one exists. If none exists, choose the simplest local, reversible option and identify it as an internal implementation choice when it matters to review. If the impact is uncertain, treat the choice as material and ask.

## Phase gates

- **DISCOVER:** report observations and unknowns separately. Do not close discovery if a material unknown prevents a trustworthy specification.
- **DEFINE:** every material requirement and acceptance criterion must trace to evidence or a user-confirmed decision. An approval-ready specification cannot contain unresolved material assumptions.
- **SOLUTION DESIGN:** decision drivers, options, recommendation, architecture, patterns, quality claims, and
  technology impact must trace to the approved specification, project evidence, or explicit human confirmation.
  Material unknowns block solution approval.
- **PLAN:** tasks must trace to the approved specification and solution. A new material architecture,
  compatibility, data, security, dependency, quality, or verification decision returns to solution design.
- **BUILD:** implement only resolved decisions. New material uncertainty is scope drift and returns to the relevant approval gate.
- **VERIFY/REVIEW:** state only what current evidence proves. Unsupported concerns or conclusions remain `UNVERIFIED` and must not be converted into facts or automatic remediation.

## Required presentation

Before requesting specification or plan approval, show material decisions with their evidence or user-confirmation source, plus any proposals and open questions. Approval applies only to the decisions actually presented; it does not approve hidden inferred details.
