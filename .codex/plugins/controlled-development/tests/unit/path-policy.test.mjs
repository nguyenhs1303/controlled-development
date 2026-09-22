import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { authorizePathOperation } from '../../scripts/runtime/path-policy.mjs';
import { RULE_IDS } from '../../scripts/runtime/enforcement-rule-ids.mjs';

test('path policy allows declared writes and new files', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-path-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src', 'existing.js'), 'x');
  const policy = { allowedWritePaths: ['src/**'], allowedNewFiles: ['test/**'], protectedPaths: [] };
  assert.equal(authorizePathOperation(root, 'src/existing.js', policy).ruleId, RULE_IDS.PATH_WRITE_ALLOWED);
  assert.equal(authorizePathOperation(root, 'test/new.test.js', policy).ruleId, RULE_IDS.PATH_NEW_ALLOWED);
});

test('path policy denies protected, traversal, and undeclared targets', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-path-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const policy = { allowedWritePaths: ['**'], allowedNewFiles: ['**'], protectedPaths: ['state.json'] };
  assert.equal(authorizePathOperation(root, 'state.json', policy).ruleId, RULE_IDS.PATH_PROTECTED_DENY);
  assert.equal(authorizePathOperation(root, '../outside.txt', policy).ruleId, RULE_IDS.PATH_OUTSIDE_CHECKOUT);
  assert.equal(authorizePathOperation(root, 'missing.txt', { ...policy, allowedNewFiles: [] }).ruleId, RULE_IDS.PATH_NOT_ALLOWED);
});

test('path policy resolves symlink escapes before allowing writes', { skip: process.platform === 'win32' }, (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-path-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-outside-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  context.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.symlinkSync(outside, path.join(root, 'link'));
  const policy = { allowedWritePaths: ['**'], allowedNewFiles: ['**'], protectedPaths: [] };
  assert.equal(authorizePathOperation(root, 'link/file.txt', policy).ruleId, RULE_IDS.PATH_OUTSIDE_CHECKOUT);
});
