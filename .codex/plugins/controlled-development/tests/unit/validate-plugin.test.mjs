import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runTriggerEvals } from '../../evals/runners/run-trigger-evals.mjs';
import {
  buildExecutorArgs,
  buildGraderPrompt,
  buildInstructionBundle,
  combineGrading,
  parseArguments,
  runDeterministicChecks,
  selectEvaluationsForFilters,
  selectEvaluationsForChangedFiles,
  summarizeExecutionTrace,
  summarizeTokenUsage,
  validateGrading,
  writeRawTrace,
} from '../../evals/runners/run-behavioral-evals.mjs';
import { validateWorkflowState } from '../../scripts/runtime/validate-workflow-state.mjs';
import { validateLearningRetrospective } from '../../scripts/validators/validate-learning-retrospective.mjs';
import { validatePlugin } from '../../scripts/validators/validate-plugin.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDirectory, '..', '..');
const approvalArtifacts = {
  spec: 'spec.md',
  solution: 'solution.md',
  plan: 'plan.md',
};

function asSchema3(state) {
  const result = structuredClone(state);
  result.schemaVersion = 3;
  result.revision = 0;
  result.lastEventSequence = 0;
  result.lastEventHash = null;
  for (const [gate, artifactPath] of Object.entries(approvalArtifacts)) {
    const approval = result.approvals[gate];
    const approved = approval.status === 'approved';
    approval.artifactPath = approved ? artifactPath : null;
    approval.digestAlgorithm = approved ? 'sha256-text-v1' : null;
    approval.artifactDigest = approved ? `sha256:${'a'.repeat(64)}` : null;
    approval.approvedAt = approved ? '2026-01-01T00:00:00Z' : null;
  }
  return result;
}

function setPluginVersion(root, version) {
  for (const manifestPath of [
    path.join(root, 'plugin.json'),
    path.join(root, '.codex-plugin', 'plugin.json'),
  ]) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = version;
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

function setPendingApproval(approval) {
  approval.status = 'pending';
  approval.reference = null;
  approval.artifactPath = null;
  approval.digestAlgorithm = null;
  approval.artifactDigest = null;
  approval.approvedAt = null;
}

function removeSchema3Fields(state) {
  delete state.revision;
  delete state.lastEventSequence;
  delete state.lastEventHash;
  for (const approval of Object.values(state.approvals)) {
    delete approval.artifactPath;
    delete approval.digestAlgorithm;
    delete approval.artifactDigest;
    delete approval.approvedAt;
  }
}

test('the checked-in plugin satisfies structural contracts', () => {
  assert.deepEqual(validatePlugin(pluginRoot), []);
});

test('workflow state schema reference defines sha256-text-v1 canonicalization', () => {
  const referencePath = path.join(pluginRoot, 'references', 'schemas', 'workflow-state-schema.md');
  const contents = fs.readFileSync(referencePath, 'utf8');
  for (const marker of [
    'schemaVersion: 1',
    'schemaVersion: 2',
    'schemaVersion: 3',
    'sha256-text-v1',
    'UTF-8 BOM',
    'CRLF',
    'lone CR',
    'trailing newline',
    'Unicode normalization',
    'invalid UTF-8',
    'sha256:<64-lowercase-hex>',
  ]) {
    assert.ok(contents.includes(marker), `workflow state schema reference missing ${marker}`);
  }
});

test('behavioral grading uses stable expectation indexes instead of copied prose', () => {
  const expectations = ['First long expectation', 'Second long expectation'];
  const grading = {
    overallPass: true,
    summary: 'Both pass',
    results: [
      { index: 1, passed: true, evidence: 'Observed first behavior' },
      { index: 2, passed: true, evidence: 'Observed second behavior' },
    ],
  };

  assert.doesNotThrow(() => validateGrading(expectations, grading));
  grading.results[1].index = 1;
  assert.throws(() => validateGrading(expectations, grading), /wrong index/);
});

test('behavioral grading accepts original indexes for a semantic subset', () => {
  const expectations = ['deterministic', 'semantic', 'semantic'];
  const grading = {
    overallPass: true,
    summary: 'Semantic expectations pass',
    results: [
      { index: 2, passed: true, evidence: 'Observed second behavior' },
      { index: 3, passed: true, evidence: 'Observed third behavior' },
    ],
  };

  assert.doesNotThrow(() => validateGrading(expectations, grading, [2, 3]));
  grading.results[1].index = 1;
  assert.throws(() => validateGrading(expectations, grading, [2, 3]), /wrong index/);
});

test('executor context contains only files declared by the behavioral case', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-context-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(temporaryRoot, 'skills', 'sample'), { recursive: true });
  fs.mkdirSync(path.join(temporaryRoot, 'references', 'policies'), { recursive: true });
  fs.writeFileSync(path.join(temporaryRoot, 'skills', 'sample', 'SKILL.md'), 'selected skill');
  fs.writeFileSync(path.join(temporaryRoot, 'references', 'policies', 'output-language-policy.md'), 'language policy');
  fs.writeFileSync(path.join(temporaryRoot, 'references', 'needed.md'), 'needed policy');
  fs.writeFileSync(path.join(temporaryRoot, 'references', 'unused.md'), 'unused policy');
  const definition = { skill_name: 'sample' };
  const evaluation = {
    id: 1,
    kind: 'dialogue',
    prompt: 'Evaluate',
    expectations: ['Responds'],
    context_files: [
      'skills/sample/SKILL.md',
      'references/policies/output-language-policy.md',
      'references/needed.md',
    ],
  };

  const bundle = buildInstructionBundle(definition, evaluation, temporaryRoot);
  assert.match(bundle, /selected skill/);
  assert.match(bundle, /needed policy/);
  assert.doesNotMatch(bundle, /unused policy/);
});

