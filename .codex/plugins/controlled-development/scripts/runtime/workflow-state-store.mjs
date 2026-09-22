import fs from 'node:fs';
import path from 'node:path';

import { appendLedgerEvent, applyStatePatch, assessLedger, createLedgerEvent } from './workflow-ledger.mjs';

export function readState(statePath) {
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

export function writeJsonAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  const temporaryPath = path.join(directory, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`);
  const descriptor = fs.openSync(temporaryPath, 'wx');
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  fs.renameSync(temporaryPath, filePath);
  flushDirectory(directory);
}

export function withStateLock(statePath, action) {
  const lockPath = `${statePath}.lock`;
  const descriptor = acquireLock(lockPath);
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })}\n`);
    fs.fsyncSync(descriptor);
    return action();
  } finally {
    fs.closeSync(descriptor);
    fs.unlinkSync(lockPath);
  }
}

export function runStateTransaction(statePath, expectedRevision, mutation, options = {}) {
  return withStateLock(statePath, () => {
    cleanupTemporaryFiles(statePath);
    let current = readState(statePath);
    const ledger = assessLedger(statePath, current);
    if (ledger.status === 'invalid') throw new Error(`ledger validation failed: ${ledger.errors.join('; ')}`);
    if (ledger.status === 'recoverable') {
      current = ledger.recoveredState;
      writeJsonAtomic(statePath, current);
    }
    if (current.revision !== expectedRevision) {
      throw new Error(`stale revision: expected ${expectedRevision}, current ${current.revision}`);
    }

    const at = options.at ?? new Date().toISOString();
    const result = mutation(structuredClone(current), at);
    const event = createLedgerEvent(current, result.type, result.patch, at);
    const next = applyStatePatch(current, result.patch);
    next.revision = event.resultingRevision;
    next.lastEventSequence = event.sequence;
    next.lastEventHash = event.eventHash;
    next.updatedAt = at;
    if (options.validateNext) {
      const errors = options.validateNext(next);
      if (errors.length) throw new Error(`next state is invalid: ${errors.join('; ')}`);
    }

    appendLedgerEvent(statePath, event);
    if (options.failAfterEvent) throw new Error('simulated crash after event append');
    writeJsonAtomic(statePath, next);
    return { state: next, event };
  });
}

function acquireLock(lockPath) {
  try {
    return fs.openSync(lockPath, 'wx');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!isStaleLock(lockPath)) throw new Error(`state lock exists: ${lockPath}`);
    fs.unlinkSync(lockPath);
    return fs.openSync(lockPath, 'wx');
  }
}

function isStaleLock(lockPath) {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    if (!Number.isInteger(lock.pid) || lock.pid <= 0) return false;
    try {
      process.kill(lock.pid, 0);
      return false;
    } catch (error) {
      return error.code === 'ESRCH';
    }
  } catch {
    return false;
  }
}

function cleanupTemporaryFiles(statePath) {
  const directory = path.dirname(statePath);
  const statePrefix = `.${path.basename(statePath)}.tmp-`;
  for (const entry of fs.readdirSync(directory)) {
    if (entry.startsWith(statePrefix)) fs.unlinkSync(path.join(directory, entry));
  }
  const eventsDirectory = path.join(directory, 'events');
  if (!fs.existsSync(eventsDirectory)) return;
  for (const entry of fs.readdirSync(eventsDirectory)) {
    if (/^\d{8}\.json\.tmp-/.test(entry)) fs.unlinkSync(path.join(eventsDirectory, entry));
  }
}

function flushDirectory(directory) {
  try {
    const descriptor = fs.openSync(directory, 'r');
    try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
  } catch {
    // Directory fsync is best-effort on platforms that do not expose it.
  }
}
