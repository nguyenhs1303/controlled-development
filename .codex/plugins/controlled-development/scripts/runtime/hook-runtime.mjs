import fs from 'node:fs';
import path from 'node:path';

import { readActiveChange } from './active-change-store.mjs';
import { authorizeStop, recordEnforcementViolation, recordReadinessProof } from './workflow-controller-core.mjs';
import { authorizeExecution } from './execution-policy.mjs';
import { readState } from './workflow-state-store.mjs';
import { hashArtifact, sha256 } from './workflow-crypto.mjs';
import { captureWorktreeSnapshot, compareWorktreeSnapshots } from './worktree-snapshot.mjs';
import { writeJsonAtomic } from './workflow-state-store.mjs';
import { RULE_IDS } from './enforcement-rule-ids.mjs';
import { authorizePathOperation } from './path-policy.mjs';

export function handleHookEvent(event) {
  const checkoutRoot = findCheckoutRoot(path.resolve(event.cwd));
  if (!checkoutRoot) return hookOutput(event.hook_event_name);
  const binding = readActiveChange(checkoutRoot);
  if (!binding) return hookOutput(event.hook_event_name);

  const statePath = path.resolve(checkoutRoot, binding.statePath);
  const state = readState(statePath);
  if (state.changeId !== binding.changeId || state.enforcement?.activeBinding?.nonce !== binding.nonce) {
    throw new Error('active change binding does not match workflow state');
  }
  if (event.hook_event_name === 'SessionStart') {
    const proof = sha256(`${binding.nonce}:${event.session_id ?? 'session'}`);
    if (state.enforcement.status === 'pending') recordReadinessProof(statePath, state.revision, proof);
    return hookOutput(event.hook_event_name, `Controlled change ${binding.changeId} is active; controller authorization is required.`);
  }
  if (event.hook_event_name === 'PreToolUse') {
    const policyPath = path.join(path.dirname(statePath), state.enforcement.policy.artifactPath);
    if (hashArtifact(policyPath) !== state.enforcement.policy.artifactDigest) {
      return { hookSpecificOutput: { hookEventName: event.hook_event_name, permissionDecision: 'deny', permissionDecisionReason: `${RULE_IDS.POLICY_DIGEST_MISMATCH}: Execution policy digest does not match workflow state` } };
    }
    const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    const operations = classifyPreToolUse(event, checkoutRoot);
    const decisions = operations.map((operation) => authorizeExecution(state, policy, operation));
    const denied = decisions.find((decision) => !decision.allowed);
    if (denied) {
      return {
        hookSpecificOutput: {
          hookEventName: event.hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: `${denied.ruleId}: ${denied.reason}`,
        },
      };
    }
    if (event.tool_use_id) writePreToolSnapshot(checkoutRoot, event.tool_use_id);
    return { hookSpecificOutput: { hookEventName: event.hook_event_name, permissionDecision: 'allow' } };
  }
  if (event.hook_event_name === 'PostToolUse') {
    const before = event.tool_use_id ? readPreToolSnapshot(checkoutRoot, event.tool_use_id) : null;
    if (!before) return hookOutput(event.hook_event_name, `Controlled change ${binding.changeId} is active; no pre-tool snapshot was available.`);
    const after = captureWorktreeSnapshot(checkoutRoot, { excludedPaths: ['.codex/workflows/**'] });
    const policy = JSON.parse(fs.readFileSync(path.join(path.dirname(statePath), state.enforcement.policy.artifactPath), 'utf8'));
    const changedPaths = compareWorktreeSnapshots(before, after).changedPaths;
    const unauthorized = changedPaths.filter((targetPath) => !authorizePathOperation(checkoutRoot, targetPath, policy).allowed);
    removePreToolSnapshot(checkoutRoot, event.tool_use_id);
    if (unauthorized.length) {
      recordEnforcementViolation(statePath, state.revision, { ruleId: RULE_IDS.PATH_NOT_ALLOWED, paths: unauthorized });
      return hookOutput(event.hook_event_name, `Recorded unauthorized side effects: ${unauthorized.join(', ')}`);
    }
    return hookOutput(event.hook_event_name, `Audited ${changedPaths.length} changed path(s).`);
  }
  if (event.hook_event_name === 'Stop') {
    const decision = authorizeStop(state, event);
    if (decision.allowed) return hookOutput(event.hook_event_name, `${decision.ruleId}: ${decision.reason}`);
    return { decision: 'block', reason: `${decision.ruleId}: ${decision.reason}` };
  }
  return hookOutput(event.hook_event_name, `Controlled change ${binding.changeId} is active.`);
}

function snapshotPath(checkoutRoot, toolUseId) {
  const safeId = String(toolUseId).replace(/[^A-Za-z0-9._-]/g, '_');
  return path.join(checkoutRoot, '.codex', 'workflows', '.hook-snapshots', `${safeId}.json`);
}

function writePreToolSnapshot(checkoutRoot, toolUseId) {
  const filePath = snapshotPath(checkoutRoot, toolUseId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  writeJsonAtomic(filePath, captureWorktreeSnapshot(checkoutRoot, { excludedPaths: ['.codex/workflows/**'] }));
}

function readPreToolSnapshot(checkoutRoot, toolUseId) {
  const filePath = snapshotPath(checkoutRoot, toolUseId);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

function removePreToolSnapshot(checkoutRoot, toolUseId) {
  const filePath = snapshotPath(checkoutRoot, toolUseId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function classifyPreToolUse(event, checkoutRoot) {
  const input = event.tool_input ?? {};
  if (event.tool_name === 'apply_patch') {
    const targets = [...String(input.patch ?? input.input ?? '').matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)]
      .map((match) => match[1].trim());
    return targets.length
      ? targets.map((targetPath) => ({ kind: 'write', checkoutRoot, targetPath }))
      : [{ kind: 'unknown' }];
  }
  if (['Edit', 'Write'].includes(event.tool_name)) {
    const targetPath = input.file_path ?? input.path;
    return typeof targetPath === 'string'
      ? [{ kind: 'write', checkoutRoot, targetPath }]
      : [{ kind: 'unknown' }];
  }
  if (['Bash', 'exec_command'].includes(event.tool_name)) {
    return [{ kind: 'command', command: input.command ?? input.cmd, platform: process.platform }];
  }
  return [{ kind: 'unknown' }];
}

function findCheckoutRoot(startPath) {
  let current = startPath;
  while (true) {
    if (fs.existsSync(path.join(current, '.codex', 'workflows', 'active-change.json'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function hookOutput(hookEventName, additionalContext) {
  const hookSpecificOutput = { hookEventName };
  if (additionalContext) hookSpecificOutput.additionalContext = additionalContext;
  return { hookSpecificOutput };
}
