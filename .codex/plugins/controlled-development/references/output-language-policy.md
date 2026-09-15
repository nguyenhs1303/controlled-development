# Output Language Policy

Keep the plugin's internal instructions, routing descriptions, workflow identifiers, and machine-readable contracts in English.

## Human-facing output

- Default user-facing communication and generated Markdown artifacts to Vietnamese unless the user explicitly requests another language.
- Write approval packets, specifications, plans, task descriptions, evidence explanations, review findings, blocker guidance, and final reports in Vietnamese.
- Use natural Vietnamese for headings, prose, explanations, questions, and placeholder content.
- When resuming an existing change, preserve its established human-facing language unless the user requests a change.

## Content that must remain unchanged

Do not translate:

- workflow phases and transitions such as `BOOTSTRAP`, `BUILD`, `VERIFY`, `FINAL REPORT`, and `STOP`;
- evidence and terminal states such as `PASS`, `FAIL`, `NOT RUN`, `UNVERIFIED`, `REVIEW PASSED`, `REVIEW BLOCKED`, and `IMPLEMENTATION BLOCKED`;
- risk/profile values, severity labels, task IDs, acceptance-criterion IDs, receipt IDs, and finding IDs;
- commands, command output, source-code identifiers, paths, filenames, URLs, configuration keys, JSON fields, schema values, and code blocks.

Translate the explanation around technical evidence, but quote the evidence itself exactly.

## Machine-readable artifacts

Keep `state.json` keys, enum values, and schema structure in English. Human-readable Markdown artifacts may use Vietnamese labels while preserving every identifier and status required by the workflow contract.