test('execution trace summary extracts bounded mechanical evidence', () => {
  const trace = [
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: 'npm test',
        exit_code: 0,
        aggregated_output: 'tests passed',
      },
    }),
    JSON.stringify({ type: 'error', message: 'approval denied after timeout' }),
    'not-json',
  ].join('\n');
  const summary = summarizeExecutionTrace(trace);

  assert.deepEqual(summary.commands[0], {
    command: 'npm test',
    exitCode: 0,
    status: null,
    output: 'tests passed',
  });
  assert.equal(summary.errors.length, 1);
  assert.equal(summary.timeouts.length, 1);
  assert.equal(summary.deniedActions.length, 1);
  assert.equal(summary.malformedLines, 1);
});

test('behavioral trace token usage sums completed turns and ignores malformed lines', () => {
  const trace = [
    JSON.stringify({
      type: 'turn.completed',
      usage: {
        input_tokens: 100,
        cached_input_tokens: 40,
        output_tokens: 20,
        reasoning_output_tokens: 7,
      },
    }),
    'not-json',
    JSON.stringify({ type: 'item.completed', usage: { input_tokens: 999 } }),
    JSON.stringify({
      type: 'turn.completed',
      usage: {
        input_tokens: 50,
        cached_input_tokens: 10,
        output_tokens: 5,
        reasoning_output_tokens: 2,
      },
    }),
  ].join('\n');

  assert.deepEqual(summarizeTokenUsage(trace), {
    inputTokens: 150,
    cachedInputTokens: 50,
    outputTokens: 25,
    reasoningOutputTokens: 9,
  });
});

test('model grader prompt receives the mechanical summary and not the raw trace', () => {
  const execution = {
    before: { 'file.txt': 'before' },
    after: { 'file.txt': 'after' },
    lastMessage: 'Final executor answer',
    trace: 'RAW_TRACE_SECRET_THAT_MUST_NOT_REACH_GRADER',
    traceSummary: {
      commands: [{ command: 'npm test', exitCode: 0, status: 'completed', output: 'pass' }],
      errors: [],
      timeouts: [],
      deniedActions: [],
    },
  };
  const prompt = buildGraderPrompt(
    { skill_name: 'sample' },
    {
      kind: 'execution',
      expected_output: 'Expected',
      expectations: ['Semantic result'],
    },
    execution,
    [1],
    [],
  );

  assert.match(prompt, /EXECUTION SUMMARY/);
  assert.match(prompt, /npm test/);
  assert.match(prompt, /Final executor answer/);
  assert.doesNotMatch(prompt, /RAW_TRACE_SECRET_THAT_MUST_NOT_REACH_GRADER/);
  assert.doesNotMatch(prompt, /EXECUTION TRACE/);
});

test('raw trace can be persisted separately for failed-case investigation', (context) => {
  const resultRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-trace-'));
  context.after(() => fs.rmSync(resultRoot, { recursive: true, force: true }));
  const trace = '{"type":"turn.failed","message":"failure"}\n';
  const tracePath = writeRawTrace(
    { skill_name: 'sample' },
    { id: 7 },
    trace,
    resultRoot,
  );

  assert.equal(path.basename(tracePath), 'sample.eval-7.trace.jsonl');
  assert.equal(fs.readFileSync(tracePath, 'utf8'), trace);
});

test('raw behavioral traces are ignored by Git', () => {
  const ignorePath = path.join(pluginRoot, 'evals', 'results', '.gitignore');
  const contents = fs.readFileSync(ignorePath, 'utf8');
  assert.match(contents, /^\*\.trace\.jsonl$/m);
});

test('deterministic expectations can complete grading without a model result', () => {
  const evaluation = {
    expectations: ['Workspace is unchanged', 'Final response names PASS'],
    deterministic_checks: [
      { expectation: 1, rules: [{ type: 'workspace_unchanged' }] },
      { expectation: 2, rules: [{ type: 'final_message_includes', values: ['PASS'] }] },
    ],
  };
  const execution = {
    before: { 'file.txt': 'same' },
    after: { 'file.txt': 'same' },
    lastMessage: 'Result: PASS',
    trace: '',
    traceSummary: { commands: [] },
  };

  const checks = runDeterministicChecks(evaluation, execution);
  const grading = combineGrading(evaluation.expectations, checks);
  assert.equal(grading.overallPass, true);
  assert.equal(grading.modelGrader, 'SKIPPED');
  assert.ok(grading.results.every((result) => result.source === 'deterministic'));
});

test('deterministic failure fails fast and leaves semantic expectations ungraded', () => {
  const evaluation = {
    expectations: ['Workspace is unchanged', 'Semantic explanation'],
    deterministic_checks: [
      { expectation: 1, rules: [{ type: 'workspace_unchanged' }] },
    ],
  };
  const execution = {
    before: { 'file.txt': 'before' },
    after: { 'file.txt': 'after' },
    lastMessage: 'Explanation',
    trace: '',
    traceSummary: { commands: [] },
  };

  const checks = runDeterministicChecks(evaluation, execution);
  const grading = combineGrading(evaluation.expectations, checks);
  assert.equal(grading.overallPass, false);
  assert.equal(grading.modelGrader, 'SKIPPED');
  assert.equal(grading.results[1].source, 'not-graded');
});

test('deterministic JSON checks can verify workflow state transitions', () => {
  const evaluation = {
    expectations: ['Workflow reached VERIFY'],
    deterministic_checks: [
      {
        expectation: 1,
        rules: [
          { type: 'json_valid', path: 'state.json' },
          { type: 'json_field_equals', path: 'state.json', field: 'phase', equals: 'VERIFY' },
        ],
      },
    ],
  };
  const execution = {
    before: { 'state.json': '{"phase":"BUILD"}' },
    after: { 'state.json': '{"phase":"VERIFY"}' },
    lastMessage: '',
    trace: '',
    traceSummary: { commands: [] },
  };

  const grading = combineGrading(
    evaluation.expectations,
    runDeterministicChecks(evaluation, execution),
  );
  assert.equal(grading.overallPass, true);
  assert.equal(grading.modelGrader, 'SKIPPED');
});

