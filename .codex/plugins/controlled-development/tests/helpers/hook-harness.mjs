import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function runHookFixture(pluginRoot, input) {
  const runner = path.join(pluginRoot, 'hooks', 'run-hook.mjs');
  const result = spawnSync(process.execPath, [runner], {
    cwd: pluginRoot,
    input: `${JSON.stringify(input)}\n`,
    encoding: 'utf8',
    env: { ...process.env, PLUGIN_ROOT: pluginRoot },
  });
  let json = null;
  try { json = JSON.parse(result.stdout); } catch { /* assertion reports malformed output */ }
  return { ...result, json };
}

export function readHookFixture(pluginRoot, name) {
  return JSON.parse(fs.readFileSync(path.join(pluginRoot, 'tests', 'fixtures', 'hooks', `${name}.json`), 'utf8'));
}
