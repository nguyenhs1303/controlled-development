import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  approveState,
  checkResume,
  recordStateMetadata,
  statusForState,
  transitionState,
  validateStateFile,
} from './workflow-controller-core.mjs';
import { hashArtifact } from './workflow-crypto.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

function createWorkflow(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-controller-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const state = JSON.parse(fs.readFileSync(new URL('../templates/state.json', import.meta.url), 'utf8'));
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

test('CLI read-only commands return machine-readable output', (context) => {
  const { statePath } = createWorkflow(context);
  const controller = path.join(scriptDirectory, 'workflow-controller.mjs');
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
