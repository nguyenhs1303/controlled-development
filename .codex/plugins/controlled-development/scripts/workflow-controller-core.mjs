import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hashArtifact, sha256 } from './workflow-crypto.mjs';
import { assessLedger } from './workflow-ledger.mjs';
import { legalTransitionTargets, validateTransitionRequest } from './workflow-rules.mjs';
import { readState, runStateTransaction } from './workflow-state-store.mjs';
import { validateWorkflowState } from './validate.mjs';

const APPROVAL_ARTIFACTS = { spec: 'spec.md', solution: 'solution.md', plan: 'plan.md' };
const METADATA_FIELDS = new Set([
  'approvedScope', 'triage', 'tasks', 'currentTaskId', 'blockers', 'reviewRemediationCycle',
  'evidenceReceipts', 'gitBaseline',
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

export function checkResume(statePath, options = {}) {
  const { state, errors } = validateStateFile(statePath, {
    currentGitBaseline: options.currentGitBaseline,
  });
  const ledger = state.schemaVersion === 3
    ? assessLedger(statePath, state)
    : { status: 'not-applicable', errors: [], events: [] };
  errors.push(...ledger.errors);
  for (const [gate, approval] of Object.entries(state.approvals ?? {})) {
    if (state.schemaVersion !== 3 || approval.status !== 'approved') continue;
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
    if (state.schemaVersion !== 3) throw new Error('approve requires schemaVersion 3');
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
    if (state.schemaVersion !== 3) throw new Error('transition requires schemaVersion 3');
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

export function currentGitBaseline(startDirectory) {
  const root = runGit(startDirectory, ['rev-parse', '--show-toplevel']).trim();
  const head = runGit(root, ['rev-parse', 'HEAD']).trim();
  const status = runGit(root, ['status', '--porcelain=v1', '-z']);
  return { head, statusFingerprint: sha256(Buffer.from(status, 'utf8')) };
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
