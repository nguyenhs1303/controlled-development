import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizeExecution, validateExecutionPolicy } from '../../scripts/runtime/execution-policy.mjs';
import { RULE_IDS } from '../../scripts/runtime/enforcement-rule-ids.mjs';

function state(overrides = {}) {
  return {
    schemaVersion: 4,
    phase: 'BUILD',
    currentTaskId: 'TASK-001',
    enforcement: { status: 'ready' },
    ...overrides,
  };
}

function policy(overrides = {}) {
  return {
    contractVersion: 1,
    changeId: 'change-id',
    taskId: 'TASK-001',
    phase: 'BUILD',
    allowedWritePaths: [],
    allowedNewFiles: [],
    protectedPaths: [],
    commandGrants: [],
    requiredChecks: [],
    ...overrides,
  };
}

test('authorization no-ops outside an active controlled change', () => {
  assert.deepEqual(authorizeExecution(null, null, { kind: 'write' }), {
    allowed: true,
    ruleId: RULE_IDS.INACTIVE_NOOP,
    reason: 'No active controlled change',
    audit: null,
  });
});

test('authorization fails closed for legacy state and phase mismatch', () => {
  assert.equal(authorizeExecution(state({ schemaVersion: 3 }), policy(), { kind: 'read' }).ruleId, RULE_IDS.STATE_NOT_ENFORCEABLE);
  assert.equal(authorizeExecution(state({ phase: 'VERIFY' }), policy(), { kind: 'read' }).ruleId, RULE_IDS.POLICY_PHASE_MISMATCH);
});

test('authorization allows classified reads and denies unknown operations', () => {
  assert.equal(authorizeExecution(state(), policy(), { kind: 'read' }).ruleId, RULE_IDS.READ_ALLOWED);
  assert.equal(authorizeExecution(state(), policy(), { kind: 'unknown' }).ruleId, RULE_IDS.UNCLASSIFIED_DENY);
});

test('execution policy validator reports malformed task contracts', () => {
  assert.deepEqual(validateExecutionPolicy(policy()), []);
  assert.ok(validateExecutionPolicy(policy({ allowedWritePaths: null })).some((error) => error.includes('allowedWritePaths')));
});
