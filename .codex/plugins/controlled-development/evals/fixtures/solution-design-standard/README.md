# Validation fixture

The approved change adds the internal validator `no-line-breaks` through the existing registry. It returns
`true` only when the input contains neither `\r` nor `\n`. Acceptance evidence must cover a normal single-line
value plus values containing each line-break character.

The public contract, dependencies, persistence, security boundary, concurrency behavior, and runtime topology
must remain unchanged.
