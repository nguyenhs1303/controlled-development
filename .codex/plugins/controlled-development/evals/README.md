# Controlled Development Evals

The eval suite follows the repository's three-tier model:

1. Structural checks validate the manifest, skill anatomy, links, JSON, and fixture references.
2. Trigger checks ensure each prompt routes to the intended skill and away from owned negatives.
3. Behavioral checks evaluate approval gates, evidence honesty, incremental build behavior, review quality, remediation limits, and STOP boundaries.

Every skill has at least three positive triggers, two owned negatives, and one behavioral case. Execution cases reference real paths under `fixtures/`. Dialogue cases are used only when the required artifact is a decision or approval conversation rather than file mutation.

Fixtures are intentionally dependency-free and do not use network or external services.

Preview all behavioral cases without invoking a model:

```text
node scripts/run-behavioral-evals.mjs --all --dry-run
```

Run one skill or the full behavioral tier on demand:

```text
node scripts/run-behavioral-evals.mjs <skill-name>
node scripts/run-behavioral-evals.mjs --all
```

Actual execution invokes Codex twice per case: an isolated executor and a separate structured grader. It therefore consumes model tokens and is not part of the free deterministic gate.
