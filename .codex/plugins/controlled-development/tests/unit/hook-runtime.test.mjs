import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runHookFixture } from '../helpers/hook-harness.mjs';
import { parseHookEvent } from '../../scripts/runtime/hook-event-parser.mjs';
import { handleHookEvent } from '../../scripts/runtime/hook-runtime.mjs';
import { authorizeStop } from '../../scripts/runtime/workflow-controller-core.mjs';
import { hashArtifact } from '../../scripts/runtime/workflow-crypto.mjs';
import os from 'node:os';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

for (const fixture of ['session-start', 'pre-tool-use', 'post-tool-use', 'stop']) {
  test(`hook harness executes ${fixture} JSON fixture`, () => {
    const input = JSON.parse(fs.readFileSync(
      path.join(pluginRoot, 'tests', 'fixtures', 'hooks', `${fixture}.json`),
      'utf8',
    ));
    const result = runHookFixture(pluginRoot, input);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.json?.hookSpecificOutput?.hookEventName, input.hook_event_name);
  });
}

test('inactive checkout is a deterministic no-op', () => {
  const result = runHookFixture(pluginRoot, {
    hook_event_name: 'SessionStart',
    source: 'startup',
    cwd: pluginRoot,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.json, { hookSpecificOutput: { hookEventName: 'SessionStart' } });
});

test('malformed hook input fails closed', () => {
  assert.throws(() => parseHookEvent('{'), /valid JSON/);
  assert.throws(() => parseHookEvent({ hook_event_name: 'Unknown', cwd: '.' }), /unsupported/);
});

test('PreToolUse authorizes declared paths and denies undeclared paths', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'controlled-development-hook-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const workflow = path.join(root, '.codex', 'workflows', 'changes', 'change-one');
  fs.mkdirSync(workflow, { recursive: true });
  const binding = { changeId: 'change-one', statePath: '.codex/workflows/changes/change-one/state.json', nonce: 'nonce-one' };
  fs.writeFileSync(path.join(root, '.codex', 'workflows', 'active-change.json'), `${JSON.stringify(binding)}\n`);
  const statePath = path.join(workflow, 'state.json');
  const policyPath = path.join(workflow, 'execution-policy.json');
  fs.writeFileSync(policyPath, `${JSON.stringify({
    contractVersion: 1,
    changeId: 'change-one',
    taskId: 'TASK-001',
    phase: 'BUILD',
    allowedWritePaths: ['src/**'],
    allowedNewFiles: ['src/**'],
    protectedPaths: ['.codex/**'],
    commandGrants: [],
    requiredChecks: [],
  })}\n`);
  fs.writeFileSync(statePath, `${JSON.stringify({
    schemaVersion: 4,
    changeId: 'change-one',
    phase: 'BUILD',
    currentTaskId: 'TASK-001',
    enforcement: { status: 'ready', activeBinding: binding, policy: { artifactPath: 'execution-policy.json', artifactDigest: hashArtifact(policyPath) } },
  })}\n`);
  const base = { hook_event_name: 'PreToolUse', tool_name: 'Write', cwd: root };
  assert.equal(handleHookEvent({ ...base, tool_input: { file_path: 'src/new.js' } }).hookSpecificOutput.permissionDecision, 'allow');
  const denied = handleHookEvent({ ...base, tool_input: { file_path: 'outside.js' } });
  assert.equal(denied.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(denied.hookSpecificOutput.permissionDecisionReason, /CD-E204/);
  const commandAllowed = handleHookEvent({ ...base, tool_name: 'Bash', tool_input: { command: 'git status --short' } });
  assert.equal(commandAllowed.hookSpecificOutput.permissionDecision, 'allow');
  const unknownDenied = handleHookEvent({ ...base, tool_name: 'UnregisteredTool', tool_input: {} });
  assert.match(unknownDenied.hookSpecificOutput.permissionDecisionReason, /CD-E900/);
});

test('Stop allows approval waits, blocks incomplete work once, and prevents loops', () => {
  const incomplete = { phase: 'BUILD', tasks: [{ id: 'TASK-001', status: 'in-progress' }], blockers: {} };
  assert.equal(authorizeStop(incomplete).allowed, false);
  assert.equal(authorizeStop(incomplete, { stop_hook_active: true }).allowed, true);
  assert.equal(authorizeStop({ phase: 'PLAN APPROVAL', tasks: [], blockers: {} }).allowed, true);
  assert.equal(authorizeStop({ phase: 'FINAL REPORT', tasks: [{ id: 'TASK-001', status: 'done' }], blockers: {} }).allowed, true);
});
