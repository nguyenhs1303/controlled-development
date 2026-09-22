import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hashArtifact, sha256 } from './workflow-crypto.mjs';
import { authorizeExecution, validateExecutionPolicy } from './execution-policy.mjs';
import { assessLedger } from './workflow-ledger.mjs';
import { legalTransitionTargets, validateTransitionRequest } from './workflow-rules.mjs';
import { readState, runStateTransaction } from './workflow-state-store.mjs';
import { validateWorkflowState } from './validate-workflow-state.mjs';
import { randomUUID } from 'node:crypto';
import { activateChangeBinding, deactivateChangeBinding, readActiveChange } from './active-change-store.mjs';
import { implementationSnapshot } from './worktree-snapshot.mjs';
import { RULE_IDS } from './enforcement-rule-ids.mjs';

const APPROVAL_ARTIFACTS = { spec: 'spec.md', solution: 'solution.md', plan: 'plan.md' };
const METADATA_FIELDS = new Set([
  'approvedScope', 'triage', 'tasks', 'currentTaskId', 'blockers', 'reviewRemediationCycle',
  'evidenceReceipts', 'gitBaseline',
  'enforcement',
]);

export function statusForState(statePath) {
  const state = readState(statePath);
  return {
    changeId: state.changeId,
    schemaVersion: state.schemaVersion,
    revision: state.revision ?? null,
    phase: state.phase,
    lastCompletedPhase: state.lastCompletedPhase,
    terminalState: state.terminalState,
    currentTaskId: state.currentTaskId,
    approvals: Object.fromEntries(Object.entries(state.approvals ?? {}).map(([gate, value]) => [gate, value.status])),
    lastEventSequence: state.lastEventSequence ?? null,
    lastEventHash: state.lastEventHash ?? null,
    legalTransitions: legalTransitionTargets(state),
  };
}

export function validateStateFile(statePath, context = {}) {
  const state = readState(statePath);
  return { state, errors: validateWorkflowState(state, path.basename(statePath), context) };
}

export function authorizeStateExecution(statePath, policyPath, operation) {
  const state = readState(statePath);
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const stateErrors = validateWorkflowState(state, path.basename(statePath));
  const policyErrors = validateExecutionPolicy(policy);
  if (stateErrors.length || policyErrors.length) {
    return authorizeExecution(stateErrors.length ? { ...state, schemaVersion: null } : state, policy, operation);
  }
  if (state.enforcement?.policy?.artifactDigest && hashArtifact(policyPath) !== state.enforcement.policy.artifactDigest) {
    return { allowed: false, ruleId: RULE_IDS.POLICY_DIGEST_MISMATCH, reason: 'Execution policy digest does not match workflow state', audit: { kind: operation?.kind ?? 'unknown' } };
  }
  return authorizeExecution(state, policy, operation);
}

export function activeChangeStatus(checkoutRoot) {
  return readActiveChange(checkoutRoot);
}

export function activateWorkflowChange(statePath, checkoutRoot, policyPath, expectedRevision, options = {}) {
  const state = readState(statePath);
  if (state.schemaVersion !== 4) throw new Error('active change enforcement requires schemaVersion 4');
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const policyErrors = validateExecutionPolicy(policy);
  if (policyErrors.length) throw new Error(`execution policy is invalid: ${policyErrors.join('; ')}`);
  if (policy.changeId !== state.changeId || policy.taskId !== state.currentTaskId || policy.phase !== state.phase) {
    throw new Error('execution policy does not match active workflow');
  }
  const active = readActiveChange(checkoutRoot);
  if (active && active.changeId !== state.changeId) throw new Error(`change ${active.changeId} is already active`);
  const nonce = options.nonce ?? randomUUID();
  const binding = { changeId: state.changeId, statePath: path.relative(checkoutRoot, statePath).replaceAll('\\', '/'), nonce };
  const digest = hashArtifact(policyPath);
  const result = runStateTransaction(statePath, expectedRevision, (current) => ({
    type: 'ENFORCEMENT_ACTIVATED',
    patch: {
      enforcement: {
        ...current.enforcement,
        status: 'pending',
        activeBinding: binding,
        policy: { artifactPath: 'execution-policy.json', digestAlgorithm: 'sha256-text-v1', artifactDigest: digest },
        readiness: { required: true, nonce, proof: null },
      },
    },
  }), controllerTransactionOptions(options));
  activateChangeBinding(checkoutRoot, binding);
  return result;
}