test('impact selection uses case dependencies and fails closed for unknown changes', () => {
  const evaluations = [
    {
      definition: { skill_name: 'alpha' },
      evaluation: {
        id: 1,
        context_files: ['skills/alpha/SKILL.md', 'references/policies/a.md'],
        files: ['fixture-a'],
      },
    },
    {
      definition: { skill_name: 'beta' },
      evaluation: {
        id: 1,
        context_files: ['skills/beta/SKILL.md', 'references/policies/b.md'],
        files: [],
      },
    },
  ];

  assert.deepEqual(
    selectEvaluationsForChangedFiles(evaluations, ['references/policies/a.md']),
    [evaluations[0]],
  );
  assert.deepEqual(
    selectEvaluationsForChangedFiles(evaluations, ['skills/alpha/agents/openai.yaml']),
    [evaluations[0]],
  );
  assert.deepEqual(
    selectEvaluationsForChangedFiles(evaluations, ['tests/fixtures/fixture-a/input.txt']),
    [evaluations[0]],
  );
  assert.deepEqual(selectEvaluationsForChangedFiles(evaluations, ['README.md']), []);
  assert.deepEqual(
    selectEvaluationsForChangedFiles(evaluations, ['evals/runners/run-behavioral-evals.mjs']),
    evaluations,
  );
  assert.deepEqual(selectEvaluationsForChangedFiles(evaluations, ['unknown/file.txt']), evaluations);
});

test('behavioral selection supports kind and exact case filters', () => {
  const evaluations = [
    { definition: { skill_name: 'alpha' }, evaluation: { id: 1, kind: 'dialogue' } },
    { definition: { skill_name: 'alpha' }, evaluation: { id: 2, kind: 'execution' } },
    { definition: { skill_name: 'beta' }, evaluation: { id: 1, kind: 'execution' } },
  ];

  assert.deepEqual(
    selectEvaluationsForFilters(evaluations, { kind: 'execution', caseSelectors: [] }),
    evaluations.slice(1),
  );
  assert.deepEqual(
    selectEvaluationsForFilters(evaluations, { kind: null, caseSelectors: ['alpha:2'] }),
    [evaluations[1]],
  );
  assert.deepEqual(
    selectEvaluationsForFilters(evaluations, { kind: 'execution', caseSelectors: ['beta:1'] }),
    [evaluations[2]],
  );
  assert.throws(
    () => selectEvaluationsForFilters(evaluations, { kind: null, caseSelectors: ['alpha:9'] }),
    /behavioral eval case not found: alpha:9/,
  );
});

test('behavioral CLI parses repeatable case filters and validates kind', () => {
  assert.deepEqual(
    parseArguments(['--all', '--kind', 'execution', '--case', 'alpha:2', '--case', 'beta:1', '--dry-run']),
    {
      dryRun: true,
      changedFromGit: false,
      changedFiles: [],
      selection: '--all',
      kind: 'execution',
      caseSelectors: ['alpha:2', 'beta:1'],
    },
  );
  assert.deepEqual(
    parseArguments(['--case', 'alpha:2']),
    {
      dryRun: false,
      changedFromGit: false,
      changedFiles: [],
      selection: '--all',
      kind: null,
      caseSelectors: ['alpha:2'],
    },
  );
  assert.throws(() => parseArguments([]), /explicit selection required/);
  assert.throws(() => parseArguments(['--dry-run']), /explicit selection required/);
  assert.throws(() => parseArguments(['--kind', 'execution']), /explicit selection required/);
  assert.throws(() => parseArguments(['--kind', 'invalid']), /--kind must be dialogue or execution/);
  assert.throws(() => parseArguments(['--case', 'alpha']), /--case must use <skill>:<id>/);
});

test('execution eval arguments preserve option-value pairs', () => {
  const args = buildExecutorArgs('execution', 'workspace', 'last-message.txt');
  const colorIndex = args.indexOf('--color');
  const sandboxIndex = args.indexOf('--sandbox');

  assert.equal(args[colorIndex + 1], 'never');
  assert.equal(args[sandboxIndex + 1], 'workspace-write');
  assert.equal(args.includes('--approve-for-me'), false);
});

test('the base plugin version remains valid without a cachebuster', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  setPluginVersion(temporaryRoot, '0.1.0');

  assert.deepEqual(validatePlugin(temporaryRoot), []);
});

test('an unrelated plugin version is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  setPluginVersion(temporaryRoot, '0.2.0');

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('0.1.0 or a Codex cachebuster')));
});

test('manifest drift between portable and compatibility layouts is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const compatibilityPath = path.join(temporaryRoot, '.codex-plugin', 'plugin.json');
  const compatibility = JSON.parse(fs.readFileSync(compatibilityPath, 'utf8'));
  compatibility.description = 'Drifted description';
  fs.writeFileSync(compatibilityPath, `${JSON.stringify(compatibility, null, 2)}\n`);

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must share description')));
});

test('plugin manifests and hook config declare the same lifecycle bundle', () => {
  const portable = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'plugin.json'), 'utf8'));
  const compatibility = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'));
  const hooksPath = path.join(pluginRoot, 'hooks', 'hooks.json');

  assert.equal(portable.extensions?.['com.openai']?.hooks, './hooks/hooks.json');
  assert.equal(compatibility.hooks, './hooks/hooks.json');
  assert.ok(fs.existsSync(hooksPath));

  const configuredEvents = Object.keys(JSON.parse(fs.readFileSync(hooksPath, 'utf8')).hooks ?? {}).sort();
  assert.deepEqual(configuredEvents, ['PostToolUse', 'PreToolUse', 'SessionStart', 'Stop']);
  assert.deepEqual(validatePlugin(pluginRoot), []);
});

