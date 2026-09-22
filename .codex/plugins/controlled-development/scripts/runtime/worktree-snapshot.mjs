import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { sha256 } from './workflow-crypto.mjs';

export function captureWorktreeSnapshot(checkoutRoot, options = {}) {
  const output = runGit(checkoutRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const paths = {};
  for (const entry of output.split('\0').filter(Boolean)) {
    const relative = entry.slice(3).replaceAll('\\', '/');
    if (matchesAny(relative, options.excludedPaths ?? [])) continue;
    const absolute = path.join(checkoutRoot, relative);
    paths[relative] = {
      status: entry.slice(0, 2),
      digest: fs.existsSync(absolute) && fs.statSync(absolute).isFile() ? sha256(fs.readFileSync(absolute)) : null,
    };
  }
  return { paths };
}

export function compareWorktreeSnapshots(before, after) {
  const changedPaths = [];
  for (const [relative, value] of Object.entries(after.paths)) {
    const prior = before.paths[relative];
    if (!prior || prior.status !== value.status || prior.digest !== value.digest) changedPaths.push(relative);
  }
  for (const relative of Object.keys(before.paths)) {
    if (!Object.hasOwn(after.paths, relative)) changedPaths.push(relative);
  }
  return { changedPaths: [...new Set(changedPaths)].sort() };
}

export function implementationSnapshot(checkoutRoot, excludedPaths = []) {
  const snapshot = captureWorktreeSnapshot(checkoutRoot, { excludedPaths });
  return {
    changedPaths: Object.keys(snapshot.paths).sort(),
    snapshotDigest: sha256(JSON.stringify(snapshot.paths)),
  };
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout;
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => {
    const normalized = pattern.replaceAll('\\', '/');
    if (normalized.endsWith('/**')) return value === normalized.slice(0, -3) || value.startsWith(normalized.slice(0, -2));
    return value === normalized;
  });
}