export function recordReadinessProof(statePath, expectedRevision, proof, options = {}) {
  if (typeof proof !== 'string' || !proof.trim()) throw new Error('readiness proof is required');
  return runStateTransaction(statePath, expectedRevision, (state, at) => ({
    type: 'ENFORCEMENT_READY',
    patch: { enforcement: { ...state.enforcement, status: 'ready', readiness: { ...state.enforcement.readiness, proof: { value: proof.trim(), recordedAt: at } } } },
  }), controllerTransactionOptions(options));
}

export function deactivateWorkflowChange(statePath, checkoutRoot, expectedRevision, options = {}) {
  const state = readState(statePath);
  const result = runStateTransaction(statePath, expectedRevision, (current) => ({
    type: 'ENFORCEMENT_DEACTIVATED',
    patch: { enforcement: { ...current.enforcement, status: 'inactive', activeBinding: null, readiness: { ...current.enforcement.readiness, proof: null } } },
  }), controllerTransactionOptions(options));
  deactivateChangeBinding(checkoutRoot, state.changeId);
  return result;
}

export function recordEnforcementViolation(statePath, expectedRevision, violation, options = {}) {
  if (!violation || typeof violation.ruleId !== 'string' || !Array.isArray(violation.paths)) {
    throw new Error('enforcement violation requires ruleId and paths');
  }
  return runStateTransaction(statePath, expectedRevision, (state, at) => ({
    type: 'ENFORCEMENT_VIOLATION_RECORDED',
    patch: {
      enforcement: {
        ...state.enforcement,
        status: 'violated',
        violations: [...state.enforcement.violations, { ...violation, recordedAt: at }],
      },
    },
  }), controllerTransactionOptions(options));
}

export function currentImplementationSnapshot(checkoutRoot, state) {
  return implementationSnapshot(checkoutRoot, [
    '.codex/workflows/active-change.json',
    '.codex/workflows/.hook-snapshots/**',
    `${state.artifactRoot}/**`,
  ]);
}

export function bindEvidenceReceipt(statePath, checkoutRoot, expectedRevision, receiptId, options = {}) {
  if (typeof receiptId !== 'string' || !receiptId.trim()) throw new Error('evidence receipt ID is required');
  const state = readState(statePath);
  const snapshot = currentImplementationSnapshot(checkoutRoot, state);
  return runStateTransaction(statePath, expectedRevision, (current) => ({
    type: 'EVIDENCE_RECEIPT_BOUND',
    patch: {
      evidenceReceipts: [...current.evidenceReceipts, receiptId.trim()],
      enforcement: {
        ...current.enforcement,
        status: current.enforcement.status === 'stale' ? 'ready' : current.enforcement.status,
        implementation: { ...current.enforcement.implementation, ...snapshot },
      },
    },
  }), controllerTransactionOptions(options));
}

export function assessEvidenceFreshness(state, currentSnapshot) {
  const expected = state.enforcement?.implementation?.snapshotDigest;
  if (!expected || !currentSnapshot) return [];
  return expected === currentSnapshot.snapshotDigest ? [] : ['verification evidence is stale for the current implementation diff'];
}

export function authorizeStop(state, event = {}) {
  if (event.stop_hook_active === true) {
    return { allowed: true, ruleId: RULE_IDS.STOP_LOOP_BYPASS, reason: 'Stop hook is already active' };
  }
  if (['SPEC APPROVAL', 'SOLUTION APPROVAL', 'PLAN APPROVAL'].includes(state.phase)) {
    return { allowed: true, ruleId: RULE_IDS.STOP_APPROVAL_WAIT, reason: 'Workflow is waiting for explicit approval' };
  }
  if (Object.keys(state.blockers ?? {}).length > 0) {
    return { allowed: true, ruleId: RULE_IDS.STOP_ALLOWED, reason: 'Workflow has a recorded blocker' };
  }
  if ((state.tasks ?? []).some((task) => ['todo', 'in-progress'].includes(task.status))) {
    return { allowed: false, ruleId: RULE_IDS.STOP_INCOMPLETE_DENY, reason: 'Controlled change still has incomplete tasks' };
  }
  if (!['FINAL REPORT', 'STOP'].includes(state.phase)) {
    return { allowed: false, ruleId: RULE_IDS.STOP_INVALID_TERMINAL_DENY, reason: 'Workflow has not reached a terminal reporting phase' };
  }
  return { allowed: true, ruleId: RULE_IDS.STOP_ALLOWED, reason: 'Controlled change may stop' };
}

