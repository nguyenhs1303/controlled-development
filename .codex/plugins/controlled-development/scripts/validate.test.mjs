import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runTriggerEvals } from './run-trigger-evals.mjs';
import { validateLearningRetrospective } from './validate-learning-retrospective.mjs';
import { validatePlugin, validateWorkflowState } from './validate.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDirectory, '..');

test('the checked-in plugin satisfies structural contracts', () => {
  assert.deepEqual(validatePlugin(pluginRoot), []);
});

test('the base plugin version remains valid without a cachebuster', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const manifestPath = path.join(temporaryRoot, '.codex-plugin', 'plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = '0.1.0';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  assert.deepEqual(validatePlugin(temporaryRoot), []);
});

test('an unrelated plugin version is rejected', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const manifestPath = path.join(temporaryRoot, '.codex-plugin', 'plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = '0.2.0';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('0.1.0 or a Codex cachebuster')));
});

test('every skill must apply the shared output language policy', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const skillPath = path.join(temporaryRoot, 'skills', 'project-discovery', 'SKILL.md');
  const contents = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(skillPath, contents.replace('../../references/output-language-policy.md', '../../references/evidence-policy.md'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must apply the output language policy')));
});

test('every skill must apply the decision evidence policy', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.cpSync(pluginRoot, temporaryRoot, { recursive: true });

  const skillPath = path.join(temporaryRoot, 'skills', 'implementation-planning', 'SKILL.md');
  const contents = fs.readFileSync(skillPath, 'utf8');
  fs.writeFileSync(skillPath, contents.replace('../../references/decision-evidence-policy.md', '../../references/evidence-policy.md'));

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('must apply the decision evidence policy')));
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

  const statePath = path.join(temporaryRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.approvals.spec.status = 'pending';
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const errors = validatePlugin(temporaryRoot);
  assert.ok(errors.some((error) => error.includes('BUILD requires approved spec')));
});

test('the intentionally invalid resume fixture fails closed', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'invalid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const errors = validateWorkflowState(state, 'invalid-state.json');
  assert.ok(errors.some((error) => error.includes('BUILD requires approved spec')));
  assert.ok(errors.some((error) => error.includes('BUILD requires approved plan')));
  assert.ok(errors.some((error) => error.includes('BUILD must follow PLAN APPROVAL')));
});

test('low-risk BUILD may follow PLAN when plan approval is optional', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.riskLevel = 'low';
  state.approvals.plan.required = false;
  state.approvals.plan.status = 'pending';
  state.approvals.plan.reference = null;
  state.lastCompletedPhase = 'PLAN';
  assert.deepEqual(validateWorkflowState(state, 'optional-plan-state'), []);
});

test('a stricter project policy may require plan approval for a low-risk change', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.riskLevel = 'low';
  state.approvals.plan.required = true;
  state.lastCompletedPhase = 'PLAN APPROVAL';
  assert.deepEqual(validateWorkflowState(state, 'stricter-plan-state'), []);
});

test('Deep BUILD cannot bypass plan approval by changing persisted required flag', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
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
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.approvals.spec.reference = null;
  state.approvals.plan.reference = '   ';

  const errors = validateWorkflowState(state, 'missing-approval-references');
  assert.ok(errors.some((error) => error.includes('approved spec requires a reference')));
  assert.ok(errors.some((error) => error.includes('approved plan requires a reference')));
});

test('write phases require a recorded baseline and fail closed on observed drift', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
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

test('malformed task, evidence, timestamp, and blocker records fail closed', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
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
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'VERIFY';
  state.lastCompletedPhase = 'DISCOVER';

  const errors = validateWorkflowState(state, 'illegal-history-state');
  assert.ok(errors.some((error) => error.includes('VERIFY must follow BUILD')));
});

test('default artifact root must match the change ID and cannot escape the repository', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
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
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.artifactRoot = '.codex/workflows/changes/discount-floor';
  state.artifactRootOverride = null;

  assert.deepEqual(validateWorkflowState(state, 'codex-default-artifact-state'), []);
});

