import path from 'node:path';

import {
  effectivePlanApprovalRequired,
  expectedPredecessorsForState,
  planApprovalRequired,
  usesSolutionWorkflow,
} from './workflow-rules.mjs';

export const BASE_PLUGIN_VERSION = '0.1.0';
const SUPPORTED_SCHEMA_VERSIONS = new Set([1, 2, 3, 4]);
const SHA256_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const APPROVAL_ARTIFACTS = {
  spec: 'spec.md',
  solution: 'solution.md',
  plan: 'plan.md',
};
const PHASES = new Set([
  'BOOTSTRAP', 'INTAKE', 'DISCOVER', 'TRIAGE', 'DEFINE', 'SPEC APPROVAL',
  'SOLUTION DESIGN', 'SOLUTION APPROVAL', 'PLAN', 'PLAN APPROVAL',
  'BUILD', 'VERIFY', 'REVIEW', 'AUTO-REMEDIATE',
  'RE-VERIFY', 'RE-REVIEW', 'LEARNING RETROSPECTIVE', 'FINAL REPORT', 'STOP',
]);
const TERMINAL_STATES = new Set(['REVIEW PASSED', 'REVIEW BLOCKED', 'IMPLEMENTATION BLOCKED']);
const TASK_STATUSES = new Set(['todo', 'in-progress', 'done', 'blocked', 'not-applicable']);
const WRITE_PHASES = new Set([
  'BUILD', 'VERIFY', 'REVIEW', 'AUTO-REMEDIATE', 'RE-VERIFY', 'RE-REVIEW',
  'LEARNING RETROSPECTIVE', 'FINAL REPORT', 'STOP',
]);
const POST_SPEC_APPROVAL_PHASES = new Set([
  'SOLUTION DESIGN', 'SOLUTION APPROVAL', 'PLAN', 'PLAN APPROVAL', ...WRITE_PHASES,
]);
const POST_SOLUTION_APPROVAL_PHASES = new Set([
  'PLAN', 'PLAN APPROVAL', ...WRITE_PHASES,
]);
const ABSOLUTE_PROHIBITIONS = [
  'git-add',
  'git-commit',
  'git-push',
  'pull-request',
  'merge',
  'release',
  'deploy',
  'production-access',
  'real-data-mutation',
];

