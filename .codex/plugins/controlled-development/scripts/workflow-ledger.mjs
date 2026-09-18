import fs from 'node:fs';
import path from 'node:path';

import { hashCanonicalJson } from './workflow-crypto.mjs';

function eventDirectory(statePath) {
  return path.join(path.dirname(statePath), 'events');
}

function eventPath(statePath, sequence) {
  return path.join(eventDirectory(statePath), `${String(sequence).padStart(8, '0')}.json`);
}

export function applyStatePatch(state, patch) {
  const result = structuredClone(state);
  mergeInto(result, patch);
  return result;
}

function mergeInto(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      mergeInto(target[key], value);
    } else {
      target[key] = structuredClone(value);
    }
  }
}

export function createLedgerEvent(state, type, patch, at) {
  const resultingState = applyStatePatch(state, patch);
  resultingState.revision = state.revision + 1;
  resultingState.lastEventSequence = state.lastEventSequence + 1;
  resultingState.lastEventHash = null;
  resultingState.updatedAt = at;
  const body = {
    sequence: state.lastEventSequence + 1,
    previousHash: state.lastEventHash,
    type,
    at,
    expectedRevision: state.revision,
    resultingRevision: state.revision + 1,
    patch,
    stateDigest: hashCanonicalJson(resultingState),
  };
  return { ...body, eventHash: hashCanonicalJson(body) };
}

export function appendLedgerEvent(statePath, event) {
  const directory = eventDirectory(statePath);
  fs.mkdirSync(directory, { recursive: true });
  const finalPath = eventPath(statePath, event.sequence);
  if (fs.existsSync(finalPath)) throw new Error(`event already exists: ${path.basename(finalPath)}`);
  const temporaryPath = `${finalPath}.tmp-${process.pid}-${Date.now()}`;
  const descriptor = fs.openSync(temporaryPath, 'wx');
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(event, null, 2)}\n`, 'utf8');
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
  fs.renameSync(temporaryPath, finalPath);
  flushDirectory(directory);
  return finalPath;
}

export function readLedger(statePath) {
  const directory = eventDirectory(statePath);
  if (!fs.existsSync(directory)) return { events: [], errors: [] };
  const filenames = fs.readdirSync(directory)
    .filter((entry) => /^\d{8}\.json$/.test(entry))
    .sort();
  const events = [];
  const errors = [];
  let previousHash = null;
  for (const [index, filename] of filenames.entries()) {
    const expectedSequence = index + 1;
    let event;
    try {
      event = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
    } catch (error) {
      errors.push(`${filename} is not valid JSON: ${error.message}`);
      continue;
    }
    const { eventHash, ...body } = event;
    if (event.sequence !== expectedSequence || filename !== `${String(expectedSequence).padStart(8, '0')}.json`) {
      errors.push(`${filename} has invalid sequence`);
    }
    if (event.previousHash !== previousHash) errors.push(`${filename} breaks the previousHash chain`);
    if (eventHash !== hashCanonicalJson(body)) errors.push(`${filename} eventHash does not match its contents`);
    previousHash = eventHash;
    events.push(event);
  }
  return { events, errors };
}

export function assessLedger(statePath, state) {
  const ledger = readLedger(statePath);
  if (ledger.errors.length) return { status: 'invalid', errors: ledger.errors, events: ledger.events };
  const last = ledger.events.at(-1) ?? null;
  if (!last) {
    return state.lastEventSequence === 0 && state.lastEventHash === null
      ? { status: 'aligned', errors: [], events: [] }
      : { status: 'invalid', errors: ['snapshot references events but ledger is empty'], events: [] };
  }
  if (state.lastEventSequence === last.sequence && state.lastEventHash === last.eventHash) {
    const snapshotForDigest = structuredClone(state);
    snapshotForDigest.lastEventHash = null;
    return hashCanonicalJson(snapshotForDigest) === last.stateDigest
      ? { status: 'aligned', errors: [], events: ledger.events }
      : { status: 'invalid', errors: ['snapshot contents do not match the final ledger event'], events: ledger.events };
  }
  if (last.sequence === state.lastEventSequence + 1 && last.previousHash === state.lastEventHash &&
      last.expectedRevision === state.revision && last.resultingRevision === state.revision + 1) {
    const recovered = applyStatePatch(state, last.patch);
    recovered.revision = last.resultingRevision;
    recovered.lastEventSequence = last.sequence;
    recovered.lastEventHash = last.eventHash;
    recovered.updatedAt = last.at;
    const recoveredForDigest = structuredClone(recovered);
    recoveredForDigest.lastEventHash = null;
    return hashCanonicalJson(recoveredForDigest) === last.stateDigest
      ? { status: 'recoverable', errors: [], events: ledger.events, recoveredState: recovered }
      : { status: 'invalid', errors: ['recoverable event stateDigest does not match its patch'], events: ledger.events };
  }
  return {
    status: 'invalid',
    errors: ['ledger anchor does not match snapshot and is not a single recoverable pending event'],
    events: ledger.events,
  };
}

function flushDirectory(directory) {
  try {
    const descriptor = fs.openSync(directory, 'r');
    try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
  } catch {
    // Directory fsync is not supported on every platform; the file itself is already flushed.
  }
}
