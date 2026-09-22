import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  activateWorkflowChange,
  approveState,
  checkResume,
  deactivateWorkflowChange,
  recordReadinessProof,
  bindEvidenceReceipt,
  currentImplementationSnapshot,
  recordStateMetadata,
  statusForState,
  transitionState,
  validateStateFile,
} from '../../scripts/runtime/workflow-controller-core.mjs';
import { hashArtifact } from '../../scripts/runtime/workflow-crypto.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function createWorkflow(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-controller-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const state = JSON.parse(fs.readFileSync(new URL('../../assets/workflow-templates/state.json', import.meta.url), 'utf8'));
  state.changeId = 'controller-test';
  state.profile = 'deep';
  state.riskLevel = 'high';
  state.triage.highestFactors = ['interface'];
  state.triage.reason = 'Controller test fixture';
  state.triage.solutionMode = 'full';
  state.triage.solutionReason = 'Controller behavior needs full approval gates';
  state.phase = 'SPEC APPROVAL';
  state.lastCompletedPhase = 'DEFINE';
  state.artifactRoot = '.codex/workflows/changes/controller-test';
  state.approvals.solution.mode = 'full';
  state.approvals.plan.required = true;
  state.updatedAt = '2026-01-01T00:00:00Z';
  const statePath = path.join(root, 'state.json');
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  fs.writeFileSync(path.join(root, 'spec.md'), '\ufeffLine one\r\nLine two\r\n');
  fs.writeFileSync(path.join(root, 'solution.md'), '# Solution\n');
  fs.writeFileSync(path.join(root, 'plan.md'), '# Plan\n');
  return { root, statePath };
}

test('hash-artifact applies sha256-text-v1 normalization', (context) => {
  const { root } = createWorkflow(context);
  const first = path.join(root, 'spec.md');
  const second = path.join(root, 'equivalent.md');
  fs.writeFileSync(second, 'Line one\nLine two\n');
  assert.equal(hashArtifact(first), hashArtifact(second));
});

test('read-only status and validation expose controller state', (context) => {
  const { statePath } = createWorkflow(context);
  assert.deepEqual(validateStateFile(statePath).errors, []);
  const status = statusForState(statePath);
  assert.equal(status.revision, 0);
  assert.deepEqual(status.legalTransitions, ['SOLUTION DESIGN']);
});

test('approve binds the current artifact digest and appends an immutable event', (context) => {
  const { root, statePath } = createWorkflow(context);
  const result = approveState(statePath, 'spec', 0, 'human-approval', { at: '2026-01-02T00:00:00Z' });
  assert.equal(result.state.revision, 1);
  assert.equal(result.state.approvals.spec.artifactDigest, hashArtifact(path.join(root, 'spec.md')));
  assert.equal(result.state.lastEventSequence, 1);
  assert.ok(fs.existsSync(path.join(root, 'events', '00000001.json')));
  assert.equal(checkResume(statePath).status, 'ok');
});

test('check-resume detects artifact changes and baseline drift', (context) => {
  const { root, statePath } = createWorkflow(context);
  approveState(statePath, 'spec', 0, 'human-approval', { at: '2026-01-02T00:00:00Z' });
  fs.appendFileSync(path.join(root, 'spec.md'), 'changed\n');
  let result = checkResume(statePath);
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.some((error) => error.includes('artifact digest no longer matches')));

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.gitBaseline = { head: 'one', statusFingerprint: 'sha256:one', recordedAt: '2026-01-01T00:00:00Z' };
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  result = checkResume(statePath, { currentGitBaseline: { head: 'two', statusFingerprint: 'sha256:two' } });
  assert.ok(result.errors.some((error) => error.includes('gitBaseline drift')));
});

test('schema 4 resume permits implementation status drift but still rejects HEAD drift', (context) => {
  const { statePath } = createWorkflow(context);
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.gitBaseline = { head: 'one', statusFingerprint: 'sha256:one', recordedAt: '2026-01-01T00:00:00Z' };
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  assert.equal(checkResume(statePath, { currentGitBaseline: { head: 'one', statusFingerprint: 'sha256:changed' } }).status, 'ok');
  assert.match(checkResume(statePath, { currentGitBaseline: { head: 'two', statusFingerprint: 'sha256:changed' } }).errors.join(' '), /gitBaseline drift/);
});

test('transition enforces optimistic revision and legal phase rules', (context) => {
  const { statePath } = createWorkflow(context);
  approveState(statePath, 'spec', 0, 'human-approval', { at: '2026-01-02T00:00:00Z' });
  const transitioned = transitionState(statePath, 'SOLUTION DESIGN', 1, { at: '2026-01-03T00:00:00Z' });
  assert.equal(transitioned.state.phase, 'SOLUTION DESIGN');
  assert.equal(transitioned.state.lastCompletedPhase, 'SPEC APPROVAL');
  assert.throws(() => transitionState(statePath, 'SOLUTION APPROVAL', 1), /stale revision/);
  assert.throws(() => transitionState(statePath, 'BUILD', 2), /illegal transition/);
});

test('lock files prevent concurrent writers and successful writes leave no temp files', (context) => {
  const { root, statePath } = createWorkflow(context);
  fs.writeFileSync(`${statePath}.lock`, 'held');
  assert.throws(() => approveState(statePath, 'spec', 0, 'human-approval'), /state lock exists/);
  fs.unlinkSync(`${statePath}.lock`);
  fs.writeFileSync(path.join(root, `.state.json.tmp-999-stale`), 'partial');
  approveState(statePath, 'spec', 0, 'human-approval');
  assert.equal(fs.readdirSync(root).some((entry) => entry.includes('.tmp-')), false);
});

