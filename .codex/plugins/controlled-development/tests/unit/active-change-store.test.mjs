import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { activateChangeBinding, deactivateChangeBinding, readActiveChange } from '../../scripts/runtime/active-change-store.mjs';

test('active change store permits one idempotent binding per checkout', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-active-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const binding = { changeId: 'one', statePath: '.codex/workflows/changes/one/state.json', nonce: 'nonce-one' };
  activateChangeBinding(root, binding);
  activateChangeBinding(root, binding);
  assert.equal(readActiveChange(root).changeId, 'one');
  assert.throws(() => activateChangeBinding(root, { ...binding, changeId: 'two' }), /already active/);
});

test('deactivation is scoped to the expected active change', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-active-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  activateChangeBinding(root, { changeId: 'one', statePath: 'state.json', nonce: 'nonce-one' });
  assert.throws(() => deactivateChangeBinding(root, 'two'), /does not match/);
  deactivateChangeBinding(root, 'one');
  assert.equal(readActiveChange(root), null);
});

test('malformed or stale checkout bindings fail closed', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-active-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, '.codex', 'workflows');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'active-change.json'), '{"changeId":"one"}\n');
  assert.throws(() => readActiveChange(root), /invalid/);
});