test('hook enforcement fixture covers inactive, deny, stale, trust, bypass, and recovery paths', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'tests', 'fixtures', 'hook-enforcement', 'scenarios.json'), 'utf8'));
  const ids = new Set(fixture.scenarios.map((scenario) => scenario.id));
  for (const required of [
    'inactive-noop',
    'undeclared-path-deny',
    'unknown-tool-deny',
    'stale-receipt',
    'untrusted-hook',
    'post-tool-bypass-detected',
    'stop-loop-recovery',
  ]) assert.ok(ids.has(required), `missing hook enforcement scenario ${required}`);
});

test('every skill must apply the shared output language policy', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const skillPath = path.join(temporaryRoot, 'skills', 'project-discovery', 'SKILL.md');
  const contents = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(skillPath, contents.replace('../../references/policies/output-language-policy.md', '../../references/policies/evidence-policy.md'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must apply the output language policy')));
});

test('every skill must apply the decision evidence policy', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const skillPath = path.join(temporaryRoot, 'skills', 'implementation-planning', 'SKILL.md');
  const contents = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(skillPath, contents.replace('../../references/policies/decision-evidence-policy.md', '../../references/policies/evidence-policy.md'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must apply the decision evidence policy')));
});

test('repository bootstrap must remain explicit-only', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const agentPath = path.join(temporaryRoot, 'skills', 'repository-bootstrap', 'agents', 'openai.yaml');
  const contents = fs.readFileSync(agentPath, 'utf8');
  fs.writeFileSync(agentPath, contents.replace('allow_implicit_invocation: false', 'allow_implicit_invocation: true'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must disable implicit invocation')));
});

test('repository bootstrap must continue after an answer without same-task re-invocation', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const skillPath = path.join(temporaryRoot, 'skills', 'repository-bootstrap', 'SKILL.md');
  const contents = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(skillPath, contents.replace('## One-Invocation Continuation', '## Continuation'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must define one-invocation continuation')));
});

test('an execution eval with a missing fixture is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const casePath = path.join(temporaryRoot, 'evals', 'cases', 'incremental-build.json');
  const evalCase = JSON.parse(fs.readFileSync(casePath, 'utf8'));
  evalCase.evals[0].files = ['missing-fixture'];
  fs.writeFileSync(casePath, `${JSON.stringify(evalCase, null, 2)}\n`);

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('missing fixture')));
});

test('a missing local Markdown link outside skills is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });
  fs.appendFileSync(path.join(temporaryRoot, 'README.md'), '\n[Missing](references/not-real.md)\n');

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('README.md has missing link target')));
});

test('an empty directory is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });
  fs.mkdirSync(path.join(temporaryRoot, 'empty-directory'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('empty directory')));
});

test('an illegal BUILD state without approvals is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const statePath = path.join(temporaryRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.approvals.spec.status = 'pending';
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('BUILD requires approved spec')));
});

test('the intentionally invalid resume fixture fails closed', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'invalid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const errors = validateWorkflowState(state, 'invalid-state.json');
  assert.ok(errors.some((error) => error.includes('BUILD requires approved spec')));
  assert.ok(errors.some((error) => error.includes('BUILD requires approved solution')));
  assert.ok(errors.some((error) => error.includes('BUILD requires approved plan')));
  assert.ok(errors.some((error) => error.includes('BUILD must follow PLAN APPROVAL')));
});

test('low-risk BUILD may follow PLAN when plan approval is optional', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.riskLevel = 'low';
  state.approvals.plan.required = false;
  setPendingApproval(state.approvals.plan);
  state.lastCompletedPhase = 'PLAN';
  assert.deepEqual(validateWorkflowState(state, 'optional-plan-state'), []);
});

test('a stricter project policy may require plan approval for a low-risk change', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.riskLevel = 'low';
  state.approvals.plan.required = true;
  state.lastCompletedPhase = 'PLAN APPROVAL';
  assert.deepEqual(validateWorkflowState(state, 'stricter-plan-state'), []);
});

test('Deep BUILD cannot bypass plan approval by changing persisted required flag', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.profile = 'deep';
  state.riskLevel = 'high';
  state.approvals.plan.required = false;
  state.approvals.plan.status = 'pending';
  state.approvals.plan.reference = null;
  state.lastCompletedPhase = 'PLAN';

  const errors = validateWorkflowState(state, 'forged-plan-state');
  assert.ok(errors.some((error) => error.includes('plan approval requirement')));
  assert.ok(errors.some((error) => error.includes('BUILD requires approved plan')));
});

test('approved gates require non-empty approval references', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.approvals.spec.reference = null;
  state.approvals.plan.reference = '   ';

  const errors = validateWorkflowState(state, 'missing-approval-references');
  assert.ok(errors.some((error) => error.includes('approved spec requires a reference')));
  assert.ok(errors.some((error) => error.includes('approved plan requires a reference')));
});

test('write phases require a recorded baseline and fail closed on observed drift', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.gitBaseline.head = null;
  state.gitBaseline.statusFingerprint = null;
  state.gitBaseline.recordedAt = null;
  let errors = validateWorkflowState(state, 'missing-baseline-state');
  assert.ok(errors.some((error) => error.includes('BUILD requires a recorded gitBaseline')));

  state.gitBaseline = {
    head: 'fixture-head',
    statusFingerprint: 'clean',
    recordedAt: '2026-01-01T00:00:00Z',
  };
  errors = validateWorkflowState(state, 'drifted-baseline-state', {
    currentGitBaseline: { head: 'different-head', statusFingerprint: 'modified' },
  });
  assert.ok(errors.some((error) => error.includes('gitBaseline drift')));
});

