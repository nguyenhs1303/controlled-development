# Review Findings Fixture

## ENG-001

- Severity: Important
- Evidence: `applyDiscount(50, 70)` returns `-20`, violating AC-001 that totals never become negative.
- Trigger: A discount exceeds the subtotal; this is a supported input according to the approved specification.
- Scope: Inside approved scope.
- Recommendation: Clamp the result to zero and add a regression test.
- Eligible: Yes.

## ENG-002

- Severity: Suggestion
- Evidence: The function name could include the word `clamped`.
- Trigger: Readability preference only; behavior is unaffected.
- Scope: Outside the required behavior.
- Recommendation: Consider renaming in a separate change.
- Eligible: No.
