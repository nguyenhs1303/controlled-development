import { RULE_IDS } from './enforcement-rule-ids.mjs';
import { authorizePathOperation } from './path-policy.mjs';
import { authorizeCommand } from './command-policy.mjs';

const REQUIRED_ARRAY_FIELDS = [
  'allowedWritePaths',
  'allowedNewFiles',
  'protectedPaths',
  'commandGrants',
  'requiredChecks',
];

export function validateExecutionPolicy(policy) {
  const errors = [];
  if (!isPlainObject(policy)) return ['execution policy must be an object'];
  if (policy.contractVersion !== 1) errors.push('contractVersion must be 1');
  for (const field of ['changeId', 'phase']) {
    if (!nonEmptyString(policy[field])) errors.push(`${field} must be a non-empty string`);
  }
  if (policy.taskId !== null && !nonEmptyString(policy.taskId)) {
    errors.push('taskId must be null or a non-empty string');
  }
  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(policy[field])) errors.push(`${field} must be an array`);
  }
  return errors;
}

export function authorizeExecution(state, policy, operation) {
  if (state === null && policy === null) {
    return decision(true, RULE_IDS.INACTIVE_NOOP, 'No active controlled change', null);
  }
  if (!isPlainObject(state) || state.schemaVersion !== 4) {
    return decision(false, RULE_IDS.STATE_NOT_ENFORCEABLE, 'Active workflow state does not support enforcement', audit(operation));
  }
  if (state.enforcement?.status !== 'ready') {
    return decision(false, RULE_IDS.ENFORCEMENT_NOT_READY, 'Active workflow enforcement is not ready', audit(operation));
  }
  const policyErrors = validateExecutionPolicy(policy);
  if (policyErrors.length) {
    return decision(false, RULE_IDS.POLICY_INVALID, policyErrors.join('; '), audit(operation));
  }
  if (nonEmptyString(state.changeId) && policy.changeId !== state.changeId) {
    return decision(false, RULE_IDS.POLICY_CHANGE_MISMATCH, 'Execution policy changeId does not match active workflow', audit(operation));
  }
  if (nonEmptyString(state.currentTaskId) && policy.taskId !== state.currentTaskId) {
    return decision(false, RULE_IDS.POLICY_TASK_MISMATCH, 'Execution policy taskId does not match current task', audit(operation));
  }
  if (policy.phase !== state.phase) {
    return decision(false, RULE_IDS.POLICY_PHASE_MISMATCH, 'Execution policy phase does not match active workflow', audit(operation));
  }

  if (operation?.kind === 'read') {
    return decision(true, RULE_IDS.READ_ALLOWED, 'Classified read operation is allowed', audit(operation));
  }
  if (operation?.kind === 'write') {
    if (nonEmptyString(operation.checkoutRoot) && nonEmptyString(operation.targetPath)) {
      return authorizePathOperation(operation.checkoutRoot, operation.targetPath, policy);
    }
    return decision(false, RULE_IDS.WRITE_DEFERRED, 'Write operation requires a checkout root and target path', audit(operation));
  }
  if (operation?.kind === 'command') {
    return authorizeCommand(operation.command, policy.commandGrants, operation.platform);
  }
  return decision(false, RULE_IDS.UNCLASSIFIED_DENY, 'Operation could not be classified safely', audit(operation));
}

function decision(allowed, ruleId, reason, auditData) {
  return { allowed, ruleId, reason, audit: auditData };
}

function audit(operation) {
  return isPlainObject(operation) ? { kind: operation.kind ?? 'unknown' } : { kind: 'unknown' };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
