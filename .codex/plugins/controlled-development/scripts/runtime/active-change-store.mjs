import fs from 'node:fs';
import path from 'node:path';

import { writeJsonAtomic } from './workflow-state-store.mjs';

const RELATIVE_PATH = path.join('.codex', 'workflows', 'active-change.json');

export function activeChangePath(checkoutRoot) {
  return path.join(checkoutRoot, RELATIVE_PATH);
}

export function readActiveChange(checkoutRoot) {
  const filePath = activeChangePath(checkoutRoot);
  if (!fs.existsSync(filePath)) return null;
  let binding;
  try {
    binding = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`active change binding is invalid: ${error.message}`);
  }
  if (!isBinding(binding)) throw new Error('active change binding is invalid');
  return binding;
}

export function activateChangeBinding(checkoutRoot, binding) {
  if (!isBinding(binding)) throw new Error('active change binding is invalid');
  const current = readActiveChange(checkoutRoot);
  if (current && current.changeId !== binding.changeId) {
    throw new Error(`change ${current.changeId} is already active`);
  }
  const filePath = activeChangePath(checkoutRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  writeJsonAtomic(filePath, binding);
  return binding;
}

export function deactivateChangeBinding(checkoutRoot, changeId) {
  const current = readActiveChange(checkoutRoot);
  if (!current) return null;
  if (current.changeId !== changeId) throw new Error(`active change ${current.changeId} does not match ${changeId}`);
  fs.unlinkSync(activeChangePath(checkoutRoot));
  return current;
}

function isBinding(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    nonEmpty(value.changeId) && safeRelativePath(value.statePath) && nonEmpty(value.nonce);
}

function safeRelativePath(value) {
  if (!nonEmpty(value) || path.isAbsolute(value)) return false;
  const normalized = path.normalize(value);
  return normalized !== '..' && !normalized.startsWith(`..${path.sep}`);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
