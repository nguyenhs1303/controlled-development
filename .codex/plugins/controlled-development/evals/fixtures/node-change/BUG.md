# Discount floor bug

`applyDiscount(50, 70)` currently returns `-20`. A cart total must never be negative.

Expected behavior:

- Add a regression test that fails before the implementation changes.
- Clamp the result to zero.
- Preserve the valid-discount behavior.
- Use `npm test` for tests and `npm run check` for syntax validation.
