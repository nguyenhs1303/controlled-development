import assert from 'node:assert/strict';
import test from 'node:test';

import {
  expectedPredecessorsForState,
  legalTransitionTargets,
  planApprovalRequired,
  validateTransitionRequest,
} from './workflow-rules.mjs';

function state(overrides = {}) {
  return {
    schemaVersion: 3,
    profile: 'deep',
    riskLevel: 'high',
    phase: 'PLAN',
    approvals: { plan: { required: true } },
    ...overrides,
  };
}

test('plan approval requirement is pure and profile aware', () => {
  assert.equal(planApprovalRequired(state()), true);
  assert.equal(planApprovalRequired(state({ profile: 'standard', riskLevel: 'medium' })), false);
  assert.equal(planApprovalRequired(state({ schemaVersion: 1, profile: 'standard', riskLevel: 'medium' })), true);
});

test('Quick transitions directly from TRIAGE to BUILD', () => {
  const quick = state({ profile: 'quick', riskLevel: 'low', phase: 'TRIAGE', approvals: { plan: { required: false } } });
  assert.deepEqual(legalTransitionTargets(quick), ['BUILD']);
  assert.deepEqual(validateTransitionRequest(quick, 'BUILD'), []);
  assert.deepEqual(expectedPredecessorsForState({ ...quick, phase: 'BUILD' }), ['TRIAGE']);
});

test('Deep PLAN requires PLAN APPROVAL before BUILD', () => {
  const deep = state();
  assert.deepEqual(legalTransitionTargets(deep), ['PLAN APPROVAL']);
  assert.ok(validateTransitionRequest(deep, 'BUILD')[0].includes('illegal transition'));
  assert.deepEqual(expectedPredecessorsForState({ ...deep, phase: 'BUILD' }), ['PLAN APPROVAL']);
});

test('review branches remain explicit', () => {
  assert.deepEqual(legalTransitionTargets(state({ phase: 'REVIEW' })), [
    'AUTO-REMEDIATE', 'LEARNING RETROSPECTIVE', 'FINAL REPORT',
  ]);
});