test('a stale lock from a dead process is reclaimed', (context) => {
  const { statePath } = createWorkflow(context);
  fs.writeFileSync(`${statePath}.lock`, `${JSON.stringify({ pid: 2147483647, createdAt: '2026-01-01T00:00:00Z' })}\n`);
  const result = approveState(statePath, 'spec', 0, 'human-approval');
  assert.equal(result.state.revision, 1);
  assert.equal(fs.existsSync(`${statePath}.lock`), false);
});

test('a crash after event append is recoverable on the next mutation', (context) => {
  const { statePath } = createWorkflow(context);
  approveState(statePath, 'spec', 0, 'human-approval', { at: '2026-01-02T00:00:00Z' });
  transitionState(statePath, 'SOLUTION DESIGN', 1, { at: '2026-01-03T00:00:00Z' });
  assert.throws(() => transitionState(statePath, 'SOLUTION APPROVAL', 2, {
    at: '2026-01-04T00:00:00Z',
    failAfterEvent: true,
  }), /simulated crash/);
  assert.equal(checkResume(statePath).status, 'recoverable');

  const approved = approveState(statePath, 'solution', 3, 'solution-approved', { at: '2026-01-05T00:00:00Z' });
  assert.equal(approved.state.revision, 4);
  assert.equal(approved.state.phase, 'SOLUTION APPROVAL');
  assert.equal(approved.state.approvals.solution.status, 'approved');
  assert.equal(checkResume(statePath).status, 'ok');
});

test('event tampering is detected', (context) => {
  const { root, statePath } = createWorkflow(context);
  approveState(statePath, 'spec', 0, 'human-approval', { at: '2026-01-02T00:00:00Z' });
  const eventPath = path.join(root, 'events', '00000001.json');
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  event.type = 'TAMPERED';
  fs.writeFileSync(eventPath, `${JSON.stringify(event, null, 2)}\n`);
  const result = checkResume(statePath);
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.some((error) => error.includes('eventHash does not match')));
});

test('record stores allowlisted metadata through the same revisioned ledger', (context) => {
  const { statePath } = createWorkflow(context);
  const recorded = recordStateMetadata(statePath, 0, {
    evidenceReceipts: ['CLI-001'],
    tasks: [{ id: 'TASK-001', status: 'todo' }],
  }, { at: '2026-01-02T00:00:00Z' });
  assert.equal(recorded.state.revision, 1);
  assert.deepEqual(recorded.state.evidenceReceipts, ['CLI-001']);
  assert.throws(() => recordStateMetadata(statePath, 1, { phase: 'BUILD' }), /controller-owned/);
});

test('controller activates one change and requires readiness proof', (context) => {
  const { root, statePath } = createWorkflow(context);
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.phase = 'BUILD';
  state.lastCompletedPhase = 'PLAN APPROVAL';
  state.currentTaskId = 'TASK-001';
  state.approvedScope = ['src/**'];
  state.tasks = [{ id: 'TASK-001', status: 'in-progress' }];
  state.gitBaseline = { head: 'a'.repeat(40), statusFingerprint: `sha256:${'b'.repeat(64)}`, recordedAt: '2026-01-01T00:00:00Z' };
  for (const gate of ['spec', 'solution', 'plan']) {
    state.approvals[gate] = {
      ...state.approvals[gate],
      status: 'approved',
      reference: 'approved',
      artifactPath: `${gate}.md`,
      digestAlgorithm: 'sha256-text-v1',
      artifactDigest: hashArtifact(path.join(root, `${gate}.md`)),
      approvedAt: '2026-01-01T00:00:00Z',
    };
  }
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  const policyPath = path.join(root, 'execution-policy.json');
  fs.writeFileSync(policyPath, `${JSON.stringify({
    contractVersion: 1,
    changeId: 'controller-test',
    taskId: 'TASK-001',
    phase: 'BUILD',
    allowedWritePaths: [],
    allowedNewFiles: [],
    protectedPaths: [],
    commandGrants: [],
    requiredChecks: [],
  }, null, 2)}\n`);

  const activated = activateWorkflowChange(statePath, root, policyPath, 0, { nonce: 'nonce-one' });
  assert.equal(activated.state.enforcement.status, 'pending');
  assert.equal(activated.state.enforcement.activeBinding.nonce, 'nonce-one');
  const ready = recordReadinessProof(statePath, 1, 'session-proof');
  assert.equal(ready.state.enforcement.status, 'ready');
  const deactivated = deactivateWorkflowChange(statePath, root, 2);
  assert.equal(deactivated.state.enforcement.status, 'inactive');
  assert.equal(fs.existsSync(path.join(root, '.codex', 'workflows', 'active-change.json')), false);
});

test('evidence receipt binds implementation snapshot and detects later drift', (context) => {
  const { root, statePath } = createWorkflow(context);
  spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  const bound = bindEvidenceReceipt(statePath, root, 0, 'EVID-TEST');
  assert.match(bound.state.enforcement.implementation.snapshotDigest, /^sha256:/);
  fs.writeFileSync(path.join(root, 'new-implementation.js'), 'changed\n');
  const changed = currentImplementationSnapshot(root, bound.state);
  assert.notEqual(changed.snapshotDigest, bound.state.enforcement.implementation.snapshotDigest);
});

test('CLI read-only commands return machine-readable output', (context) => {
  const { statePath } = createWorkflow(context);
  const controller = path.resolve(scriptDirectory, '..', '..', 'scripts', 'runtime', 'workflow-controller.mjs');
  for (const args of [
    ['status', '--state', statePath],
    ['validate-state', '--state', statePath],
    ['check-resume', '--state', statePath],
    ['hash-artifact', path.join(path.dirname(statePath), 'spec.md')],
  ]) {
    const result = spawnSync(process.execPath, [controller, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.doesNotThrow(() => JSON.parse(result.stdout));
  }
});
