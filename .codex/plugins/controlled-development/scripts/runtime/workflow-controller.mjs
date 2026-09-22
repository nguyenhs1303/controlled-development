#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  approveState,
  activateWorkflowChange,
  authorizeStateExecution,
  checkResume,
  currentGitBaseline,
  recordStateMetadata,
  recordReadinessProof,
  deactivateWorkflowChange,
  bindEvidenceReceipt,
  currentImplementationSnapshot,
  statusForState,
  transitionState,
  validateStateFile,
} from './workflow-controller-core.mjs';
import { hashArtifact } from './workflow-crypto.mjs';

export function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = { _: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith('--')) {
      options._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = rest[index + 1];
    if (next === undefined || next.startsWith('--')) options[key] = true;
    else {
      options[key] = next;
      index += 1;
    }
  }
  return { command, options };
}

export function run(argv, io = console) {
  const { command, options } = parseArguments(argv);
  const statePath = path.resolve(options.state ?? 'state.json');
  let result;
  if (command === 'status') result = statusForState(statePath);
  else if (command === 'validate-state') {
    const validation = validateStateFile(statePath);
    result = { valid: validation.errors.length === 0, errors: validation.errors };
  } else if (command === 'check-resume') {
    let currentGit;
    let currentImplementation;
    const state = validateStateFile(statePath).state;
    if (state.gitBaseline?.head && state.gitBaseline?.statusFingerprint) {
      currentGit = currentGitBaseline(path.dirname(statePath), { excludedPaths: [state.artifactRoot] });
    }
    if (state.enforcement?.implementation?.snapshotDigest) {
      currentImplementation = currentImplementationSnapshot(gitRoot(path.dirname(statePath)), state);
    }
    result = checkResume(statePath, { currentGitBaseline: currentGit, currentImplementationSnapshot: currentImplementation });
  } else if (command === 'hash-artifact') {
    const artifactPath = path.resolve(options.artifact ?? options._[0] ?? '');
    result = { artifactPath, digestAlgorithm: 'sha256-text-v1', artifactDigest: hashArtifact(artifactPath) };
  } else if (command === 'authorize') {
    const policyPath = path.resolve(options.policy ?? path.join(path.dirname(statePath), 'execution-policy.json'));
    const operationPath = path.resolve(required(options, 'operation-file'));
    const operation = JSON.parse(fs.readFileSync(operationPath, 'utf8'));
    result = authorizeStateExecution(statePath, policyPath, operation);
  } else if (command === 'activate') {
    result = receipt('activate', activateWorkflowChange(
      statePath,
      path.resolve(required(options, 'checkout')),
      path.resolve(required(options, 'policy')),
      revision(options),
    ));
  } else if (command === 'ready') {
    result = receipt('ready', recordReadinessProof(
      statePath,
      revision(options),
      required(options, 'proof'),
    ));
  } else if (command === 'deactivate') {
    result = receipt('deactivate', deactivateWorkflowChange(
      statePath,
      path.resolve(required(options, 'checkout')),
      revision(options),
    ));
  } else if (command === 'bind-evidence') {
    result = receipt('bind-evidence', bindEvidenceReceipt(
      statePath,
      path.resolve(required(options, 'checkout')),
      revision(options),
      required(options, 'receipt'),
    ));
  } else if (command === 'approve') {
    result = receipt('approve', approveState(
      statePath,
      required(options, 'gate'),
      revision(options),
      required(options, 'reference'),
    ));
  } else if (command === 'transition') {
    result = receipt('transition', transitionState(
      statePath,
      required(options, 'to'),
      revision(options),
      { terminalState: options['terminal-state'] },
    ));
  } else if (command === 'record') {
    const patchPath = path.resolve(required(options, 'patch-file'));
    const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
    result = receipt('record', recordStateMetadata(statePath, revision(options), patch));
  } else {
    throw new Error('command must be status, validate-state, check-resume, hash-artifact, authorize, activate, ready, deactivate, bind-evidence, approve, transition, or record');
  }
  io.log(JSON.stringify(result, null, 2));
  if (result.valid === false || result.status === 'invalid') return 1;
  return 0;
}

function gitRoot(cwd) {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git rev-parse failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout.trim();
}

function required(options, name) {
  if (typeof options[name] !== 'string' || !options[name]) throw new Error(`--${name} is required`);
  return options[name];
}

function revision(options) {
  const value = Number(required(options, 'expected-revision'));
  if (!Number.isInteger(value) || value < 0) throw new Error('--expected-revision must be a non-negative integer');
  return value;
}

function receipt(operation, result) {
  return {
    operation,
    revision: result.state.revision,
    phase: result.state.phase,
    eventSequence: result.event.sequence,
    eventHash: result.event.eventHash,
    eventType: result.event.type,
  };
}

function main() {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