test('missing required workflow-state fields fail closed without throwing', () => {
  const errors = validateWorkflowState({}, 'empty-state');
  for (const field of [
    'schemaVersion',
    'pluginVersion',
    'changeId',
    'profile',
    'riskLevel',
    'phase',
    'artifactRoot',
    'approvedScope',
    'prohibitedOperations',
    'approvals',
    'tasks',
    'blockers',
    'reviewRemediationCycle',
    'evidenceReceipts',
    'gitBaseline',
    'lastCompletedPhase',
  ]) {
    assert.ok(errors.some((error) => error.includes(field)), `expected an error for ${field}`);
  }
});

test('schema version 2 requires triage evidence', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  delete state.triage;

  const errors = validateWorkflowState(state, 'missing-triage-state');
  assert.ok(errors.some((error) => error.includes('missing required field: triage')));
});

test('schema version 1 remains valid for legacy in-progress changes', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.schemaVersion = 1;
  delete state.triage;
  delete state.approvals.solution;
  removeSchema3Fields(state);
  const before = structuredClone(state);

  assert.deepEqual(validateWorkflowState(state, 'legacy-state'), []);
  assert.deepEqual(state, before);
});

test('schema version 2 remains valid and validation does not mutate it', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.schemaVersion = 2;
  removeSchema3Fields(state);
  const before = structuredClone(state);

  assert.deepEqual(validateWorkflowState(state, 'schema-two-state'), []);
  assert.deepEqual(state, before);
});

test('schema version 3 accepts valid integrity fields without mutating input', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = asSchema3(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  const before = structuredClone(state);

  assert.deepEqual(validateWorkflowState(state, 'schema-three-state'), []);
  assert.deepEqual(state, before);
});

test('schema version 3 rejects invalid revision and event anchors', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const base = asSchema3(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  const cases = [
    ['missing revision', (state) => delete state.revision, 'missing required field: revision'],
    ['negative revision', (state) => { state.revision = -1; }, 'revision must be a non-negative integer'],
    ['fractional sequence', (state) => { state.lastEventSequence = 1.5; }, 'lastEventSequence must be a non-negative integer'],
    ['hash with zero sequence', (state) => { state.lastEventHash = `sha256:${'b'.repeat(64)}`; }, 'lastEventHash must be null'],
    ['missing hash after event', (state) => { state.lastEventSequence = 1; }, 'lastEventHash must match'],
    ['uppercase event hash', (state) => {
      state.lastEventSequence = 1;
      state.lastEventHash = `sha256:${'A'.repeat(64)}`;
    }, 'lastEventHash must match'],
  ];

  for (const [name, mutate, expected] of cases) {
    const state = structuredClone(base);
    mutate(state);
    const errors = validateWorkflowState(state, name);
    assert.ok(errors.some((error) => error.includes(expected)), `${name}: ${errors.join('; ')}`);
  }
});

test('future workflow state schema versions fail closed without mutation', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = asSchema3(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  state.schemaVersion = 5;
  const before = structuredClone(state);

  const errors = validateWorkflowState(state, 'future-state');
  assert.ok(errors.some((error) => error.includes('schemaVersion must be 1, 2, 3, or 4')));
  assert.deepEqual(state, before);
});

test('schema version 3 requires complete approval binding metadata', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const base = asSchema3(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  const cases = [
    ['wrong artifact', (state) => { state.approvals.spec.artifactPath = 'plan.md'; }, 'approvals.spec.artifactPath must be spec.md'],
    ['wrong algorithm', (state) => { state.approvals.solution.digestAlgorithm = 'sha256'; }, 'digestAlgorithm must be sha256-text-v1'],
    ['malformed digest', (state) => { state.approvals.plan.artifactDigest = 'sha256:ABC'; }, 'artifactDigest must match'],
    ['invalid timestamp', (state) => { state.approvals.plan.approvedAt = 'yesterday'; }, 'approvedAt must be an ISO timestamp'],
    ['date-only timestamp', (state) => { state.approvals.plan.approvedAt = '2026-01-01'; }, 'approvedAt must be an ISO timestamp'],
    ['missing path', (state) => { state.approvals.spec.artifactPath = null; }, 'approvals.spec.artifactPath must be spec.md'],
  ];

  for (const [name, mutate, expected] of cases) {
    const state = structuredClone(base);
    mutate(state);
    const errors = validateWorkflowState(state, name);
    assert.ok(errors.some((error) => error.includes(expected)), `${name}: ${errors.join('; ')}`);
  }
});

test('schema version 3 pending approvals reject stale binding metadata', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = asSchema3(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  state.phase = 'SOLUTION APPROVAL';
  state.lastCompletedPhase = 'SOLUTION DESIGN';
  state.approvals.solution.status = 'pending';
  state.approvals.solution.reference = null;
  state.approvals.solution.artifactPath = 'solution.md';
  state.approvals.solution.digestAlgorithm = null;
  state.approvals.solution.artifactDigest = null;
  state.approvals.solution.approvedAt = null;

  const errors = validateWorkflowState(state, 'stale-pending-approval');
  assert.ok(errors.some((error) => error.includes('pending solution approval binding fields must be null')));
});

test('new workflow templates use schema version 4 enforcement contracts', () => {
  const state = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'assets', 'workflow-templates', 'state.json'), 'utf8'));
  const policy = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'assets', 'workflow-templates', 'execution-policy.json'), 'utf8'));

  assert.equal(state.schemaVersion, 4);
  assert.equal(state.enforcement.contractVersion, 1);
  assert.equal(state.enforcement.status, 'inactive');
  assert.equal(policy.contractVersion, 1);
  assert.deepEqual(policy.allowedWritePaths, []);
  assert.deepEqual(validateWorkflowState(state, 'schema-four-template'), []);
});