test('a safe non-default artifact root requires and accepts a recorded approval reference', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.artifactRoot = 'project-artifacts/discount-floor';
  state.artifactRootOverride = {
    approved: true,
    reference: 'AGENTS.md:artifact-policy',
  };
  assert.deepEqual(validateWorkflowState(state, 'approved-artifact-override'), []);
});

test('the legal predecessor table accepts every phase and rejects an unrelated predecessor', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const base = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const legal = [
    ['BOOTSTRAP', null],
    ['INTAKE', 'BOOTSTRAP'],
    ['DISCOVER', 'INTAKE'],
    ['DEFINE', 'DISCOVER'],
    ['SPEC APPROVAL', 'DEFINE'],
    ['PLAN', 'SPEC APPROVAL'],
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
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'FINAL REPORT';
  state.terminalState = 'REVIEW PASSED';
  state.lastCompletedPhase = 'LEARNING RETROSPECTIVE';
  assert.deepEqual(validateWorkflowState(state, 'final-report-state'), []);
});

test('REVIEW PASSED cannot bypass learning retrospective', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'FINAL REPORT';
  state.terminalState = 'REVIEW PASSED';
  state.lastCompletedPhase = 'REVIEW';

  const errors = validateWorkflowState(state, 'bypassed-retrospective-state');
  assert.ok(errors.some((error) => error.includes('directly after review requires REVIEW BLOCKED')));
});

test('a blocked review may enter FINAL REPORT without retrospective', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'FINAL REPORT';
  state.terminalState = 'REVIEW BLOCKED';
  state.lastCompletedPhase = 'RE-REVIEW';
  assert.deepEqual(validateWorkflowState(state, 'blocked-review-state'), []);
});

test('learning retrospective accepts clean review predecessors and no terminal state', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'learning-retrospective-state.json');
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
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'AUTO-REMEDIATE';
  state.lastCompletedPhase = 'RE-REVIEW';
  state.reviewRemediationCycle = 4;
  const errors = validateWorkflowState(state, 'cycle-four-state');
  assert.ok(errors.some((error) => error.includes('review remediation limit')));
});

test('AUTO-REMEDIATE cannot start when three cycles are already recorded', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'AUTO-REMEDIATE';
  state.lastCompletedPhase = 'REVIEW';
  state.reviewRemediationCycle = 3;
  const errors = validateWorkflowState(state, 'cycle-limit-state');
  assert.ok(errors.some((error) => error.includes('cannot begin after three review remediation cycles')));
});

test('a fourth recovery attempt for one blocker is rejected', () => {
  const statePath = path.join(pluginRoot, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
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

test('behavioral eval runner can dry-run every checked-in case without spending tokens', () => {
  const runner = path.join(pluginRoot, 'scripts', 'run-behavioral-evals.mjs');
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

test('the Node fixture supports a real red-green sequence and preserves unrelated content', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-node-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const sourceFixture = path.join(pluginRoot, 'evals', 'fixtures', 'node-change');
  fs.cpSync(sourceFixture, temporaryRoot, { recursive: true });
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

  const red = spawnSync(process.execPath, ['--test'], { cwd: temporaryRoot, encoding: 'utf8' });
  assert.notEqual(red.status, 0);
  assert.match(`${red.stdout}${red.stderr}`, /-20 !== 0|Expected values to be strictly equal/);

  const sourcePath = path.join(temporaryRoot, 'src', 'calculate.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(sourcePath, source.replace('return subtotal - discount;', 'return Math.max(0, subtotal - discount);'));

  const green = spawnSync(process.execPath, ['--test'], { cwd: temporaryRoot, encoding: 'utf8' });
  assert.equal(green.status, 0, `${green.stdout}${green.stderr}`);
  const syntax = spawnSync(process.execPath, ['--check', sourcePath], { cwd: temporaryRoot, encoding: 'utf8' });
  assert.equal(syntax.status, 0, `${syntax.stdout}${syntax.stderr}`);
  assert.equal(fs.readFileSync(unrelatedPath, 'utf8'), unrelatedBefore);
});

test('the Python fixture passes tests while its optional type checker is unavailable', (context) => {
  const fixtureRoot = path.join(pluginRoot, 'evals', 'fixtures', 'python-verification');
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
