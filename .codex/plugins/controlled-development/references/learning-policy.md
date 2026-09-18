# Learning Policy

Use this policy after verification and review to decide whether a completed change produced durable learning for the Controlled Development plugin.

The retrospective evaluates learning. It never edits plugin instructions, references, templates, scripts, evals, manifests, marketplace files, or installed plugin state.

## Evidence boundary

Use only current, inspectable evidence from:

- the approved specification and plan;
- the approved solution and its decision/quality evidence;
- task outcomes and changed-file diff;
- executed verification receipts;
- specification-compliance and engineering-review findings;
- explicit user corrections or decisions recorded in the current change context;
- the current plugin source when checking existing coverage.

Do not treat model confidence, effort, diff size, successful completion alone, common practice, absence of user correction, or an unverified session recollection as evidence.

Every material observation and proposed plugin change must cite its evidence. Apply the [decision evidence policy](decision-evidence-policy.md): unsupported material conclusions remain proposals or unknowns and cannot become learning candidates.

## Eligibility test

A plugin learning qualifies only when all are true:

1. The relevant implementation behavior is solved and verified.
2. The learning describes a reusable workflow, evidence, approval, review, permission, state, or verification concern rather than project-domain behavior.
3. The lesson is not readily recoverable from the final code, tests, project documentation, or current plugin guidance.
4. Losing the lesson would plausibly cause a future controlled change to repeat the failure, create material risk, or require substantial rediscovery.
5. Current evidence supports the proposed applicability; broader applicability is not inferred from one example.
6. Existing plugin coverage has been inspected for overlap or contradiction.

Apply this counterfactual: if the retrospective disappeared, would a future agent following the current plugin still be likely to repeat the evidenced workflow problem? If not, do not create a plugin candidate.

## Classifications

Choose exactly one result:

- `PLUGIN CANDIDATE`: all eligibility conditions hold and a specific plugin improvement plus a regression eval can be proposed.
- `REPOSITORY LEARNING`: the lesson is durable but depends on the current repository's domain, architecture, tools, or conventions.
- `ALREADY COVERED`: current plugin guidance already addresses the lesson and the evidence does not show that the guidance itself is ineffective or contradictory.
- `NEEDS MORE EVIDENCE`: a possible plugin lesson exists, but evidence cannot establish its cause, applicability, target, or verification approach.
- `NO DURABLE LEARNING`: the result is routine, already apparent from final artifacts, trivial, or unlikely to prevent meaningful rediscovery.

Only `PLUGIN CANDIDATE` creates `learning-retrospective.md`. Other classifications are reported without creating an empty artifact.

## Scope and overlap

Produce at most one plugin candidate per change: the highest-value lesson supported by the evidence. Additional possible lessons remain unpromoted observations.

Before proposing a new rule, compare the lesson with existing skills, references, templates, validators, and evals across:

- triggering condition;
- failure or decision being prevented;
- workflow stage and owner;
- proposed correction;
- proposed regression evidence.

When existing coverage can absorb the correction, propose the smallest update to that owner. Do not propose a new skill merely because the lesson is new to the session.

## Candidate contract

A candidate must include:

- stable candidate ID and change ID;
- `status: proposed`;
- the observed workflow problem;
- concrete evidence pointers;
- the durability counterfactual;
- overlap or contradiction findings;
- the smallest proposed plugin targets;
- at least one behavioral or deterministic eval that would fail before the correction and pass after it;
- demonstrated applicability and explicit limits;
- overgeneralization risk;
- unresolved questions.

Validate a written candidate with `../../scripts/validate-learning-retrospective.mjs`. A candidate that fails validation is not approval-ready.

## Human approval and application

Retrospective output is advisory. Creating a candidate does not approve or implement it.

Approval must identify the candidate and the presented version or artifact. Silence, approval of the completed feature, or a request to finish the current change is not learning approval.

After explicit approval, start a separate Controlled Development change against the plugin source. That change must rediscover the current plugin state, define the exact behavior, obtain the normal approvals, implement the smallest supported update, add or update evals, run plugin validation, and stop after review. Never mutate the plugin inside the retrospective phase.