test('supplemental workflow fixtures use schema version 3', () => {
  for (const filename of [
    'blocker-limit-state.json',
    'remediation-state.json',
    'remediation-limit-state.json',
    'learning-retrospective-state.json',
  ]) {
    const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', filename);
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assert.equal(state.schemaVersion, 3, filename);
    assert.equal(state.revision, 0, filename);
    assert.equal(state.lastEventSequence, 0, filename);
    assert.equal(state.lastEventHash, null, filename);
    assert.deepEqual(validateWorkflowState(state, filename), []);
  }
});

test('Standard PLAN and BUILD require an approved solution', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.approvals.solution.status = 'pending';
  state.approvals.solution.reference = null;

  let errors = validateWorkflowState(state, 'unapproved-solution-build');
  assert.ok(errors.some((error) => error.includes('BUILD requires approved solution')));

  state.phase = 'PLAN';
  state.lastCompletedPhase = 'SOLUTION APPROVAL';
  errors = validateWorkflowState(state, 'unapproved-solution-plan');
  assert.ok(errors.some((error) => error.includes('PLAN requires approved solution')));
});

test('solution mode must match the selected profile', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.triage.solutionMode = 'full';
  state.approvals.solution.mode = 'full';

  const errors = validateWorkflowState(state, 'wrong-solution-mode');
  assert.ok(errors.some((error) => error.includes('standard profile requires triage.solutionMode lite')));
  assert.ok(errors.some((error) => error.includes('approvals.solution.mode must be lite')));
});

test('Quick BUILD may follow TRIAGE without specification or solution approval', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.profile = 'quick';
  state.riskLevel = 'low';
  state.triage = {
    highestFactors: ['scope', 'behavior', 'security/data', 'interface', 'runtime', 'dependencies/config', 'verification', 'clarity'],
    reason: 'All task-relevant factors are evidenced Low',
    solutionMode: 'none',
    solutionReason: 'No material technical decision exists',
    escalationTriggers: ['shared interface impact'],
  };
  state.approvals.spec = {
    status: 'pending', reference: null, artifactPath: null, digestAlgorithm: null,
    artifactDigest: null, approvedAt: null,
  };
  state.approvals.solution = {
    required: false, mode: 'none', status: 'pending', reference: null, artifactPath: null,
    digestAlgorithm: null, artifactDigest: null, approvedAt: null,
  };
  state.approvals.plan = {
    required: false, status: 'pending', reference: null, artifactPath: null, digestAlgorithm: null,
    artifactDigest: null, approvedAt: null,
  };
  state.lastCompletedPhase = 'TRIAGE';

  assert.deepEqual(validateWorkflowState(state, 'quick-build-state'), []);
});

test('Standard plan approval may be optional after solution approval', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.approvals.plan.required = false;
  setPendingApproval(state.approvals.plan);
  state.lastCompletedPhase = 'PLAN';

  assert.deepEqual(validateWorkflowState(state, 'standard-optional-plan-state'), []);
});

test('malformed task, evidence, timestamp, and blocker records fail closed', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.tasks[0].status = 'pretend-complete';
  state.evidenceReceipts = ['', 42];
  state.gitBaseline.recordedAt = 'not-a-timestamp';
  state.updatedAt = 'also-not-a-timestamp';
  state.blockers = {
    'broken-command': {
      attempts: [{ number: 2, hypothesis: 'first hypothesis' }],
    },
  };

  const errors = validateWorkflowState(state, 'malformed-records');
  assert.ok(errors.some((error) => error.includes('tasks[0].status')));
  assert.ok(errors.some((error) => error.includes('evidenceReceipts')));
  assert.ok(errors.some((error) => error.includes('gitBaseline.recordedAt')));
  assert.ok(errors.some((error) => error.includes('updatedAt')));
  assert.ok(errors.some((error) => error.includes('attempt 1 number must be 1')));
});

test('every phase must follow a legal recorded predecessor', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'VERIFY';
  state.lastCompletedPhase = 'DISCOVER';

  const errors = validateWorkflowState(state, 'illegal-history-state');
  assert.ok(errors.some((error) => error.includes('VERIFY must follow BUILD')));
});

test('default artifact root must match the change ID and cannot escape the repository', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  state.artifactRoot = '../../outside';
  let errors = validateWorkflowState(state, 'escaping-artifact-state');
  assert.ok(errors.some((error) => error.includes('artifactRoot must be a safe project-relative path')));

  state.artifactRoot = '.codex/workflows/changes/another-change';
  errors = validateWorkflowState(state, 'mismatched-artifact-state');
  assert.ok(errors.some((error) => error.includes('artifactRoot must be .codex/workflows/changes/discount-floor')));

  state.artifactRoot = 'C:outside/discount-floor';
  state.artifactRootOverride = { approved: true, reference: 'unsafe-override' };
  errors = validateWorkflowState(state, 'drive-relative-artifact-state');
  assert.ok(errors.some((error) => error.includes('artifactRoot must be a safe project-relative path')));
});

test('codex workflow path is the canonical default artifact root', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.artifactRoot = '.codex/workflows/changes/discount-floor';
  state.artifactRootOverride = null;

  assert.deepEqual(validateWorkflowState(state, 'codex-default-artifact-state'), []);
});

test('a safe non-default artifact root requires and accepts a recorded approval reference', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.artifactRoot = 'project-artifacts/discount-floor';
  state.artifactRootOverride = {
    approved: true,
    reference: 'AGENTS.md:artifact-policy',
  };
  assert.deepEqual(validateWorkflowState(state, 'approved-artifact-override'), []);
});

