# Workflow state scenarios

- Current-state fixtures use `schemaVersion: 3` with revision, event-anchor, and approval-binding metadata.
- Unit tests construct schema 1 and schema 2 variants without schema 3 fields to preserve compatibility coverage.
- `valid-state.json` may legally resume at BUILD because specification, solution, and required plan approvals exist and PLAN APPROVAL is complete.
- `invalid-state.json` must fail closed because it claims BUILD while specification, solution, and plan approvals are pending and the last completed phase is TRIAGE.
- `remediation-state.json` may enter AUTO-REMEDIATE after REVIEW for the evidenced Important finding in `review-findings.md`.
- `blocker-limit-state.json` records three distinct BUILD recovery attempts and must finish as `IMPLEMENTATION BLOCKED`.
- `remediation-limit-state.json` records three complete review-remediation cycles and must finish as `REVIEW BLOCKED`.
- `review-findings.md` contains one eligible Important finding and one Suggestion that must not be auto-fixed.

The orchestrator must not begin a fourth blocker attempt or remediation cycle.
