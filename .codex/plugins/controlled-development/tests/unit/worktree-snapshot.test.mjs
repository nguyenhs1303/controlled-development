import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { captureWorktreeSnapshot, compareWorktreeSnapshots } from '../../scripts/runtime/worktree-snapshot.mjs';

test('snapshot comparison preserves pre-existing dirty files and reports new side effects', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-snapshot-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  run(root, ['init']);
  run(root, ['config', 'user.email', 'test@example.com']);
  run(root, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(root, 'existing.txt'), 'base\n');
  run(root, ['add', 'existing.txt']);
  run(root, ['commit', '-m', 'base']);
  fs.writeFileSync(path.join(root, 'existing.txt'), 'dirty-before\n');
  const before = captureWorktreeSnapshot(root);
  fs.writeFileSync(path.join(root, 'new.txt'), 'side effect\n');
  const after = captureWorktreeSnapshot(root);
  assert.deepEqual(compareWorktreeSnapshots(before, after).changedPaths, ['new.txt']);
});

test('snapshot excludes controller-owned workflow artifacts', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-snapshot-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  run(root, ['init']);
  fs.mkdirSync(path.join(root, '.codex', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(root, '.codex', 'workflows', 'active-change.json'), '{}\n');
  const snapshot = captureWorktreeSnapshot(root, { excludedPaths: ['.codex/workflows/**'] });
  assert.deepEqual(snapshot.paths, {});
});

function run(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