test('the legal predecessor table accepts every phase and rejects an unrelated predecessor', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const base = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const legal = [
    ['BOOTSTRAP', null],
    ['INTAKE', 'BOOTSTRAP'],
    ['DISCOVER', 'INTAKE'],
    ['TRIAGE', 'DISCOVER'],
    ['DEFINE', 'TRIAGE'],
    ['SPEC APPROVAL', 'DEFINE'],
    ['SOLUTION DESIGN', 'SPEC APPROVAL'],
    ['SOLUTION APPROVAL', 'SOLUTION DESIGN'],
    ['PLAN', 'SOLUTION APPROVAL'],
    ['PLAN APPROVAL', 'PLAN'],
    ['BUILD', 'PLAN APPROVAL'],
    ['VERIFY', 'BUILD'],
    ['REVIEW', 'VERIFY'],
    ['AUTO-REMEDIATE', 'REVIEW'],
    ['RE-VERIFY', 'AUTO-REMEDIATE'],
    ['RE-REVIEW', 'RE-VERIFY'],
    ['LEARNING RETROSPECTIVE', 'REVIEW'],
    ['FINAL REPORT', 'LEARNING RETROSPECTIVE'],
    ['STOP', 'FINAL REPORT'],
  ];

  for (const [phase, predecessor] of legal) {
    const state = structuredClone(base);
    state.phase = phase;
    state.lastCompletedPhase = predecessor;
    state.terminalState = ['FINAL REPORT', 'STOP'].includes(phase) ? 'REVIEW PASSED' : null;
    assert.deepEqual(validateWorkflowState(state, `legal-${phase}`), []);

    state.lastCompletedPhase = 'STOP';
    const errors = validateWorkflowState(state, `illegal-${phase}`);
    assert.ok(errors.some((error) => error.includes(`${phase} must follow`)), phase);
  }
});

test('a final state may be selected while writing FINAL REPORT', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'FINAL REPORT';
  state.terminalState = 'REVIEW PASSED';
  state.lastCompletedPhase = 'LEARNING RETROSPECTIVE';
  assert.deepEqual(validateWorkflowState(state, 'final-report-state'), []);
});

test('REVIEW PASSED cannot bypass learning retrospective', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'FINAL REPORT';
  state.terminalState = 'REVIEW PASSED';
  state.lastCompletedPhase = 'REVIEW';

  const errors = validateWorkflowState(state, 'bypassed-retrospective-state');
  assert.ok(errors.some((error) => error.includes('directly after review requires REVIEW BLOCKED')));
});

test('a blocked review may enter FINAL REPORT without retrospective', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'FINAL REPORT';
  state.terminalState = 'REVIEW BLOCKED';
  state.lastCompletedPhase = 'RE-REVIEW';
  assert.deepEqual(validateWorkflowState(state, 'blocked-review-state'), []);
});

test('learning retrospective accepts clean review predecessors and no terminal state', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'learning-retrospective-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.deepEqual(validateWorkflowState(state, 'learning-retrospective-state'), []);

  state.lastCompletedPhase = 'VERIFY';
  const errors = validateWorkflowState(state, 'early-retrospective-state');
  assert.ok(errors.some((error) => error.includes('LEARNING RETROSPECTIVE must follow REVIEW or RE-REVIEW')));
});

test('learning candidate validation enforces proposal and evidence boundaries', () => {
  const valid = [
    '---',
    'schemaVersion: 1',
    'candidateId: "LR-001"',
    'status: "proposed"',
    'classification: "PLUGIN CANDIDATE"',
    'changeId: "example-change"',
    'generatedAt: "2026-09-15T12:00:00Z"',
    'pluginMutation: "none"',
    '---',
    '',
    '# Learning retrospective: Example',
    '',
    '## Observation',
    'An evidenced workflow gap occurred.',
    '',
    '## Evidence',
    '- `evidence.md#VERIFY-001` - The executed check proves the condition.',
    '',
    '## Durability test',
    'The current plugin could repeat the gap.',
    '',
    '## Existing coverage',
    'The owning guidance was inspected and does not cover the condition.',
    '',
    '## Proposed plugin targets',
    '- `references/example.md` - Add the missing condition.',
    '',
    '## Proposed eval',
    '- The agent asks instead of inferring when the condition is absent.',
    '',
    '## Applicability',
    'Applies to changes with the evidenced condition only.',
    '',
    '## Overgeneralization risk',
    'Do not apply it to mechanical local choices.',
    '',
    '## Open questions',
    '- None',
    '',
    '## Approval boundary',
    'Apply only through a separate approved Controlled Development change.',
    '',
  ].join('\n');

  assert.deepEqual(validateLearningRetrospective(valid), []);
  const invalid = valid
    .replace('status: "proposed"', 'status: "approved"')
    .replace('pluginMutation: "none"', 'pluginMutation: "applied"')
    .replace('- `evidence.md#VERIFY-001` - The executed check proves the condition.', 'No concrete pointer.');
  const errors = validateLearningRetrospective(invalid);
  assert.ok(errors.some((error) => error.includes('status must be proposed')));
  assert.ok(errors.some((error) => error.includes('pluginMutation must be none')));
  assert.ok(errors.some((error) => error.includes('concrete backticked pointer')));
});

test('a fourth review-remediation cycle is rejected', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'AUTO-REMEDIATE';
  state.lastCompletedPhase = 'RE-REVIEW';
  state.reviewRemediationCycle = 4;
  const errors = validateWorkflowState(state, 'cycle-four-state');
  assert.ok(errors.some((error) => error.includes('review remediation limit')));
});

test('AUTO-REMEDIATE cannot start when three cycles are already recorded', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'AUTO-REMEDIATE';
  state.lastCompletedPhase = 'REVIEW';
  state.reviewRemediationCycle = 3;
  const errors = validateWorkflowState(state, 'cycle-limit-state');
  assert.ok(errors.some((error) => error.includes('cannot begin after three review remediation cycles')));
});