export function checkResume(statePath, options = {}) {
  const recordedState = readState(statePath);
  const observedGit = recordedState.schemaVersion === 4 && options.currentGitBaseline
    ? { ...options.currentGitBaseline, statusFingerprint: recordedState.gitBaseline?.statusFingerprint }
    : options.currentGitBaseline;
  const { state, errors } = validateStateFile(statePath, {
    currentGitBaseline: observedGit,
  });
  const ledger = [3, 4].includes(state.schemaVersion)
    ? assessLedger(statePath, state)
    : { status: 'not-applicable', errors: [], events: [] };
  errors.push(...ledger.errors);
  errors.push(...assessEvidenceFreshness(state, options.currentImplementationSnapshot));
  for (const [gate, approval] of Object.entries(state.approvals ?? {})) {
    if (![3, 4].includes(state.schemaVersion) || approval.status !== 'approved') continue;
    const expectedPath = APPROVAL_ARTIFACTS[gate];
    const artifactPath = path.join(path.dirname(statePath), expectedPath);
    if (!fs.existsSync(artifactPath)) {
      errors.push(`approved ${gate} artifact is missing: ${expectedPath}`);
      continue;
    }
    try {
      const digest = hashArtifact(artifactPath);
      if (digest !== approval.artifactDigest) errors.push(`approved ${gate} artifact digest no longer matches`);
    } catch (error) {
      errors.push(`approved ${gate} artifact cannot be hashed: ${error.message}`);
    }
  }
  return {
    status: errors.length ? 'invalid' : ledger.status === 'recoverable' ? 'recoverable' : 'ok',
    errors,
    ledgerStatus: ledger.status,
    revision: state.revision ?? null,
    phase: state.phase,
  };
}

export function approveState(statePath, gate, expectedRevision, reference, options = {}) {
  if (!Object.hasOwn(APPROVAL_ARTIFACTS, gate)) throw new Error(`unknown approval gate: ${gate}`);
  if (typeof reference !== 'string' || !reference.trim()) throw new Error('approval reference is required');
  const artifactName = APPROVAL_ARTIFACTS[gate];
  const artifactPath = path.join(path.dirname(statePath), artifactName);
  if (!fs.existsSync(artifactPath)) throw new Error(`approval artifact is missing: ${artifactName}`);
  const digest = hashArtifact(artifactPath);
  return runStateTransaction(statePath, expectedRevision, (state, at) => {
    if (![3, 4].includes(state.schemaVersion)) throw new Error('approve requires schemaVersion 3 or 4');
    return {
      type: 'APPROVAL_RECORDED',
      patch: {
        approvals: {
          [gate]: {
            status: 'approved',
            reference: reference.trim(),
            artifactPath: artifactName,
            digestAlgorithm: 'sha256-text-v1',
            artifactDigest: digest,
            approvedAt: at,
          },
        },
      },
    };
  }, controllerTransactionOptions(options));
}

export function transitionState(statePath, targetPhase, expectedRevision, options = {}) {
  return runStateTransaction(statePath, expectedRevision, (state) => {
    if (![3, 4].includes(state.schemaVersion)) throw new Error('transition requires schemaVersion 3 or 4');
    const errors = validateTransitionRequest(state, targetPhase);
    if (errors.length) throw new Error(errors.join('; '));
    const patch = { phase: targetPhase, lastCompletedPhase: state.phase };
    if (targetPhase === 'FINAL REPORT') patch.terminalState = options.terminalState ?? null;
    return { type: 'PHASE_TRANSITIONED', patch };
  }, controllerTransactionOptions(options));
}

export function recordStateMetadata(statePath, expectedRevision, patch, options = {}) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('metadata patch must be an object');
  const forbidden = Object.keys(patch).filter((field) => !METADATA_FIELDS.has(field));
  if (forbidden.length) throw new Error(`metadata patch contains controller-owned or unsupported fields: ${forbidden.join(', ')}`);
  return runStateTransaction(statePath, expectedRevision, () => ({
    type: 'STATE_METADATA_RECORDED',
    patch,
  }), controllerTransactionOptions(options));
}

export function currentGitBaseline(startDirectory, options = {}) {
  const root = runGit(startDirectory, ['rev-parse', '--show-toplevel']).trim();
  const head = runGit(root, ['rev-parse', 'HEAD']).trim();
  const status = runGit(root, ['status', '--porcelain=v1', '-z']);
  const filtered = status.split('\0').filter(Boolean).filter((entry) => {
    const relative = entry.slice(3).replaceAll('\\', '/');
    return !(options.excludedPaths ?? []).some((excluded) => {
      const normalized = excluded.replaceAll('\\', '/').replace(/\/$/, '');
      return relative === normalized || relative.startsWith(`${normalized}/`);
    });
  }).join('\0');
  return { head, statusFingerprint: sha256(Buffer.from(filtered, 'utf8')) };
}

function controllerTransactionOptions(options) {
  return {
    at: options.at,
    failAfterEvent: options.failAfterEvent,
    validateNext: (state) => validateWorkflowState(state, 'next-state'),
  };
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout;
}
