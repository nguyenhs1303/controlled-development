import fs from 'node:fs';
import path from 'node:path';

import { RULE_IDS } from './enforcement-rule-ids.mjs';

export function authorizePathOperation(checkoutRoot, targetPath, policy) {
  const root = fs.realpathSync(checkoutRoot);
  const absolute = path.resolve(root, targetPath);
  if (!isWithin(root, absolute) || !resolvedParentWithin(root, absolute)) {
    return result(false, RULE_IDS.PATH_OUTSIDE_CHECKOUT, targetPath);
  }
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  if (matchesAny(relative, policy.protectedPaths ?? [])) {
    return result(false, RULE_IDS.PATH_PROTECTED_DENY, relative);
  }
  const exists = fs.existsSync(absolute);
  const allowedPatterns = exists ? policy.allowedWritePaths : policy.allowedNewFiles;
  if (!matchesAny(relative, allowedPatterns ?? [])) {
    return result(false, RULE_IDS.PATH_NOT_ALLOWED, relative);
  }
  return result(true, exists ? RULE_IDS.PATH_WRITE_ALLOWED : RULE_IDS.PATH_NEW_ALLOWED, relative);
}

function resolvedParentWithin(root, absolute) {
  let current = fs.existsSync(absolute) ? absolute : path.dirname(absolute);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
  return isWithin(root, fs.realpathSync(current));
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => globRegex(pattern.replaceAll('\\', '/')).test(value));
}

function globRegex(pattern) {
  let source = '';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*' && pattern[index + 1] === '*') {
      source += '.*';
      index += 1;
    } else if (character === '*') source += '[^/]*';
    else source += character.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
  }
  return new RegExp(`^${source}$`, process.platform === 'win32' ? 'i' : '');
}

function result(allowed, ruleId, target) {
  return { allowed, ruleId, reason: allowed ? 'Path is authorized by the task contract' : 'Path is outside the task contract', audit: { target } };
}