export function validateWorkflowState(state, label = 'state', context = {}) {
  const errors = [];
  if (!isPlainObject(state)) return [`${label} must be a JSON object`];

  const requiredFields = [
    'schemaVersion', 'pluginVersion', 'changeId', 'profile', 'riskLevel', 'phase',
    'terminalState', 'artifactRoot', 'approvedScope', 'prohibitedOperations',
    'approvals', 'tasks', 'currentTaskId', 'blockers', 'reviewRemediationCycle',
    'evidenceReceipts', 'gitBaseline', 'lastCompletedPhase', 'updatedAt',
  ];
  if ([2, 3, 4].includes(state.schemaVersion)) requiredFields.push('triage');
  if ([3, 4].includes(state.schemaVersion)) {
    requiredFields.push('revision', 'lastEventSequence', 'lastEventHash');
  }
  if (state.schemaVersion === 4) requiredFields.push('enforcement');
  for (const field of requiredFields) {
    if (!Object.hasOwn(state, field)) errors.push(`${label} missing required field: ${field}`);
  }

  if (Object.hasOwn(state, 'schemaVersion') && !SUPPORTED_SCHEMA_VERSIONS.has(state.schemaVersion)) {
    errors.push(`${label} schemaVersion must be 1, 2, 3, or 4`);
  }
  if (state.schemaVersion === 1 &&
      ['TRIAGE', 'SOLUTION DESIGN', 'SOLUTION APPROVAL'].includes(state.phase)) {
    errors.push(`${label} schemaVersion 1 cannot use solution-workflow phases`);
  }
  if (state.schemaVersion === 1 &&
      ['TRIAGE', 'SOLUTION DESIGN', 'SOLUTION APPROVAL'].includes(state.lastCompletedPhase)) {
    errors.push(`${label} schemaVersion 1 cannot record solution-workflow predecessors`);
  }
  if (Object.hasOwn(state, 'pluginVersion') && state.pluginVersion !== BASE_PLUGIN_VERSION) {
    errors.push(`${label} pluginVersion must be ${BASE_PLUGIN_VERSION}`);
  }
  if (Object.hasOwn(state, 'changeId') &&
      (!nonEmptyString(state.changeId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.changeId))) {
    errors.push(`${label} changeId must be lowercase filesystem-safe kebab-case`);
  }

  const validProfile = ['quick', 'standard', 'deep'].includes(state.profile);
  const validRisk = ['low', 'medium', 'high'].includes(state.riskLevel);
  if (Object.hasOwn(state, 'profile') && !validProfile) {
    errors.push(`${label} profile must be quick, standard, or deep`);
  }
  if (Object.hasOwn(state, 'riskLevel') && !validRisk) {
    errors.push(`${label} riskLevel must be low, medium, or high`);
  }
  if (validProfile && validRisk) {
    if (state.profile === 'quick' && state.riskLevel !== 'low') {
      errors.push(`${label} quick profile requires low riskLevel`);
    }
    if (state.profile === 'standard' && state.riskLevel === 'high') {
      errors.push(`${label} high riskLevel requires deep profile`);
    }
  }
  const hasSolutionWorkflow = usesSolutionWorkflow(state.schemaVersion);
  if (hasSolutionWorkflow && state.profile === 'quick' &&
      ['DEFINE', 'SPEC APPROVAL', 'SOLUTION DESIGN', 'SOLUTION APPROVAL', 'PLAN', 'PLAN APPROVAL'].includes(state.phase)) {
    errors.push(`${label} Quick must skip specification, solution, and plan phases or escalate profile`);
  }
  if (hasSolutionWorkflow) validateTriage(state.triage, state.profile, label, errors);

  const validPhase = PHASES.has(state.phase);
  if (Object.hasOwn(state, 'phase') && !validPhase) errors.push(`${label} has unknown phase`);
  if (Object.hasOwn(state, 'lastCompletedPhase') &&
      state.lastCompletedPhase !== null && !PHASES.has(state.lastCompletedPhase)) {
    errors.push(`${label} lastCompletedPhase must be null or a known phase`);
  }

  if (Object.hasOwn(state, 'terminalState') &&
      state.terminalState !== null && !TERMINAL_STATES.has(state.terminalState)) {
    errors.push(`${label} has unknown terminal state`);
  }
  if (validPhase && !['FINAL REPORT', 'STOP'].includes(state.phase) && state.terminalState !== null) {
    errors.push(`${label} may set a terminal state only at FINAL REPORT or STOP`);
  }
  if (validPhase && ['FINAL REPORT', 'STOP'].includes(state.phase) &&
      !TERMINAL_STATES.has(state.terminalState)) {
    errors.push(`${label} ${state.phase} requires a terminal state`);
  }

  validateArtifactRoot(state, label, errors);
  validateStringArray(state.approvedScope, 'approvedScope', label, errors);
  validateStringArray(state.prohibitedOperations, 'prohibitedOperations', label, errors);
  if (Array.isArray(state.prohibitedOperations)) {
    for (const operation of ABSOLUTE_PROHIBITIONS) {
      if (!state.prohibitedOperations.includes(operation)) {
        errors.push(`${label} prohibitedOperations must include ${operation}`);
      }
    }
  }

  const requiredPlanApproval = validProfile && validRisk ? planApprovalRequired(state) : null;
  const solutionApprovalRequired = hasSolutionWorkflow && validProfile
    ? state.profile !== 'quick'
    : false;
  validateApprovals(
    state.approvals,
    requiredPlanApproval,
    solutionApprovalRequired,
    hasSolutionWorkflow ? state.profile : null,
    [3, 4].includes(state.schemaVersion),
    label,
    errors,
  );
  const needsPlanApproval = effectivePlanApprovalRequired(state);

  if (!Array.isArray(state.tasks)) {
    if (Object.hasOwn(state, 'tasks')) errors.push(`${label} tasks must be an array`);
  } else {
    const taskIds = new Set();
    for (const [index, task] of state.tasks.entries()) {
      if (!isPlainObject(task) || !nonEmptyString(task.id) || !nonEmptyString(task.status)) {
        errors.push(`${label} tasks[${index}] requires non-empty id and status`);
        continue;
      }
      if (!TASK_STATUSES.has(task.status)) {
        errors.push(`${label} tasks[${index}].status must be todo, in-progress, done, blocked, or not-applicable`);
      }
      if (taskIds.has(task.id)) errors.push(`${label} has duplicate task id: ${task.id}`);
      taskIds.add(task.id);
    }
    if (state.currentTaskId !== null &&
        (!nonEmptyString(state.currentTaskId) || !taskIds.has(state.currentTaskId))) {
      errors.push(`${label} currentTaskId must be null or reference an existing task`);
    }
  }
  if (Object.hasOwn(state, 'currentTaskId') && state.currentTaskId !== null &&
      !nonEmptyString(state.currentTaskId)) {
    errors.push(`${label} currentTaskId must be null or a non-empty string`);
  }

  validateBlockers(state.blockers, label, errors);
  if (!Number.isInteger(state.reviewRemediationCycle) ||
      state.reviewRemediationCycle < 0 || state.reviewRemediationCycle > 3) {
    if (Object.hasOwn(state, 'reviewRemediationCycle')) {
      errors.push(`${label} reviewRemediationCycle exceeds review remediation limit or is invalid`);
    }
  }
  validateStringArray(state.evidenceReceipts, 'evidenceReceipts', label, errors);
  validateGitBaseline(state.gitBaseline, label, errors);
  if (Object.hasOwn(state, 'updatedAt') && state.updatedAt !== null && !isIsoTimestamp(state.updatedAt)) {
    errors.push(`${label} updatedAt must be null or an ISO timestamp string`);
  }
  if ([3, 4].includes(state.schemaVersion)) validateSchema3Integrity(state, label, errors);
  if (state.schemaVersion === 4) validateEnforcement(state.enforcement, label, errors);

  if (validPhase) {
    const expectedPredecessors = expectedPredecessorsForState(state);
    if (expectedPredecessors && !expectedPredecessors.includes(state.lastCompletedPhase)) {
      errors.push(`${label} ${state.phase} must follow ${formatChoices(expectedPredecessors)}`);
    }
  }

  if (validPhase && WRITE_PHASES.has(state.phase)) {
    if (needsPlanApproval && state.approvals?.plan?.status !== 'approved') {
      errors.push(`${label} ${state.phase} requires approved plan`);
    }
    if (Array.isArray(state.approvedScope) && state.approvedScope.length === 0) {
      errors.push(`${label} ${state.phase} requires non-empty approvedScope`);
    }
    if (Array.isArray(state.tasks) && state.tasks.length === 0) {
      errors.push(`${label} ${state.phase} requires at least one task`);
    }
    if (!isRecordedGitBaseline(state.gitBaseline)) {
      errors.push(`${label} ${state.phase} requires a recorded gitBaseline`);
    }
  }
  if (validPhase && POST_SPEC_APPROVAL_PHASES.has(state.phase) &&
      !(hasSolutionWorkflow && state.profile === 'quick') &&
      state.approvals?.spec?.status !== 'approved') {
    errors.push(`${label} ${state.phase} requires approved spec`);
  }
  if (hasSolutionWorkflow && validPhase && POST_SOLUTION_APPROVAL_PHASES.has(state.phase) &&
      state.profile !== 'quick' && state.approvals?.solution?.status !== 'approved') {
    errors.push(`${label} ${state.phase} requires approved solution`);
  }

  if (state.phase === 'FINAL REPORT' && ['BUILD', 'VERIFY'].includes(state.lastCompletedPhase) &&
      state.terminalState !== 'IMPLEMENTATION BLOCKED') {
    errors.push(`${label} FINAL REPORT after ${state.lastCompletedPhase} requires IMPLEMENTATION BLOCKED`);
  }
  if (state.phase === 'FINAL REPORT' && ['REVIEW', 'RE-REVIEW'].includes(state.lastCompletedPhase) &&
      state.terminalState !== 'REVIEW BLOCKED') {
    errors.push(`${label} FINAL REPORT directly after review requires REVIEW BLOCKED`);
  }
  if (state.phase === 'FINAL REPORT' && state.lastCompletedPhase === 'LEARNING RETROSPECTIVE' &&
      state.terminalState !== 'REVIEW PASSED') {
    errors.push(`${label} FINAL REPORT after LEARNING RETROSPECTIVE requires REVIEW PASSED`);
  }
  if (state.phase === 'AUTO-REMEDIATE' &&
      Number.isInteger(state.reviewRemediationCycle) && state.reviewRemediationCycle >= 3) {
    errors.push(`${label} AUTO-REMEDIATE cannot begin after three review remediation cycles`);
  }
  validateObservedGitBaseline(state.gitBaseline, context.currentGitBaseline, label, errors);
  return errors;
}

