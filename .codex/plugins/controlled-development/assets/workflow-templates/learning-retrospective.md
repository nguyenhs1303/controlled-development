---
schemaVersion: 1
candidateId: "{{LR-001}}"
status: "proposed"
classification: "PLUGIN CANDIDATE"
changeId: "{{change-id}}"
generatedAt: "{{ISO-8601 timestamp}}"
pluginMutation: "none"
---

# Learning retrospective: {{change title}}

## Observation

{{Describe the evidenced workflow problem, not the project-domain implementation.}}

## Evidence

- `{{artifact, receipt, finding, or file:line}}` - {{What this evidence proves}}

## Durability test

{{Explain why a future controlled change could repeat the problem or require substantial rediscovery if this learning is not captured.}}

## Existing coverage

{{Name inspected plugin skills, references, templates, scripts, or evals and describe overlap or contradiction.}}

## Proposed plugin targets

- `{{plugin-relative path}}` - {{smallest proposed correction}}

## Proposed eval

- {{A concrete case that fails before the correction and passes after it}}

## Applicability

{{State where the lesson is supported and where it is not established.}}

## Overgeneralization risk

{{Describe how this lesson could become an incorrect universal rule.}}

## Open questions

- {{Unresolved question, or "None"}}

## Approval boundary

This candidate is a proposal only. It does not modify the plugin. Apply it only through a separate Controlled Development change after explicit approval of this candidate and version.