test('a fourth recovery attempt for one blocker is rejected', () => {
  const statePath = path.join(pluginRoot, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.blockers = {
    'test-command-failure': {
      attempts: [
        { number: 1, hypothesis: 'wrong command' },
        { number: 2, hypothesis: 'wrong directory' },
        { number: 3, hypothesis: 'missing configuration' },
        { number: 4, hypothesis: 'try again' },
      ],
    },
  };
  const errors = validateWorkflowState(state, 'attempt-four-state');
  assert.ok(errors.some((error) => error.includes('recovery attempt limit')));
});

test('all checked-in trigger cases route as declared', () => {
  assert.deepEqual(runTriggerEvals(pluginRoot).errors, []);
});

test('behavioral eval runner refuses an omitted scope before invoking Codex', () => {
  const runner = path.join(pluginRoot, 'evals', 'runners', 'run-behavioral-evals.mjs');
  const result = spawnSync(process.execPath, [runner], {
    cwd: pluginRoot,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /explicit selection required/);
});
test('behavioral eval runner can dry-run every checked-in case without spending tokens', () => {
  const runner = path.join(pluginRoot, 'evals', 'runners', 'run-behavioral-evals.mjs');
  const casesRoot = path.join(pluginRoot, 'evals', 'cases');
  const expectedCount = fs.readdirSync(casesRoot)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => JSON.parse(fs.readFileSync(path.join(casesRoot, entry), 'utf8')).evals.length)
    .reduce((total, count) => total + count, 0);
  const result = spawnSync(process.execPath, [runner, '--all', '--dry-run'], {
    cwd: pluginRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, new RegExp(`${expectedCount} behavioral evals planned; execution NOT RUN \\(dry-run\\)`));
});

test('behavioral eval runner can dry-run execution and exact-case selections', () => {
  const runner = path.join(pluginRoot, 'evals', 'runners', 'run-behavioral-evals.mjs');
  const casesRoot = path.join(pluginRoot, 'evals', 'cases');
  const definitions = fs.readdirSync(casesRoot)
    .filter((entry) => entry.endsWith('.json'))
    .map((entry) => JSON.parse(fs.readFileSync(path.join(casesRoot, entry), 'utf8')));
  const executionCount = definitions
    .flatMap((definition) => definition.evals)
    .filter((evaluation) => evaluation.kind === 'execution').length;

  const execution = spawnSync(process.execPath, [runner, '--all', '--kind', 'execution', '--dry-run'], {
    cwd: pluginRoot,
    encoding: 'utf8',
  });
  assert.equal(execution.status, 0, `${execution.stdout}${execution.stderr}`);
  assert.match(execution.stdout, new RegExp(`${executionCount} behavioral evals planned`));

  const exact = spawnSync(process.execPath, [
    runner, '--case', 'controlled-development:8', '--dry-run',
  ], {
    cwd: pluginRoot,
    encoding: 'utf8',
  });
  assert.equal(exact.status, 0, `${exact.stdout}${exact.stderr}`);
  assert.match(exact.stdout, /controlled-development eval 8: execution/);
  assert.match(exact.stdout, /1 behavioral evals planned/);
});

test('the Node fixture supports a real red-green sequence and preserves unrelated content', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-node-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const sourceFixture = path.join(pluginRoot, 'tests', 'fixtures', 'node-change');
  fs.cpSync(sourceFixture, temporaryRoot, { recursive: true });
  const childEnvironment = { ...process.env };
  // A nested Node test runner skips files when it inherits the parent's internal test context.
  delete childEnvironment.NODE_TEST_CONTEXT;
  const unrelatedPath = path.join(temporaryRoot, 'UNRELATED.md');
  const unrelatedBefore = fs.readFileSync(unrelatedPath, 'utf8');

  const testPath = path.join(temporaryRoot, 'test', 'calculate.test.js');
  fs.appendFileSync(testPath, [
    '',
    "test('clamps a discount larger than subtotal to zero', () => {",
    '  assert.equal(applyDiscount(50, 70), 0);',
    '});',
    '',
  ].join('\n'));

  const red = spawnSync(process.execPath, ['--test'], {
    cwd: temporaryRoot,
    encoding: 'utf8',
    env: childEnvironment,
  });
  assert.notEqual(red.status, 0);
  assert.match(`${red.stdout}${red.stderr}`, /-20 !== 0|Expected values to be strictly equal/);

  const sourcePath = path.join(temporaryRoot, 'src', 'calculate.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(sourcePath, source.replace('return subtotal - discount;', 'return Math.max(0, subtotal - discount);'));

  const green = spawnSync(process.execPath, ['--test'], {
    cwd: temporaryRoot,
    encoding: 'utf8',
    env: childEnvironment,
  });
  assert.equal(green.status, 0, `${green.stdout}${green.stderr}`);
  const syntax = spawnSync(process.execPath, ['--check', sourcePath], { cwd: temporaryRoot, encoding: 'utf8' });
  assert.equal(syntax.status, 0, `${syntax.stdout}${syntax.stderr}`);
  assert.equal(fs.readFileSync(unrelatedPath, 'utf8'), unrelatedBefore);
});

test('the Python fixture passes tests while its optional type checker is unavailable', (context) => {
  const fixtureRoot = path.join(pluginRoot, 'tests', 'fixtures', 'python-verification');
  const pythonCandidates = [process.env.CONTROLLED_DEVELOPMENT_PYTHON, 'python', 'python3', 'py'].filter(Boolean);
  const python = pythonCandidates.find((candidate) => {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    return probe.status === 0;
  });
  if (!python) {
    context.skip('Python is unavailable; fixture baseline is NOT RUN');
    return;
  }
  const tests = spawnSync(python, ['-m', 'unittest', 'discover', '-s', 'tests'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.equal(tests.status, 0, `${tests.stdout}${tests.stderr}`);

  const mypy = spawnSync(python, ['-m', 'mypy', 'src'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  if (!mypy.error && mypy.status === 0) {
    assert.match(mypy.stdout, /Success|no issues found/i);
  } else {
    assert.match(`${mypy.stdout}${mypy.stderr}`, /No module named mypy|not found|cannot find/i);
  }
});