function validateEnforcement(enforcement, label, errors) {
  if (!isPlainObject(enforcement)) {
    errors.push(`${label} enforcement must be an object`);
    return;
  }
  if (enforcement.contractVersion !== 1) {
    errors.push(`${label} enforcement.contractVersion must be 1`);
  }
  if (!['inactive', 'pending', 'ready', 'violated', 'stale'].includes(enforcement.status)) {
    errors.push(`${label} enforcement.status must be inactive, pending, ready, violated, or stale`);
  }
  if (enforcement.activeBinding !== null && !isPlainObject(enforcement.activeBinding)) {
    errors.push(`${label} enforcement.activeBinding must be null or an object`);
  }
  if (!isPlainObject(enforcement.policy) || enforcement.policy.artifactPath !== 'execution-policy.json') {
    errors.push(`${label} enforcement.policy.artifactPath must be execution-policy.json`);
  } else {
    const digest = enforcement.policy.artifactDigest;
    if (digest !== null && (enforcement.policy.digestAlgorithm !== 'sha256-text-v1' || !SHA256_DIGEST_PATTERN.test(digest))) {
      errors.push(`${label} enforcement.policy digest binding is invalid`);
    }
  }
  if (!isPlainObject(enforcement.readiness) || typeof enforcement.readiness.required !== 'boolean') {
    errors.push(`${label} enforcement.readiness requires a boolean required field`);
  }
  if (!isPlainObject(enforcement.implementation) || !Array.isArray(enforcement.implementation.changedPaths)) {
    errors.push(`${label} enforcement.implementation requires changedPaths`);
  }
  if (!Array.isArray(enforcement.violations)) {
    errors.push(`${label} enforcement.violations must be an array`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateStringArray(value, field, label, errors) {
  if (!Array.isArray(value)) {
    if (value !== undefined) errors.push(`${label} ${field} must be an array`);
    return;
  }
  if (value.some((entry) => !nonEmptyString(entry))) {
    errors.push(`${label} ${field} must contain only non-empty strings`);
  }
}

function validateArtifactRoot(state, label, errors) {
  if (!Object.hasOwn(state, 'artifactRoot')) return;
  if (!nonEmptyString(state.artifactRoot) || !isSafeProjectRelativePath(state.artifactRoot)) {
    errors.push(`${label} artifactRoot must be a safe project-relative path`);
    return;
  }
  if (!nonEmptyString(state.changeId)) return;

  const normalized = state.artifactRoot.replaceAll('\\', '/').replace(/\/$/, '');
  const expected = `.codex/workflows/changes/${state.changeId}`;
  const override = state.artifactRootOverride;
  if (override !== undefined && override !== null &&
      (!isPlainObject(override) || override.approved !== true || !nonEmptyString(override.reference))) {
    errors.push(`${label} artifactRootOverride must be null or contain approved: true and a reference`);
  }
  if (normalized === expected) return;

  if (!isPlainObject(override) || override.approved !== true || !nonEmptyString(override.reference)) {
    errors.push(`${label} artifactRoot must be ${expected} unless an approved override reference is recorded`);
  }
  if (normalized.split('/').at(-1) !== state.changeId) {
    errors.push(`${label} approved artifactRoot override must end with changeId ${state.changeId}`);
  }
}

function isSafeProjectRelativePath(value) {
  const normalized = value.trim().replaceAll('\\', '/');
  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(value.trim()) ||
      /^[a-zA-Z]:/.test(normalized) || normalized.startsWith('//')) return false;
  const segments = normalized.split('/');
  return segments.length > 0 && segments.every((segment) => segment && segment !== '.' && segment !== '..');
}

function validateTriage(triage, profile, label, errors) {
  if (!isPlainObject(triage)) {
    if (triage !== undefined) errors.push(`${label} triage must be an object`);
    return;
  }
  validateStringArray(triage.highestFactors, 'triage.highestFactors', label, errors);
  validateStringArray(triage.escalationTriggers, 'triage.escalationTriggers', label, errors);
  if (!nonEmptyString(triage.reason)) errors.push(`${label} triage.reason must be a non-empty string`);
  if (!nonEmptyString(triage.solutionReason)) {
    errors.push(`${label} triage.solutionReason must be a non-empty string`);
  }
  const expectedMode = profile === 'quick' ? 'none' : profile === 'standard' ? 'lite' : profile === 'deep' ? 'full' : null;
  if (!['none', 'lite', 'full'].includes(triage.solutionMode)) {
    errors.push(`${label} triage.solutionMode must be none, lite, or full`);
  } else if (expectedMode && triage.solutionMode !== expectedMode) {
    errors.push(`${label} ${profile} profile requires triage.solutionMode ${expectedMode}`);
  }
  if (Array.isArray(triage.highestFactors) && triage.highestFactors.length === 0) {
    errors.push(`${label} triage.highestFactors must record at least one evidence-backed factor`);
  }
}

function validateApprovals(
  approvals,
  planApprovalRequired,
  solutionApprovalRequired,
  profile,
  requireArtifactBinding,
  label,
  errors,
) {
  if (!isPlainObject(approvals)) {
    if (approvals !== undefined) errors.push(`${label} approvals must be an object`);
    return;
  }
  const gates = profile === null ? ['spec', 'plan'] : ['spec', 'solution', 'plan'];
  for (const gate of gates) {
    const approval = approvals[gate];
    if (!isPlainObject(approval)) {
      errors.push(`${label} approvals.${gate} must be an object`);
      continue;
    }
    if (!['pending', 'approved'].includes(approval.status)) {
      errors.push(`${label} approvals.${gate}.status must be pending or approved`);
    }
    if (approval.reference !== null && typeof approval.reference !== 'string') {
      errors.push(`${label} approvals.${gate}.reference must be null or a string`);
    }
    if (approval.status === 'approved' && !nonEmptyString(approval.reference)) {
      errors.push(`${label} approved ${gate} requires a reference`);
    }
    if (requireArtifactBinding) validateApprovalBinding(approval, gate, label, errors);
  }
  if (profile !== null && isPlainObject(approvals.solution)) {
    if (typeof approvals.solution.required !== 'boolean') {
      errors.push(`${label} approvals.solution.required must be boolean`);
    } else if (approvals.solution.required !== solutionApprovalRequired) {
      errors.push(`${label} solution approval requirement does not match the selected profile`);
    }
    const expectedMode = profile === 'quick' ? 'none' : profile === 'standard' ? 'lite' : 'full';
    if (approvals.solution.mode !== expectedMode) {
      errors.push(`${label} approvals.solution.mode must be ${expectedMode} for ${profile}`);
    }
    if (!solutionApprovalRequired && approvals.solution.status === 'approved') {
      errors.push(`${label} Quick must escalate instead of approving a solution under the Quick profile`);
    }
  }
  if (isPlainObject(approvals.plan)) {
    if (typeof approvals.plan.required !== 'boolean') {
      errors.push(`${label} approvals.plan.required must be boolean`);
    } else if (planApprovalRequired === true && approvals.plan.required !== true) {
      errors.push(`${label} plan approval requirement must be true for the selected profile and risk`);
    }
  }
}

function validateSchema3Integrity(state, label, errors) {
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    errors.push(`${label} revision must be a non-negative integer`);
  }
  if (!Number.isInteger(state.lastEventSequence) || state.lastEventSequence < 0) {
    errors.push(`${label} lastEventSequence must be a non-negative integer`);
    return;
  }
  if (state.lastEventSequence === 0) {
    if (state.lastEventHash !== null) {
      errors.push(`${label} lastEventHash must be null when lastEventSequence is 0`);
    }
    return;
  }
  if (typeof state.lastEventHash !== 'string' || !SHA256_DIGEST_PATTERN.test(state.lastEventHash)) {
    errors.push(`${label} lastEventHash must match sha256:<64-lowercase-hex> when events exist`);
  }
}

function validateApprovalBinding(approval, gate, label, errors) {
  const fields = ['artifactPath', 'digestAlgorithm', 'artifactDigest', 'approvedAt'];
  if (approval.status === 'pending') {
    if (fields.some((field) => approval[field] !== null)) {
      errors.push(`${label} pending ${gate} approval binding fields must be null`);
    }
    return;
  }
  if (approval.status !== 'approved') return;

  if (approval.artifactPath !== APPROVAL_ARTIFACTS[gate]) {
    errors.push(`${label} approvals.${gate}.artifactPath must be ${APPROVAL_ARTIFACTS[gate]}`);
  }
  if (approval.digestAlgorithm !== 'sha256-text-v1') {
    errors.push(`${label} approvals.${gate}.digestAlgorithm must be sha256-text-v1`);
  }
  if (typeof approval.artifactDigest !== 'string' || !SHA256_DIGEST_PATTERN.test(approval.artifactDigest)) {
    errors.push(`${label} approvals.${gate}.artifactDigest must match sha256:<64-lowercase-hex>`);
  }
  if (!isIsoDateTime(approval.approvedAt)) {
    errors.push(`${label} approvals.${gate}.approvedAt must be an ISO timestamp`);
  }
}

function validateBlockers(blockers, label, errors) {
  if (!isPlainObject(blockers)) {
    if (blockers !== undefined) errors.push(`${label} blockers must be an object`);
    return;
  }
  for (const [blockerId, blocker] of Object.entries(blockers)) {
    if (!nonEmptyString(blockerId) || !isPlainObject(blocker) || !Array.isArray(blocker.attempts)) {
      errors.push(`${label} blocker ${blockerId || '<empty>'} requires an attempts array`);
      continue;
    }
    if (blocker.attempts.length > 3) {
      errors.push(`${label} blocker ${blockerId} exceeds recovery attempt limit`);
    }
    const hypotheses = [];
    for (const [index, attempt] of blocker.attempts.entries()) {
      if (!isPlainObject(attempt) || !nonEmptyString(attempt.hypothesis)) {
        errors.push(`${label} blocker ${blockerId} attempt ${index + 1} requires a hypothesis`);
      } else {
        hypotheses.push(attempt.hypothesis.trim().toLowerCase());
      }
      if (!isPlainObject(attempt) || attempt.number !== index + 1) {
        errors.push(`${label} blocker ${blockerId} attempt ${index + 1} number must be ${index + 1}`);
      }
    }
    if (new Set(hypotheses).size !== hypotheses.length) {
      errors.push(`${label} blocker ${blockerId} recovery hypotheses must be distinct`);
    }
  }
}

function validateGitBaseline(baseline, label, errors) {
  if (!isPlainObject(baseline)) {
    if (baseline !== undefined) errors.push(`${label} gitBaseline must be an object`);
    return;
  }
  for (const field of ['head', 'statusFingerprint', 'recordedAt']) {
    if (!Object.hasOwn(baseline, field)) {
      errors.push(`${label} gitBaseline missing required field: ${field}`);
    } else if (baseline[field] !== null && !nonEmptyString(baseline[field])) {
      errors.push(`${label} gitBaseline.${field} must be null or a non-empty string`);
    }
  }
  if (baseline.recordedAt !== null && nonEmptyString(baseline.recordedAt) && !isIsoTimestamp(baseline.recordedAt)) {
    errors.push(`${label} gitBaseline.recordedAt must be an ISO timestamp string`);
  }
}

function isIsoTimestamp(value) {
  return nonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isIsoDateTime(value) {
  return nonEmptyString(value) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function isRecordedGitBaseline(baseline) {
  return isPlainObject(baseline) && nonEmptyString(baseline.head) &&
    nonEmptyString(baseline.statusFingerprint) && nonEmptyString(baseline.recordedAt);
}

function validateObservedGitBaseline(recorded, current, label, errors) {
  if (!isPlainObject(current) || !isRecordedGitBaseline(recorded)) return;
  if (!nonEmptyString(current.head) || !nonEmptyString(current.statusFingerprint)) {
    errors.push(`${label} currentGitBaseline requires head and statusFingerprint`);
    return;
  }
  if (recorded.head !== current.head || recorded.statusFingerprint !== current.statusFingerprint) {
    errors.push(`${label} gitBaseline drift must be reconciled before resume`);
  }
}

function formatChoices(values) {
  return values.map((value) => value === null ? 'no completed phase' : value).join(' or ');
}
